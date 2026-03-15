import type { Ref } from 'vue'
import type { TerminalConnection } from '../helpers/connection'
import type { TerminalInstance } from '../helpers/instance'
import type { XtermTerminalProps } from '../types'
import { computed, markRaw, onUnmounted, ref, watch } from 'vue'
import { useTheme } from '@/composables/useTheme'
import { connectTerminal } from '../helpers/connection'
import { createTerminalInstance, getTerminalTheme } from '../helpers/instance'

interface UseXtermTerminalOptions {
  /**
   * 容器引用
   * @description 终端挂载节点的 DOM 引用。
   */
  containerRef: Ref<HTMLElement | null>
  /**
   * 属性
   * @description XtermTerminal 组件传入的 props。
   */
  props: Readonly<XtermTerminalProps>
}

export function useXtermTerminal(options: UseXtermTerminalOptions) {
  const { containerRef, props } = options
  const { resolvedThemeId } = useTheme()

  const sessionId = ref<string | null>(null)
  const clientId = ref<string | null>(null)
  const writerClientId = ref<string | null>(null)
  const isWriter = computed(() => !!clientId.value && clientId.value === writerClientId.value)

  let instance: TerminalInstance | null = null
  let connection: TerminalConnection | null = null
  let removeResizeListener: (() => void) | null = null
  let inputDisposable: { dispose: () => void } | null = null
  let resizeDisposable: { dispose: () => void } | null = null
  let manualDisconnect = false
  let receivedTerminalClose = false

  function initTerminal(container: HTMLElement) {
    if (instance) {
      return
    }

    const raw = createTerminalInstance(resolvedThemeId.value)
    instance = {
      terminal: markRaw(raw.terminal),
      fitAddon: markRaw(raw.fitAddon),
    }

    instance.terminal.open(container)
    instance.fitAddon.fit()

    const handleResize = () => instance?.fitAddon.fit()
    window.addEventListener('resize', handleResize)
    removeResizeListener = () => window.removeEventListener('resize', handleResize)

    inputDisposable = instance.terminal.onData((data) => {
      if (!sessionId.value || !isWriter.value) {
        return
      }

      connection?.send({
        type: 'terminal.input',
        payload: { sessionId: sessionId.value, data },
      })
    })

    resizeDisposable = instance.terminal.onResize(({ cols, rows }) => {
      if (!sessionId.value || !isWriter.value) {
        return
      }

      connection?.send({
        type: 'terminal.resize',
        payload: { sessionId: sessionId.value, cols, rows },
      })
    })
  }

  function connect(url: string) {
    if (!instance) {
      return
    }

    disconnect()
    manualDisconnect = false
    receivedTerminalClose = false

    connection = connectTerminal(url, instance.terminal, {
      onHello(sid, cid) {
        sessionId.value = sid
        clientId.value = cid
      },
      onWriterState(wid) {
        writerClientId.value = wid
      },
      onTerminalClosed() {
        receivedTerminalClose = true
      },
      onDisconnect() {
        sessionId.value = null
        clientId.value = null
        writerClientId.value = null

        if (!manualDisconnect && !receivedTerminalClose) {
          instance?.terminal.writeln('')
          instance?.terminal.writeln('终端连接已断开')
        }
      },
    })
  }

  function disconnect() {
    manualDisconnect = true

    if (connection && sessionId.value) {
      connection.send({
        type: 'terminal.close',
        payload: { sessionId: sessionId.value, reason: 'client_disconnect' },
      })
    }

    connection?.close()
    connection = null
    sessionId.value = null
    clientId.value = null
    writerClientId.value = null
  }

  function claimWriter() {
    if (!sessionId.value) {
      return
    }

    connection?.send({
      type: 'terminal.writer.claim',
      payload: { sessionId: sessionId.value },
    })
  }

  function releaseWriter() {
    if (!sessionId.value) {
      return
    }

    connection?.send({
      type: 'terminal.writer.release',
      payload: { sessionId: sessionId.value },
    })
  }

  function clear() {
    instance?.terminal.clear()
  }

  watch(containerRef, (container) => {
    if (!container || instance) {
      return
    }

    initTerminal(container)

    if (props.url) {
      connect(props.url)
    }
  }, { immediate: true })

  watch(() => props.url, (url) => {
    if (!instance) {
      return
    }

    if (url) {
      connect(url)
    }
    else {
      disconnect()
    }
  })

  watch(resolvedThemeId, (themeId) => {
    if (instance) {
      instance.terminal.options.theme = getTerminalTheme(themeId)
    }
  })

  onUnmounted(() => {
    disconnect()
    inputDisposable?.dispose()
    resizeDisposable?.dispose()
    removeResizeListener?.()

    try {
      instance?.terminal.dispose()
    }
    catch {
      // already disposed
    }

    instance = null
  })

  return {
    isWriter,
    claimWriter,
    releaseWriter,
    clear,
  }
}

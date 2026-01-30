import type { Ref } from 'vue'
import { Terminal } from 'xterm'
import { FitAddon } from 'xterm-addon-fit'
import { WebLinksAddon } from 'xterm-addon-web-links'
import { ref, onMounted, onUnmounted } from 'vue'
import 'xterm/css/xterm.css'

export function useTerminal(containerRef: Ref<HTMLElement | null>) {
  const terminal = ref<Terminal | null>(null)
  const fitAddon = ref<FitAddon | null>(null)
  const ws = ref<WebSocket | null>(null)

  onMounted(() => {
    if (!containerRef.value) return

    terminal.value = new Terminal({
      cursorBlink: true,
      fontSize: 14,
      fontFamily: 'Menlo, Monaco, "Courier New", monospace',
      theme: {
        background: '#1e1e1e',
        foreground: '#d4d4d4',
      },
      rows: 30,
    })

    fitAddon.value = new FitAddon()
    terminal.value.loadAddon(fitAddon.value)
    terminal.value.loadAddon(new WebLinksAddon())

    terminal.value.open(containerRef.value)
    fitAddon.value.fit()

    // Handle window resize
    const handleResize = () => {
      fitAddon.value?.fit()
    }
    window.addEventListener('resize', handleResize)

    onUnmounted(() => {
      window.removeEventListener('resize', handleResize)
    })
  })

  onUnmounted(() => {
    ws.value?.close()
    terminal.value?.dispose()
  })

  function connect(url: string) {
    if (ws.value) {
      ws.value.close()
    }

    ws.value = new WebSocket(url)

    ws.value.onopen = () => {
      terminal.value?.writeln('Connected to sandbox terminal')
      terminal.value?.writeln('')
    }

    ws.value.onmessage = (event) => {
      terminal.value?.write(event.data)
    }

    ws.value.onerror = (error) => {
      console.error('WebSocket error:', error)
      terminal.value?.writeln('\r\nWebSocket error occurred')
    }

    ws.value.onclose = () => {
      terminal.value?.writeln('\r\nConnection closed')
    }

    // Send terminal input to WebSocket
    terminal.value?.onData((data) => {
      if (ws.value?.readyState === WebSocket.OPEN) {
        ws.value.send(data)
      }
    })
  }

  function disconnect() {
    ws.value?.close()
    ws.value = null
  }

  function write(data: string) {
    terminal.value?.write(data)
  }

  function writeln(data: string) {
    terminal.value?.writeln(data)
  }

  function clear() {
    terminal.value?.clear()
  }

  return {
    terminal,
    connect,
    disconnect,
    write,
    writeln,
    clear,
  }
}

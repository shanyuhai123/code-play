import type { ThemeId } from '@/themes'
import { Terminal } from 'xterm'
import { FitAddon } from 'xterm-addon-fit'
import { WebLinksAddon } from 'xterm-addon-web-links'
import { getTerminalColors } from '@/themes'
import 'xterm/css/xterm.css'

export interface TerminalInstance {
  /**
   * 终端实例
   * @description xterm.js 的 Terminal 实例。
   */
  terminal: Terminal
  /**
   * 自适应插件
   * @description 用于按容器尺寸调整终端布局。
   */
  fitAddon: FitAddon
}

export function getTerminalTheme(themeId: ThemeId) {
  return getTerminalColors(themeId)
}

export function createTerminalInstance(themeId: ThemeId): TerminalInstance {
  const terminal = new Terminal({
    cursorBlink: true,
    fontSize: 14,
    fontFamily: 'Menlo, Monaco, "Courier New", monospace',
    theme: getTerminalTheme(themeId),
    rows: 30,
  })

  const fitAddon = new FitAddon()
  terminal.loadAddon(fitAddon)
  terminal.loadAddon(new WebLinksAddon())

  return { terminal, fitAddon }
}

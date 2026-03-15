const FONT_READY_CLASS = 'fonts-wenkai-ready'
const FONT_FAMILY = '"LXGW WenKai Lite"'
export const FONT_READY_EVENT = 'cp:fonts-ready'
export const UI_FONT_STACK = '\'LXGW WenKai Lite\', \'PingFang SC\', \'Hiragino Sans GB\', \'Microsoft YaHei\', \'Noto Sans SC\', system-ui, -apple-system, BlinkMacSystemFont, \'Segoe UI\', sans-serif'
export const CODE_FONT_STACK = '\'JetBrains Mono\', \'Cascadia Mono\', \'SFMono-Regular\', Consolas, \'Liberation Mono\', Menlo, Monaco, monospace, \'LXGW WenKai Lite\', \'PingFang SC\', \'Hiragino Sans GB\', \'Microsoft YaHei\', \'Noto Sans SC\', sans-serif'

async function loadWenKai() {
  if (!('fonts' in document))
    return

  await Promise.all([
    document.fonts.load(`400 1em ${FONT_FAMILY}`, 'A'),
    document.fonts.load(`400 1em ${FONT_FAMILY}`, '汉'),
  ])

  document.documentElement.classList.add(FONT_READY_CLASS)
  window.dispatchEvent(new Event(FONT_READY_EVENT))
}

export function setupFonts() {
  const networkInformation = navigator as Navigator & {
    connection?: { saveData?: boolean }
  }

  if (networkInformation.connection?.saveData)
    return

  const enqueueLoad = () => {
    void loadWenKai().catch(() => {})
  }

  if (typeof window.requestIdleCallback === 'function') {
    window.requestIdleCallback(enqueueLoad, { timeout: 1500 })
    return
  }

  window.setTimeout(enqueueLoad, 300)
}

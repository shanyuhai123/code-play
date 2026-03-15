import '../styles/global.css'

export default async function setupAssets() {
  await Promise.all([
    import('@unocss/reset/tailwind.css'),
    import('element-plus/theme-chalk/dark/css-vars.css'),
    import('virtual:uno.css'),
  ])
}

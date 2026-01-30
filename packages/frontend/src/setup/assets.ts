export default async function setupAssets() {
  await Promise.all([
    import('uno.css'),
    import('virtual:uno.css'),
    import('@unocss/reset/tailwind.css'),
  ])
}

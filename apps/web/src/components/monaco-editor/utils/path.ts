export function normalizeFilePath(path: string) {
  return path.replace(/^\/+/, '').replace(/\/+/g, '/')
}

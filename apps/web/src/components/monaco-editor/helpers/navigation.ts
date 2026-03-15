import type * as Monaco from 'monaco-editor'
import type { MonacoFile } from '../types'
import { normalizeFilePath } from '../utils/path'

const resolvableExtensions = [
  '',
  '.ts',
  '.tsx',
  '.js',
  '.jsx',
  '.vue',
  '.json',
]

function dirname(path: string) {
  const normalized = normalizeFilePath(path)
  const index = normalized.lastIndexOf('/')
  return index === -1 ? '' : normalized.slice(0, index)
}

function normalizeSegments(path: string) {
  const segments = path.split('/')
  const result: string[] = []

  for (const segment of segments) {
    if (!segment || segment === '.') {
      continue
    }

    if (segment === '..') {
      result.pop()
      continue
    }

    result.push(segment)
  }

  return result.join('/')
}

function resolveRelativeImportPath(fromPath: string, specifier: string, files: MonacoFile[]) {
  if (!specifier.startsWith('./') && !specifier.startsWith('../')) {
    return null
  }

  const fileSet = new Set(files.map(file => normalizeFilePath(file.path)))
  const baseDir = dirname(fromPath)
  const basePath = normalizeSegments(baseDir ? `${baseDir}/${specifier}` : specifier)

  for (const extension of resolvableExtensions) {
    const candidate = normalizeFilePath(`${basePath}${extension}`)
    if (fileSet.has(candidate)) {
      return candidate
    }
  }

  for (const extension of resolvableExtensions.filter(Boolean)) {
    const candidate = normalizeFilePath(`${basePath}/index${extension}`)
    if (fileSet.has(candidate)) {
      return candidate
    }
  }

  return null
}

interface ImportPathMatch {
  /**
   * 路径
   * @description 当前匹配到的导入路径文本。
   */
  path: string
  /**
   * 起始列
   * @description 导入路径在当前行中的起始列号。
   */
  startColumn: number
  /**
   * 结束列
   * @description 导入路径在当前行中的结束列号。
   */
  endColumn: number
}

function collectImportPathMatches(lineContent: string): ImportPathMatch[] {
  const matches: ImportPathMatch[] = []
  const patterns = [
    /\b(?:import|export)\b[^'"]+?\bfrom\s*(['"])([^'"]+)\1/g,
    /\bimport\s*(['"])([^'"]+)\1/g,
    /\bimport\s*\(\s*(['"])([^'"]+)\1\s*\)/g,
  ]

  for (const pattern of patterns) {
    for (const match of lineContent.matchAll(pattern)) {
      const fullMatch = match[0]
      const specifier = match[2]

      if (!specifier || match.index === undefined) {
        continue
      }

      const specifierOffset = fullMatch.indexOf(specifier)
      if (specifierOffset === -1) {
        continue
      }

      const startColumn = match.index + specifierOffset + 1
      matches.push({
        path: specifier,
        startColumn,
        endColumn: startColumn + specifier.length,
      })
    }
  }

  return matches
}

function findImportPathAtPosition(model: Monaco.editor.ITextModel, position: Monaco.Position) {
  const lineContent = model.getLineContent(position.lineNumber)
  const column = position.column

  return collectImportPathMatches(lineContent).find(match => column >= match.startColumn && column <= match.endColumn)
}

export function bindImportNavigation(
  editor: Monaco.editor.IStandaloneCodeEditor,
  currentPath: () => string,
  files: () => MonacoFile[],
  onNavigate: (path: string) => void,
) {
  const disposable = editor.onMouseDown((event) => {
    const mouseEvent = event.event.browserEvent
    if (!(mouseEvent.metaKey || mouseEvent.ctrlKey) || !event.target.position) {
      return
    }

    const model = editor.getModel()
    if (!model) {
      return
    }

    const matchedImport = findImportPathAtPosition(model, event.target.position)
    if (!matchedImport) {
      return
    }

    const targetPath = resolveRelativeImportPath(currentPath(), matchedImport.path, files())
    if (!targetPath) {
      return
    }

    mouseEvent.preventDefault()
    mouseEvent.stopPropagation()
    onNavigate(targetPath)
  })

  return disposable
}

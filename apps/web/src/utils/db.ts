import type { FileNode, Project } from '@code-play/domain'
import type { Table } from 'dexie'
import Dexie from 'dexie'

export interface StoredProject extends Project {
  /**
   * 文件树
   * @description 本地缓存的项目文件树。
   */
  files?: FileNode[]
  /**
   * 最近打开时间
   * @description 最近一次在本地打开该项目的时间。
   */
  lastOpenedAt?: Date
}

export class CodePlayDatabase extends Dexie {
  projects!: Table<StoredProject, string>

  constructor() {
    super('CodePlayDB')

    this.version(2).stores({
      projects: 'id, name, templateId, userId, updatedAt, lastOpenedAt, activeSessionId',
    })
  }
}

export const db = new CodePlayDatabase()

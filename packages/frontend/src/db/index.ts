import Dexie, { type Table } from 'dexie'
import type { Project, FileNode } from '@code-play/shared'

export interface StoredProject extends Project {
  files?: FileNode[]
  lastOpenedAt?: Date
}

export class CodePlayDatabase extends Dexie {
  projects!: Table<StoredProject, string>

  constructor() {
    super('CodePlayDB')

    this.version(1).stores({
      projects: 'id, name, templateId, userId, createdAt, updatedAt, lastOpenedAt',
    })
  }
}

export const db = new CodePlayDatabase()

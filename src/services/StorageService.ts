import { openDB, DBSchema, IDBPDatabase } from 'idb'
import { Snippet, ErrorEntry } from '../types/index'

interface BugTraceDB extends DBSchema {
  snippets: {
    key: string
    value: Snippet
  }
  settings: {
    key: string
    value: any
  }
}

class StorageServiceClass {
  private db: IDBPDatabase<BugTraceDB> | null = null
  private readonly DB_NAME = 'BugTraceDB'
  private readonly DB_VERSION = 1

  async init() {
    if (this.db) return this.db

    this.db = await openDB<BugTraceDB>(this.DB_NAME, this.DB_VERSION, {
      upgrade(db) {
        // Create snippets store
        const snippetsStore = db.createObjectStore('snippets', {
          keyPath: 'id'
        })
        snippetsStore.createIndex('timestamp', 'timestamp')
        snippetsStore.createIndex('errorType', 'error.type')

        // Create settings store
        db.createObjectStore('settings', {
          keyPath: 'key'
        })
      }
    })

    return this.db
  }

  async saveSnippet(snippet: Snippet): Promise<void> {
    const db = await this.init()
    await db.put('snippets', snippet)
  }

  async getSnippets(): Promise<Snippet[]> {
    const db = await this.init()
    const snippets = await db.getAll('snippets')
    return snippets.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    )
  }

  async getSnippet(id: string): Promise<Snippet | undefined> {
    const db = await this.init()
    return await db.get('snippets', id)
  }

  async deleteSnippet(id: string): Promise<void> {
    const db = await this.init()
    await db.delete('snippets', id)
  }

  async updateSnippet(snippet: Snippet): Promise<void> {
    const db = await this.init()
    await db.put('snippets', snippet)
  }

  async searchSnippets(query: string): Promise<Snippet[]> {
    const snippets = await this.getSnippets()
    const lowercaseQuery = query.toLowerCase()
    
    return snippets.filter(snippet => 
      snippet.error.message.toLowerCase().includes(lowercaseQuery) ||
      snippet.note.toLowerCase().includes(lowercaseQuery) ||
      snippet.tags.some(tag => tag.toLowerCase().includes(lowercaseQuery))
    )
  }

  async exportSnippets(): Promise<string> {
    const snippets = await this.getSnippets()
    return JSON.stringify({
      version: '1.0',
      timestamp: new Date().toISOString(),
      snippets
    }, null, 2)
  }

  async importSnippets(jsonData: string): Promise<{ imported: number; skipped: number }> {
    try {
      const data = JSON.parse(jsonData)
      const snippets: Snippet[] = data.snippets || []
      
      let imported = 0
      let skipped = 0

      const db = await this.init()
      const tx = db.transaction('snippets', 'readwrite')

      for (const snippet of snippets) {
        try {
          // Check if snippet already exists
          const existing = await tx.store.get(snippet.id)
          if (existing) {
            skipped++
          } else {
            await tx.store.put(snippet)
            imported++
          }
        } catch (error) {
          console.error('Error importing snippet:', snippet.id, error)
          skipped++
        }
      }

      await tx.done
      return { imported, skipped }
    } catch (error) {
      console.error('Error parsing import data:', error)
      throw new Error('Invalid import data format')
    }
  }

  async clearAllSnippets(): Promise<void> {
    const db = await this.init()
    await db.clear('snippets')
  }

  async getSettings(key: string, defaultValue: any = null): Promise<any> {
    const db = await this.init()
    const setting = await db.get('settings', key)
    return setting?.value ?? defaultValue
  }

  async saveSettings(key: string, value: any): Promise<void> {
    const db = await this.init()
    await db.put('settings', { key, value })
  }

  // Chrome storage fallback methods
  async saveToChrome(data: Record<string, any>): Promise<void> {
    if (chrome?.storage?.local) {
      await chrome.storage.local.set(data)
    }
  }

  async getFromChrome(keys: string | string[]): Promise<Record<string, any>> {
    if (chrome?.storage?.local) {
      return await chrome.storage.local.get(keys)
    }
    return {}
  }

  async removeFromChrome(keys: string | string[]): Promise<void> {
    if (chrome?.storage?.local) {
      await chrome.storage.local.remove(keys)
    }
  }
}

export const StorageService = new StorageServiceClass()

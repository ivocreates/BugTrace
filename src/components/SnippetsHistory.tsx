import React, { useState } from 'react'
import { Snippet } from '../types/index'
import { Search, Trash2, ExternalLink, Calendar, Tag, Download, Upload, FileText } from 'lucide-react'

interface SnippetsHistoryProps {
  snippets: Snippet[]
  onDeleteSnippet: (snippetId: string) => void
}

export function SnippetsHistory({ snippets, onDeleteSnippet }: SnippetsHistoryProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTag, setSelectedTag] = useState<string>('all')
  const [showExportDialog, setShowExportDialog] = useState(false)
  const [showImportDialog, setShowImportDialog] = useState(false)

  const filteredSnippets = snippets.filter(snippet => {
    const matchesSearch = searchQuery === '' || 
      snippet.error.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
      snippet.note.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesTag = selectedTag === 'all' || 
      snippet.tags.includes(selectedTag)
    
    return matchesSearch && matchesTag
  })

  const allTags = Array.from(new Set(
    snippets.flatMap(snippet => snippet.tags)
  )).sort()

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getSeverityClass = (severity: string) => {
    switch (severity) {
      case 'error':
        return 'border-l-red-500 bg-red-50/5'
      case 'warning':
        return 'border-l-yellow-500 bg-yellow-50/5'
      default:
        return 'border-l-blue-500 bg-blue-50/5'
    }
  }

  const handleExport = () => {
    const dataStr = JSON.stringify({
      version: '1.0',
      timestamp: new Date().toISOString(),
      snippets: filteredSnippets
    }, null, 2)
    
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = `bugtrace-snippets-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    setShowExportDialog(false)
  }

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string
        // Here you would call a service method to import the data
        console.log('Import data:', content)
        setShowImportDialog(false)
      } catch (error) {
        console.error('Failed to import file:', error)
      }
    }
    reader.readAsText(file)
  }

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-devtools-border bg-devtools-panel">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium">My Fixes ({snippets.length})</h3>
          <div className="flex gap-2">
            <button
              onClick={() => setShowExportDialog(true)}
              className="p-2 hover:bg-devtools-bg rounded text-gray-400 hover:text-white transition-colors"
              title="Export snippets"
            >
              <Download className="h-4 w-4" />
            </button>
            <button
              onClick={() => setShowImportDialog(true)}
              className="p-2 hover:bg-devtools-bg rounded text-gray-400 hover:text-white transition-colors"
              title="Import snippets"
            >
              <Upload className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="space-y-3">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search snippets..."
                className="w-full pl-10 pr-3 py-2 bg-devtools-bg border border-devtools-border rounded text-sm focus:outline-none focus:border-devtools-accent"
              />
            </div>
          </div>

          {allTags.length > 0 && (
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setSelectedTag('all')}
                className={`px-2 py-1 text-xs rounded transition-colors ${
                  selectedTag === 'all'
                    ? 'bg-devtools-accent text-white'
                    : 'bg-devtools-bg text-gray-400 hover:text-white'
                }`}
              >
                All
              </button>
              {allTags.map(tag => (
                <button
                  key={tag}
                  onClick={() => setSelectedTag(tag)}
                  className={`px-2 py-1 text-xs rounded transition-colors ${
                    selectedTag === tag
                      ? 'bg-devtools-accent text-white'
                      : 'bg-devtools-bg text-gray-400 hover:text-white'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {filteredSnippets.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-400">
            <div className="text-center">
              <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>
                {snippets.length === 0
                  ? 'No saved snippets yet'
                  : 'No snippets match your search'
                }
              </p>
              <p className="text-xs mt-1">
                {snippets.length === 0
                  ? 'Save errors from the Errors tab to build your knowledge base'
                  : 'Try different search terms or tags'
                }
              </p>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-devtools-border">
            {filteredSnippets.map((snippet) => (
              <div
                key={snippet.id}
                className={`p-4 border-l-4 hover:bg-devtools-panel transition-colors ${getSeverityClass(snippet.error.severity)}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="text-sm font-medium text-devtools-text">
                        {snippet.error.type} - {snippet.error.severity}
                      </h4>
                      <div className="flex items-center gap-1 text-xs text-gray-400">
                        <Calendar className="h-3 w-3" />
                        <span>{formatDate(snippet.timestamp)}</span>
                      </div>
                    </div>

                    <p className="text-sm text-gray-300 mb-2 line-clamp-2">
                      {snippet.error.message}
                    </p>

                    <div className="bg-devtools-bg p-3 rounded mb-3">
                      <h5 className="text-xs font-medium text-gray-400 mb-1">My Notes:</h5>
                      <p className="text-sm text-devtools-text whitespace-pre-wrap">
                        {snippet.note}
                      </p>
                    </div>

                    {snippet.error.url && (
                      <div className="flex items-center gap-1 text-xs text-gray-400 mb-2">
                        <ExternalLink className="h-3 w-3" />
                        <span className="truncate">{snippet.error.url}</span>
                        {snippet.error.line && `:${snippet.error.line}`}
                      </div>
                    )}

                    {snippet.tags.length > 0 && (
                      <div className="flex items-center gap-2">
                        <Tag className="h-3 w-3 text-gray-400" />
                        <div className="flex gap-1">
                          {snippet.tags.map(tag => (
                            <span
                              key={tag}
                              className="bg-devtools-bg px-2 py-1 text-xs rounded text-gray-300"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => onDeleteSnippet(snippet.id)}
                    className="p-1 hover:bg-devtools-bg rounded text-gray-400 hover:text-red-400 transition-colors"
                    title="Delete snippet"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Export Dialog */}
      {showExportDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-devtools-panel border border-devtools-border rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Export Snippets</h3>
            <p className="text-sm text-gray-300 mb-4">
              Export your saved snippets as a JSON file. You can import this file later or share it with others.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowExportDialog(false)}
                className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleExport}
                className="px-4 py-2 bg-devtools-accent text-white rounded hover:bg-blue-600 transition-colors"
              >
                Export
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Import Dialog */}
      {showImportDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-devtools-panel border border-devtools-border rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Import Snippets</h3>
            <p className="text-sm text-gray-300 mb-4">
              Import snippets from a JSON file. This will add to your existing snippets.
            </p>
            <input
              type="file"
              accept=".json"
              onChange={handleImport}
              className="w-full p-2 bg-devtools-bg border border-devtools-border rounded text-sm focus:outline-none focus:border-devtools-accent"
            />
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => setShowImportDialog(false)}
                className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

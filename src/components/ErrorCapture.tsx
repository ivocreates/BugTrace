import React, { useState } from 'react'
import { ErrorEntry } from '../types/index'
import { Save, Copy, ExternalLink, Clock, AlertTriangle, XCircle, Info } from 'lucide-react'

interface ErrorCaptureProps {
  errors: ErrorEntry[]
  selectedError: ErrorEntry | null
  onSelectError: (error: ErrorEntry | null) => void
  onSaveSnippet: (error: ErrorEntry, note: string) => void
}

export function ErrorCapture({ errors, selectedError, onSelectError, onSaveSnippet }: ErrorCaptureProps) {
  const [saveNote, setSaveNote] = useState('')
  const [showSaveDialog, setShowSaveDialog] = useState(false)

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      default:
        return <Info className="h-4 w-4 text-blue-500" />
    }
  }

  const getSeverityClass = (severity: string) => {
    switch (severity) {
      case 'error':
        return 'error-critical'
      case 'warning':
        return 'error-warning'
      default:
        return 'error-info'
    }
  }

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString()
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea')
      textArea.value = text
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
    }
  }

  const handleSaveSnippet = () => {
    if (selectedError && saveNote.trim()) {
      onSaveSnippet(selectedError, saveNote.trim())
      setSaveNote('')
      setShowSaveDialog(false)
    }
  }

  return (
    <div className="h-full flex">
      {/* Error List */}
      <div className="w-1/2 border-r border-devtools-border">
        <div className="p-3 border-b border-devtools-border bg-devtools-panel">
          <h3 className="text-sm font-medium">Captured Errors ({errors.length})</h3>
        </div>
        <div className="overflow-y-auto h-full">
          {errors.length === 0 ? (
            <div className="p-4 text-center text-gray-400">
              <AlertTriangle className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No errors captured yet</p>
              <p className="text-xs mt-1">Errors will appear here as they occur</p>
            </div>
          ) : (
            <div className="divide-y divide-devtools-border">
              {errors.map((error) => (
                <div
                  key={error.id}
                  className={`p-3 cursor-pointer hover:bg-devtools-panel transition-colors ${
                    selectedError?.id === error.id ? 'bg-devtools-panel' : ''
                  } ${getSeverityClass(error.severity)}`}
                  onClick={() => onSelectError(error)}
                >
                  <div className="flex items-start gap-2">
                    {getSeverityIcon(error.severity)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 text-xs text-gray-400 mb-1">
                        <Clock className="h-3 w-3" />
                        <span>{formatTimestamp(error.timestamp)}</span>
                        <span className="capitalize">{error.type}</span>
                        <span className="capitalize">{error.severity}</span>
                      </div>
                      <p className="text-sm font-medium text-devtools-text truncate">
                        {error.message}
                      </p>
                      {error.url && (
                        <p className="text-xs text-gray-400 truncate mt-1">
                          {error.url}
                          {error.line && `:${error.line}`}
                          {error.column && `:${error.column}`}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Error Details */}
      <div className="w-1/2 flex flex-col">
        {selectedError ? (
          <>
            <div className="p-3 border-b border-devtools-border bg-devtools-panel">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium">Error Details</h3>
                <div className="flex gap-1">
                  <button
                    onClick={() => copyToClipboard(selectedError.message)}
                    className="p-1 hover:bg-devtools-bg rounded text-gray-400 hover:text-white transition-colors"
                    title="Copy error message"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setShowSaveDialog(!showSaveDialog)}
                    className="p-1 hover:bg-devtools-bg rounded text-gray-400 hover:text-white transition-colors"
                    title="Save as snippet"
                  >
                    <Save className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* Error Summary */}
              <div className={`p-3 rounded-md ${getSeverityClass(selectedError.severity)}`}>
                <div className="flex items-start gap-2 mb-2">
                  {getSeverityIcon(selectedError.severity)}
                  <div>
                    <p className="text-sm font-medium">
                      {selectedError.severity.toUpperCase()} - {selectedError.type}
                    </p>
                    <p className="text-xs text-gray-400">
                      {formatTimestamp(selectedError.timestamp)}
                    </p>
                  </div>
                </div>
                <p className="text-sm whitespace-pre-wrap">{selectedError.message}</p>
              </div>

              {/* Location Info */}
              {selectedError.url && (
                <div className="bg-devtools-panel p-3 rounded-md">
                  <h4 className="text-sm font-medium mb-2">Location</h4>
                  <div className="flex items-center gap-2 text-sm">
                    <ExternalLink className="h-4 w-4" />
                    <span className="break-all">{selectedError.url}</span>
                    {selectedError.line && (
                      <span className="text-gray-400">:{selectedError.line}</span>
                    )}
                    {selectedError.column && (
                      <span className="text-gray-400">:{selectedError.column}</span>
                    )}
                  </div>
                </div>
              )}

              {/* Stack Trace */}
              {selectedError.stack && (
                <div className="bg-devtools-panel p-3 rounded-md">
                  <h4 className="text-sm font-medium mb-2">Stack Trace</h4>
                  <pre className="text-xs text-gray-300 whitespace-pre-wrap overflow-x-auto">
                    {selectedError.stack}
                  </pre>
                </div>
              )}

              {/* Network Details */}
              {selectedError.networkDetails && (
                <div className="bg-devtools-panel p-3 rounded-md">
                  <h4 className="text-sm font-medium mb-2">Network Details</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-gray-400">Method:</span>
                      <span className="ml-2">{selectedError.networkDetails.method}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Status:</span>
                      <span className="ml-2">
                        {selectedError.networkDetails.status} {selectedError.networkDetails.statusText}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Save Snippet Dialog */}
              {showSaveDialog && (
                <div className="bg-devtools-panel p-3 rounded-md border border-devtools-accent">
                  <h4 className="text-sm font-medium mb-2">Save Error as Snippet</h4>
                  <textarea
                    value={saveNote}
                    onChange={(e) => setSaveNote(e.target.value)}
                    placeholder="Add a note about this error or how you fixed it..."
                    className="w-full h-20 p-2 bg-devtools-bg border border-devtools-border rounded text-sm resize-none focus:outline-none focus:border-devtools-accent"
                  />
                  <div className="flex justify-end gap-2 mt-2">
                    <button
                      onClick={() => setShowSaveDialog(false)}
                      className="px-3 py-1 text-sm text-gray-400 hover:text-white transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveSnippet}
                      disabled={!saveNote.trim()}
                      className="px-3 py-1 text-sm bg-devtools-accent text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Save
                    </button>
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-400">
            <div className="text-center">
              <AlertTriangle className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>Select an error to view details</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

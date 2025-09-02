import { useState, useEffect } from 'react'
import { ErrorCapture } from './components/ErrorCapture'
import { SuggestionPanel } from './components/SuggestionPanel'
import { SnippetsHistory } from './components/SnippetsHistory'
import { GitHubSettingsPanel } from './components/GitHubSettingsPanel'
import { GitHubIntegrationPanel } from './components/GitHubIntegrationPanel'
import { Tabs, TabsList, TabsTrigger, TabsContent } from './components/ui/Tabs'
import { BugOff, History, Search, Settings, Brain, Zap, Shield, Github } from 'lucide-react'
import { ErrorEntry, Snippet, GitHubSettings } from './types/index'
import { ErrorDetector } from './services/ErrorDetector'
import { StorageService } from './services/StorageService'

function App() {
  const [errors, setErrors] = useState<ErrorEntry[]>([])
  const [selectedError, setSelectedError] = useState<ErrorEntry | null>(null)
  const [snippets, setSnippets] = useState<Snippet[]>([])
  const [activeTab, setActiveTab] = useState('errors')
  const [showGitHubSettings, setShowGitHubSettings] = useState(false)
  const [githubEnabled, setGithubEnabled] = useState(false)
  const [scanning, setScanning] = useState(false)

  const errorDetector = ErrorDetector.getInstance()

  useEffect(() => {
    const handleNewError = (error: ErrorEntry) => {
      setErrors(prev => [error, ...prev].slice(0, 100))
    }

    const handleNetworkError = (networkError: any) => {
      const errorEntry: ErrorEntry = {
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        type: 'network',
        severity: 'error',
        message: `Network Error: ${networkError.status} ${networkError.statusText}`,
        url: networkError.url,
        networkDetails: {
          url: networkError.url,
          method: networkError.method || 'GET',
          status: networkError.status,
          statusText: networkError.statusText,
          responseTime: networkError.responseTime || 0
        }
      }
      handleNewError(errorEntry)
    }

    // Initialize error detection
    errorDetector.onConsoleError(handleNewError)
    errorDetector.onNetworkError(handleNetworkError)
    errorDetector.startListening()

    // Load saved snippets and GitHub settings
    loadSnippets()
    loadGitHubSettings()

    return () => {
      errorDetector.stopListening()
    }
  }, [])

  const loadSnippets = async () => {
    try {
      const savedSnippets = await StorageService.getSnippets()
      setSnippets(savedSnippets)
    } catch (error) {
      console.error('Failed to load snippets:', error)
    }
  }

  const loadGitHubSettings = () => {
    try {
      chrome.storage.local.get('github_settings').then(result => {
        if (result.github_settings) {
          const settings: GitHubSettings = result.github_settings
          setGithubEnabled(settings.enabled && !!settings.token)
        }
      })
    } catch (error) {
      console.error('Failed to load GitHub settings:', error)
    }
  }

  const handleSaveSnippet = async (error: ErrorEntry, note: string, tags: string[] = []) => {
    try {
      const snippet: Snippet = {
        id: Date.now().toString(),
        error,
        note,
        tags,
        timestamp: new Date().toISOString()
      }
      
      const updatedSnippets = [snippet, ...snippets]
      setSnippets(updatedSnippets)
      await StorageService.saveSnippet(snippet)
    } catch (error) {
      console.error('Failed to save snippet:', error)
    }
  }

  const handleDeleteSnippet = async (id: string) => {
    try {
      const updatedSnippets = snippets.filter(s => s.id !== id)
      setSnippets(updatedSnippets)
      await StorageService.deleteSnippet(id)
    } catch (error) {
      console.error('Failed to delete snippet:', error)
    }
  }

  const handleGitHubSettingsChange = (settings: GitHubSettings) => {
    setGithubEnabled(settings.enabled && !!settings.token)
  }

  const runAdvancedScan = async () => {
    if (scanning) return
    
    setScanning(true)
    try {
      // Enhanced vulnerability scan
      const vulnerabilityScanners = [
        // DOM-based XSS
        () => {
          const elements = document.querySelectorAll('[onclick], [onload], [onerror]')
          if (elements.length > 0) {
            console.warn(`Security: Found ${elements.length} elements with inline event handlers`)
          }
        },
        
        // Insecure protocols
        () => {
          const insecureLinks = document.querySelectorAll('a[href^="http:"], script[src^="http:"], link[href^="http:"]')
          if (insecureLinks.length > 0) {
            console.warn(`Security: Found ${insecureLinks.length} insecure HTTP resources`)
          }
        },
        
        // Missing CSP
        () => {
          const csp = document.querySelector('meta[http-equiv="Content-Security-Policy"]')
          if (!csp) {
            console.warn('Security: Content Security Policy not found')
          }
        },
        
        // Local storage inspection
        () => {
          const storageKeys = Object.keys(localStorage)
          const sensitiveKeys = storageKeys.filter(key => 
            key.toLowerCase().includes('token') || 
            key.toLowerCase().includes('password') || 
            key.toLowerCase().includes('secret')
          )
          if (sensitiveKeys.length > 0) {
            console.warn(`Security: Potentially sensitive data in localStorage: ${sensitiveKeys.join(', ')}`)
          }
        },
        
        // Cookie security
        () => {
          const cookies = document.cookie.split(';')
          const insecureCookies = cookies.filter(cookie => !cookie.includes('Secure') && !cookie.includes('HttpOnly'))
          if (insecureCookies.length > 0) {
            console.warn(`Security: Found ${insecureCookies.length} potentially insecure cookies`)
          }
        }
      ]

      // Run all scans
      vulnerabilityScanners.forEach((scanner, index) => {
        try {
          scanner()
        } catch (error) {
          console.error(`Vulnerability scan ${index} failed:`, error)
        }
      })

      // Simulate additional advanced scanning
      setTimeout(() => {
        console.info('Advanced vulnerability scan completed')
        setScanning(false)
      }, 2000)
    } catch (error) {
      console.error('Advanced scan failed:', error)
      setScanning(false)
    }
  }

  const injectTestError = () => {
    // Inject a test error for demonstration
    try {
      // @ts-ignore
      window.undefinedFunction()
    } catch (error) {
      console.error('Test Error: This is a demonstration error', error)
    }
  }

  return (
    <div className="h-screen bg-devtools-bg text-devtools-text flex flex-col font-mono text-sm">
      {/* Header */}
      <div className="bg-devtools-panel border-b border-devtools-border p-2 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BugOff className="h-5 w-5 text-red-400" />
            <h1 className="font-bold text-devtools-text">BugTrace</h1>
            <span className="text-xs text-gray-500">v1.0.0</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={injectTestError}
              className="px-3 py-1 text-xs bg-orange-600 text-white rounded hover:bg-orange-700 transition-colors"
              title="Inject a test error"
            >
              Test Error
            </button>

            <button
              onClick={runAdvancedScan}
              disabled={scanning}
              className="px-3 py-1 text-xs bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50 transition-colors flex items-center gap-1"
              title="Run advanced vulnerability scan"
            >
              <Shield className="h-3 w-3" />
              {scanning ? 'Scanning...' : 'Scan'}
            </button>

            <button
              onClick={() => setShowGitHubSettings(true)}
              className="p-2 hover:bg-devtools-panel rounded text-gray-400 hover:text-white transition-colors flex items-center gap-1"
              title="GitHub Settings"
            >
              <Settings className="h-4 w-4" />
              <Brain className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <TabsList className="grid w-full grid-cols-4 bg-devtools-panel border-b border-devtools-border rounded-none">
          <TabsTrigger value="errors" className="flex items-center gap-2">
            <BugOff className="h-4 w-4" />
            Errors ({errors.length})
          </TabsTrigger>
          <TabsTrigger value="suggestions" className="flex items-center gap-2">
            <Search className="h-4 w-4" />
            GitHub Suggestions
            {githubEnabled && <Zap className="h-3 w-3 text-green-400" />}
          </TabsTrigger>
          <TabsTrigger value="snippets" className="flex items-center gap-2">
            <History className="h-4 w-4" />
            My Fixes ({snippets.length})
          </TabsTrigger>
          <TabsTrigger value="github" className="flex items-center gap-2">
            <Github className="h-4 w-4" />
            GitHub
          </TabsTrigger>
        </TabsList>

        <div className="flex-1 overflow-hidden">
          <TabsContent value="errors" className="h-full m-0">
            <ErrorCapture
              errors={errors}
              selectedError={selectedError}
              onSelectError={setSelectedError}
              onSaveSnippet={handleSaveSnippet}
            />
          </TabsContent>

          <TabsContent value="suggestions" className="h-full m-0">
            <SuggestionPanel 
              selectedError={selectedError} 
            />
          </TabsContent>

          <TabsContent value="snippets" className="h-full m-0">
            <SnippetsHistory
              snippets={snippets}
              onDeleteSnippet={handleDeleteSnippet}
            />
          </TabsContent>

          <TabsContent value="github" className="h-full m-0">
            <GitHubIntegrationPanel />
          </TabsContent>
        </div>
      </Tabs>

      {showGitHubSettings && (
        <GitHubSettingsPanel
          onSettingsChange={handleGitHubSettingsChange}
          onClose={() => setShowGitHubSettings(false)}
        />
      )}
    </div>
  )
}

export default App

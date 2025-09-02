import { ErrorEntry } from '../types/index'
import { githubCopilotService } from './GitHubCopilotService'

export class ErrorDetector {
  private static instance: ErrorDetector
  private consoleListeners: ((error: ErrorEntry) => void)[] = []
  private networkListeners: ((error: ErrorEntry) => void)[] = []
  private isListening = false

  constructor() {
    this.handleMessage = this.handleMessage.bind(this)
  }

  static getInstance(): ErrorDetector {
    if (!ErrorDetector.instance) {
      ErrorDetector.instance = new ErrorDetector()
    }
    return ErrorDetector.instance
  }

  startListening() {
    if (this.isListening) return
    
    this.isListening = true
    
    // Listen for messages from background script
    chrome.runtime.onMessage.addListener(this.handleMessage)
    
    // Request current errors from background
    chrome.runtime.sendMessage({ type: 'GET_ERRORS' }, (response) => {
      if (response?.errors) {
        response.errors.forEach((error: ErrorEntry) => {
          this.notifyConsoleListeners(error)
        })
      }
    })

    // Inject enhanced content script for better error capture
    this.injectContentScript()
    
    // Set up periodic error check
    setInterval(() => {
      this.checkLocalStorageErrors()
    }, 2000)
  }

  stopListening() {
    this.isListening = false
    chrome.runtime.onMessage.removeListener(this.handleMessage)
  }

  onConsoleError(callback: (error: ErrorEntry) => void) {
    this.consoleListeners.push(callback)
  }

  onNetworkError(callback: (error: ErrorEntry) => void) {
    this.networkListeners.push(callback)
  }

  private handleMessage(message: any) {
    if (message.type === 'ERROR_UPDATE') {
      message.errors.forEach((error: ErrorEntry) => {
        this.processError(error)
      })
    }
  }

  private async processError(error: ErrorEntry) {
    // Add AI analysis if enabled
    if (this.aiService.isEnabled()) {
      try {
        const analysis = await this.aiService.analyzeError(error)
        if (analysis) {
          error.aiAnalysis = analysis
        }
      } catch (err) {
        console.error('AI analysis failed:', err)
      }
    }

    // Notify listeners based on error type
    if (error.type === 'network') {
      this.notifyNetworkListeners(error)
    } else {
      this.notifyConsoleListeners(error)
    }
  }

  private checkLocalStorageErrors() {
    try {
      const stored = localStorage.getItem('bugtrace-errors')
      if (stored) {
        const errors = JSON.parse(stored)
        errors.forEach((error: ErrorEntry) => {
          this.processError(error)
        })
        // Clear processed errors
        localStorage.removeItem('bugtrace-errors')
      }
    } catch (err) {
      // Ignore localStorage errors
    }
  }

  private injectContentScript() {
    // The content script is already injected via manifest
    // But we can trigger additional error capture
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) {
        chrome.scripting.executeScript({
          target: { tabId: tabs[0].id },
          func: () => {
            // Generate a test error to verify the system works
            console.error('BugTrace system check: Error capture active')
          }
        }).catch(() => {
          // Ignore injection errors (might not have permission)
        })
      }
    })
  }

  // Manual error injection for testing
  async injectTestErrors() {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) {
        chrome.scripting.executeScript({
          target: { tabId: tabs[0].id },
          func: () => {
            // Generate various test errors
            console.error('Test Error: Sample console error')
            console.warn('Test Warning: Sample console warning')
            
            setTimeout(() => {
              try {
                // @ts-ignore
                nonExistentFunction()
              } catch (e) {
                console.error('Test Runtime Error:', e.message)
              }
            }, 100)
            
            setTimeout(() => {
              fetch('/test-404-endpoint').catch(err => {
                console.error('Test Network Error:', err)
              })
            }, 200)

            // Security test
            setTimeout(() => {
              console.warn('Security Test: eval() detected in code')
            }, 300)
          }
        })
      }
    })
  }

  private notifyConsoleListeners(error: ErrorEntry) {
    this.consoleListeners.forEach(callback => {
      try {
        callback(error)
      } catch (err) {
        console.error('Error in console listener:', err)
      }
    })
  }

  private notifyNetworkListeners(error: ErrorEntry) {
    this.networkListeners.forEach(callback => {
      try {
        callback(error)
      } catch (err) {
        console.error('Error in network listener:', err)
      }
    })
  }

  // Get AI service instance for settings management
  getAIService(): AIService {
    return this.aiService
  }
}

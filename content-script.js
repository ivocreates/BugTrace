// Content script for BugTrace - Enhanced error capture
console.log('BugTrace content script loaded');

// Enhanced error capturing
class AdvancedErrorCapture {
  constructor() {
    this.errorCount = 0;
    this.setupErrorCapture();
    this.setupPerformanceMonitoring();
    this.scanPageForVulnerabilities();
  }

  setupErrorCapture() {
    // Override console methods
    const originalError = console.error;
    const originalWarn = console.warn;
    
    console.error = (...args) => {
      originalError.apply(console, args);
      this.captureError('console', 'error', args.join(' '));
    };
    
    console.warn = (...args) => {
      originalWarn.apply(console, args);
      this.captureError('console', 'warning', args.join(' '));
    };

    // Capture unhandled errors
    window.addEventListener('error', (event) => {
      this.captureError('runtime', 'error', event.message, {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: event.error?.stack
      });
    });

    // Capture unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.captureError('promise', 'error', event.reason?.message || String(event.reason), {
        stack: event.reason?.stack
      });
    });

    // Capture network errors
    this.setupNetworkInterception();

    // Capture React errors (if React is present)
    this.setupReactErrorCapture();
  }

  setupNetworkInterception() {
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      try {
        const response = await originalFetch.apply(window, args);
        if (!response.ok && response.status >= 400) {
          this.captureError('network', response.status >= 500 ? 'error' : 'warning', 
            `HTTP ${response.status}: ${response.statusText}`, {
              url: typeof args[0] === 'string' ? args[0] : args[0]?.url,
              method: args[1]?.method || 'GET',
              status: response.status,
              statusText: response.statusText
            });
        }
        return response;
      } catch (error) {
        this.captureError('network', 'error', `Network request failed: ${error.message}`, {
          url: typeof args[0] === 'string' ? args[0] : args[0]?.url,
          method: args[1]?.method || 'GET',
          error: error.message
        });
        throw error;
      }
    };

    // Intercept XMLHttpRequest
    const originalXHROpen = XMLHttpRequest.prototype.open;
    const originalXHRSend = XMLHttpRequest.prototype.send;
    
    XMLHttpRequest.prototype.open = function(method, url) {
      this._method = method;
      this._url = url;
      return originalXHROpen.apply(this, arguments);
    };
    
    XMLHttpRequest.prototype.send = function() {
      const xhr = this;
      const originalOnReadyStateChange = xhr.onreadystatechange;
      
      xhr.onreadystatechange = function() {
        if (xhr.readyState === 4 && xhr.status >= 400) {
          window.advancedErrorCapture.captureError('network', 
            xhr.status >= 500 ? 'error' : 'warning',
            `HTTP ${xhr.status}: ${xhr.statusText}`, {
              url: xhr._url,
              method: xhr._method,
              status: xhr.status,
              statusText: xhr.statusText
            });
        }
        if (originalOnReadyStateChange) {
          originalOnReadyStateChange.apply(xhr, arguments);
        }
      };
      
      return originalXHRSend.apply(this, arguments);
    };
  }

  setupReactErrorCapture() {
    // Check if React is present
    if (window.React && window.React.Component) {
      const originalComponentDidCatch = window.React.Component.prototype.componentDidCatch;
      if (originalComponentDidCatch) {
        window.React.Component.prototype.componentDidCatch = function(error, errorInfo) {
          window.advancedErrorCapture.captureError('react', 'error', error.message, {
            stack: error.stack,
            componentStack: errorInfo.componentStack
          });
          return originalComponentDidCatch.call(this, error, errorInfo);
        };
      }
    }
  }

  setupPerformanceMonitoring() {
    // Monitor for performance issues
    if (window.PerformanceObserver) {
      try {
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.entryType === 'measure' && entry.duration > 1000) {
              this.captureError('performance', 'warning', 
                `Slow operation detected: ${entry.name} took ${entry.duration.toFixed(2)}ms`, {
                  duration: entry.duration,
                  name: entry.name
                });
            }
            if (entry.entryType === 'navigation' && entry.loadEventEnd - entry.navigationStart > 5000) {
              this.captureError('performance', 'warning', 
                `Slow page load: ${(entry.loadEventEnd - entry.navigationStart).toFixed(2)}ms`, {
                  loadTime: entry.loadEventEnd - entry.navigationStart
                });
            }
          }
        });
        observer.observe({ entryTypes: ['measure', 'navigation'] });
      } catch (e) {
        console.log('Performance monitoring not available');
      }
    }
  }

  async scanPageForVulnerabilities() {
    // Scan page content for security vulnerabilities
    setTimeout(() => {
      const scripts = Array.from(document.scripts);
      const vulnerabilities = [];
      
      scripts.forEach(script => {
        if (script.innerHTML) {
          const issues = this.scanCodeForVulnerabilities(script.innerHTML);
          vulnerabilities.push(...issues);
        }
      });

      if (vulnerabilities.length > 0) {
        vulnerabilities.forEach(vuln => {
          this.captureError('security', 'warning', 
            `Security vulnerability detected: ${vuln.description}`, vuln);
        });
      }

      // Scan for common security misconfigurations
      this.scanSecurityHeaders();
      this.scanCookieSettings();
    }, 2000);
  }

  scanCodeForVulnerabilities(code) {
    const vulnerabilities = [];
    const patterns = [
      {
        pattern: /eval\s*\(/gi,
        type: 'Code Injection',
        severity: 'HIGH',
        description: 'Use of eval() detected - potential code injection risk'
      },
      {
        pattern: /innerHTML\s*=.*\+/gi,
        type: 'XSS',
        severity: 'HIGH',
        description: 'Dynamic innerHTML assignment - potential XSS risk'
      },
      {
        pattern: /document\.write\(/gi,
        type: 'XSS',
        severity: 'MEDIUM',
        description: 'document.write() usage detected - potential XSS risk'
      }
    ];

    patterns.forEach(({ pattern, type, severity, description }) => {
      if (pattern.test(code)) {
        vulnerabilities.push({ type, severity, description });
      }
    });

    return vulnerabilities;
  }

  scanSecurityHeaders() {
    // Check for security headers (requires fetch to same origin)
    fetch(window.location.href, { method: 'HEAD' })
      .then(response => {
        const headers = response.headers;
        const securityIssues = [];

        if (!headers.get('Content-Security-Policy')) {
          securityIssues.push('Missing Content-Security-Policy header');
        }
        if (!headers.get('X-Frame-Options')) {
          securityIssues.push('Missing X-Frame-Options header - clickjacking risk');
        }
        if (!headers.get('X-Content-Type-Options')) {
          securityIssues.push('Missing X-Content-Type-Options header');
        }

        securityIssues.forEach(issue => {
          this.captureError('security', 'warning', issue, { type: 'header' });
        });
      })
      .catch(() => {
        // Ignore fetch errors for security header check
      });
  }

  scanCookieSettings() {
    const cookies = document.cookie.split(';');
    cookies.forEach(cookie => {
      if (cookie && !cookie.includes('Secure') && window.location.protocol === 'https:') {
        this.captureError('security', 'warning', 'Cookie without Secure flag on HTTPS site', {
          cookie: cookie.trim(),
          type: 'cookie'
        });
      }
    });
  }

  captureError(type, severity, message, details = {}) {
    this.errorCount++;
    
    const error = {
      id: Date.now() + '-' + Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toISOString(),
      type,
      severity,
      message,
      url: window.location.href,
      userAgent: navigator.userAgent,
      ...details
    };

    // Send to background script
    chrome.runtime.sendMessage({
      type: 'ERROR_CAPTURED',
      error
    }).catch(() => {
      // Extension might not be ready, store locally
      console.log('BugTrace: Error captured but extension not ready:', error);
    });

    // Also store locally for immediate access
    const stored = localStorage.getItem('bugtrace-errors');
    const errors = stored ? JSON.parse(stored) : [];
    errors.unshift(error);
    
    // Keep only last 50 errors in localStorage
    if (errors.length > 50) {
      errors.splice(50);
    }
    
    localStorage.setItem('bugtrace-errors', JSON.stringify(errors));
  }
}

// Initialize error capture
window.advancedErrorCapture = new AdvancedErrorCapture();

// Test error generation (remove in production)
setTimeout(() => {
  console.log('BugTrace: Content script ready - generating test error');
  console.error('BugTrace test error: Extension is working!');
}, 1000);

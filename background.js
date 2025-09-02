// Background service worker for BugTrace
console.log('BugTrace background service worker loaded');

// Store for collected errors
let globalErrors = [];

// Listen for runtime messages from content scripts and devtools
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'ERROR_CAPTURED') {
    globalErrors.push({
      ...message.error,
      tabId: sender.tab?.id,
      url: sender.tab?.url,
      timestamp: new Date().toISOString()
    });
    
    // Keep only last 200 errors
    if (globalErrors.length > 200) {
      globalErrors = globalErrors.slice(-200);
    }
    
    // Notify devtools panel if it's listening
    chrome.runtime.sendMessage({
      type: 'ERROR_UPDATE',
      errors: globalErrors
    }).catch(() => {
      // DevTools panel might not be open, ignore error
    });
  }
  
  if (message.type === 'GET_ERRORS') {
    sendResponse({ errors: globalErrors });
  }
  
  return true;
});

// Listen for tab updates to clear old errors
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'loading') {
    // Clear errors for this tab when page starts loading
    globalErrors = globalErrors.filter(error => error.tabId !== tabId);
  }
});

// Advanced vulnerability scanning function
async function scanForVulnerabilities(code, url) {
  const vulnerabilities = [];
  
  // Common security vulnerability patterns
  const patterns = [
    {
      pattern: /eval\s*\(/gi,
      type: 'Code Injection',
      severity: 'HIGH',
      description: 'Use of eval() can lead to code injection vulnerabilities',
      suggestion: 'Replace eval() with JSON.parse() or safer alternatives'
    },
    {
      pattern: /innerHTML\s*=.*\+/gi,
      type: 'XSS',
      severity: 'HIGH',
      description: 'Dynamic innerHTML assignment can lead to XSS attacks',
      suggestion: 'Use textContent or sanitize HTML input'
    },
    {
      pattern: /document\.write\(/gi,
      type: 'XSS',
      severity: 'MEDIUM',
      description: 'document.write() can be exploited for XSS',
      suggestion: 'Use modern DOM manipulation methods'
    },
    {
      pattern: /window\.location\s*=.*\+/gi,
      type: 'Open Redirect',
      severity: 'MEDIUM',
      description: 'Unvalidated redirects can be abused',
      suggestion: 'Validate URLs before redirecting'
    },
    {
      pattern: /localStorage\.setItem\([^)]*password[^)]*\)/gi,
      type: 'Data Exposure',
      severity: 'HIGH',
      description: 'Storing passwords in localStorage is insecure',
      suggestion: 'Use secure authentication tokens instead'
    },
    {
      pattern: /http:\/\/[^\/]+/gi,
      type: 'Insecure Communication',
      severity: 'MEDIUM',
      description: 'Using HTTP instead of HTTPS',
      suggestion: 'Always use HTTPS for secure communication'
    },
    {
      pattern: /Math\.random\(\)/gi,
      type: 'Weak Randomness',
      severity: 'LOW',
      description: 'Math.random() is not cryptographically secure',
      suggestion: 'Use crypto.getRandomValues() for security-sensitive operations'
    }
  ];
  
  patterns.forEach(({ pattern, type, severity, description, suggestion }) => {
    const matches = code.match(pattern);
    if (matches) {
      vulnerabilities.push({
        type,
        severity,
        description,
        suggestion,
        matches: matches.length,
        pattern: pattern.toString(),
        url
      });
    }
  });
  
  return vulnerabilities;
}

// Export for use in other parts of the extension
self.scanForVulnerabilities = scanForVulnerabilities;

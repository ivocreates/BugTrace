export interface ErrorEntry {
  id: string
  timestamp: string
  type: 'console' | 'network' | 'runtime' | 'security' | 'performance' | 'react'
  severity: 'error' | 'warning' | 'info' | 'critical'
  message: string
  stack?: string
  url?: string
  line?: number
  column?: number
  source?: string
  networkDetails?: {
    url: string
    method: string
    status: number
    statusText: string
    responseTime: number
  }
  vulnerabilityDetails?: {
    type: string
    severity: string
    description: string
    suggestion: string
    pattern?: string
  }
  githubAnalysis?: GitHubAnalysis
}

// Legacy support for ErrorData
export interface ErrorData extends ErrorEntry {}

export interface GitHubAnalysis {
  summary: string
  rootCause: string
  suggestedFixes: string[]
  severityScore: number
  complexity: 'low' | 'medium' | 'high'
  tags: string[]
  relatedPatterns: string[]
  preventionTips: string[]
  githubIssues: GitHubSearchResult[]
  codeExamples: GitHubCodeExample[]
}

export interface GitHubSettings {
  enabled: boolean
  token: string
  selectedRepository: string
  autoCreateIssues: boolean
}

export interface GitHubIssueData {
  id: number;
  number: number;
  title: string;
  url: string;
  state: string;
  created_at: string;
}

export interface GitHubSearchResult {
  id: number;
  title: string;
  url: string;
  body: string;
  state: string;
  repository: string;
  created_at: string;
  score: number;
}

export interface GitHubCodeExample {
  name: string;
  path: string;
  repository: string;
  url: string;
  score: number;
  snippet?: string;
}

export interface Suggestion {
  id: string
  source: 'stackoverflow' | 'github' | 'mdn' | 'copilot' | 'custom'
  title: string
  url?: string
  excerpt: string
  score?: number
  tags?: string[]
  isAccepted?: boolean
  votes?: number
  githubGenerated?: boolean
  confidence?: number
}

export interface Snippet {
  id: string
  error: ErrorEntry
  note: string
  timestamp: string
  tags: string[]
  solution?: string
  isPublic?: boolean
  githubSuggestions?: string[]
}

export interface SearchOptions {
  query: string
  sources: ('stackoverflow' | 'github' | 'mdn' | 'copilot')[]
  maxResults: number
  includeGitHub: boolean
}

export interface ConsoleMessage {
  level: string
  text: string
  url?: string
  line?: number
  column?: number
}

export interface NetworkRequest {
  request: any // chrome.devtools.network.Request
  response?: {
    status: number
    statusText: string
    headers: Record<string, string>
  }
}

export interface VulnerabilityScan {
  id: string
  timestamp: string
  url: string
  vulnerabilities: VulnerabilityIssue[]
  overallRisk: 'low' | 'medium' | 'high' | 'critical'
  suggestions: string[]
}

export interface VulnerabilityIssue {
  type: string
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  description: string
  suggestion: string
  location?: {
    file?: string
    line?: number
    column?: number
  }
  cwe?: string // Common Weakness Enumeration ID
  owasp?: string // OWASP category
}

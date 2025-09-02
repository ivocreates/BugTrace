import { ErrorEntry, Suggestion, SearchOptions } from '../types/index'

export class SuggestionService {
  private readonly STACKOVERFLOW_API = 'https://api.stackexchange.com/2.3'
  private readonly GITHUB_API = 'https://api.github.com'
  
  async getSuggestions(error: ErrorEntry, options: Partial<SearchOptions> = {}): Promise<Suggestion[]> {
    const searchOptions: SearchOptions = {
      query: this.extractSearchQuery(error),
      sources: options.sources || ['stackoverflow', 'github'],
      maxResults: options.maxResults || 10
    }

    const suggestions: Suggestion[] = []
    
    // Search StackOverflow
    if (searchOptions.sources.includes('stackoverflow')) {
      try {
        const stackOverflowResults = await this.searchStackOverflow(searchOptions.query, searchOptions.maxResults)
        suggestions.push(...stackOverflowResults)
      } catch (error) {
        console.error('StackOverflow search failed:', error)
      }
    }

    // Search GitHub Issues
    if (searchOptions.sources.includes('github')) {
      try {
        const githubResults = await this.searchGitHubIssues(searchOptions.query, searchOptions.maxResults)
        suggestions.push(...githubResults)
      } catch (error) {
        console.error('GitHub search failed:', error)
      }
    }

    // Search MDN (basic implementation)
    if (searchOptions.sources.includes('mdn')) {
      try {
        const mdnResults = await this.searchMDN(searchOptions.query, searchOptions.maxResults)
        suggestions.push(...mdnResults)
      } catch (error) {
        console.error('MDN search failed:', error)
      }
    }

    return suggestions.slice(0, searchOptions.maxResults)
  }

  private extractSearchQuery(error: ErrorEntry): string {
    let query = error.message

    // Clean up common error patterns
    query = query
      .replace(/at .+:\d+:\d+/g, '') // Remove stack trace locations
      .replace(/\(.*\)/g, '') // Remove parentheses content
      .replace(/https?:\/\/[^\s]+/g, '') // Remove URLs
      .replace(/\d+/g, '') // Remove numbers
      .replace(/['"]/g, '') // Remove quotes
      .trim()

    // Extract error type if present
    const errorTypeMatch = query.match(/^(\w+Error|Error)/)
    if (errorTypeMatch) {
      const errorType = errorTypeMatch[1]
      query = `${errorType} ${query.replace(errorType, '').trim()}`
    }

    // Limit query length
    if (query.length > 100) {
      query = query.substring(0, 100).trim()
    }

    return query || error.type
  }

  private async searchStackOverflow(query: string, maxResults: number): Promise<Suggestion[]> {
    const params = new URLSearchParams({
      order: 'desc',
      sort: 'relevance',
      q: query,
      site: 'stackoverflow',
      pagesize: Math.min(maxResults, 20).toString(),
      filter: '!9YdnSM5sM' // Custom filter to get relevant fields
    })

    const response = await fetch(`${this.STACKOVERFLOW_API}/search/advanced?${params}`)
    
    if (!response.ok) {
      throw new Error(`StackOverflow API error: ${response.status}`)
    }

    const data = await response.json()
    
    return (data.items || []).map((item: any): Suggestion => ({
      id: `so-${item.question_id}`,
      source: 'stackoverflow',
      title: this.decodeHtml(item.title),
      url: item.link,
      excerpt: this.decodeHtml(item.body_markdown || '').substring(0, 200) + '...',
      score: item.score,
      tags: item.tags || [],
      isAccepted: item.is_answered,
      votes: item.score
    }))
  }

  private async searchGitHubIssues(query: string, maxResults: number): Promise<Suggestion[]> {
    const searchQuery = `${query} type:issue state:closed`
    const params = new URLSearchParams({
      q: searchQuery,
      sort: 'updated',
      order: 'desc',
      per_page: Math.min(maxResults, 20).toString()
    })

    const response = await fetch(`${this.GITHUB_API}/search/issues?${params}`, {
      headers: {
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'BugTrace-Extension'
      }
    })

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status}`)
    }

    const data = await response.json()
    
    return (data.items || []).map((item: any): Suggestion => ({
      id: `gh-${item.id}`,
      source: 'github',
      title: item.title,
      url: item.html_url,
      excerpt: (item.body || '').substring(0, 200) + '...',
      score: item.score,
      tags: item.labels?.map((label: any) => label.name) || [],
      votes: item.reactions?.total_count || 0
    }))
  }

  private async searchMDN(query: string, maxResults: number): Promise<Suggestion[]> {
    // This is a simplified MDN search - in a real implementation,
    // you might want to use a proper MDN API or search service
    const suggestions: Suggestion[] = []
    
    // Common JavaScript error patterns and their MDN links
    const mdnMappings: Record<string, { title: string; url: string; excerpt: string }> = {
      'TypeError': {
        title: 'TypeError - JavaScript | MDN',
        url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/TypeError',
        excerpt: 'The TypeError object represents an error when an operation could not be performed, typically when a value is not of the expected type.'
      },
      'ReferenceError': {
        title: 'ReferenceError - JavaScript | MDN',
        url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/ReferenceError',
        excerpt: 'The ReferenceError object represents an error when a non-existent variable is referenced.'
      },
      'SyntaxError': {
        title: 'SyntaxError - JavaScript | MDN',
        url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/SyntaxError',
        excerpt: 'The SyntaxError object represents an error when trying to interpret syntactically invalid code.'
      },
      'RangeError': {
        title: 'RangeError - JavaScript | MDN',
        url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RangeError',
        excerpt: 'The RangeError object indicates an error when a value is not in the set or range of allowed values.'
      }
    }

    // Check for matching error types
    for (const [errorType, info] of Object.entries(mdnMappings)) {
      if (query.toLowerCase().includes(errorType.toLowerCase())) {
        suggestions.push({
          id: `mdn-${errorType}`,
          source: 'mdn',
          title: info.title,
          url: info.url,
          excerpt: info.excerpt
        })
        
        if (suggestions.length >= maxResults) break
      }
    }

    return suggestions
  }

  private decodeHtml(html: string): string {
    const txt = document.createElement('textarea')
    txt.innerHTML = html
    return txt.value
  }

  async saveSuggestionFeedback(suggestionId: string, helpful: boolean): Promise<void> {
    // Store feedback for future ML improvements
    const feedback = {
      suggestionId,
      helpful,
      timestamp: new Date().toISOString()
    }
    
    // Save to storage for analytics
    try {
      const existingFeedback = await this.getFeedback()
      existingFeedback.push(feedback)
      
      // Keep only last 1000 feedback entries
      if (existingFeedback.length > 1000) {
        existingFeedback.splice(0, existingFeedback.length - 1000)
      }
      
      localStorage.setItem('bugtrace-feedback', JSON.stringify(existingFeedback))
    } catch (error) {
      console.error('Failed to save feedback:', error)
    }
  }

  private async getFeedback(): Promise<Array<{suggestionId: string; helpful: boolean; timestamp: string}>> {
    try {
      const stored = localStorage.getItem('bugtrace-feedback')
      return stored ? JSON.parse(stored) : []
    } catch {
      return []
    }
  }
}

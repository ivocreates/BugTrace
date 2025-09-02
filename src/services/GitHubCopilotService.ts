import { ErrorData, GitHubAnalysis, GitHubCodeExample } from '../types';
import { githubService } from './GitHubService';

export class GitHubCopilotService {
  private isEnabled = false;

  constructor() {
    this.loadSettings();
  }

  private async loadSettings(): Promise<void> {
    try {
      const result = await chrome.storage.local.get('github_copilot_enabled');
      this.isEnabled = result.github_copilot_enabled || false;
    } catch (error) {
      console.error('Failed to load GitHub Copilot settings:', error);
    }
  }

  async isAvailable(): Promise<boolean> {
    return githubService.isConnected() && this.isEnabled;
  }

  async enable(): Promise<void> {
    this.isEnabled = true;
    await chrome.storage.local.set({ github_copilot_enabled: true });
  }

  async disable(): Promise<void> {
    this.isEnabled = false;
    await chrome.storage.local.set({ github_copilot_enabled: false });
  }

  async analyzeError(error: ErrorData): Promise<GitHubAnalysis> {
    if (!await this.isAvailable()) {
      throw new Error('GitHub Copilot service is not available');
    }

    try {
      // Search for similar issues and code examples on GitHub
      const [similarIssues, codeExamples] = await Promise.all([
        this.findSimilarIssues(error),
        this.findCodeExamples(error)
      ]);

      // Generate analysis based on GitHub data
      const analysis = this.generateAnalysis(error, similarIssues, codeExamples);
      
      return analysis;
    } catch (error) {
      console.error('Failed to analyze error with GitHub Copilot:', error);
      throw error;
    }
  }

  private async findSimilarIssues(error: ErrorData) {
    const searchTerms = this.extractSearchTerms(error);
    const query = `${searchTerms.join(' ')} language:javascript type:issue state:closed`;
    
    try {
      return await githubService.searchSimilarErrors(query);
    } catch (err) {
      console.error('Failed to search similar issues:', err);
      return [];
    }
  }

  private async findCodeExamples(error: ErrorData): Promise<GitHubCodeExample[]> {
    const searchTerms = this.extractSearchTerms(error);
    const query = searchTerms.slice(0, 3).join(' '); // Limit search terms for better results
    
    try {
      const results = await githubService.searchCodeSnippets(query);
      return results.map(item => ({
        name: item.name,
        path: item.path,
        repository: item.repository,
        url: item.url,
        score: item.score,
        snippet: '' // Will be populated when viewing the code
      }));
    } catch (err) {
      console.error('Failed to search code examples:', err);
      return [];
    }
  }

  private extractSearchTerms(error: ErrorData): string[] {
    const terms: string[] = [];
    
    // Extract error type
    if (error.type) {
      terms.push(error.type.toLowerCase());
    }
    
    // Extract key words from error message
    const message = error.message || '';
    const keyWords = message
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => 
        word.length > 3 && 
        !['error', 'undefined', 'null', 'cannot', 'failed', 'invalid'].includes(word)
      );
    
    terms.push(...keyWords.slice(0, 5)); // Limit to 5 key words
    
    // Extract function names from stack trace
    if (error.stack) {
      const functionMatches = error.stack.match(/at\s+(\w+)/g);
      if (functionMatches) {
        const functions = functionMatches
          .map(match => match.replace('at ', ''))
          .filter(func => func !== 'Object' && func !== 'Function')
          .slice(0, 3);
        terms.push(...functions);
      }
    }
    
    return [...new Set(terms)]; // Remove duplicates
  }

  private generateAnalysis(
    error: ErrorData, 
    similarIssues: any[], 
    codeExamples: GitHubCodeExample[]
  ): GitHubAnalysis {
    // Analyze error severity
    const severityScore = this.calculateSeverityScore(error);
    
    // Extract patterns from similar issues
    const patterns = this.extractPatterns(similarIssues);
    
    // Generate root cause analysis
    const rootCause = this.analyzeRootCause(error, similarIssues);
    
    // Generate suggested fixes from GitHub issues
    const suggestedFixes = this.extractSuggestedFixes(similarIssues);
    
    // Generate prevention tips
    const preventionTips = this.generatePreventionTips(error, patterns);
    
    // Determine complexity
    const complexity = this.determineComplexity(error, similarIssues.length);
    
    return {
      summary: this.generateSummary(error, similarIssues.length),
      rootCause,
      suggestedFixes,
      severityScore,
      complexity,
      tags: this.generateTags(error),
      relatedPatterns: patterns,
      preventionTips,
      githubIssues: similarIssues,
      codeExamples
    };
  }

  private calculateSeverityScore(error: ErrorData): number {
    let score = 5; // Base score
    
    // Increase score for critical errors
    if (error.severity === 'critical') score += 3;
    else if (error.severity === 'error') score += 2;
    else if (error.severity === 'warning') score += 1;
    
    // Increase score for security/network errors
    if (error.type === 'security') score += 2;
    else if (error.type === 'network') score += 1;
    
    return Math.min(score, 10);
  }

  private extractPatterns(issues: any[]): string[] {
    const patterns = new Set<string>();
    
    issues.forEach(issue => {
      // Extract common patterns from issue titles and bodies
      const text = (issue.title + ' ' + issue.body).toLowerCase();
      
      // Common JavaScript error patterns
      if (text.includes('undefined')) patterns.add('undefined-reference');
      if (text.includes('null')) patterns.add('null-pointer');
      if (text.includes('cors')) patterns.add('cors-issue');
      if (text.includes('async')) patterns.add('async-issue');
      if (text.includes('promise')) patterns.add('promise-handling');
      if (text.includes('fetch')) patterns.add('fetch-api');
      if (text.includes('dom')) patterns.add('dom-manipulation');
    });
    
    return Array.from(patterns);
  }

  private analyzeRootCause(error: ErrorData, issues: any[]): string {
    const commonCauses = [
      'Variable or function not defined in current scope',
      'Asynchronous operation completed after component unmounted',
      'API endpoint returned unexpected response format',
      'Missing error handling for network requests',
      'Incorrect DOM element selection or timing',
      'Type mismatch in function parameters',
      'Missing dependency in useEffect hook'
    ];
    
    // Simple heuristic based on error type and message
    if (error.message.toLowerCase().includes('undefined')) {
      return commonCauses[0];
    } else if (error.type === 'network') {
      return commonCauses[3];
    } else if (error.message.toLowerCase().includes('null')) {
      return commonCauses[4];
    } else {
      return issues.length > 0 ? 
        'Based on similar GitHub issues, this appears to be a common pattern' :
        'This error requires further investigation';
    }
  }

  private extractSuggestedFixes(issues: any[]): string[] {
    const fixes = new Set<string>();
    
    issues.slice(0, 5).forEach(issue => {
      // Extract fixes from issue bodies and comments
      const body = issue.body?.toLowerCase() || '';
      
      if (body.includes('try catch')) {
        fixes.add('Add try-catch block for error handling');
      }
      if (body.includes('null check') || body.includes('undefined check')) {
        fixes.add('Add null/undefined checks before accessing properties');
      }
      if (body.includes('await') || body.includes('promise')) {
        fixes.add('Properly handle asynchronous operations with await/then');
      }
      if (body.includes('useeffect')) {
        fixes.add('Add cleanup function in useEffect to prevent memory leaks');
      }
      if (body.includes('cors')) {
        fixes.add('Configure CORS headers on server or use proxy');
      }
    });
    
    if (fixes.size === 0) {
      fixes.add('Check the GitHub issues linked above for community solutions');
      fixes.add('Review the code examples for similar implementations');
      fixes.add('Add proper error handling and validation');
    }
    
    return Array.from(fixes);
  }

  private generatePreventionTips(error: ErrorData, patterns: string[]): string[] {
    const tips = [
      'Use TypeScript for better type safety and error detection',
      'Add proper error boundaries in React applications',
      'Implement comprehensive error handling for all async operations',
      'Use ESLint rules to catch common JavaScript pitfalls',
      'Add unit tests to verify function behavior with edge cases'
    ];
    
    // Add pattern-specific tips
    if (patterns.includes('undefined-reference')) {
      tips.unshift('Always initialize variables before use');
    }
    if (patterns.includes('cors-issue')) {
      tips.unshift('Test API calls in development environment');
    }
    if (patterns.includes('async-issue')) {
      tips.unshift('Use proper async/await patterns and error handling');
    }
    
    return tips;
  }

  private determineComplexity(error: ErrorData, issueCount: number): 'low' | 'medium' | 'high' {
    if (issueCount > 50) return 'low'; // Common issue, well documented
    if (issueCount > 10) return 'medium'; // Moderately common
    return 'high'; // Rare or complex issue
  }

  private generateSummary(error: ErrorData, issueCount: number): string {
    const baseMessage = `${error.type} error: ${error.message}`;
    const contextMessage = issueCount > 0 ? 
      ` Found ${issueCount} similar issues on GitHub.` :
      ' This appears to be a unique error pattern.';
    
    return baseMessage + contextMessage;
  }

  private generateTags(error: ErrorData): string[] {
    const tags = ['javascript', 'debugging'];
    
    if (error.type) tags.push(error.type);
    if (error.severity) tags.push(error.severity);
    
    // Add framework-specific tags based on stack trace
    if (error.stack?.includes('react')) tags.push('react');
    if (error.stack?.includes('vue')) tags.push('vue');
    if (error.stack?.includes('angular')) tags.push('angular');
    
    return tags;
  }

  async scanForVulnerabilities(error: ErrorData): Promise<string[]> {
    if (!await this.isAvailable()) {
      return [];
    }

    const vulnerabilities: string[] = [];
    const message = error.message?.toLowerCase() || '';
    
    // Check for common security patterns
    if (message.includes('eval') || error.stack?.includes('eval')) {
      vulnerabilities.push('Code injection risk: eval() usage detected');
    }
    
    if (message.includes('innerhtml') || error.stack?.includes('innerHTML')) {
      vulnerabilities.push('XSS risk: innerHTML usage without sanitization');
    }
    
    if (error.type === 'network' && error.networkDetails?.url) {
      const url = error.networkDetails.url;
      if (url.startsWith('http://')) {
        vulnerabilities.push('Security risk: HTTP connection detected, use HTTPS');
      }
    }
    
    return vulnerabilities;
  }
}

export const githubCopilotService = new GitHubCopilotService();

import { Octokit } from '@octokit/rest';
import { ErrorData, GitHubIssueData, GitHubSearchResult } from '../types';

export class GitHubService {
  private octokit: Octokit | null = null;
  private isAuthenticated = false;

  constructor() {
    this.loadStoredToken();
  }

  private async loadStoredToken(): Promise<void> {
    try {
      const result = await chrome.storage.local.get('github_token');
      if (result.github_token) {
        this.octokit = new Octokit({ auth: result.github_token });
        this.isAuthenticated = true;
      }
    } catch (error) {
      console.error('Failed to load GitHub token:', error);
    }
  }

  async authenticate(token: string): Promise<boolean> {
    try {
      this.octokit = new Octokit({ auth: token });
      
      // Validate token by making a test request
      await this.octokit.rest.users.getAuthenticated();
      
      // Store token securely
      await chrome.storage.local.set({ github_token: token });
      this.isAuthenticated = true;
      
      return true;
    } catch (error) {
      console.error('GitHub authentication failed:', error);
      this.isAuthenticated = false;
      return false;
    }
  }

  async disconnect(): Promise<void> {
    try {
      await chrome.storage.local.remove('github_token');
      this.octokit = null;
      this.isAuthenticated = false;
    } catch (error) {
      console.error('Failed to disconnect from GitHub:', error);
    }
  }

  isConnected(): boolean {
    return this.isAuthenticated && this.octokit !== null;
  }

  async getCurrentUser() {
    if (!this.isConnected()) {
      throw new Error('GitHub not authenticated');
    }

    try {
      const { data } = await this.octokit!.rest.users.getAuthenticated();
      return data;
    } catch (error) {
      console.error('Failed to get current user:', error);
      throw error;
    }
  }

  async getUserRepositories(): Promise<any[]> {
    if (!this.isConnected()) {
      throw new Error('GitHub not authenticated');
    }

    try {
      const { data } = await this.octokit!.rest.repos.listForAuthenticatedUser({
        visibility: 'all',
        sort: 'updated',
        per_page: 100
      });
      return data;
    } catch (error) {
      console.error('Failed to get repositories:', error);
      throw error;
    }
  }

  async createIssue(repo: string, error: ErrorData): Promise<GitHubIssueData> {
    if (!this.isConnected()) {
      throw new Error('GitHub not authenticated');
    }

    const [owner, repoName] = repo.split('/');
    if (!owner || !repoName) {
      throw new Error('Invalid repository format. Use "owner/repo"');
    }

    try {
      const issueBody = this.generateIssueBody(error);
      const labels = this.generateLabels(error);

      const { data } = await this.octokit!.rest.issues.create({
        owner,
        repo: repoName,
        title: `[BugTrace] ${error.message}`,
        body: issueBody,
        labels
      });

      return {
        id: data.id,
        number: data.number,
        title: data.title,
        url: data.html_url,
        state: data.state,
        created_at: data.created_at
      };
    } catch (error) {
      console.error('Failed to create GitHub issue:', error);
      throw error;
    }
  }

  async searchSimilarErrors(query: string): Promise<GitHubSearchResult[]> {
    if (!this.isConnected()) {
      throw new Error('GitHub not authenticated');
    }

    try {
      const searchQuery = `${query} type:issue language:javascript`;
      const { data } = await this.octokit!.rest.search.issuesAndPullRequests({
        q: searchQuery,
        sort: 'updated',
        per_page: 10
      });

      return data.items.map((item: any) => ({
        id: item.id,
        title: item.title,
        url: item.html_url,
        body: item.body || '',
        state: item.state,
        repository: item.repository_url.split('/').slice(-2).join('/'),
        created_at: item.created_at,
        score: item.score || 0
      }));
    } catch (error) {
      console.error('Failed to search GitHub issues:', error);
      throw error;
    }
  }

  async searchCodeSnippets(query: string): Promise<any[]> {
    if (!this.isConnected()) {
      throw new Error('GitHub not authenticated');
    }

    try {
      const { data } = await this.octokit!.rest.search.code({
        q: `${query} extension:js OR extension:ts`,
        sort: 'indexed',
        per_page: 10
      });

      return data.items.map((item: any) => ({
        name: item.name,
        path: item.path,
        repository: item.repository.full_name,
        url: item.html_url,
        score: item.score
      }));
    } catch (error) {
      console.error('Failed to search code snippets:', error);
      throw error;
    }
  }

  async getRepositoryInfo(repo: string) {
    if (!this.isConnected()) {
      throw new Error('GitHub not authenticated');
    }

    const [owner, repoName] = repo.split('/');
    if (!owner || !repoName) {
      throw new Error('Invalid repository format. Use "owner/repo"');
    }

    try {
      const { data } = await this.octokit!.rest.repos.get({
        owner,
        repo: repoName
      });

      return {
        id: data.id,
        name: data.name,
        full_name: data.full_name,
        description: data.description,
        url: data.html_url,
        language: data.language,
        stars: data.stargazers_count,
        forks: data.forks_count,
        issues: data.open_issues_count
      };
    } catch (error) {
      console.error('Failed to get repository info:', error);
      throw error;
    }
  }

  private generateIssueBody(error: ErrorData): string {
    return `
## 🐛 Bug Report from BugTrace

**Error Message:** ${error.message}

**Error Type:** ${error.type}

**Timestamp:** ${new Date(error.timestamp).toISOString()}

**URL:** ${error.url}

### Stack Trace
\`\`\`javascript
${error.stackTrace}
\`\`\`

### Browser Information
- **User Agent:** ${error.userAgent}
- **Line:** ${error.line}
- **Column:** ${error.column}
- **Source:** ${error.source}

### Additional Context
${error.context ? JSON.stringify(error.context, null, 2) : 'No additional context available.'}

### Network Information
${error.networkError ? `
- **Network Error:** ${error.networkError.message}
- **Status:** ${error.networkError.status}
- **URL:** ${error.networkError.url}
` : 'No network errors detected.'}

---

*This issue was automatically created by [BugTrace](https://github.com/ivocreates/BugTrace) - A Chrome DevTools extension for intelligent error debugging.*

**Need help with this error?** The BugTrace extension can provide AI-powered suggestions and search for similar issues across GitHub repositories.
`;
  }

  private generateLabels(error: ErrorData): string[] {
    const labels = ['bug', 'bugtrace'];
    
    // Add labels based on error type
    switch (error.type.toLowerCase()) {
      case 'typeerror':
        labels.push('javascript', 'type-error');
        break;
      case 'referenceerror':
        labels.push('javascript', 'reference-error');
        break;
      case 'syntaxerror':
        labels.push('javascript', 'syntax-error');
        break;
      case 'networkerror':
        labels.push('network', 'api');
        break;
      case 'securityerror':
        labels.push('security', 'cors');
        break;
      default:
        labels.push('javascript');
    }

    // Add severity label
    if (error.severity) {
      labels.push(`severity:${error.severity}`);
    }

    // Add frontend label
    labels.push('frontend');

    return labels;
  }
}

export const githubService = new GitHubService();

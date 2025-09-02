import React, { useState, useEffect } from 'react';
import { githubService } from '../services/GitHubService';

interface GitHubUser {
  login: string;
  name: string | null;
  avatar_url: string;
  public_repos: number;
}

interface Repository {
  id: number;
  name: string;
  full_name: string;
  description: string;
  language: string;
  stargazers_count: number;
  private: boolean;
}

export const GitHubIntegrationPanel: React.FC = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [user, setUser] = useState<GitHubUser | null>(null);
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedRepo, setSelectedRepo] = useState('');

  useEffect(() => {
    checkConnection();
  }, []);

  const checkConnection = async () => {
    if (githubService.isConnected()) {
      setIsConnected(true);
      try {
        const userData = await githubService.getCurrentUser();
        setUser(userData);
        await loadRepositories();
      } catch (err) {
        console.error('Failed to get user data:', err);
        setError('Failed to load GitHub data');
      }
    }
  };

  const handleConnect = async () => {
    if (!token.trim()) {
      setError('Please enter a valid GitHub token');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const success = await githubService.authenticate(token);
      if (success) {
        setIsConnected(true);
        const userData = await githubService.getCurrentUser();
        setUser(userData);
        await loadRepositories();
        setToken(''); // Clear token from UI for security
      } else {
        setError('Authentication failed. Please check your token.');
      }
    } catch (err) {
      setError('Failed to authenticate with GitHub');
      console.error('GitHub auth error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    await githubService.disconnect();
    setIsConnected(false);
    setUser(null);
    setRepositories([]);
    setSelectedRepo('');
  };

  const loadRepositories = async () => {
    try {
      const repos = await githubService.getUserRepositories();
      setRepositories(repos);
    } catch (err) {
      console.error('Failed to load repositories:', err);
      setError('Failed to load repositories');
    }
  };

  const handleCreateIssue = async (errorData: any) => {
    if (!selectedRepo) {
      setError('Please select a repository first');
      return;
    }

    try {
      const issue = await githubService.createIssue(selectedRepo, errorData);
      alert(`Issue created successfully: ${issue.url}`);
    } catch (err) {
      setError('Failed to create GitHub issue');
      console.error('Create issue error:', err);
    }
  };

  if (!isConnected) {
    return (
      <div className="p-6 space-y-4">
        <div className="flex items-center space-x-2">
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
          </svg>
          <h2 className="text-lg font-semibold">GitHub Integration</h2>
        </div>
        
        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
          <h3 className="font-medium mb-2">Connect to GitHub</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Connect your GitHub account to create issues from errors, search for similar problems, and access repository features.
          </p>
          
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium mb-1">
                GitHub Personal Access Token
              </label>
              <input
                type="password"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                className="w-full px-3 py-2 border rounded-md dark:bg-gray-800 dark:border-gray-600"
              />
              <p className="text-xs text-gray-500 mt-1">
                Create a token at <a href="https://github.com/settings/tokens" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">github.com/settings/tokens</a> with 'repo' and 'user' scopes.
              </p>
            </div>
            
            <button
              onClick={handleConnect}
              disabled={loading}
              className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50"
            >
              {loading ? 'Connecting...' : 'Connect to GitHub'}
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-300 px-4 py-3 rounded">
            {error}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* User Info */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          {user?.avatar_url && (
            <img src={user.avatar_url} alt="GitHub Avatar" className="w-8 h-8 rounded-full" />
          )}
          <div>
            <h2 className="text-lg font-semibold">Connected to GitHub</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {user?.name || user?.login} • {user?.public_repos} repositories
            </p>
          </div>
        </div>
        <button
          onClick={handleDisconnect}
          className="text-red-600 hover:text-red-800 text-sm"
        >
          Disconnect
        </button>
      </div>

      {/* Repository Selection */}
      <div>
        <label className="block text-sm font-medium mb-2">
          Select Repository for Issue Creation
        </label>
        <select
          value={selectedRepo}
          onChange={(e) => setSelectedRepo(e.target.value)}
          className="w-full px-3 py-2 border rounded-md dark:bg-gray-800 dark:border-gray-600"
          title="Select repository for issue creation"
        >
          <option value="">Choose a repository...</option>
          {repositories.map((repo) => (
            <option key={repo.id} value={repo.full_name}>
              {repo.full_name} {repo.private ? '(Private)' : '(Public)'}
            </option>
          ))}
        </select>
      </div>

      {/* Features */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
          <h3 className="font-medium mb-2 flex items-center">
            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
            </svg>
            Issue Creation
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Automatically create GitHub issues from captured errors with detailed context and stack traces.
          </p>
        </div>

        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
          <h3 className="font-medium mb-2 flex items-center">
            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Solution Search
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Search GitHub repositories and issues for similar errors and community solutions.
          </p>
        </div>

        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
          <h3 className="font-medium mb-2 flex items-center">
            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
            </svg>
            Code Snippets
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Find relevant code examples and snippets from open source projects.
          </p>
        </div>

        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
          <h3 className="font-medium mb-2 flex items-center">
            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
            </svg>
            Secure Integration
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            OAuth authentication and secure token storage with minimal required permissions.
          </p>
        </div>
      </div>

      {/* Repository Stats */}
      {repositories.length > 0 && (
        <div>
          <h3 className="font-medium mb-3">Your Repositories</h3>
          <div className="max-h-40 overflow-y-auto space-y-2">
            {repositories.slice(0, 5).map((repo) => (
              <div key={repo.id} className="flex items-center justify-between py-2 px-3 bg-gray-50 dark:bg-gray-800 rounded">
                <div>
                  <span className="font-medium text-sm">{repo.name}</span>
                  {repo.description && (
                    <p className="text-xs text-gray-500 truncate max-w-xs">{repo.description}</p>
                  )}
                </div>
                <div className="flex items-center space-x-2 text-xs text-gray-500">
                  {repo.language && (
                    <span className="bg-blue-100 dark:bg-blue-900 px-2 py-1 rounded">
                      {repo.language}
                    </span>
                  )}
                  <span>★ {repo.stargazers_count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-300 px-4 py-3 rounded">
          {error}
        </div>
      )}
    </div>
  );
};

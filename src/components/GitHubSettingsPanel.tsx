import React, { useState, useEffect } from 'react';
import { GitHubSettings } from '../types';
import { githubService } from '../services/GitHubService';
import { githubCopilotService } from '../services/GitHubCopilotService';

interface GitHubSettingsPanelProps {
  onSettingsChange: (settings: GitHubSettings) => void;
  onClose: () => void;
}

export const GitHubSettingsPanel: React.FC<GitHubSettingsPanelProps> = ({ onSettingsChange, onClose }) => {
  const [settings, setSettings] = useState<GitHubSettings>({
    enabled: false,
    token: '',
    selectedRepository: '',
    autoCreateIssues: false
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [repositories, setRepositories] = useState<any[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    loadSettings();
    checkConnection();
  }, []);

  const loadSettings = async () => {
    try {
      const result = await chrome.storage.local.get('github_settings');
      if (result.github_settings) {
        setSettings(result.github_settings);
      }
    } catch (err) {
      console.error('Failed to load GitHub settings:', err);
    }
  };

  const checkConnection = async () => {
    if (githubService.isConnected()) {
      setIsConnected(true);
      try {
        const userData = await githubService.getCurrentUser();
        setUser(userData);
        await loadRepositories();
      } catch (err) {
        console.error('Failed to get user data:', err);
      }
    }
  };

  const loadRepositories = async () => {
    try {
      const repos = await githubService.getUserRepositories();
      setRepositories(repos);
    } catch (err) {
      console.error('Failed to load repositories:', err);
    }
  };

  const handleConnect = async () => {
    if (!settings.token.trim()) {
      setError('Please enter a valid GitHub token');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const success = await githubService.authenticate(settings.token);
      if (success) {
        setIsConnected(true);
        const userData = await githubService.getCurrentUser();
        setUser(userData);
        await loadRepositories();
        await githubCopilotService.enable();
        
        const newSettings = { ...settings, enabled: true };
        setSettings(newSettings);
        await chrome.storage.local.set({ github_settings: newSettings });
        onSettingsChange(newSettings);
        
        setSettings(prev => ({ ...prev, token: '' })); // Clear token from UI
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
    await githubCopilotService.disable();
    setIsConnected(false);
    setUser(null);
    setRepositories([]);
    
    const newSettings = {
      enabled: false,
      token: '',
      selectedRepository: '',
      autoCreateIssues: false
    };
    setSettings(newSettings);
    await chrome.storage.local.set({ github_settings: newSettings });
    onSettingsChange(newSettings);
  };

  const handleSettingChange = async (key: keyof GitHubSettings, value: any) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    await chrome.storage.local.set({ github_settings: newSettings });
    onSettingsChange(newSettings);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-96 max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-600">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
            </svg>
            GitHub & Copilot Settings
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            ✕
          </button>
        </div>

        <div className="p-4 space-y-4">
          {!isConnected ? (
            <div className="space-y-4">
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                <h3 className="font-medium mb-2">Connect to GitHub</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Connect your GitHub account to enable Copilot-powered error analysis, issue creation, and code suggestions.
                </p>
                
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      GitHub Personal Access Token
                    </label>
                    <input
                      type="password"
                      value={settings.token}
                      onChange={(e) => setSettings(prev => ({ ...prev, token: e.target.value }))}
                      placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                      className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Create a token at <a href="https://github.com/settings/tokens" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">github.com/settings/tokens</a> with 'repo' and 'user' scopes.
                    </p>
                  </div>
                  
                  <button
                    onClick={handleConnect}
                    disabled={loading}
                    className="w-full bg-green-600 text-white py-2 rounded-md hover:bg-green-700 disabled:opacity-50"
                  >
                    {loading ? 'Connecting...' : 'Connect to GitHub'}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Connection Status */}
              <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {user?.avatar_url && (
                      <img src={user.avatar_url} alt="GitHub Avatar" className="w-8 h-8 rounded-full" />
                    )}
                    <div>
                      <p className="font-medium">{user?.name || user?.login}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Connected to GitHub • Copilot Enabled
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
              </div>

              {/* Repository Selection */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Default Repository for Issues
                </label>
                <select
                  value={settings.selectedRepository}
                  onChange={(e) => handleSettingChange('selectedRepository', e.target.value)}
                  className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
                  title="Select default repository for issue creation"
                >
                  <option value="">Choose a repository...</option>
                  {repositories.map((repo: any) => (
                    <option key={repo.id} value={repo.full_name}>
                      {repo.full_name} {repo.private ? '(Private)' : '(Public)'}
                    </option>
                  ))}
                </select>
              </div>

              {/* Auto-create Issues */}
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium">Auto-create GitHub Issues</label>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Automatically create GitHub issues for critical errors
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.autoCreateIssues}
                    onChange={(e) => handleSettingChange('autoCreateIssues', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                </label>
              </div>

              {/* Features */}
              <div className="border-t border-gray-200 dark:border-gray-600 pt-4">
                <h4 className="font-medium mb-3">Enabled Features</h4>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    GitHub Copilot Error Analysis
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    Similar Issue Detection
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    Code Example Search
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    Automated Issue Creation
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    Vulnerability Scanning
                  </div>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-300 px-4 py-3 rounded">
              {error}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

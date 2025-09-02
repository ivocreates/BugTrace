import React, { useState, useEffect } from 'react'
import { AISettings } from '../types/index'
import { Settings, Brain, Key, Zap, Shield } from 'lucide-react'

interface AISettingsProps {
  onSettingsChange: (settings: AISettings) => void
  onClose: () => void
}

export function AISettingsPanel({ onSettingsChange, onClose }: AISettingsProps) {
  const [settings, setSettings] = useState<AISettings>({
    enabled: false,
    provider: 'openai',
    apiKey: '',
    model: 'gpt-3.5-turbo',
    maxTokens: 1000,
    temperature: 0.3
  })

  const [testResult, setTestResult] = useState<string>('')
  const [testing, setTesting] = useState(false)

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = () => {
    try {
      const stored = localStorage.getItem('bugtrace-ai-settings')
      if (stored) {
        setSettings({ ...settings, ...JSON.parse(stored) })
      }
    } catch (error) {
      console.error('Failed to load AI settings:', error)
    }
  }

  const handleSave = () => {
    localStorage.setItem('bugtrace-ai-settings', JSON.stringify(settings))
    onSettingsChange(settings)
    onClose()
  }

  const handleTest = async () => {
    setTesting(true)
    setTestResult('')
    
    try {
      const testPrompt = 'Respond with "AI connection successful!" to confirm the API is working.'
      
      let response: Response
      
      if (settings.provider === 'openai') {
        response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${settings.apiKey}`
          },
          body: JSON.stringify({
            model: settings.model,
            messages: [{ role: 'user', content: testPrompt }],
            max_tokens: 50
          })
        })
      } else if (settings.provider === 'gemini') {
        response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${settings.model}:generateContent?key=${settings.apiKey}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            contents: [{ parts: [{ text: testPrompt }] }]
          })
        })
      } else {
        throw new Error('Custom API testing not implemented')
      }
      
      if (response.ok) {
        setTestResult('✅ API connection successful!')
      } else {
        const error = await response.text()
        setTestResult(`❌ API Error: ${response.status} - ${error.substring(0, 100)}...`)
      }
    } catch (error: any) {
      setTestResult(`❌ Connection Failed: ${error.message}`)
    } finally {
      setTesting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-devtools-panel border border-devtools-border rounded-lg w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-devtools-accent" />
              <h2 className="text-lg font-semibold">AI Configuration</h2>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              ✕
            </button>
          </div>

          <div className="space-y-6">
            {/* Enable AI */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-yellow-500" />
                <span className="font-medium">Enable AI Analysis</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.enabled}
                  onChange={(e) => setSettings({ ...settings, enabled: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-devtools-accent rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-devtools-accent"></div>
              </label>
            </div>

            {/* Provider Selection */}
            <div>
              <label className="block text-sm font-medium mb-2">AI Provider</label>
              <select
                value={settings.provider}
                onChange={(e) => setSettings({ 
                  ...settings, 
                  provider: e.target.value as 'openai' | 'gemini' | 'custom',
                  model: e.target.value === 'openai' ? 'gpt-3.5-turbo' : 'gemini-pro'
                })}
                className="w-full px-3 py-2 bg-devtools-bg border border-devtools-border rounded text-white focus:outline-none focus:border-devtools-accent"
              >
                <option value="openai">OpenAI (GPT-3.5/GPT-4)</option>
                <option value="gemini">Google Gemini (Free Tier)</option>
                <option value="custom">Custom API Endpoint</option>
              </select>
            </div>

            {/* API Key */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium mb-2">
                <Key className="h-4 w-4" />
                API Key
              </label>
              <input
                type="password"
                value={settings.apiKey}
                onChange={(e) => setSettings({ ...settings, apiKey: e.target.value })}
                placeholder={`Enter your ${settings.provider} API key`}
                className="w-full px-3 py-2 bg-devtools-bg border border-devtools-border rounded text-white focus:outline-none focus:border-devtools-accent"
              />
              <p className="text-xs text-gray-400 mt-1">
                {settings.provider === 'openai' && 'Get your API key from https://platform.openai.com/api-keys'}
                {settings.provider === 'gemini' && 'Get your free API key from https://makersuite.google.com/app/apikey'}
                {settings.provider === 'custom' && 'Enter your custom API endpoint API key'}
              </p>
            </div>

            {/* Model Selection */}
            <div>
              <label className="block text-sm font-medium mb-2">Model</label>
              <input
                type="text"
                value={settings.model}
                onChange={(e) => setSettings({ ...settings, model: e.target.value })}
                placeholder={settings.provider === 'openai' ? 'gpt-3.5-turbo' : 'gemini-pro'}
                className="w-full px-3 py-2 bg-devtools-bg border border-devtools-border rounded text-white focus:outline-none focus:border-devtools-accent"
              />
            </div>

            {/* Custom Endpoint (for custom provider) */}
            {settings.provider === 'custom' && (
              <div>
                <label className="block text-sm font-medium mb-2">API Endpoint</label>
                <input
                  type="url"
                  value={settings.endpoint || ''}
                  onChange={(e) => setSettings({ ...settings, endpoint: e.target.value })}
                  placeholder="https://api.example.com/v1/chat/completions"
                  className="w-full px-3 py-2 bg-devtools-bg border border-devtools-border rounded text-white focus:outline-none focus:border-devtools-accent"
                />
              </div>
            )}

            {/* Advanced Settings */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Max Tokens</label>
                <input
                  type="number"
                  value={settings.maxTokens}
                  onChange={(e) => setSettings({ ...settings, maxTokens: parseInt(e.target.value) || 1000 })}
                  min="100"
                  max="4000"
                  className="w-full px-3 py-2 bg-devtools-bg border border-devtools-border rounded text-white focus:outline-none focus:border-devtools-accent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Temperature</label>
                <input
                  type="number"
                  value={settings.temperature}
                  onChange={(e) => setSettings({ ...settings, temperature: parseFloat(e.target.value) || 0.3 })}
                  min="0"
                  max="2"
                  step="0.1"
                  className="w-full px-3 py-2 bg-devtools-bg border border-devtools-border rounded text-white focus:outline-none focus:border-devtools-accent"
                />
              </div>
            </div>

            {/* Security Notice */}
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded p-3">
              <div className="flex items-start gap-2">
                <Shield className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                <div className="text-sm">
                  <p className="text-yellow-200 font-medium mb-1">Privacy & Security Notice</p>
                  <ul className="text-gray-300 text-xs space-y-1">
                    <li>• API keys are stored locally in your browser</li>
                    <li>• Error messages are sent to AI providers for analysis</li>
                    <li>• No personal data or source code is transmitted</li>
                    <li>• You can disable AI features at any time</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Test Connection */}
            <div>
              <button
                onClick={handleTest}
                disabled={!settings.apiKey || testing}
                className="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {testing ? 'Testing Connection...' : 'Test API Connection'}
              </button>
              {testResult && (
                <p className="mt-2 text-sm p-2 bg-devtools-bg rounded">
                  {testResult}
                </p>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-devtools-border">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-devtools-accent text-white rounded hover:bg-blue-600 transition-colors"
            >
              Save Settings
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

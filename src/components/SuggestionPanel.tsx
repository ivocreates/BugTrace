import React, { useState, useEffect } from 'react'
import { ErrorEntry, Suggestion } from '../types/index'
import { SuggestionService } from '../services/SuggestionService'
import { Search, ExternalLink, Star, ArrowUpDown, ThumbsUp, ThumbsDown, Loader } from 'lucide-react'

interface SuggestionPanelProps {
  selectedError: ErrorEntry | null
  aiEnabled?: boolean
}

export function SuggestionPanel({ selectedError, aiEnabled = false }: SuggestionPanelProps) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<'relevance' | 'votes'>('relevance')
  const [filterSource, setFilterSource] = useState<'all' | 'stackoverflow' | 'github' | 'mdn'>('all')

  const suggestionService = new SuggestionService()

  useEffect(() => {
    if (selectedError) {
      fetchSuggestions(selectedError)
    } else {
      setSuggestions([])
    }
  }, [selectedError])

  const fetchSuggestions = async (error: ErrorEntry) => {
    setLoading(true)
    try {
      const results = await suggestionService.getSuggestions(error, {
        maxResults: 20
      })
      setSuggestions(results)
    } catch (err) {
      console.error('Failed to fetch suggestions:', err)
      setSuggestions([])
    } finally {
      setLoading(false)
    }
  }

  const handleCustomSearch = async () => {
    if (!searchQuery.trim()) return
    
    setLoading(true)
    try {
      const customError: ErrorEntry = {
        id: 'custom-search',
        timestamp: new Date().toISOString(),
        type: 'console',
        severity: 'info',
        message: searchQuery,
        source: 'custom-search'
      }
      
      const results = await suggestionService.getSuggestions(customError, {
        maxResults: 20
      })
      setSuggestions(results)
    } catch (err) {
      console.error('Failed to search:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleFeedback = async (suggestion: Suggestion, helpful: boolean) => {
    try {
      await suggestionService.saveSuggestionFeedback(suggestion.id, helpful)
    } catch (err) {
      console.error('Failed to save feedback:', err)
    }
  }

  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'stackoverflow':
        return '📚'
      case 'github':
        return '🐙'
      case 'mdn':
        return '📖'
      default:
        return '🔍'
    }
  }

  const filteredSuggestions = suggestions
    .filter(s => filterSource === 'all' || s.source === filterSource)
    .sort((a, b) => {
      if (sortBy === 'votes') {
        return (b.votes || 0) - (a.votes || 0)
      }
      return (b.score || 0) - (a.score || 0)
    })

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-devtools-border bg-devtools-panel">
        <div className="flex items-center gap-2 mb-4">
          <Search className="h-4 w-4" />
          <h3 className="text-sm font-medium">Suggestions & Solutions</h3>
        </div>

        {/* Custom Search */}
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search for solutions manually..."
            className="flex-1 px-3 py-2 bg-devtools-bg border border-devtools-border rounded text-sm focus:outline-none focus:border-devtools-accent"
            onKeyDown={(e) => e.key === 'Enter' && handleCustomSearch()}
          />
          <button
            onClick={handleCustomSearch}
            disabled={!searchQuery.trim() || loading}
            className="px-4 py-2 bg-devtools-accent text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
          >
            Search
          </button>
        </div>

        {/* Filters */}
        <div className="flex gap-4 text-xs">
          <div className="flex items-center gap-2">
            <label className="text-gray-400">Source:</label>
            <select
              value={filterSource}
              onChange={(e) => setFilterSource(e.target.value as any)}
              className="bg-devtools-bg border border-devtools-border rounded px-2 py-1 text-white focus:outline-none focus:border-devtools-accent"
            >
              <option value="all">All</option>
              <option value="stackoverflow">StackOverflow</option>
              <option value="github">GitHub</option>
              <option value="mdn">MDN</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-gray-400">Sort:</label>
            <button
              onClick={() => setSortBy(sortBy === 'relevance' ? 'votes' : 'relevance')}
              className="flex items-center gap-1 text-devtools-text hover:text-white transition-colors"
            >
              <ArrowUpDown className="h-3 w-3" />
              {sortBy === 'relevance' ? 'Relevance' : 'Votes'}
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <Loader className="h-6 w-6 animate-spin text-devtools-accent" />
            <span className="ml-2 text-sm text-gray-400">Finding solutions...</span>
          </div>
        ) : !selectedError && !searchQuery ? (
          <div className="flex items-center justify-center h-full text-gray-400">
            <div className="text-center">
              <Search className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>Select an error to see suggestions</p>
              <p className="text-xs mt-1">Or use the search bar above</p>
            </div>
          </div>
        ) : filteredSuggestions.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-gray-400">
            <div className="text-center">
              <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No suggestions found</p>
              <p className="text-xs mt-1">Try different search terms</p>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-devtools-border">
            {filteredSuggestions.map((suggestion) => (
              <div key={suggestion.id} className="p-4 hover:bg-devtools-panel transition-colors">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 text-lg">
                    {getSourceIcon(suggestion.source)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="text-sm font-medium text-devtools-text hover:text-white">
                        <a
                          href={suggestion.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:underline"
                        >
                          {suggestion.title}
                        </a>
                      </h4>
                      <ExternalLink className="h-3 w-3 text-gray-400" />
                    </div>
                    
                    <p className="text-sm text-gray-300 mb-2 line-clamp-3">
                      {suggestion.excerpt}
                    </p>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 text-xs text-gray-400">
                        <span className="capitalize">{suggestion.source}</span>
                        {suggestion.votes !== undefined && (
                          <span className="flex items-center gap-1">
                            <Star className="h-3 w-3" />
                            {suggestion.votes}
                          </span>
                        )}
                        {suggestion.isAccepted && (
                          <span className="text-green-400">✓ Accepted</span>
                        )}
                        {suggestion.tags && suggestion.tags.length > 0 && (
                          <span className="flex gap-1">
                            {suggestion.tags.slice(0, 3).map(tag => (
                              <span key={tag} className="bg-devtools-bg px-1 py-0.5 rounded text-xs">
                                {tag}
                              </span>
                            ))}
                          </span>
                        )}
                      </div>

                      <div className="flex gap-1">
                        <button
                          onClick={() => handleFeedback(suggestion, true)}
                          className="p-1 hover:bg-devtools-bg rounded text-gray-400 hover:text-green-400 transition-colors"
                          title="Helpful"
                        >
                          <ThumbsUp className="h-3 w-3" />
                        </button>
                        <button
                          onClick={() => handleFeedback(suggestion, false)}
                          className="p-1 hover:bg-devtools-bg rounded text-gray-400 hover:text-red-400 transition-colors"
                          title="Not helpful"
                        >
                          <ThumbsDown className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

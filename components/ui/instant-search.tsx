"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { Search, X, Clock, TrendingUp } from "lucide-react"
import { useDebounce } from "@/hooks/use-debounce"

interface SearchResult {
  id: string
  title: string
  description: string
  price: number
  image_url: string
  category: string
  type: "product" | "worker"
  rating: number
  reviews_count: number
}

interface SearchSuggestion {
  suggestion: string
  type: "category" | "specialization"
  count: number
}

interface InstantSearchProps {
  onResultSelect?: (result: SearchResult) => void
  onClose?: () => void
  placeholder?: string
}

export function InstantSearch({ onResultSelect, onClose, placeholder = "Qidirish..." }: InstantSearchProps) {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<SearchResult[]>([])
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [recentSearches, setRecentSearches] = useState<string[]>([])

  const searchRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const debouncedQuery = useDebounce(query, 300)

  // Load recent searches from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("jamolstroy_recent_searches")
      if (saved) {
        try {
          setRecentSearches(JSON.parse(saved))
        } catch (error) {
          console.error("Error parsing recent searches:", error)
        }
      }
    }
  }, [])

  // Perform search when debounced query changes
  useEffect(() => {
    if (debouncedQuery.trim().length >= 2) {
      performSearch(debouncedQuery)
    } else {
      setResults([])
      setSuggestions([])
      setIsLoading(false)
    }
  }, [debouncedQuery])

  // Handle clicks outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const performSearch = async (searchQuery: string) => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/search/instant?q=${encodeURIComponent(searchQuery)}`)
      if (response.ok) {
        const data = await response.json()
        setResults(data.results || [])
        setSuggestions(data.suggestions || [])
      }
    } catch (error) {
      console.error("Search error:", error)
      setResults([])
      setSuggestions([])
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setQuery(value)
    setIsOpen(true)
  }

  const handleInputFocus = () => {
    setIsOpen(true)
  }

  const handleResultClick = (result: SearchResult) => {
    // Save to recent searches
    saveRecentSearch(result.title)

    // Clear search
    setQuery("")
    setIsOpen(false)

    // Call callback
    if (onResultSelect) {
      onResultSelect(result)
    }
  }

  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    setQuery(suggestion.suggestion)
    inputRef.current?.focus()
    performSearch(suggestion.suggestion)
  }

  const handleRecentSearchClick = (search: string) => {
    setQuery(search)
    inputRef.current?.focus()
    performSearch(search)
  }

  const saveRecentSearch = (search: string) => {
    if (typeof window === "undefined") return

    const updated = [search, ...recentSearches.filter((s) => s !== search)].slice(0, 5)
    setRecentSearches(updated)
    localStorage.setItem("jamolstroy_recent_searches", JSON.stringify(updated))
  }

  const clearRecentSearches = () => {
    setRecentSearches([])
    if (typeof window !== "undefined") {
      localStorage.removeItem("jamolstroy_recent_searches")
    }
  }

  const handleClear = () => {
    setQuery("")
    setResults([])
    setSuggestions([])
    setIsOpen(false)
    inputRef.current?.focus()
  }

  return (
    <div ref={searchRef} className="relative w-full">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          placeholder={placeholder}
          className="w-full pl-10 pr-10 py-2 bg-muted rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all"
        />
        {query && (
          <button
            onClick={handleClear}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 rounded-full hover:bg-muted-foreground/10 transition-colors"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        )}
      </div>

      {/* Search Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
          {/* Loading State */}
          {isLoading && (
            <div className="p-4 text-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
              <p className="text-sm text-muted-foreground mt-2">Qidirilmoqda...</p>
            </div>
          )}

          {/* No Query State - Show Recent Searches */}
          {!query && !isLoading && (
            <div className="p-4">
              {recentSearches.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-medium text-muted-foreground flex items-center">
                      <Clock className="w-4 h-4 mr-2" />
                      So'nggi qidiruvlar
                    </h3>
                    <button
                      onClick={clearRecentSearches}
                      className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                    >
                      Tozalash
                    </button>
                  </div>
                  <div className="space-y-1">
                    {recentSearches.map((search, index) => (
                      <button
                        key={index}
                        onClick={() => handleRecentSearchClick(search)}
                        className="w-full text-left px-3 py-2 rounded-md hover:bg-muted transition-colors text-sm"
                      >
                        {search}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Search Results */}
          {query && !isLoading && (results.length > 0 || suggestions.length > 0) && (
            <div className="p-2">
              {/* Suggestions */}
              {suggestions.length > 0 && (
                <div className="mb-4">
                  <h3 className="text-sm font-medium text-muted-foreground mb-2 px-2 flex items-center">
                    <TrendingUp className="w-4 h-4 mr-2" />
                    Tavsiyalar
                  </h3>
                  <div className="space-y-1">
                    {suggestions.map((suggestion, index) => (
                      <button
                        key={index}
                        onClick={() => handleSuggestionClick(suggestion)}
                        className="w-full text-left px-3 py-2 rounded-md hover:bg-muted transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm">{suggestion.suggestion}</span>
                          <span className="text-xs text-muted-foreground">{suggestion.count} ta</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Results */}
              {results.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-2 px-2">Natijalar ({results.length})</h3>
                  <div className="space-y-1">
                    {results.map((result) => (
                      <button
                        key={result.id}
                        onClick={() => handleResultClick(result)}
                        className="w-full text-left p-3 rounded-md hover:bg-muted transition-colors"
                      >
                        <div className="flex items-start space-x-3">
                          <img
                            src={result.image_url || "/placeholder.svg?height=40&width=40"}
                            alt={result.title}
                            className="w-10 h-10 rounded-md object-cover flex-shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-medium truncate">{result.title}</h4>
                            <p className="text-xs text-muted-foreground truncate">{result.description}</p>
                            <div className="flex items-center justify-between mt-1">
                              <span className="text-sm font-medium text-primary">
                                {result.price.toLocaleString()} so'm
                              </span>
                              <div className="flex items-center space-x-1">
                                <span className="text-xs text-muted-foreground">⭐ {result.rating.toFixed(1)}</span>
                                <span className="text-xs text-muted-foreground">({result.reviews_count})</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* No Results */}
          {query && !isLoading && results.length === 0 && suggestions.length === 0 && (
            <div className="p-4 text-center">
              <p className="text-sm text-muted-foreground">"{query}" uchun hech narsa topilmadi</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

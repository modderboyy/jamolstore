"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Search, X, Clock, TrendingUp } from "lucide-react"
import { useDebounce } from "@/hooks/use-debounce"
import { useRouter } from "next/navigation"

interface SearchResult {
  id: string
  title: string
  subtitle: string
  type: "product" | "worker"
  image_url?: string
  price: number
  category: string
  rating: number
  has_delivery: boolean
}

interface InstantSearchProps {
  onClose?: () => void
  placeholder?: string
  className?: string
}

export function InstantSearch({
  onClose,
  placeholder = "Mahsulot yoki ishchi qidiring...",
  className = "",
}: InstantSearchProps) {
  const router = useRouter()
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<SearchResult[]>([])
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [recentSearches, setRecentSearches] = useState<string[]>([])
  const inputRef = useRef<HTMLInputElement>(null)
  const resultsRef = useRef<HTMLDivElement>(null)

  const debouncedQuery = useDebounce(query, 200) // Faster debounce for real-time feel

  // Load recent searches from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("recentSearches")
      if (saved) {
        setRecentSearches(JSON.parse(saved))
      }
    }
  }, [])

  // Perform search when debounced query changes
  useEffect(() => {
    if (debouncedQuery.trim()) {
      performSearch(debouncedQuery)
    } else {
      setResults([])
      setSuggestions([])
      setIsLoading(false)
    }
  }, [debouncedQuery])

  // Show/hide results based on focus and query
  useEffect(() => {
    setShowResults(query.length > 0 || (inputRef.current === document.activeElement && recentSearches.length > 0))
  }, [query, recentSearches])

  const performSearch = async (searchQuery: string) => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/search/instant?q=${encodeURIComponent(searchQuery)}&limit=8`)
      const data = await response.json()

      if (response.ok) {
        setResults(data.results || [])
        setSuggestions(data.suggestions || [])
      } else {
        console.error("Search error:", data.error)
        setResults([])
        setSuggestions([])
      }
    } catch (error) {
      console.error("Search request failed:", error)
      setResults([])
      setSuggestions([])
    } finally {
      setIsLoading(false)
    }
  }

  const handleSearch = (searchQuery: string) => {
    if (!searchQuery.trim()) return

    // Save to recent searches
    const newRecentSearches = [searchQuery, ...recentSearches.filter((s) => s !== searchQuery)].slice(0, 5)
    setRecentSearches(newRecentSearches)
    if (typeof window !== "undefined") {
      localStorage.setItem("recentSearches", JSON.stringify(newRecentSearches))
    }

    // Navigate to search results
    router.push(`/?search=${encodeURIComponent(searchQuery)}`)
    setQuery("")
    setShowResults(false)
    onClose?.()
  }

  const handleResultClick = (result: SearchResult) => {
    if (result.type === "product") {
      router.push(`/product/${result.id}`)
    } else {
      router.push(`/workers/${result.id}`)
    }
    setQuery("")
    setShowResults(false)
    onClose?.()
  }

  const clearRecentSearches = () => {
    setRecentSearches([])
    if (typeof window !== "undefined") {
      localStorage.removeItem("recentSearches")
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault()
      if (query.trim()) {
        handleSearch(query)
      }
    } else if (e.key === "Escape") {
      setQuery("")
      setShowResults(false)
      onClose?.()
    }
  }

  return (
    <div className={`relative ${className}`}>
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setShowResults(true)}
          placeholder={placeholder}
          className="w-full pl-10 pr-10 py-3 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
        />
        {query && (
          <button
            onClick={() => {
              setQuery("")
              setShowResults(false)
            }}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Search Results Dropdown */}
      {showResults && (
        <div
          ref={resultsRef}
          className="absolute top-full left-0 right-0 mt-2 bg-background border border-border rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto"
        >
          {/* Loading State */}
          {isLoading && (
            <div className="p-4 text-center text-muted-foreground">
              <div className="animate-spin w-5 h-5 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2"></div>
              Qidirilmoqda...
            </div>
          )}

          {/* Search Results */}
          {!isLoading && query && results.length > 0 && (
            <div className="p-2">
              <div className="text-xs font-medium text-muted-foreground px-3 py-2 border-b">
                Natijalar ({results.length})
              </div>
              {results.map((result) => (
                <button
                  key={`${result.type}-${result.id}`}
                  onClick={() => handleResultClick(result)}
                  className="w-full flex items-center space-x-3 p-3 hover:bg-muted rounded-lg transition-colors text-left"
                >
                  <div className="w-10 h-10 bg-muted rounded-lg flex-shrink-0 overflow-hidden">
                    {result.image_url ? (
                      <img
                        src={result.image_url || "/placeholder.svg"}
                        alt={result.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
                        <Search className="w-4 h-4 text-primary/50" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">{result.title}</div>
                    <div className="text-xs text-muted-foreground truncate">{result.subtitle}</div>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-xs font-medium text-primary">
                        {new Intl.NumberFormat("uz-UZ").format(result.price)} so'm
                        {result.type === "worker" && "/soat"}
                      </span>
                      {result.has_delivery && (
                        <span className="text-xs bg-green-100 text-green-800 px-1.5 py-0.5 rounded">
                          Yetkazib berish
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Search Suggestions */}
          {!isLoading && query && suggestions.length > 0 && (
            <div className="p-2 border-t">
              <div className="text-xs font-medium text-muted-foreground px-3 py-2">Takliflar</div>
              {suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => handleSearch(suggestion)}
                  className="w-full flex items-center space-x-3 p-3 hover:bg-muted rounded-lg transition-colors text-left"
                >
                  <Search className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  <span className="text-sm">{suggestion}</span>
                </button>
              ))}
            </div>
          )}

          {/* No Results */}
          {!isLoading && query && results.length === 0 && suggestions.length === 0 && (
            <div className="p-6 text-center text-muted-foreground">
              <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <div className="text-sm">"{query}" bo'yicha hech narsa topilmadi</div>
            </div>
          )}

          {/* Recent Searches */}
          {!query && recentSearches.length > 0 && (
            <div className="p-2">
              <div className="flex items-center justify-between px-3 py-2 border-b">
                <div className="text-xs font-medium text-muted-foreground flex items-center">
                  <Clock className="w-3 h-3 mr-1" />
                  So'nggi qidiruvlar
                </div>
                <button onClick={clearRecentSearches} className="text-xs text-muted-foreground hover:text-foreground">
                  Tozalash
                </button>
              </div>
              {recentSearches.map((search, index) => (
                <button
                  key={index}
                  onClick={() => handleSearch(search)}
                  className="w-full flex items-center space-x-3 p-3 hover:bg-muted rounded-lg transition-colors text-left"
                >
                  <Clock className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  <span className="text-sm">{search}</span>
                </button>
              ))}
            </div>
          )}

          {/* Popular Searches */}
          {!query && recentSearches.length === 0 && (
            <div className="p-2">
              <div className="text-xs font-medium text-muted-foreground px-3 py-2 border-b flex items-center">
                <TrendingUp className="w-3 h-3 mr-1" />
                Mashhur qidiruvlar
              </div>
              {["Qurilish materiallari", "Elektr jihozlari", "Santexnika", "Asboblar", "Bo'yoqlar"].map(
                (search, index) => (
                  <button
                    key={index}
                    onClick={() => handleSearch(search)}
                    className="w-full flex items-center space-x-3 p-3 hover:bg-muted rounded-lg transition-colors text-left"
                  >
                    <TrendingUp className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    <span className="text-sm">{search}</span>
                  </button>
                ),
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

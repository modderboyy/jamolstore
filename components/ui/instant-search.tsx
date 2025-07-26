"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { Search, X } from "lucide-react"
import { useRouter } from "next/navigation"
import { useDebounce } from "@/hooks/use-debounce"

interface SearchResult {
  id: string
  title: string
  type: string
  image_url: string
  price: number
  category: string
}

interface InstantSearchProps {
  searchQuery: string
  onSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  placeholder?: string
}

export function InstantSearch({
  searchQuery,
  onSearchChange,
  placeholder = "Mahsulot qidirish...",
}: InstantSearchProps) {
  const [results, setResults] = useState<SearchResult[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const searchRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const debouncedQuery = useDebounce(searchQuery, 200)

  useEffect(() => {
    if (debouncedQuery.trim().length > 0) {
      fetchInstantResults(debouncedQuery)
    } else {
      setResults([])
      setIsOpen(false)
    }
  }, [debouncedQuery])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const fetchInstantResults = async (query: string) => {
    setLoading(true)
    try {
      const response = await fetch(`/api/search/instant?q=${encodeURIComponent(query)}&limit=8`)
      const data = await response.json()

      if (data.success) {
        setResults(data.results)
        setIsOpen(data.results.length > 0)
      }
    } catch (error) {
      console.error("Instant search error:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleResultClick = (result: SearchResult) => {
    setIsOpen(false)
    if (result.type === "product") {
      router.push(`/product/${result.id}`)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onSearchChange(e)
    if (e.target.value.trim().length > 0) {
      setIsOpen(true)
    }
  }

  const clearSearch = () => {
    onSearchChange({ target: { value: "" } } as React.ChangeEvent<HTMLInputElement>)
    setResults([])
    setIsOpen(false)
    inputRef.current?.focus()
  }

  return (
    <div ref={searchRef} className="relative w-full max-w-2xl">
      <div className="relative group">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors duration-200" />
        <input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={searchQuery}
          onChange={handleInputChange}
          onFocus={() => {
            if (results.length > 0) setIsOpen(true)
          }}
          className="w-full pl-10 pr-10 py-2.5 bg-muted rounded-lg border-0 focus:ring-2 focus:ring-primary/20 focus:bg-background transition-all duration-200 text-sm placeholder:text-muted-foreground/70"
        />
        {searchQuery && (
          <button
            onClick={clearSearch}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 hover:bg-muted-foreground/10 rounded-full transition-colors"
          >
            <X className="w-3 h-3 text-muted-foreground" />
          </button>
        )}
      </div>

      {/* Instant Results Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-background border border-border rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
          {loading ? (
            <div className="p-4 text-center text-muted-foreground">
              <div className="animate-spin w-4 h-4 border-2 border-primary border-t-transparent rounded-full mx-auto"></div>
              <span className="ml-2 text-sm">Qidirilmoqda...</span>
            </div>
          ) : results.length > 0 ? (
            <div className="py-2">
              {results.map((result) => (
                <button
                  key={result.id}
                  onClick={() => handleResultClick(result)}
                  className="w-full px-4 py-3 hover:bg-muted transition-colors text-left flex items-center space-x-3"
                >
                  <img
                    src={result.image_url || "/placeholder.svg"}
                    alt={result.title}
                    className="w-10 h-10 rounded-lg object-cover bg-muted"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{result.title}</p>
                    <p className="text-xs text-muted-foreground truncate">{result.category}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-sm">{new Intl.NumberFormat("uz-UZ").format(result.price)} so'm</p>
                  </div>
                </button>
              ))}

              {searchQuery.trim() && (
                <div className="border-t border-border mt-2 pt-2">
                  <button
                    onClick={() => {
                      setIsOpen(false)
                      router.push(`/?search=${encodeURIComponent(searchQuery)}`)
                    }}
                    className="w-full px-4 py-2 text-sm text-primary hover:bg-primary/5 transition-colors text-center"
                  >
                    "{searchQuery}" bo'yicha barcha natijalarni ko'rish
                  </button>
                </div>
              )}
            </div>
          ) : (
            searchQuery.trim() && (
              <div className="p-4 text-center text-muted-foreground">
                <p className="text-sm">Hech narsa topilmadi</p>
              </div>
            )
          )}
        </div>
      )}
    </div>
  )
}

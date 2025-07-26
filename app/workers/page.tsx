"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { BottomNavigation } from "@/components/layout/bottom-navigation"
import { TopBar } from "@/components/layout/top-bar"
import { BottomSheet } from "@/components/ui/bottom-sheet"
import { Star, MapPin, Phone, Filter, Search } from "lucide-react"
import Image from "next/image"

interface Worker {
  id: string
  user: {
    first_name: string
    last_name: string
    phone_number: string
    avatar_url?: string
  }
  profession_uz: string
  experience_years: number
  hourly_rate: number
  daily_rate: number
  rating: number
  total_reviews: number
  location_uz: string
  is_available: boolean
  skills: string[]
}

export default function WorkersPage() {
  const searchParams = useSearchParams()
  const initialSearch = searchParams.get("search") || ""

  const [workers, setWorkers] = useState<Worker[]>([])
  const [selectedWorker, setSelectedWorker] = useState<Worker | null>(null)
  const [showWorkerSheet, setShowWorkerSheet] = useState(false)
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState(initialSearch)

  useEffect(() => {
    fetchWorkers()
  }, [searchQuery])

  const fetchWorkers = async () => {
    setLoading(true)
    try {
      let query = supabase
        .from("worker_profiles")
        .select(`
          *,
          user:users!inner(first_name, last_name, phone_number, avatar_url, role)
        `)
        .eq("is_available", true)
        .eq("user.role", "worker")

      if (searchQuery) {
        // Fix the search query syntax
        query = query.or(
          `profession_uz.ilike.%${searchQuery}%,user.first_name.ilike.%${searchQuery}%,user.last_name.ilike.%${searchQuery}%`,
        )
      }

      const { data, error } = await query.order("rating", { ascending: false })

      if (error) throw error
      setWorkers(data || [])
    } catch (error) {
      console.error("Ishchilarni yuklashda xatolik:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    fetchWorkers()
  }

  const handleWorkerSelect = (worker: Worker) => {
    setSelectedWorker(worker)
    setShowWorkerSheet(true)
  }

  const handleContactWorker = (phoneNumber: string) => {
    window.open(`tel:${phoneNumber}`)
  }

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-4">
      <TopBar />

      {/* Header with Search */}
      <div className="container mx-auto px-4 py-4 border-b border-border">
        <div className="flex items-center justify-between mb-4">
          <div className="flex-1">
            <h1 className="text-xl font-bold">Ishchilar</h1>
            <p className="text-sm text-muted-foreground">{workers.length} ta mutaxassis</p>
          </div>
          <button className="p-3 rounded-xl hover:bg-muted transition-colors shadow-sm border border-border">
            <Filter className="w-5 h-5" />
          </button>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="relative">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors duration-200" />
            <input
              type="text"
              placeholder="Ishchi qidirish..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-gray-900 dark:bg-gray-800 text-white rounded-lg border border-gray-700 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all duration-200 text-sm"
            />
          </div>
        </form>
      </div>

      {/* Workers List */}
      <div className="container mx-auto px-4 py-6">
        {loading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="bg-card rounded-xl p-4 animate-pulse border border-border">
                <div className="flex space-x-4">
                  <div className="w-16 h-16 bg-muted rounded-full"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-5 bg-muted rounded w-3/4"></div>
                    <div className="h-4 bg-muted rounded w-1/2"></div>
                    <div className="h-4 bg-muted rounded w-2/3"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : workers.length > 0 ? (
          <div className="space-y-4">
            {workers.map((worker) => (
              <div
                key={worker.id}
                className="bg-card rounded-xl p-4 border border-border hover:shadow-md transition-all cursor-pointer"
                onClick={() => handleWorkerSelect(worker)}
              >
                <div className="flex space-x-4">
                  {/* Avatar */}
                  <div className="w-16 h-16 bg-muted rounded-full overflow-hidden flex-shrink-0">
                    {worker.user.avatar_url ? (
                      <Image
                        src={worker.user.avatar_url || "/placeholder.svg"}
                        alt={`${worker.user.first_name} ${worker.user.last_name}`}
                        width={64}
                        height={64}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-muted flex items-center justify-center">
                        <span className="text-foreground font-semibold text-lg">
                          {worker.user.first_name[0]}
                          {worker.user.last_name[0]}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-semibold">
                          {worker.user.first_name} {worker.user.last_name}
                        </h3>
                        <p className="text-sm text-muted-foreground">{worker.profession_uz}</p>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        <span className="text-sm font-medium">{worker.rating.toFixed(1)}</span>
                        <span className="text-sm text-muted-foreground">({worker.total_reviews})</span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-4 mb-3">
                      <div className="flex items-center space-x-1">
                        <MapPin className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">{worker.location_uz}</span>
                      </div>
                      <div className="text-sm text-muted-foreground">{worker.experience_years} yil tajriba</div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-bold">
                          {new Intl.NumberFormat("uz-UZ").format(worker.hourly_rate)} so'm
                        </span>
                        <span className="text-sm text-muted-foreground ml-1">/soat</span>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleContactWorker(worker.user.phone_number)
                        }}
                        className="flex items-center space-x-1 px-3 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-sm shadow-sm"
                      >
                        <Phone className="w-4 h-4" />
                        <span>Qo'ng'iroq</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Skills */}
                {worker.skills && worker.skills.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-border">
                    <div className="flex flex-wrap gap-2">
                      {worker.skills.slice(0, 3).map((skill, index) => (
                        <span key={index} className="px-2 py-1 bg-muted text-foreground text-xs rounded-lg">
                          {skill}
                        </span>
                      ))}
                      {worker.skills.length > 3 && (
                        <span className="px-2 py-1 bg-muted text-muted-foreground text-xs rounded-lg">
                          +{worker.skills.length - 3} ko'proq
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <Filter className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Ishchi topilmadi</h3>
            <p className="text-muted-foreground mb-4">Qidiruv so'zini o'zgartiring yoki boshqa kasb nomini kiriting</p>
          </div>
        )}
      </div>

      <BottomNavigation />

      {/* Worker Detail Bottom Sheet - Full Screen */}
      <BottomSheet
        isOpen={showWorkerSheet}
        onClose={() => setShowWorkerSheet(false)}
        title="Ishchi haqida"
        height="full"
      >
        {selectedWorker && (
          <div className="p-6 h-full flex flex-col">
            {/* Worker Header */}
            <div className="flex space-x-4 mb-6">
              <div className="w-20 h-20 bg-muted rounded-full overflow-hidden flex-shrink-0">
                {selectedWorker.user.avatar_url ? (
                  <Image
                    src={selectedWorker.user.avatar_url || "/placeholder.svg"}
                    alt={`${selectedWorker.user.first_name} ${selectedWorker.user.last_name}`}
                    width={80}
                    height={80}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-muted flex items-center justify-center">
                    <span className="text-foreground font-semibold text-2xl">
                      {selectedWorker.user.first_name[0]}
                      {selectedWorker.user.last_name[0]}
                    </span>
                  </div>
                )}
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold mb-1">
                  {selectedWorker.user.first_name} {selectedWorker.user.last_name}
                </h3>
                <p className="text-muted-foreground mb-2">{selectedWorker.profession_uz}</p>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-1">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    <span className="font-medium">{selectedWorker.rating.toFixed(1)}</span>
                    <span className="text-sm text-muted-foreground">({selectedWorker.total_reviews} sharh)</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Details */}
            <div className="flex-1 space-y-6">
              {/* Experience & Location */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-muted/50 rounded-xl p-4">
                  <h4 className="text-sm text-muted-foreground mb-1">Tajriba</h4>
                  <p className="font-semibold">{selectedWorker.experience_years} yil</p>
                </div>
                <div className="bg-muted/50 rounded-xl p-4">
                  <h4 className="text-sm text-muted-foreground mb-1">Joylashuv</h4>
                  <p className="font-semibold">{selectedWorker.location_uz}</p>
                </div>
              </div>

              {/* Pricing */}
              <div>
                <h4 className="font-semibold mb-3">Narxlar</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
                    <h5 className="text-sm text-primary mb-1">Soatlik</h5>
                    <p className="text-lg font-bold text-primary">
                      {new Intl.NumberFormat("uz-UZ").format(selectedWorker.hourly_rate)} so'm
                    </p>
                  </div>
                  <div className="bg-muted/50 rounded-xl p-4">
                    <h5 className="text-sm text-muted-foreground mb-1">Kunlik</h5>
                    <p className="text-lg font-bold">
                      {new Intl.NumberFormat("uz-UZ").format(selectedWorker.daily_rate)} so'm
                    </p>
                  </div>
                </div>
              </div>

              {/* Skills */}
              {selectedWorker.skills && selectedWorker.skills.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-3">Ko'nikmalar</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedWorker.skills.map((skill, index) => (
                      <span key={index} className="px-3 py-2 bg-muted text-foreground rounded-lg">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="space-y-3 pt-6 border-t border-border">
              <button
                onClick={() => handleContactWorker(selectedWorker.user.phone_number)}
                className="w-full bg-primary text-primary-foreground rounded-xl py-3 font-medium hover:bg-primary/90 transition-colors flex items-center justify-center space-x-2 shadow-sm"
              >
                <Phone className="w-5 h-5" />
                <span>Qo'ng'iroq qilish</span>
              </button>
              <button className="w-full bg-secondary text-secondary-foreground rounded-xl py-3 font-medium hover:bg-secondary/80 transition-colors">
                Buyurtma berish
              </button>
            </div>
          </div>
        )}
      </BottomSheet>
    </div>
  )
}

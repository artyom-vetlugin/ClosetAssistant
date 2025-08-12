import { useEffect, useState } from 'react'
import { OutfitSuggestionService } from '../lib/outfitService'
import { WearLogService } from '../lib/wearLogService'
import type { ClothingItem, Outfit } from '../lib/supabase'

const SavedOutfits = () => {
  const [outfits, setOutfits] = useState<(Outfit & { items: ClothingItem[] })[]>([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const load = async () => {
    setLoading(true)
    try {
      const res = await OutfitSuggestionService.getSavedOutfits()
      setOutfits(res)
    } catch {
      setError('Failed to load saved outfits')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const wearToday = async (outfitId: string) => {
    try {
      await WearLogService.logWear(outfitId)
      setMessage('Logged for today')
      setTimeout(() => setMessage(''), 2000)
    } catch {
      setError('Failed to log wear')
      setTimeout(() => setError(''), 2500)
    }
  }

  if (loading) return <div className="py-12 text-center text-gray-600">Loading...</div>

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Saved Outfits</h1>
      {message && <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded">{message}</div>}
      {error && <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded">{error}</div>}
      {outfits.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🧰</div>
          <div className="text-gray-600">No saved outfits yet.</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {outfits.map((o) => {
            const items = o.items ?? []
            return (
              <div key={o.id} className="card">
                <div className="grid grid-cols-3 gap-2 mb-3">
                  {items.slice(0, 3).map((it) => (
                    <img key={it.id} src={it.image_url} className="aspect-square object-cover rounded" />
                  ))}
                </div>
                <div className="font-semibold mb-2">{o.name}</div>
                <div className="flex gap-2">
                  <button className="btn-primary flex-1" onClick={() => wearToday(o.id)}>I wore this today</button>
                  <details className="flex-1">
                    <summary className="btn-secondary w-full">Details</summary>
                    <div className="mt-3 text-sm text-gray-700">
                      <div className="grid grid-cols-3 gap-2">
                        {items.map((it) => (
                          <div key={it.id} className="text-center">
                            <img src={it.image_url} className="aspect-square object-cover rounded mb-1" />
                            <div className="capitalize text-xs">{it.type}</div>
                            <div className="capitalize text-xs text-gray-500">{it.color}</div>
                          </div>
                        ))}
                      </div>
                      <div className="mt-3">
                        <button className="btn-primary w-full" onClick={() => wearToday(o.id)}>Log wear</button>
                      </div>
                    </div>
                  </details>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default SavedOutfits



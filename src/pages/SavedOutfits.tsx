import { useCallback, useEffect, useRef, useState } from 'react'
import { OutfitSuggestionService } from '../lib/outfitService'
import { WearLogService } from '../lib/wearLogService'
import type { ClothingItem, Outfit } from '../lib/supabase'
import { useTranslation } from 'react-i18next'
import { toPng } from 'html-to-image'

const SavedOutfits = () => {
  const [outfits, setOutfits] = useState<(Outfit & { items: ClothingItem[] })[]>([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')
  const [savingId, setSavingId] = useState<string | null>(null)
  const [wearSavingId, setWearSavingId] = useState<string | null>(null)
  const [wearDateByOutfit, setWearDateByOutfit] = useState<Record<string, string>>({})
  const { t } = useTranslation(['saved'])
  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({})
  const exportRefs = useRef<Record<string, HTMLDivElement | null>>({})

  const selectPreviewItems = (items: ClothingItem[]) => {
    const dress = items.find((i) => i.type === 'dress')
    const shoes = items.find((i) => i.type === 'shoes')
    if (dress) {
      return [dress, ...(shoes ? [shoes] : [])]
    }
    const top = items.find((i) => i.type === 'top')
    const bottom = items.find((i) => i.type === 'bottom')
    return [top, bottom, shoes].filter(Boolean) as ClothingItem[]
  }

  const exportCard = async (id: string) => {
    try {
      const node = exportRefs.current[id] || cardRefs.current[id]
      if (!node) return
      const dataUrl = await toPng(node, { cacheBust: true, pixelRatio: 2, backgroundColor: '#ffffff' })
      const a = document.createElement('a')
      a.href = dataUrl
      a.download = `${id}.png`
      a.click()
    } catch (e) {
      console.error(e)
      setError(t('saved:failedExport', { defaultValue: 'Failed to export image' }))
      setTimeout(() => setError(''), 2000)
    }
  }

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await OutfitSuggestionService.getSavedOutfits()
      setOutfits(res)
    } catch {
      setError(t('saved:failedLoad', { defaultValue: 'Failed to load saved outfits' }))
    } finally {
      setLoading(false)
    }
  }, [t])

  useEffect(() => {
    load()
  }, [load])

  const wearToday = async (outfitId: string) => {
    try {
      await WearLogService.logWear(outfitId)
      setMessage(t('saved:loggedToday'))
      setTimeout(() => setMessage(''), 2000)
    } catch {
      setError(t('saved:failedLogWear'))
      setTimeout(() => setError(''), 2500)
    }
  }

  const logWearWithDate = async (outfitId: string, date?: string) => {
    const wornDate = (date || new Date().toISOString().slice(0, 10))
    setWearSavingId(outfitId)
    try {
      await WearLogService.logWear(outfitId, wornDate)
      setMessage(t('saved:loggedFor', { date: wornDate }))
      setTimeout(() => setMessage(''), 2000)
    } catch {
      setError(t('saved:failedLogWear'))
      setTimeout(() => setError(''), 2500)
    } finally {
      setWearSavingId(null)
    }
  }

  if (loading) return <div className="py-12 text-center text-gray-600">{t('saved:loading')}</div>

  const startEditing = (outfit: Outfit) => {
    setEditingId(outfit.id)
    setEditingName(outfit.name)
  }

  const cancelEditing = () => {
    setEditingId(null)
    setEditingName('')
  }

  const commitRename = async () => {
    if (!editingId) return
    const id = editingId
    const current = outfits.find((o) => o.id === id)
    const oldName = current?.name || ''
    const newName = editingName.trim()
    if (!newName || newName === oldName) {
      cancelEditing()
      return
    }

    setSavingId(id)
    // optimistic update
    setOutfits((prev) => prev.map((o) => (o.id === id ? { ...o, name: newName } : o)))
    try {
      await OutfitSuggestionService.renameOutfit(id, newName)
      setMessage(t('saved:nameUpdated'))
      setTimeout(() => setMessage(''), 1500)
    } catch {
      setError(t('saved:failedRename'))
      // revert
      setOutfits((prev) => prev.map((o) => (o.id === id ? { ...o, name: oldName } : o)))
      setTimeout(() => setError(''), 2500)
    } finally {
      setSavingId(null)
      cancelEditing()
    }
  }

  const handleNameKeyDown: React.KeyboardEventHandler<HTMLInputElement> = async (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      await commitRename()
    } else if (e.key === 'Escape') {
      cancelEditing()
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">{t('saved:title')}</h1>
      {message && <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded">{message}</div>}
      {error && <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded">{error}</div>}
      {outfits.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🧰</div>
          <div className="text-gray-600">{t('saved:empty')}</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {outfits.map((o) => {
            const items = o.items ?? []
            const previewItems = selectPreviewItems(items)
            return (
              <div
                key={o.id}
                className="card"
                ref={(el) => { cardRefs.current[o.id] = el }}
              >
                <div ref={(el) => { exportRefs.current[o.id] = el }}>
                  <div className="grid grid-cols-3 gap-2 mb-3">
                    {previewItems.map((it) => (
                      <img key={it.id} src={it.image_url} className="aspect-square object-cover rounded" />
                    ))}
                  </div>
                  <div className="mb-2">
                    {editingId === o.id ? (
                      <input
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        onBlur={commitRename}
                        onKeyDown={handleNameKeyDown}
                        disabled={savingId === o.id}
                        autoFocus
                        className="w-full font-semibold p-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    ) : (
                      <button
                        type="button"
                        className="font-semibold text-left hover:underline"
                        title={t('saved:clickToRename')}
                        onClick={() => startEditing(o)}
                        disabled={savingId === o.id}
                      >
                        {savingId === o.id ? t('saved:saving') : o.name}
                      </button>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button className="btn-primary flex-1" onClick={() => wearToday(o.id)} disabled={wearSavingId === o.id}>
                    {wearSavingId === o.id ? t('saved:saving') : t('saved:woreToday')}
                  </button>
                  <button className="btn-secondary" onClick={() => exportCard(o.id)}>
                    {t('saved:export', { defaultValue: 'Export' })}
                  </button>
                  <details className="flex-1">
                    <summary className="btn-secondary w-full">{t('saved:details')}</summary>
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
                      <div className="mt-3 space-y-2">
                        <label className="block text-xs text-gray-600">{t('saved:selectDate')}</label>
                        <div className="flex gap-2 items-center">
                          <input
                            type="date"
                            max={new Date().toISOString().slice(0, 10)}
                            value={wearDateByOutfit[o.id] ?? new Date().toISOString().slice(0, 10)}
                            onChange={(e) => setWearDateByOutfit((prev) => ({ ...prev, [o.id]: e.target.value }))}
                            className="flex-1 p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                          <button
                            className="btn-primary flex-1"
                            onClick={() => logWearWithDate(o.id, wearDateByOutfit[o.id])}
                            disabled={wearSavingId === o.id}
                          >
                            {wearSavingId === o.id ? t('saved:saving') : t('saved:logWear')}
                          </button>
                        </div>
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



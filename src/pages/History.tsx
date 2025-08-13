import { useCallback, useEffect, useState } from 'react'
import { WearLogService } from '../lib/wearLogService'
import type { ClothingItem, Outfit } from '../lib/supabase'
import { useTranslation } from 'react-i18next'

const History = () => {
  type OutfitItemJoin = { role: 'top' | 'bottom' | 'shoes' | 'accessory'; clothing_items: ClothingItem }
  type WearLogWithOutfit = { id: string; worn_date: string; outfits: Outfit & { outfit_items: OutfitItemJoin[] } }

  const [logs, setLogs] = useState<WearLogWithOutfit[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [deletingId, setDeletingId] = useState<string>('')
  const [editingId, setEditingId] = useState<string>('')
  const [pendingDate, setPendingDate] = useState<Record<string, string>>({})
  const { t } = useTranslation(['history'])

  const sortLogsByDateDesc = useCallback((arr: WearLogWithOutfit[]) =>
    [...arr].sort((a, b) => b.worn_date.localeCompare(a.worn_date)),
  [])

  useEffect(() => {
    ;(async () => {
      try {
        const res = await WearLogService.getHistory()
        setLogs(sortLogsByDateDesc(res as unknown as WearLogWithOutfit[]))
      } catch {
        setError(t('history:failedLoad'))
      } finally {
        setLoading(false)
      }
    })()
  }, [sortLogsByDateDesc, t])

  if (loading) return <div className="py-12 text-center text-gray-600">{t('history:loading')}</div>
  if (error) return <div className="py-12 text-center text-red-700">{error}</div>

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">{t('history:title')}</h1>

      {logs.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📅</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('history:emptyTitle')}</h3>
          <p className="text-gray-600 mb-4">{t('history:emptyText')}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {logs.map((log) => {
            const outfit = log.outfits
            const items = (outfit?.outfit_items ?? []).map((oi) => oi.clothing_items)
            const isDeleting = deletingId === log.id
            const isEditing = editingId === log.id
            return (
              <div key={log.id} className="card flex items-center gap-4">
                <div className="w-24 shrink-0 grid grid-cols-3 gap-1">
                  {items.slice(0, 3).map((it) => (
                    <img key={it.id} src={it.image_url} className="aspect-square object-cover rounded" />
                  ))}
                </div>
                <div className="flex-1">
                  <div className="font-semibold">{outfit?.name ?? 'Outfit'}</div>
                  <div className="text-sm text-gray-600 flex items-center gap-2">
                    {isEditing ? (
                      <>
                        <input
                          type="date"
                          className="input input-bordered input-sm"
                          value={pendingDate[log.id] ?? log.worn_date}
                          onChange={(e) =>
                            setPendingDate((prev) => ({ ...prev, [log.id]: e.target.value }))
                          }
                        />
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={async () => {
                            try {
                              const newDate = (pendingDate[log.id] ?? log.worn_date) || log.worn_date
                              setEditingId('')
                              await WearLogService.updateWearLogDate(log.id, newDate)
                              setLogs((prev) =>
                                sortLogsByDateDesc(
                                  prev.map((l) => (l.id === log.id ? { ...l, worn_date: newDate } : l))
                                )
                              )
                            } catch {
                              setError(t('history:failedUpdateDate'))
                            }
                          }}
                        >
                          {t('history:save')}
                        </button>
                        <button
                          className="btn btn-ghost btn-sm"
                          onClick={() => setEditingId('')}
                        >
                          {t('history:cancel')}
                        </button>
                      </>
                    ) : (
                      <span
                        className="cursor-pointer hover:underline hover:decoration-dotted"
                        onClick={() => {
                          setPendingDate((prev) => ({ ...prev, [log.id]: log.worn_date }))
                          setEditingId(log.id)
                        }}
                      >
                        {log.worn_date}
                      </span>
                    )}
                  </div>
                </div>
                <button
                  className={`btn btn-ghost text-red-600 ${isDeleting ? 'opacity-50 pointer-events-none' : ''}`}
                  onClick={async () => {
                    try {
                      setDeletingId(log.id)
                      await WearLogService.deleteWearLog(log.id)
                      setLogs((prev) => prev.filter((l) => l.id !== log.id))
                    } catch {
                      setError(t('history:failedDelete'))
                    } finally {
                      setDeletingId('')
                    }
                  }}
                >
                  {isDeleting ? t('history:deleting') : t('history:delete')}
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default History
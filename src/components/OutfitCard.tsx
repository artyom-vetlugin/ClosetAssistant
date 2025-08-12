import { useState } from 'react'
import type { OutfitSuggestion } from '../lib/outfitService'
import { useTranslation } from 'react-i18next'

interface OutfitCardProps {
  outfit: OutfitSuggestion
  onSave: (outfit: OutfitSuggestion, customName?: string) => Promise<void>
  onView?: (outfit: OutfitSuggestion) => void
  isSaving?: boolean
}

export default function OutfitCard({ outfit, onSave, onView, isSaving = false }: OutfitCardProps) {
  const [showSaveDialog, setShowSaveDialog] = useState(false)
  const [customName, setCustomName] = useState('')
  const [saving, setSaving] = useState(false)
  const { t } = useTranslation(['outfitCard', 'common'])

  const handleSaveClick = () => {
    setShowSaveDialog(true)
  }

  const handleSaveConfirm = async () => {
    setSaving(true)
    try {
      await onSave(outfit, customName.trim() || undefined)
      setShowSaveDialog(false)
      setCustomName('')
    } catch (error) {
      console.error('Error saving outfit:', error)
      // Error handling could be improved with toast notifications
    } finally {
      setSaving(false)
    }
  }

  const handleViewClick = () => {
    onView?.(outfit)
  }

  const getScoreColor = (score: number) => {
    if (score >= 85) return 'text-green-600 bg-green-50'
    if (score >= 70) return 'text-blue-600 bg-blue-50'
    if (score >= 60) return 'text-yellow-600 bg-yellow-50'
    return 'text-red-600 bg-red-50'
  }

  const getScoreLabel = (score: number) => {
    if (score >= 85) return t('outfitCard:excellent')
    if (score >= 70) return t('outfitCard:good')
    if (score >= 60) return t('outfitCard:okay')
    return t('outfitCard:poor')
  }

  return (
    <>
      <div className="card bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow">
        {/* Score Badge */}
        <div className="flex justify-between items-start mb-3">
          <div className={`px-2 py-1 rounded-full text-xs font-medium ${getScoreColor(outfit.score)}`}>
            {getScoreLabel(outfit.score)} ({outfit.score}/100)
          </div>
        </div>

        {/* Outfit Images Grid */}
        <div className="grid grid-cols-3 gap-2 mb-3">
          {/* Top */}
          <div className="aspect-square relative">
            <img
              src={outfit.items.top.image_url}
              alt={`${outfit.items.top.color} ${outfit.items.top.type}`}
              className="w-full h-full object-cover rounded"
              loading="lazy"
            />
            <div className="absolute bottom-1 left-1 bg-black bg-opacity-70 text-white text-xs px-1 rounded">
              {t('common:types.top')}
            </div>
          </div>

          {/* Bottom */}
          <div className="aspect-square relative">
            <img
              src={outfit.items.bottom.image_url}
              alt={`${outfit.items.bottom.color} ${outfit.items.bottom.type}`}
              className="w-full h-full object-cover rounded"
              loading="lazy"
            />
            <div className="absolute bottom-1 left-1 bg-black bg-opacity-70 text-white text-xs px-1 rounded">
              {t('common:types.bottom')}
            </div>
          </div>

          {/* Shoes */}
          <div className="aspect-square relative">
            <img
              src={outfit.items.shoes.image_url}
              alt={`${outfit.items.shoes.color} ${outfit.items.shoes.type}`}
              className="w-full h-full object-cover rounded"
              loading="lazy"
            />
            <div className="absolute bottom-1 left-1 bg-black bg-opacity-70 text-white text-xs px-1 rounded">
              {t('common:types.shoes')}
            </div>
          </div>
        </div>

        {/* Accessory (if present) */}
        {outfit.items.accessory && (
          <div className="mb-3">
            <div className="w-16 h-16 relative mx-auto">
              <img
                src={outfit.items.accessory.image_url}
                alt={`${outfit.items.accessory.color} ${outfit.items.accessory.type}`}
                className="w-full h-full object-cover rounded"
                loading="lazy"
              />
              <div className="absolute bottom-0 left-0 bg-black bg-opacity-70 text-white text-xs px-1 rounded">
                Accessory
              </div>
            </div>
          </div>
        )}

        {/* Color Summary */}
        <div className="mb-3">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span className="font-medium">{t('outfitCard:colors')}</span>
            <div className="flex gap-1">
              <span className="px-2 py-1 bg-gray-100 rounded text-xs capitalize">
                {outfit.items.top.color}
              </span>
              <span className="px-2 py-1 bg-gray-100 rounded text-xs capitalize">
                {outfit.items.bottom.color}
              </span>
              <span className="px-2 py-1 bg-gray-100 rounded text-xs capitalize">
                {outfit.items.shoes.color}
              </span>
            </div>
          </div>
        </div>

        {/* Reasoning */}
        {outfit.reasoning.length > 0 && (
          <div className="mb-4">
            <h4 className="text-sm font-medium text-gray-700 mb-1">{t('outfitCard:whyWorks')}</h4>
            <ul className="text-xs text-gray-600 space-y-1">
              {outfit.reasoning.map((reason, index) => (
                <li key={index} className="flex items-start">
                  <span className="text-green-500 mr-1">•</span>
                  <span>{reason}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          {onView && (
            <button
              onClick={handleViewClick}
              className="flex-1 btn-secondary text-sm py-2"
            >
              {t('outfitCard:viewDetails')}
            </button>
          )}
          <button
            onClick={handleSaveClick}
            disabled={isSaving || saving}
            className="flex-1 btn-primary text-sm py-2 disabled:opacity-50"
          >
            {saving ? t('outfitCard:saving') : t('outfitCard:saveLook')}
          </button>
        </div>
      </div>

      {/* Save Dialog Modal */}
      {showSaveDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full" role="dialog" aria-modal="true" aria-labelledby="save-outfit-title">
            <h3 id="save-outfit-title" className="text-lg font-semibold mb-4">{t('outfitCard:saveOutfit')}</h3>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('outfitCard:nameOptional')}
              </label>
              <input
                type="text"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                placeholder={t('outfitCard:placeholder')}
                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  setShowSaveDialog(false)
                  setCustomName('')
                }}
                disabled={saving}
                className="flex-1 btn-secondary"
              >
                {t('common:cancel')}
              </button>
              <button
                onClick={handleSaveConfirm}
                disabled={saving}
                className="flex-1 btn-primary disabled:opacity-50"
              >
                {saving ? t('outfitCard:saving') : t('common:save')}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { OutfitSuggestionService } from '../lib/outfitService'
import OutfitCard from '../components/OutfitCard'
import type { OutfitSuggestion } from '../lib/outfitService'
import { useTranslation } from 'react-i18next'

const Suggestions = () => {
  const [suggestions, setSuggestions] = useState<OutfitSuggestion[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [seasonFilter, setSeasonFilter] = useState('')
  const [includeAccessories, setIncludeAccessories] = useState(true)
  const [message, setMessage] = useState('')
  const { t } = useTranslation(['suggestions', 'common'])

  const getCurrentSeason = () => {
    const month = new Date().getMonth() + 1
    if (month >= 3 && month <= 5) return 'spring'
    if (month >= 6 && month <= 8) return 'summer'  
    if (month >= 9 && month <= 11) return 'fall'
    return 'winter'
  }

  const generateSuggestions = async () => {
    setLoading(true)
    setError('')
    try {
      const newSuggestions = await OutfitSuggestionService.generateSuggestions({
        seasonPreference: seasonFilter || getCurrentSeason(),
        includeAccessories,
        maxSuggestions: 6
      })
      setSuggestions(newSuggestions)
      
      if (newSuggestions.length === 0) {
        if (seasonFilter) {
          setError(
            t('suggestions:failedSeason', {
              defaultValue:
                'No good {{season}} outfit combinations found. Try adding more {{season}} items to your wardrobe, or try a different season!',
              season: t(`common:seasons.${seasonFilter}`),
            })
          )
        } else {
          setError(
            t('suggestions:failedNoCombos', {
              defaultValue:
                'No good outfit combinations found. Try adding more items to your wardrobe!',
            })
          )
        }
      }
    } catch (err) {
      if (err instanceof Error) {
        if (err.message === 'INSUFFICIENT_ITEMS') {
          setError(
            t('suggestions:insufficient', {
              defaultValue:
                'You need at least one top, one bottom, and one pair of shoes to generate outfit suggestions.',
            })
          )
        } else {
          setError(err.message)
        }
      } else {
        setError(t('suggestions:failed', { defaultValue: 'Failed to generate suggestions' }))
      }
    } finally {
      setLoading(false)
    }
  }

  const handleSaveOutfit = async (outfit: OutfitSuggestion, customName?: string) => {
    try {
      await OutfitSuggestionService.saveOutfit(outfit, customName)
      setMessage(t('suggestions.savedSuccess'))
      setTimeout(() => setMessage(''), 3000)
    } catch (error) {
      console.error('Error saving outfit:', error)
      setError(t('suggestions.failedSave'))
      setTimeout(() => setError(''), 3000)
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">{t('suggestions:title')}</h1>

      {/* Success/Error Messages */}
      {message && (
        <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded flex justify-between items-center">
          <span>{message}</span>
          <Link to="/saved" className="btn-secondary btn-sm">{t('suggestions:viewSaved')}</Link>
        </div>
      )}
      
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Controls */}
      <div className="card">
        <h2 className="text-xl font-semibold mb-4">{t('suggestions:generateTitle')}</h2>
        
        {/* Season Filter */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('suggestions:seasonPreference')}
            </label>
            <select
              value={seasonFilter}
              onChange={(e) => setSeasonFilter(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">{t('suggestions:currentSeason', { season: t(`common:seasons.${getCurrentSeason()}`) })}</option>
              <option value="spring">{t('common:seasons.spring')}</option>
              <option value="summer">{t('common:seasons.summer')}</option>
              <option value="fall">{t('common:seasons.fall')}</option>
              <option value="winter">{t('common:seasons.winter')}</option>
            </select>
          </div>

          <div className="flex items-center">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={includeAccessories}
                onChange={(e) => setIncludeAccessories(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">{t('suggestions:includeAccessories')}</span>
            </label>
          </div>
        </div>

        <button
          onClick={generateSuggestions}
          disabled={loading}
          className="btn-primary disabled:opacity-50"
        >
          {loading ? t('suggestions:generating') : t('suggestions:generate')}
        </button>
      </div>

      {/* Suggestions Grid */}
      {suggestions.length > 0 ? (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {t('suggestions:found', { count: suggestions.length })}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {suggestions.map((suggestion) => (
              <OutfitCard
                key={suggestion.id}
                outfit={suggestion}
                onSave={handleSaveOutfit}
              />
            ))}
          </div>
        </div>
      ) : !loading && !error && (
        /* Empty state */
        <div className="text-center py-12">
          <div className="text-6xl mb-4">✨</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {t('suggestions:emptyTitle')}
          </h3>
          <p className="text-gray-600 mb-4">
            {t('suggestions:emptyText')}
          </p>
          {suggestions.length === 0 && (
            <Link to="/wardrobe" className="btn-secondary">
              {t('suggestions:checkWardrobe')}
            </Link>
          )}
        </div>
      )}
    </div>
  );
};

export default Suggestions;
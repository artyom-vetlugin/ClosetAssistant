import { useState, useEffect, useCallback } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { ClothingService, type ClothingItemFilters } from '../lib/clothingService'
import type { ClothingItem } from '../lib/supabase'
import ItemDetail from '../components/ItemDetail'
import { useTranslation } from 'react-i18next'

const Wardrobe = () => {
  const location = useLocation()
  const [items, setItems] = useState<ClothingItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedItem, setSelectedItem] = useState<ClothingItem | null>(null)
  const [message, setMessage] = useState('')
  const [filters, setFilters] = useState<ClothingItemFilters>({})
  const { t } = useTranslation(['wardrobe', 'common'])

  // Show success message if redirected from AddItem
  useEffect(() => {
    if (location.state?.message) {
      setMessage(location.state.message)
      // Clear the message after 3 seconds
      setTimeout(() => setMessage(''), 3000)
    }
  }, [location.state])

  // Load clothing items
  useEffect(() => {
    loadItems()
  }, [filters])

  const loadItems = useCallback(async () => {
    try {
      setLoading(true)
      setError('')
      const clothingItems = await ClothingService.getItems(filters)
      setItems(clothingItems)
    } catch (err) {
      console.error('Error loading items:', err)
      setError(t('wardrobe:errorLoad'))
    } finally {
      setLoading(false)
    }
  }, [filters, t])

  const handleFilterChange = (filterType: keyof ClothingItemFilters, value: string) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value || undefined
    }))
  }

  const formatSeasons = (seasons: string[]) => {
    return seasons.map(season => 
      season.charAt(0).toUpperCase() + season.slice(1)
    ).join(', ')
  }

  // Handle item update
  const handleItemUpdate = (updatedItem: ClothingItem) => {
    setItems(prevItems => 
      prevItems.map(item => 
        item.id === updatedItem.id ? updatedItem : item
      )
    )
    setMessage(t('wardrobe:updatedSuccess'))
    setTimeout(() => setMessage(''), 3000)
  }

  // Handle item delete
  const handleItemDelete = (deletedItemId: string) => {
    setItems(prevItems => 
      prevItems.filter(item => item.id !== deletedItemId)
    )
    setMessage(t('wardrobe:deletedSuccess'))
    setTimeout(() => setMessage(''), 3000)
  }

  return (
    <div className="space-y-6">
      {message && (
        <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded">
          {message}
        </div>
      )}

      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">{t('wardrobe:title')}</h1>
        <Link to="/add-item" className="btn-primary">
          {t('wardrobe:addItem')}
        </Link>
      </div>

      {/* Filters */}
      <div className="card">
        <h3 className="text-lg font-semibold mb-3">{t('wardrobe:filtersTitle')}</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('wardrobe:type')}
            </label>
            <select 
              value={filters.type || ''}
              onChange={(e) => handleFilterChange('type', e.target.value)}
              className="w-full p-2 border border-gray-300 rounded focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">{t('wardrobe:allTypes')}</option>
              <option value="top">{t('common:types.top')}</option>
              <option value="bottom">{t('common:types.bottom')}</option>
              <option value="dress">{t('common:types.dress')}</option>
              <option value="outerwear">{t('common:types.outerwear')}</option>
              <option value="shoes">{t('common:types.shoes')}</option>
              <option value="accessory">{t('common:types.accessory')}</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('wardrobe:color')}
            </label>
            <select 
              value={filters.color || ''}
              onChange={(e) => handleFilterChange('color', e.target.value)}
              className="w-full p-2 border border-gray-300 rounded focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">{t('wardrobe:allColors')}</option>
              <option value="black">{t('common:colors.black')}</option>
              <option value="white">{t('common:colors.white')}</option>
              <option value="gray">{t('common:colors.gray')}</option>
              <option value="blue">{t('common:colors.blue')}</option>
              <option value="red">{t('common:colors.red')}</option>
              <option value="green">{t('common:colors.green')}</option>
              <option value="yellow">{t('common:colors.yellow')}</option>
              <option value="pink">{t('common:colors.pink')}</option>
              <option value="purple">{t('common:colors.purple')}</option>
              <option value="brown">{t('common:colors.brown')}</option>
              <option value="orange">{t('common:colors.orange')}</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('wardrobe:season')}
            </label>
            <select 
              value={filters.season || ''}
              onChange={(e) => handleFilterChange('season', e.target.value)}
              className="w-full p-2 border border-gray-300 rounded focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">{t('wardrobe:allSeasons')}</option>
              <option value="spring">{t('common:seasons.spring')}</option>
              <option value="summer">{t('common:seasons.summer')}</option>
              <option value="fall">{t('common:seasons.fall')}</option>
              <option value="winter">{t('common:seasons.winter')}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
          {error}
          <button 
            onClick={loadItems}
            className="ml-2 text-sm underline hover:no-underline"
          >
            {t('common:tryAgain')}
          </button>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="text-center py-12">
          <div className="text-4xl mb-4">👗</div>
          <p className="text-gray-600">{t('wardrobe:loading')}</p>
        </div>
      )}

      {/* Items Grid */}
      {!loading && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {items.length > 0 ? (
            items.map((item) => (
              <div 
                key={item.id} 
                onClick={() => setSelectedItem(item)}
                className="card p-0 overflow-hidden hover:shadow-lg transition-all cursor-pointer transform hover:scale-105"
              >
                <div className="aspect-square relative">
                  <img
                    src={item.image_url}
                    alt={`${item.color} ${item.type}`}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs">
                    {item.type}
                  </div>
                </div>
                <div className="p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-gray-900 capitalize">
                      {item.color}
                    </span>
                    <span className="text-sm text-gray-500 capitalize">
                      {item.type}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500">
                    {formatSeasons(item.seasons.map((s) => t(`common:seasons.${s}`)))}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    {t('wardrobe:addedOn', { date: new Date(item.created_at).toLocaleDateString() })}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full">
              <div className="text-center py-12">
                <div className="text-6xl mb-4">👗</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {Object.keys(filters).some(key => filters[key as keyof ClothingItemFilters]) 
                    ? t('wardrobe:emptyFilteredTitle') 
                    : t('wardrobe:emptyTitle')}
                </h3>
                <p className="text-gray-600 mb-4">
                  {Object.keys(filters).some(key => filters[key as keyof ClothingItemFilters])
                    ? t('wardrobe:emptyFilteredText')
                    : t('wardrobe:emptyText')}
                </p>
                <Link to="/add-item" className="btn-primary">
                  {Object.keys(filters).some(key => filters[key as keyof ClothingItemFilters])
                    ? t('wardrobe:addMore')
                    : t('wardrobe:addFirst')}
                </Link>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Item Detail Modal */}
      {selectedItem && (
        <ItemDetail
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
          onUpdate={handleItemUpdate}
          onDelete={handleItemDelete}
        />
      )}
    </div>
  );
};

export default Wardrobe;
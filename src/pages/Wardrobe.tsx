import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { ClothingService, type ClothingItemFilters } from '../lib/clothingService'
import type { ClothingItem } from '../lib/supabase'
import ItemDetail from '../components/ItemDetail'

const Wardrobe = () => {
  const location = useLocation()
  const [items, setItems] = useState<ClothingItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedItem, setSelectedItem] = useState<ClothingItem | null>(null)
  const [message, setMessage] = useState('')
  const [filters, setFilters] = useState<ClothingItemFilters>({})

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

  const loadItems = async () => {
    try {
      setLoading(true)
      setError('')
      const clothingItems = await ClothingService.getItems(filters)
      setItems(clothingItems)
    } catch (err) {
      console.error('Error loading items:', err)
      setError('Failed to load wardrobe items')
    } finally {
      setLoading(false)
    }
  }

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
    setMessage('Item updated successfully!')
    setTimeout(() => setMessage(''), 3000)
  }

  // Handle item delete
  const handleItemDelete = (deletedItemId: string) => {
    setItems(prevItems => 
      prevItems.filter(item => item.id !== deletedItemId)
    )
    setMessage('Item deleted successfully!')
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
        <h1 className="text-2xl font-bold text-gray-900">My Wardrobe</h1>
        <Link to="/add-item" className="btn-primary">
          Add Item
        </Link>
      </div>

      {/* Filters */}
      <div className="card">
        <h3 className="text-lg font-semibold mb-3">Filters</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Type
            </label>
            <select 
              value={filters.type || ''}
              onChange={(e) => handleFilterChange('type', e.target.value)}
              className="w-full p-2 border border-gray-300 rounded focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">All types</option>
              <option value="top">Tops</option>
              <option value="bottom">Bottoms</option>
              <option value="dress">Dresses</option>
              <option value="outerwear">Outerwear</option>
              <option value="shoes">Shoes</option>
              <option value="accessory">Accessories</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Color
            </label>
            <select 
              value={filters.color || ''}
              onChange={(e) => handleFilterChange('color', e.target.value)}
              className="w-full p-2 border border-gray-300 rounded focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">All colors</option>
              <option value="black">Black</option>
              <option value="white">White</option>
              <option value="gray">Gray</option>
              <option value="blue">Blue</option>
              <option value="red">Red</option>
              <option value="green">Green</option>
              <option value="yellow">Yellow</option>
              <option value="pink">Pink</option>
              <option value="purple">Purple</option>
              <option value="brown">Brown</option>
              <option value="orange">Orange</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Season
            </label>
            <select 
              value={filters.season || ''}
              onChange={(e) => handleFilterChange('season', e.target.value)}
              className="w-full p-2 border border-gray-300 rounded focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">All seasons</option>
              <option value="spring">Spring</option>
              <option value="summer">Summer</option>
              <option value="fall">Fall</option>
              <option value="winter">Winter</option>
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
            Try again
          </button>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="text-center py-12">
          <div className="text-4xl mb-4">👗</div>
          <p className="text-gray-600">Loading your wardrobe...</p>
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
                    {formatSeasons(item.seasons)}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    Added {new Date(item.created_at).toLocaleDateString()}
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
                    ? 'No items match your filters' 
                    : 'No items yet'}
                </h3>
                <p className="text-gray-600 mb-4">
                  {Object.keys(filters).some(key => filters[key as keyof ClothingItemFilters])
                    ? 'Try adjusting your filters or add more items to your wardrobe'
                    : 'Start building your digital wardrobe by adding your first item'}
                </p>
                <Link to="/add-item" className="btn-primary">
                  {Object.keys(filters).some(key => filters[key as keyof ClothingItemFilters])
                    ? 'Add More Items'
                    : 'Add Your First Item'}
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
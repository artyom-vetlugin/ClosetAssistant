import React, { useState } from 'react'
import type { ClothingItem } from '../lib/supabase'
import { ClothingService } from '../lib/clothingService'
import { ImageService } from '../lib/imageService'
import { useAuth } from '../contexts/AuthContext'

interface ItemDetailProps {
  item: ClothingItem
  onClose: () => void
  onUpdate: (updatedItem: ClothingItem) => void
  onDelete: (deletedItemId: string) => void
}

const CLOTHING_TYPES = ['top', 'bottom', 'shoes', 'accessory']
const COLORS = ['black', 'white', 'gray', 'brown', 'red', 'blue', 'green', 'yellow', 'orange', 'purple', 'pink', 'beige', 'navy']
const SEASONS = ['spring', 'summer', 'fall', 'winter']

export default function ItemDetail({ item, onClose, onUpdate, onDelete }: ItemDetailProps) {
  const { user } = useAuth()
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isRemovingBg, setIsRemovingBg] = useState(false)
  
  // Edit form state
  const [editData, setEditData] = useState({
    type: item.type,
    color: item.color,
    seasons: item.seasons || []
  })

  const handleSave = async () => {
    if (!editData.type || !editData.color || editData.seasons.length === 0) {
      alert('Please fill in all fields')
      return
    }

    setIsLoading(true)
    try {
      const updatedItem = await ClothingService.updateItem({
        id: item.id,
        type: editData.type,
        color: editData.color,
        seasons: editData.seasons
      })
      onUpdate(updatedItem)
      setIsEditing(false)
    } catch (error) {
      console.error('Error updating item:', error)
      alert('Failed to update item')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async () => {
    setIsLoading(true)
    try {
      await ClothingService.deleteItem(item.id)
      onDelete(item.id)
      onClose()
    } catch (error) {
      console.error('Error deleting item:', error)
      alert('Failed to delete item')
    } finally {
      setIsLoading(false)
    }
  }

  const handleRemoveBackground = async () => {
    if (!user?.id) {
      alert('You must be signed in to modify images')
      return
    }
    setIsRemovingBg(true)
    try {
      const originalUrl = item.image_url
      const file = await ImageService.fileFromUrl(originalUrl)
      const bgRemovedFile = await ImageService.removeBackground(file, 'image/png')
      const newImageUrl = await ImageService.uploadImage(bgRemovedFile, user.id, {
        removeBackground: false,
        outputFormat: 'image/png'
      })

      const updatedItem = await ClothingService.updateItem({
        id: item.id,
        image_url: newImageUrl
      })

      // Best-effort cleanup of old image
      try {
        await ImageService.deleteImage(originalUrl, user.id)
      } catch (cleanupError) {
        console.warn('Failed to delete old image:', cleanupError)
      }

      onUpdate(updatedItem)
    } catch (error) {
      console.error('Error removing background:', error)
      alert('Failed to remove background')
    } finally {
      setIsRemovingBg(false)
    }
  }

  const toggleSeason = (season: string) => {
    setEditData(prev => ({
      ...prev,
      seasons: prev.seasons.includes(season)
        ? prev.seasons.filter(s => s !== season)
        : [...prev.seasons, season]
    }))
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-semibold">Item Details</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          {/* Image */}
          <div className="mb-4">
            <img
              src={item.image_url}
              alt="Clothing item"
              className="w-full h-48 object-cover rounded-lg"
            />
            {isEditing && (
              <div className="mt-2 flex">
                <button
                  onClick={handleRemoveBackground}
                  disabled={isRemovingBg}
                  className="btn-secondary disabled:opacity-50"
                >
                  {isRemovingBg ? 'Removing background...' : 'Remove background'}
                </button>
              </div>
            )}
          </div>

          {!isEditing ? (
            /* View Mode */
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <p className="text-gray-900 capitalize">{item.type}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Color</label>
                <p className="text-gray-900 capitalize">{item.color}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Seasons</label>
                <div className="flex flex-wrap gap-2">
                  {(item.seasons || []).map(season => (
                    <span key={season} className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm capitalize">
                      {season}
                    </span>
                  ))}
                </div>
              </div>

              <div className="pt-4 space-y-2">
                <button
                  onClick={() => setIsEditing(true)}
                  className="w-full btn-primary"
                >
                  Edit Item
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="w-full bg-red-500 text-white py-2 px-4 rounded hover:bg-red-600"
                >
                  Delete Item
                </button>
              </div>
            </div>
          ) : (
            /* Edit Mode */
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                <select
                  value={editData.type}
                  onChange={(e) => setEditData(prev => ({ ...prev, type: e.target.value as ClothingItem['type'] }))}
                  className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {CLOTHING_TYPES.map(type => (
                    <option key={type} value={type} className="capitalize">{type}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Color</label>
                <select
                  value={editData.color}
                  onChange={(e) => setEditData(prev => ({ ...prev, color: e.target.value }))}
                  className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {COLORS.map(color => (
                    <option key={color} value={color} className="capitalize">{color}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Seasons</label>
                <div className="grid grid-cols-2 gap-2">
                  {SEASONS.map(season => (
                    <label key={season} className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editData.seasons.includes(season)}
                        onChange={() => toggleSeason(season)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="capitalize">{season}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex space-x-2 pt-4">
                <button
                  onClick={handleSave}
                  disabled={isLoading}
                  className="flex-1 btn-primary disabled:opacity-50"
                >
                  {isLoading ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  onClick={() => {
                    setIsEditing(false)
                    setEditData({
                      type: item.type,
                      color: item.color,
                      seasons: item.seasons || []
                    })
                  }}
                  disabled={isLoading}
                  className="flex-1 btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-60 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full">
            <h3 className="text-lg font-semibold mb-2">Delete Item?</h3>
            <p className="text-gray-600 mb-4">
              This action cannot be undone. The item will be permanently removed from your wardrobe.
            </p>
            <div className="flex space-x-2">
              <button
                onClick={handleDelete}
                disabled={isLoading}
                className="flex-1 bg-red-500 text-white py-2 px-4 rounded hover:bg-red-600 disabled:opacity-50"
              >
                {isLoading ? 'Deleting...' : 'Delete'}
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isLoading}
                className="flex-1 btn-secondary"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { ImageService } from '../lib/imageService'
import { ClothingService } from '../lib/clothingService'
import CameraCapture from '../components/CameraCapture'
import type { ClothingItem } from '../lib/supabase'

const AddItem = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // Form state
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string>('')
  const [type, setType] = useState<ClothingItem['type']>('top')
  const [color, setColor] = useState<ClothingItem['color']>('black')
  const [seasons, setSeasons] = useState<string[]>([])
  
  // UI state
  const [showCamera, setShowCamera] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [detectedColor, setDetectedColor] = useState<string>('')
  const [colorDetectionLoading, setColorDetectionLoading] = useState(false)

  const handleFileSelect = async (file: File) => {
    const validation = ImageService.validateImageFile(file)
    if (!validation.isValid) {
      setError(validation.error || 'Invalid file')
      return
    }

    // Clean up previous preview URL
    if (previewUrl) {
      ImageService.revokePreviewUrl(previewUrl)
    }

    setSelectedFile(file)
    setPreviewUrl(ImageService.createPreviewUrl(file))
    setError('')

    // Detect color automatically
    setColorDetectionLoading(true)
    try {
      const dominantColor = await ImageService.extractDominantColor(file)
      setDetectedColor(dominantColor)
      setColor(dominantColor as ClothingItem['color'])
      console.log('🎨 Detected color:', dominantColor)
    } catch (error) {
      console.log('🎨 Color detection failed:', error)
      setDetectedColor('')
    } finally {
      setColorDetectionLoading(false)
    }
  }

  const handleCameraCapture = (file: File) => {
    handleFileSelect(file)
    setShowCamera(false)
  }

  const handleGallerySelect = () => {
    fileInputRef.current?.click()
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFileSelect(file)
    }
  }

  const handleSeasonChange = (season: string) => {
    setSeasons(prev => 
      prev.includes(season)
        ? prev.filter(s => s !== season)
        : [...prev, season]
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedFile) {
      setError('Please select a photo')
      return
    }

    if (!user) {
      setError('You must be logged in to add items')
      return
    }

    if (seasons.length === 0) {
      setError('Please select at least one season')
      return
    }

    try {
      setLoading(true)
      setError('')

      // Upload image to Supabase storage
      const imageUrl = await ImageService.uploadImage(selectedFile, user.id)

      // Save clothing item to database
      await ClothingService.createItem({
        type,
        color,
        seasons,
        image_url: imageUrl,
      })

      // Clean up and navigate
      if (previewUrl) {
        ImageService.revokePreviewUrl(previewUrl)
      }
      
      navigate('/wardrobe', { 
        state: { message: 'Item added successfully!' }
      })
    } catch (err) {
      console.error('Error adding item:', err)
      setError('Failed to add item. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const removePhoto = () => {
    if (previewUrl) {
      ImageService.revokePreviewUrl(previewUrl)
    }
    setSelectedFile(null)
    setPreviewUrl('')
    setError('')
  }

  if (showCamera) {
    return (
      <CameraCapture
        onCapture={handleCameraCapture}
        onCancel={() => setShowCamera(false)}
      />
    )
  }

  return (
    <div className="max-w-md mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Add New Item</h1>
      
      <form onSubmit={handleSubmit}>
        <div className="card">
          <div className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
                {error}
              </div>
            )}

            {/* Photo Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Photo *
              </label>
              
              {selectedFile && previewUrl ? (
                <div className="relative">
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="w-full h-48 object-cover rounded-lg border"
                  />
                  <button
                    type="button"
                    onClick={removePhoto}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-red-600"
                  >
                    ×
                  </button>
                </div>
              ) : (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                  <div className="text-4xl mb-2">📸</div>
                  <p className="text-gray-600 mb-4">Take a photo or upload from gallery</p>
                  <div className="space-y-2">
                    <button
                      type="button"
                      onClick={() => setShowCamera(true)}
                      className="btn-primary w-full"
                    >
                      Take Photo
                    </button>
                    <button
                      type="button"
                      onClick={handleGallerySelect}
                      className="btn-secondary w-full"
                    >
                      Upload from Gallery
                    </button>
                  </div>
                </div>
              )}
              
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileInputChange}
                className="hidden"
              />
            </div>

            {/* Item Details */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Type *
              </label>
              <select 
                value={type}
                onChange={(e) => setType(e.target.value as ClothingItem['type'])}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                required
              >
                <option value="top">Top</option>
                <option value="bottom">Bottom</option>
                <option value="dress">Dress</option>
                <option value="outerwear">Outerwear</option>
                <option value="shoes">Shoes</option>
                <option value="accessory">Accessory</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Color *
                {colorDetectionLoading && (
                  <span className="ml-2 text-sm text-blue-600">🎨 Detecting color...</span>
                )}
                {detectedColor && !colorDetectionLoading && (
                  <span className="ml-2 text-sm text-green-600">✨ Auto-detected: {detectedColor}</span>
                )}
              </label>
              <select 
                value={color}
                onChange={(e) => setColor(e.target.value as ClothingItem['color'])}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                required
              >
                {detectedColor && (
                  <option value={detectedColor} className="font-semibold bg-green-50">
                    🎨 {detectedColor.charAt(0).toUpperCase() + detectedColor.slice(1)} (detected)
                  </option>
                )}
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
                <option value="navy">Navy</option>
                <option value="beige">Beige</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Seasons * (select at least one)
              </label>
              <div className="grid grid-cols-2 gap-2">
                {['spring', 'summer', 'fall', 'winter'].map((season) => (
                  <label key={season} className="flex items-center">
                    <input 
                      type="checkbox" 
                      checked={seasons.includes(season)}
                      onChange={() => handleSeasonChange(season)}
                      className="mr-2 text-primary-500 focus:ring-primary-500" 
                    />
                    {season.charAt(0).toUpperCase() + season.slice(1)}
                  </label>
                ))}
              </div>
            </div>

            <button 
              type="submit"
              disabled={loading}
              className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Saving Item...' : 'Save Item'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default AddItem;
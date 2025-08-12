import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { ImageService } from '../lib/imageService'
import { ClothingService } from '../lib/clothingService'
import CameraCapture from '../components/CameraCapture'
import type { ClothingItem } from '../lib/supabase'
import { useTranslation } from 'react-i18next'

const AddItem = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { t } = useTranslation(['addItem', 'common'])
  
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
  const [shouldRemoveBg, setShouldRemoveBg] = useState(false)

  const handleFileSelect = async (file: File) => {
    const validation = ImageService.validateImageFile(file)
    if (!validation.isValid) {
      setError(validation.error || t('addItem:invalidFile'))
      return
    }

    // Clean up previous preview URL
    if (previewUrl) {
      ImageService.revokePreviewUrl(previewUrl)
    }

    // Preview and detection use original image (no automatic background removal)
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
      setError(t('addItem:selectPhoto'))
      return
    }

    if (!user) {
      setError(t('addItem:mustLogin'))
      return
    }

    if (seasons.length === 0) {
      setError(t('addItem:selectSeason'))
      return
    }

    try {
      setLoading(true)
      setError('')

      // Upload image to Supabase storage with optional background removal
      const imageUrl = await ImageService.uploadImage(selectedFile, user.id, {
        removeBackground: shouldRemoveBg,
        outputFormat: 'image/png',
      })

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
        state: { message: t('addItem:addedSuccess') }
      })
    } catch (err) {
      console.error('Error adding item:', err)
      setError(t('addItem:failedAdd'))
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
      <h1 className="text-2xl font-bold text-gray-900 mb-6">{t('addItem:title')}</h1>
      
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
                {t('addItem:photoLabel')}
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
                  <p className="text-gray-600 mb-4">{t('addItem:photoHelp')}</p>
                  <div className="space-y-2">
                    <button
                      type="button"
                      onClick={() => setShowCamera(true)}
                      className="btn-primary w-full"
                    >
                      {t('addItem:takePhoto')}
                    </button>
                    <button
                      type="button"
                      onClick={handleGallerySelect}
                      className="btn-secondary w-full"
                    >
                      {t('addItem:uploadFromGallery')}
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
                 {t('addItem:typeLabel')}
               </label>
              <select 
                value={type}
                onChange={(e) => setType(e.target.value as ClothingItem['type'])}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                required
              >
                 <option value="top">{t('common:types.top')}</option>
                 <option value="bottom">{t('common:types.bottom')}</option>
                 <option value="dress">{t('common:types.dress')}</option>
                 <option value="outerwear">{t('common:types.outerwear')}</option>
                 <option value="shoes">{t('common:types.shoes')}</option>
                 <option value="accessory">{t('common:types.accessory')}</option>
              </select>
            </div>

            {/* Background removal toggle */}
            <div className="flex items-center">
              <input
                id="remove-bg"
                type="checkbox"
                checked={shouldRemoveBg}
                onChange={(e) => setShouldRemoveBg(e.target.checked)}
                className="mr-2 text-primary-500 focus:ring-primary-500"
              />
              <label htmlFor="remove-bg" className="text-sm text-gray-700">
                {t('addItem:removeBg')}
              </label>
            </div>

            <div>
               <label className="block text-sm font-medium text-gray-700 mb-2">
                 {t('addItem:colorLabel')}
                 {colorDetectionLoading && (
                   <span className="ml-2 text-sm text-blue-600">🎨 {t('addItem:detectingColor')}</span>
                 )}
                 {detectedColor && !colorDetectionLoading && (
                   <span className="ml-2 text-sm text-green-600">✨ {t('addItem:autodetected', { color: detectedColor.charAt(0).toUpperCase() + detectedColor.slice(1) })}</span>
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
                     🎨 {detectedColor.charAt(0).toUpperCase() + detectedColor.slice(1)}
                   </option>
                 )}
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
                 <option value="navy">{t('common:colors.navy')}</option>
                 <option value="beige">{t('common:colors.beige')}</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('addItem:seasonsLabel')}
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
                    {t(`common:seasons.${season}`)}
                  </label>
                ))}
              </div>
            </div>

            <button 
              type="submit"
              disabled={loading}
              className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? t('addItem:saving') : t('addItem:save')}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default AddItem;
import imageCompression from 'browser-image-compression'
import { v4 as uuidv4 } from 'uuid'
import { supabase } from './supabase'
import { removeBackground as removeBg } from '@imgly/background-removal'

// Color detection types
interface ColorRange {
  name: string
  r: [number, number]
  g: [number, number]
  b: [number, number]
}

export interface ImageUploadOptions {
  maxSizeMB?: number
  maxWidthOrHeight?: number
  useWebWorker?: boolean
  removeBackground?: boolean
  outputFormat?: 'image/png' | 'image/webp'
}

export class ImageService {
  private static readonly DEFAULT_OPTIONS: ImageUploadOptions = {
    maxSizeMB: 1,
    maxWidthOrHeight: 800,
    useWebWorker: true,
  }

  /**
   * Remove background from an image file and return a new File with alpha channel
   */
  static async removeBackground(
    file: File,
    format: 'image/png' | 'image/webp' = 'image/png'
  ): Promise<File> {
    try {
      const blob = await removeBg(file, { output: { format } })
      const ext = format === 'image/webp' ? 'webp' : 'png'
      const newName = file.name.replace(/\.[^/.]+$/, '') + `.${ext}`
      return new File([blob], newName, { type: format })
    } catch (error) {
      console.error('Error removing background:', error)
      throw new Error('Failed to remove background')
    }
  }

  /**
   * Compress an image file
   */
  static async compressImage(
    file: File,
    options: ImageUploadOptions = {}
  ): Promise<File> {
    const compressionOptions = { ...this.DEFAULT_OPTIONS, ...options }
    
    try {
      const compressedFile = await imageCompression(file, compressionOptions)
      return compressedFile
    } catch (error) {
      console.error('Error compressing image:', error)
      throw new Error('Failed to compress image')
    }
  }

  /**
   * Upload image to Supabase storage
   */
  static async uploadImage(
    file: File,
    userId: string,
    options: ImageUploadOptions = {}
  ): Promise<string> {
    try {
      // 1) Compress the image first
      const compressedFile = await this.compressImage(file, options)

      // 2) Optional background removal (keeps alpha)
      const finalFile = options.removeBackground
        ? await this.removeBackground(
            compressedFile,
            options.outputFormat ?? 'image/png'
          )
        : compressedFile

      // 3) Generate a filename based on final file type
      const inferredExt =
        finalFile.type.includes('webp') ? 'webp' :
        finalFile.type.includes('png') ? 'png' :
        (finalFile.name.split('.').pop() || 'jpg')

      const fileName = `${uuidv4()}.${inferredExt}`
      const filePath = `${userId}/${fileName}`

      // Upload to Supabase storage
      const { error } = await supabase.storage
        .from('clothing-images')
        .upload(filePath, finalFile, {
          cacheControl: '3600',
          upsert: false
        })

      if (error) {
        throw error
      }

      // Get the public URL
      const { data: { publicUrl } } = supabase.storage
        .from('clothing-images')
        .getPublicUrl(filePath)

      return publicUrl
    } catch (error) {
      console.error('Error uploading image:', error)
      throw new Error('Failed to upload image')
    }
  }

  /**
   * Delete image from Supabase storage
   */
  static async deleteImage(imageUrl: string, userId: string): Promise<void> {
    try {
      // Extract file path from URL
      const url = new URL(imageUrl)
      const pathParts = url.pathname.split('/')
      const fileName = pathParts[pathParts.length - 1]
      const filePath = `${userId}/${fileName}`

      const { error } = await supabase.storage
        .from('clothing-images')
        .remove([filePath])

      if (error) {
        throw error
      }
    } catch (error) {
      console.error('Error deleting image:', error)
      throw new Error('Failed to delete image')
    }
  }

  /**
   * Validate image file
   */
  static validateImageFile(file: File): { isValid: boolean; error?: string } {
    // Check file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      return {
        isValid: false,
        error: 'Please select a valid image file (JPEG, PNG, or WebP)'
      }
    }

    // Check file size (10MB max)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      return {
        isValid: false,
        error: 'File size must be less than 10MB'
      }
    }

    return { isValid: true }
  }

  /**
   * Create image preview URL
   */
  static createPreviewUrl(file: File): string {
    return URL.createObjectURL(file)
  }

  /**
   * Revoke preview URL to free memory
   */
  static revokePreviewUrl(url: string): void {
    URL.revokeObjectURL(url)
  }

  /**
   * Extract dominant color from image file
   */
  static async extractDominantColor(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      const img = new Image()
      
      if (!ctx) {
        reject(new Error('Canvas context not available'))
        return
      }
      
      img.onload = () => {
        try {
          // Resize to small canvas for performance (100x100 pixels)
          canvas.width = 100
          canvas.height = 100
          ctx.drawImage(img, 0, 0, 100, 100)
          
          // Get image data
          const imageData = ctx.getImageData(0, 0, 100, 100)
          const colorCounts: { [key: string]: number } = {}
          
          // Sample pixels and count colors (every 4th pixel for performance)
          for (let i = 0; i < imageData.data.length; i += 16) {
            const r = imageData.data[i]
            const g = imageData.data[i + 1]
            const b = imageData.data[i + 2]
            const alpha = imageData.data[i + 3]
            
            // Skip transparent pixels
            if (alpha < 128) continue
            
            // Convert RGB to color name
            const colorName = this.rgbToColorName(r, g, b)
            colorCounts[colorName] = (colorCounts[colorName] || 0) + 1
          }
          
          // Find most frequent color
          const colors = Object.keys(colorCounts)
          if (colors.length === 0) {
            resolve('gray') // fallback
            return
          }
          
          const dominantColor = colors.reduce((a, b) => 
            colorCounts[a] > colorCounts[b] ? a : b
          )
          
          resolve(dominantColor)
        } catch (error) {
          reject(error)
        } finally {
          // Clean up
          URL.revokeObjectURL(img.src)
        }
      }
      
      img.onerror = () => {
        reject(new Error('Failed to load image for color detection'))
      }
      
      img.src = URL.createObjectURL(file)
    })
  }

  /**
   * Convert RGB values to closest color name
   */
  private static rgbToColorName(r: number, g: number, b: number): string {
    // Define color ranges for common clothing colors
    const colorRanges: ColorRange[] = [
      { name: 'black', r: [0, 60], g: [0, 60], b: [0, 60] },
      { name: 'white', r: [200, 255], g: [200, 255], b: [200, 255] },
      { name: 'gray', r: [80, 180], g: [80, 180], b: [80, 180] },
      { name: 'red', r: [120, 255], g: [0, 80], b: [0, 80] },
      { name: 'blue', r: [0, 80], g: [0, 120], b: [120, 255] },
      { name: 'navy', r: [0, 50], g: [0, 50], b: [80, 150] },
      { name: 'green', r: [0, 120], g: [80, 200], b: [0, 120] },
      { name: 'yellow', r: [180, 255], g: [180, 255], b: [0, 100] },
      { name: 'orange', r: [200, 255], g: [80, 180], b: [0, 80] },
      { name: 'purple', r: [80, 180], g: [0, 100], b: [120, 255] },
      { name: 'pink', r: [200, 255], g: [100, 200], b: [150, 220] },
      { name: 'brown', r: [80, 150], g: [40, 100], b: [20, 80] },
      { name: 'beige', r: [180, 255], g: [150, 220], b: [100, 180] },
    ]
    
    // Calculate brightness to help distinguish similar colors
    const brightness = (r + g + b) / 3
    
    // Special case for very dark colors
    if (brightness < 40) {
      return 'black'
    }
    
    // Special case for very bright colors
    if (brightness > 220 && Math.abs(r - g) < 30 && Math.abs(g - b) < 30) {
      return 'white'
    }
    
    // Find closest color match
    for (const color of colorRanges) {
      if (r >= color.r[0] && r <= color.r[1] &&
          g >= color.g[0] && g <= color.g[1] &&
          b >= color.b[0] && b <= color.b[1]) {
        return color.name
      }
    }
    
    // Fallback based on dominant channel
    if (r > g && r > b) {
      return r > 150 ? 'red' : 'brown'
    } else if (g > r && g > b) {
      return g > 150 ? 'green' : 'brown'
    } else if (b > r && b > g) {
      return b > 150 ? 'blue' : 'navy'
    }
    
    // Final fallback
    return 'gray'
  }
}
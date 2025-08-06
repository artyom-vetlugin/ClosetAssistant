import imageCompression from 'browser-image-compression'
import { v4 as uuidv4 } from 'uuid'
import { supabase } from './supabase'

export interface ImageUploadOptions {
  maxSizeMB?: number
  maxWidthOrHeight?: number
  useWebWorker?: boolean
}

export class ImageService {
  private static readonly DEFAULT_OPTIONS: ImageUploadOptions = {
    maxSizeMB: 1,
    maxWidthOrHeight: 800,
    useWebWorker: true,
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
      // Compress the image first
      const compressedFile = await this.compressImage(file, options)
      
      // Generate unique filename
      const fileExt = file.name.split('.').pop()
      const fileName = `${uuidv4()}.${fileExt}`
      const filePath = `${userId}/${fileName}`

      // Upload to Supabase storage
      const { error } = await supabase.storage
        .from('clothing-images')
        .upload(filePath, compressedFile, {
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
}
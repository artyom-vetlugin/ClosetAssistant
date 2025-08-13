import { useRef, useState, useCallback, useEffect } from 'react'
import { useTranslation } from 'react-i18next'

interface CameraCaptureProps {
  onCapture: (file: File) => void
  onCancel: () => void
}

const CameraCapture = ({ onCapture, onCancel }: CameraCaptureProps) => {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const startTimeoutRef = useRef<number | null>(null)
  const [isStreaming, setIsStreaming] = useState(false)
  const [error, setError] = useState<string>('')
  const { t } = useTranslation(['camera'])

  const startCamera = useCallback(async () => {
    try {
      setError('')
      console.log('🎥 SIMPLE: Starting camera access...')
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true // Simplest possible constraints
      })

      console.log('🎥 SIMPLE: Camera stream obtained:', stream)
      
      // Store stream and show video immediately
      streamRef.current = stream
      console.log('🎥 SIMPLE: Stored stream, forcing UI to show video')
      setIsStreaming(true)
      
      // Wait for React to render the video element, then set the stream
      if (startTimeoutRef.current) {
        clearTimeout(startTimeoutRef.current)
        startTimeoutRef.current = null
      }
      startTimeoutRef.current = window.setTimeout(() => {
        console.log('🎥 SIMPLE: Checking for video element after render...')
        if (videoRef.current) {
          console.log('🎥 SIMPLE: Video element found after render, setting srcObject')
          videoRef.current.srcObject = stream
        } else {
          console.log('🎥 SIMPLE: Still no video element after timeout!')
        }
      }, 100)
    } catch (err) {
      console.error('🎥 SIMPLE: Error accessing camera:', err)
      const msg = err instanceof Error ? err.message : String(err)
      setError(t('camera:accessFailed', { message: msg }))
    }
  }, [t])

  const stopCamera = useCallback(() => {
    // Cancel any pending start timers to avoid re-attaching stream after stop
    if (startTimeoutRef.current) {
      clearTimeout(startTimeoutRef.current)
      startTimeoutRef.current = null
    }

    // Snapshot and null ref early to avoid races
    const stream = streamRef.current
    streamRef.current = null

    // Clear video element first
    if (videoRef.current) {
      const v = videoRef.current
      v.pause()
      // Clear srcObject/src aggressively
      try {
        (v as HTMLVideoElement & { srcObject?: MediaStream | null }).srcObject = null
      } catch { /* ignore cleanup errors */ }
      v.removeAttribute('src')
      v.removeAttribute('srcObject')
      v.src = ''
      v.load()
      // Force immediate DOM removal to help stubborn browsers release camera
      try {
        const parent = v.parentNode
        if (parent) {
          parent.removeChild(v)
        }
      } catch { /* ignore cleanup errors */ }
    }

    if (stream) {
      // Stop only video tracks (some browsers behave oddly with audio)
      stream.getVideoTracks().forEach((track) => {
        track.enabled = false
        track.stop()
      })
      // As a fallback, stop any remaining tracks
      stream.getTracks().forEach((track) => {
        if (track.readyState !== 'ended') {
          track.enabled = false
          track.stop()
        }
      })
    }

    setIsStreaming(false)
  }, [])

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return

    const video = videoRef.current
    const canvas = canvasRef.current
    const context = canvas.getContext('2d')

    if (!context) return

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight

    // Draw the video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height)

    // Convert canvas to blob
    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], `photo-${Date.now()}.jpg`, {
          type: 'image/jpeg'
        })
        // Stop camera first to immediately release hardware
        stopCamera()
        onCapture(file)
      }
    }, 'image/jpeg', 0.8)
  }, [onCapture, stopCamera])

  const handleCancel = useCallback(() => {
    stopCamera()
    onCancel()
  }, [stopCamera, onCancel])

  // Start camera when component mounts
  useEffect(() => {
    startCamera()
    const videoAtMount = videoRef.current
    
    // Also stop camera when user leaves the page
    const handleBeforeUnload = () => {
      console.log('🎥 SIMPLE: Page unloading, emergency camera stop')
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => {
          track.enabled = false
          track.stop()
        })
      }
      // Also clear any pending timer
      if (startTimeoutRef.current) {
        clearTimeout(startTimeoutRef.current)
        startTimeoutRef.current = null
      }
    }
    
    // Mobile Safari reliability: stop camera on pagehide (background/close)
    const handlePageHide = () => {
      console.log('🎥 SIMPLE: Page hidden (pagehide), stopping camera')
      stopCamera()
    }
    
    // Also try to stop camera when visibility changes
    const handleVisibilityChange = () => {
      if (document.hidden) {
        console.log('🎥 SIMPLE: Page hidden, stopping camera')
        stopCamera()
      }
    }
    
    window.addEventListener('beforeunload', handleBeforeUnload)
    window.addEventListener('unload', handleBeforeUnload)
    window.addEventListener('pagehide', handlePageHide)
    window.addEventListener('blur', handlePageHide)
    window.addEventListener('popstate', handlePageHide)
    document.addEventListener('visibilitychange', handleVisibilityChange)
    
    // Cleanup on unmount
    return () => {
      console.log('🎥 SIMPLE: Component unmounting, AGGRESSIVE camera stop')
      window.removeEventListener('beforeunload', handleBeforeUnload)
      window.removeEventListener('unload', handleBeforeUnload)
      window.removeEventListener('pagehide', handlePageHide)
      window.removeEventListener('blur', handlePageHide)
      window.removeEventListener('popstate', handlePageHide)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      
      // Force stop all tracks immediately
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => {
          track.enabled = false
          track.stop()
        })
        streamRef.current = null
      }
      
      // Clear video element aggressively
      if (videoAtMount) {
        videoAtMount.pause()
        ;(videoAtMount as HTMLVideoElement & { srcObject?: MediaStream | null }).srcObject = null
        videoAtMount.load()
      }
      if (startTimeoutRef.current) {
        clearTimeout(startTimeoutRef.current)
        startTimeoutRef.current = null
      }
      
      stopCamera()
    }
  }, [startCamera, stopCamera])

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Header */}
      <div className="grid grid-cols-3 items-center p-4 bg-black text-white">
        <button
          onClick={handleCancel}
          className="text-white hover:text-gray-300"
        >
          {t('camera:cancel')}
        </button>
        <h2 className="text-lg font-semibold justify-self-center">{t('camera:takePhoto')}</h2>
        <div />
      </div>

      {/* Camera View */}
      <div className="flex-1 relative flex items-center justify-center">
        {error ? (
          <div className="text-center text-white p-4">
            <div className="text-4xl mb-4">📷</div>
            <p className="mb-4">{error}</p>
            <button
              onClick={startCamera}
              className="bg-primary-500 text-white px-6 py-2 rounded-lg"
            >
              {t('camera:tryAgain')}
            </button>
          </div>
        ) : isStreaming ? (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            controls={false}
            className="max-w-full max-h-full object-contain"
            style={{ transform: 'scaleX(-1)' }} // Mirror the video like a selfie
          />
        ) : (
          <div className="text-center text-white">
            <div className="text-4xl mb-4">📷</div>
            <p>{t('camera:starting')}</p>
          </div>
        )}
      </div>

      {/* Controls */}
      {isStreaming && !error && (
        <div className="p-6 bg-black flex justify-center">
          <button
            onClick={capturePhoto}
            className="w-16 h-16 bg-white rounded-full border-4 border-gray-300 hover:border-gray-400 transition-colors"
          >
            <div className="w-full h-full bg-white rounded-full" />
          </button>
        </div>
      )}

      {/* Hidden canvas for capture */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  )
}

export default CameraCapture
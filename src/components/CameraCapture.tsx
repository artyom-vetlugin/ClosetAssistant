import { useRef, useState, useCallback, useEffect } from 'react'

interface CameraCaptureProps {
  onCapture: (file: File) => void
  onCancel: () => void
}

const CameraCapture = ({ onCapture, onCancel }: CameraCaptureProps) => {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [isStreaming, setIsStreaming] = useState(false)
  const [error, setError] = useState<string>('')

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
      setTimeout(() => {
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
      setError('Camera access failed: ' + err.message)
    }
  }, [])

  const stopCamera = useCallback(() => {
    console.log('🎥 NUCLEAR: Starting aggressive camera shutdown...')
    
    // Clear video element first
    if (videoRef.current) {
      console.log('🎥 NUCLEAR: Pausing and clearing video')
      videoRef.current.pause()
      videoRef.current.srcObject = null
      videoRef.current.load() // Force reload to clear buffer
      // Additional video cleanup
      videoRef.current.removeAttribute('src')
      videoRef.current.removeAttribute('srcObject')
    }
    
    if (streamRef.current) {
      console.log('🎥 NUCLEAR: Stream has', streamRef.current.getTracks().length, 'tracks')
      
      // Stop each track multiple times with different methods
      streamRef.current.getTracks().forEach((track, index) => {
        console.log(`🎥 NUCLEAR: Stopping track ${index}:`, track.label, 'State:', track.readyState)
        
        // Method 1: Standard stop
        track.stop()
        
        // Method 2: Disable then stop
        track.enabled = false
        track.stop()
        
        // Method 3: Clone and stop (sometimes helps)
        try {
          const clonedTrack = track.clone()
          clonedTrack.stop()
        } catch (e) {
          console.log('🎥 NUCLEAR: Could not clone track (this is OK)')
        }
        
        console.log(`🎥 NUCLEAR: Track ${index} final state:`, track.readyState)
      })
      
      streamRef.current = null
    }
    
    setIsStreaming(false)
    console.log('🎥 NUCLEAR: Basic cleanup complete, trying browser-level reset...')
    
    // Nuclear option: Try to request camera again to force release
    setTimeout(async () => {
      try {
        console.log('🎥 NUCLEAR: Requesting camera to force release...')
        const tempStream = await navigator.mediaDevices.getUserMedia({ 
          video: { width: 1, height: 1 } // Minimal request
        })
        console.log('🎥 NUCLEAR: Got temporary stream, immediately stopping...')
        tempStream.getTracks().forEach(track => {
          track.stop()
        })
        console.log('🎥 NUCLEAR: Temporary stream stopped - this should force camera release')
      } catch (e) {
        console.log('🎥 NUCLEAR: Could not get temporary stream (this might be OK):', e.message)
      }
    }, 100)
    
    // Double-check after longer delay
    setTimeout(() => {
      console.log('🎥 NUCLEAR: Final check - camera should be off now')
    }, 2000)
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
        onCapture(file)
        stopCamera()
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
    
    // Also stop camera when user leaves the page
    const handleBeforeUnload = () => {
      console.log('🎥 SIMPLE: Page unloading, emergency camera stop')
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => {
          track.enabled = false
          track.stop()
        })
      }
      // Try to get all active media streams and stop them
      navigator.mediaDevices.getUserMedia({ video: false, audio: false }).catch(() => {
        // This might help release camera resources
      })
    }
    
    // Also try to stop camera when visibility changes
    const handleVisibilityChange = () => {
      if (document.hidden) {
        console.log('🎥 SIMPLE: Page hidden, stopping camera')
        stopCamera()
      }
    }
    
    window.addEventListener('beforeunload', handleBeforeUnload)
    document.addEventListener('visibilitychange', handleVisibilityChange)
    
    // Cleanup on unmount
    return () => {
      console.log('🎥 SIMPLE: Component unmounting, AGGRESSIVE camera stop')
      window.removeEventListener('beforeunload', handleBeforeUnload)
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
      if (videoRef.current) {
        videoRef.current.pause()
        videoRef.current.srcObject = null
        videoRef.current.load()
      }
      
      stopCamera()
    }
  }, [startCamera, stopCamera])

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-center p-4 bg-black text-white">
        <button
          onClick={handleCancel}
          className="text-white hover:text-gray-300"
        >
          Cancel
        </button>
        <h2 className="text-lg font-semibold">Take Photo</h2>
        <button
          onClick={() => {
            console.log('🎥 MANUAL: User clicked manual stop')
            stopCamera()
          }}
          className="text-red-400 text-xs px-2 py-1 border border-red-400 rounded hover:bg-red-400 hover:text-black"
        >
          Stop Camera
        </button>
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
              Try Again
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
            <p>Starting camera...</p>
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
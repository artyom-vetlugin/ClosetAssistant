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
      console.log('Starting camera access...')
      
      // Check if getUserMedia is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera not supported in this browser')
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user', // Use front camera on laptops (better for testing)
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      })

      console.log('Camera stream obtained:', stream)

      if (videoRef.current) {
        const video = videoRef.current
        streamRef.current = stream
        
        console.log('Setting up video element...')
        
        // Wait for video to start playing
        const handleVideoReady = () => {
          console.log('Video is ready and playing')
          setIsStreaming(true)
        }
        
        // Set up event handlers BEFORE setting srcObject
        video.onloadedmetadata = () => {
          console.log('Video metadata loaded, readyState:', video.readyState)
          video.play().then(() => {
            console.log('Video play() succeeded')
            handleVideoReady()
          }).catch(err => {
            console.error('Error playing video:', err)
            // Force show video even if play fails
            handleVideoReady()
          })
        }
        
        video.oncanplay = () => {
          console.log('Video can start playing, readyState:', video.readyState)
          if (!isStreaming) {
            handleVideoReady()
          }
        }
        
        video.onplaying = () => {
          console.log('Video is now playing')
          if (!isStreaming) {
            handleVideoReady()
          }
        }
        
        video.onerror = (err) => {
          console.error('Video error:', err)
        }
        
        // Set video properties
        video.autoplay = true
        video.playsInline = true
        video.muted = true
        
        // Now set the stream - this should trigger the events
        console.log('Setting video srcObject...')
        video.srcObject = stream
        
        // Fallback timeout - force show after 1 second
        setTimeout(() => {
          console.log('Fallback timeout: current readyState:', video.readyState, 'isStreaming:', isStreaming)
          if (!isStreaming) {
            console.log('Forcing video display via timeout')
            handleVideoReady()
          }
        }, 1000)
      }
    } catch (err) {
      console.error('Error accessing camera:', err)
      let errorMessage = 'Unable to access camera. '
      
      if (err.name === 'NotAllowedError') {
        errorMessage += 'Please allow camera permissions in your browser.'
      } else if (err.name === 'NotFoundError') {
        errorMessage += 'No camera found on this device.'
      } else if (err.name === 'NotReadableError') {
        errorMessage += 'Camera is being used by another application.'
      } else {
        errorMessage += 'Please check your camera settings and permissions.'
      }
      
      setError(errorMessage)
    }
  }, [])

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
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
    
    // Cleanup on unmount
    return () => stopCamera()
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
        <div className="w-16"></div> {/* Spacer */}
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
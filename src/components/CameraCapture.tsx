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

      if (videoRef.current) {
        const video = videoRef.current
        streamRef.current = stream
        
        console.log('🎥 SIMPLE: Video element found:', videoRef.current)
        console.log('🎥 SIMPLE: Setting video srcObject directly...')
        video.srcObject = stream
        
        // Force show immediately - no waiting for events
        console.log('🎥 SIMPLE: Forcing video display immediately')
        setIsStreaming(true)
        
        console.log('🎥 SIMPLE: isStreaming state should now be true')
      } else {
        console.log('🎥 SIMPLE: ERROR - videoRef.current is null!')
      }
    } catch (err) {
      console.error('🎥 SIMPLE: Error accessing camera:', err)
      setError('Camera access failed: ' + err.message)
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
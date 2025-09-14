import React, { useState, useRef, useEffect, useCallback } from 'react';

interface CameraModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (file: File) => void;
}

const CameraModal: React.FC<CameraModalProps> = ({ isOpen, onClose, onCapture }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  }, [stream]);

  const startCamera = useCallback(async () => {
    stopCamera(); // Stop any existing stream
    setError(null);
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }, // Prefer rear camera
        audio: false,
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      if (err instanceof Error) {
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          setError('Camera permission was denied. Please allow camera access in your browser settings.');
        } else {
          setError(`Could not access the camera: ${err.message}`);
        }
      } else {
          setError('An unknown error occurred while accessing the camera.');
      }
    }
  }, [stopCamera]);

  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      stopCamera();
    }
    // Cleanup on component unmount
    return () => {
      stopCamera();
    };
  }, [isOpen, startCamera, stopCamera]);

  const handleCapture = () => {
    if (videoRef.current && canvasRef.current && stream) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        canvas.toBlob((blob) => {
          if (blob) {
            const capturedFile = new File([blob], `capture-${Date.now()}.jpg`, { type: 'image/jpeg' });
            onCapture(capturedFile);
          }
        }, 'image/jpeg', 0.95);
      }
    }
  };
  
  const handleModalClose = () => {
    stopCamera();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center"
      aria-modal="true"
      role="dialog"
    >
      <div className="relative w-full h-full max-w-4xl max-h-[90vh] flex flex-col items-center justify-center">
        <button
          onClick={handleModalClose}
          className="absolute top-2 right-2 z-10 text-white bg-black/50 rounded-full p-2 text-3xl leading-none"
          aria-label="Close camera"
        >
          &times;
        </button>
        
        {error ? (
          <div className="bg-red-900/50 border border-red-500/50 text-white p-6 rounded-2xl text-center">
            <h3 className="text-lg font-bold mb-2">Camera Error</h3>
            <p>{error}</p>
          </div>
        ) : (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className="w-full h-full object-contain rounded-2xl"
          />
        )}
        
        {!error && stream && (
          <div className="absolute bottom-6">
            <button
              onClick={handleCapture}
              className="w-20 h-20 rounded-full bg-white/30 border-4 border-white flex items-center justify-center backdrop-blur-sm"
              aria-label="Capture photo"
            >
              <div className="w-16 h-16 rounded-full bg-white"></div>
            </button>
          </div>
        )}
        <canvas ref={canvasRef} className="hidden" />
      </div>
    </div>
  );
};

export default CameraModal;

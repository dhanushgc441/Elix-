import React, { useState, useRef, useEffect, useCallback } from 'react';
import { analyzeVideoFrame } from './geminiService';

interface VideoCallModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const VideoCallModal: React.FC<VideoCallModalProps> = ({ isOpen, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const analysisIntervalRef = useRef<number | null>(null);
  
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiResponse, setAiResponse] = useState<string>('');
  const [isLoadingFrame, setIsLoadingFrame] = useState(false);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  }, [stream]);

  const startCamera = useCallback(async () => {
    stopCamera();
    setError(null);

    const tryStream = async (constraints: MediaStreamConstraints) => {
        return await navigator.mediaDevices.getUserMedia(constraints);
    };

    let mediaStream: MediaStream | null = null;
    try {
        // First, try for the user-facing (front) camera
        mediaStream = await tryStream({ video: { facingMode: 'user' }, audio: false });
    } catch (err) {
        console.warn("Could not get front camera, trying any available camera.", err);
        try {
            // If that fails, fall back to any available camera
            mediaStream = await tryStream({ video: true, audio: false });
        } catch (finalErr) {
            console.error("Error accessing any camera:", finalErr);
            if (finalErr instanceof Error) {
                if (finalErr.name === 'NotAllowedError' || finalErr.name === 'PermissionDeniedError') {
                    setError('Camera permission was denied. Please allow camera access in your browser settings.');
                } else {
                    setError(`Could not access the camera: ${finalErr.message}`);
                }
            } else {
                setError('An unknown error occurred while accessing the camera.');
            }
            return; // Exit if no camera is found
        }
    }

    if (mediaStream) {
        setStream(mediaStream);
        if (videoRef.current) {
            videoRef.current.srcObject = mediaStream;
        }
    }
  }, [stopCamera]);


  const stopAnalysis = useCallback(() => {
    if (analysisIntervalRef.current) {
      clearInterval(analysisIntervalRef.current);
      analysisIntervalRef.current = null;
    }
    setIsAnalyzing(false);
    setIsLoadingFrame(false);
  }, []);

  const startAnalysis = useCallback(() => {
    if (!videoRef.current || !canvasRef.current || !stream) return;
    setIsAnalyzing(true);
    setAiResponse('');

    analysisIntervalRef.current = window.setInterval(async () => {
        if (!videoRef.current || !canvasRef.current || isLoadingFrame) return;

        const video = videoRef.current;
        const canvas = canvasRef.current;
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const context = canvas.getContext('2d');

        if (context) {
            context.drawImage(video, 0, 0, canvas.width, canvas.height);
            const base64Frame = canvas.toDataURL('image/jpeg', 0.7).split(',')[1];
            
            if (base64Frame) {
                setIsLoadingFrame(true);
                try {
                    const response = await analyzeVideoFrame(base64Frame);
                    setAiResponse(response);
                } catch (apiError) {
                    console.error('API error during frame analysis', apiError);
                    setAiResponse('Sorry, I had trouble analyzing that.');
                } finally {
                    setIsLoadingFrame(false);
                }
            }
        }
    }, 2500); // Analyze roughly every 2.5 seconds
  }, [stream, isLoadingFrame]);


  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      stopAnalysis();
      stopCamera();
    }
    return () => {
        stopAnalysis();
        stopCamera();
    };
  }, [isOpen, startCamera, stopCamera, stopAnalysis]);

  const handleModalClose = () => {
    stopAnalysis();
    stopCamera();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center">
      <div className="relative w-full h-full max-w-4xl max-h-[90vh] flex flex-col items-center justify-center">
        <button
          onClick={handleModalClose}
          className="absolute top-2 right-2 z-20 text-white bg-black/50 rounded-full p-2 text-3xl leading-none"
          aria-label="Close video call"
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
          <div className="absolute bottom-6 z-10 flex flex-col items-center gap-4">
            <div className={`transition-opacity duration-300 ${isAnalyzing ? 'opacity-100' : 'opacity-0'}`}>
                <p className="bg-black/60 backdrop-blur-md text-white px-4 py-2 rounded-full text-center max-w-lg">
                    {isLoadingFrame ? '...' : aiResponse}
                </p>
            </div>
            <button
              onClick={isAnalyzing ? stopAnalysis : startAnalysis}
              className="px-6 py-3 rounded-full font-semibold text-white transition-colors duration-200 border-2 border-white/50"
              style={{
                backgroundColor: isAnalyzing ? 'rgba(239, 68, 68, 0.7)' : 'rgba(34, 197, 94, 0.7)',
                backdropFilter: 'blur(10px)',
              }}
            >
              {isAnalyzing ? 'Stop Analysis' : 'Start Analysis'}
            </button>
          </div>
        )}
        <canvas ref={canvasRef} className="hidden" />
      </div>
    </div>
  );
};

export default VideoCallModal;
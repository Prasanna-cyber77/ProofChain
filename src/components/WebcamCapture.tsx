import React, { useRef, useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Camera, RefreshCw, Upload, CheckCircle2, AlertCircle, Crosshair, Terminal, Sparkles } from 'lucide-react';
import { analyzeVideoFrame, captureStillFromVideo, ClientFaceFeedback } from '../lib/faceClient';
import { checkFace } from '../lib/api';
import { cyberAudio } from '../lib/cyberAudio';

interface WebcamCaptureProps {
  onCapture: (imageDataUrl: string) => void;
  initialImage?: string | null;
  onClear?: () => void;
}

export const WebcamCapture: React.FC<WebcamCaptureProps> = ({
  onCapture,
  initialImage,
  onClear
}) => {
  const [useWebcam, setUseWebcam] = useState(true);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isFaceDetected, setIsFaceDetected] = useState(false);
  const [feedback, setFeedback] = useState<ClientFaceFeedback | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(initialImage || null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [coordTelemetry, setCoordTelemetry] = useState({ x: 320, y: 240, entropy: 0.89 });

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Initialize Webcam
  const startCamera = useCallback(async () => {
    try {
      setCameraError(null);
      if (stream) {
        stream.getTracks().forEach((t) => t.stop());
      }
      const media = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user'
        },
        audio: false
      });
      setStream(media);
      if (videoRef.current) {
        videoRef.current.srcObject = media;
        videoRef.current.play().catch(() => {});
      }
      cyberAudio.playScanHum();
    } catch (err: any) {
      console.warn('Webcam stream request failed:', err);
      setCameraError('CAMERA_DEVICE_UNAVAILABLE: Inject static image payload below.');
      setUseWebcam(false);
    }
  }, [stream]);

  useEffect(() => {
    if (useWebcam && !capturedImage) {
      startCamera();
    }
    return () => {
      if (stream) {
        stream.getTracks().forEach((t) => t.stop());
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [useWebcam, capturedImage]);

  // Real-time client-side frame analysis loop
  useEffect(() => {
    if (!useWebcam || capturedImage || !videoRef.current || !canvasRef.current) return;

    let isSubscribed = true;
    const loop = () => {
      if (!isSubscribed) return;
      if (videoRef.current && canvasRef.current && videoRef.current.readyState >= 2) {
        const result = analyzeVideoFrame(videoRef.current, canvasRef.current);
        setFeedback(result);
        const detected = result.hasSufficientContrast && result.isCentric;
        setIsFaceDetected(detected);

        setCoordTelemetry({
          x: 320 + Math.floor((Math.random() - 0.5) * 6),
          y: 240 + Math.floor((Math.random() - 0.5) * 6),
          entropy: Number((0.85 + Math.random() * 0.1).toFixed(3))
        });
      }
      animationFrameRef.current = requestAnimationFrame(loop);
    };

    animationFrameRef.current = requestAnimationFrame(loop);

    return () => {
      isSubscribed = false;
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [useWebcam, capturedImage]);

  // Snap photo
  const handleSnap = async () => {
    if (!videoRef.current) return;
    setIsProcessing(true);
    cyberAudio.playClick();

    try {
      const stillBase64 = captureStillFromVideo(videoRef.current);
      await checkFace(stillBase64);
      setCapturedImage(stillBase64);
      onCapture(stillBase64);
      cyberAudio.playSuccess();
    } catch (err: any) {
      console.error('Snap fallback:', err);
      if (videoRef.current) {
        const fallbackStill = captureStillFromVideo(videoRef.current);
        setCapturedImage(fallbackStill);
        onCapture(fallbackStill);
        cyberAudio.playSuccess();
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFile = (file: File) => {
    if (!file.type.startsWith('image/')) return;
    cyberAudio.playBlip(700, 0.05);
    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64 = e.target?.result as string;
      setCapturedImage(base64);
      onCapture(base64);
      cyberAudio.playSuccess();
    };
    reader.readAsDataURL(file);
  };

  const handleRetake = () => {
    cyberAudio.playClick();
    setCapturedImage(null);
    if (onClear) onClear();
    if (useWebcam) {
      startCamera();
    }
  };

  return (
    <div className="flex flex-col items-center justify-center w-full max-w-lg mx-auto font-mono text-xs" id="webcam-capture-module">
      <canvas ref={canvasRef} className="hidden" />

      {/* High-Tech Tactical HUD Frame */}
      <div className="relative w-72 h-72 sm:w-80 sm:h-80 my-2 bg-[#05070a] border border-emerald-500/40 p-2 corner-brackets shadow-[0_0_20px_rgba(34,197,94,0.15)]">
        {/* HUD Top Bar Overlay */}
        <div className="absolute top-3 left-3 right-3 z-30 flex items-center justify-between text-[10px] text-emerald-400 bg-slate-950/80 px-2 py-1 border border-emerald-500/20 backdrop-blur-sm">
          <span className="flex items-center gap-1">
            <span className={`w-1.5 h-1.5 rounded-full ${isFaceDetected || capturedImage ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
            {capturedImage ? 'IMAGE_LOCKED' : isFaceDetected ? 'FACE_ACQUIRED' : 'SCANNING_OPTICAL_FIELD'}
          </span>
          <span className="font-mono text-[9px] text-slate-400">
            X:{coordTelemetry.x} Y:{coordTelemetry.y}
          </span>
        </div>

        {/* HUD Reticle Target Guide */}
        {!capturedImage && useWebcam && (
          <div className="absolute inset-8 z-20 pointer-events-none flex items-center justify-center">
            {/* Center Crosshair */}
            <div className="w-40 h-48 border border-emerald-400/40 relative rounded-sm">
              {/* Corner ticks */}
              <span className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-emerald-400" />
              <span className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-emerald-400" />
              <span className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-emerald-400" />
              <span className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-emerald-400" />
              
              {/* Center point */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-emerald-400/60 rounded-full" />
              
              {/* Simulated 68-point facial mesh wireframe dots */}
              <div className="absolute top-12 left-8 w-1 h-1 bg-cyan-400/80 rounded-full" />
              <div className="absolute top-12 right-8 w-1 h-1 bg-cyan-400/80 rounded-full" />
              <div className="absolute top-24 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-emerald-400/80 rounded-full" />
              <div className="absolute top-32 left-10 right-10 h-0.5 border-b border-dotted border-cyan-400/60" />
            </div>
          </div>
        )}

        {/* Video / Captured Image Container */}
        <div className="w-full h-full relative overflow-hidden bg-slate-950 border border-slate-800">
          {capturedImage ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full h-full relative">
              <img
                src={capturedImage}
                alt="Probe Selfie Payload"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-emerald-500/10 pointer-events-none" />
            </motion.div>
          ) : useWebcam ? (
            <div className="w-full h-full relative">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover transform -scale-x-100"
              />

              {/* Sweeping Laser Line */}
              <motion.div
                className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_10px_#22c55e] z-10"
                animate={{ top: ['5%', '95%', '5'] }}
                transition={{ duration: 1.8, repeat: Infinity, ease: 'linear' }}
              />
            </div>
          ) : (
            <div
              onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
              onDragLeave={() => setDragActive(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragActive(false);
                if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
              }}
              className={`w-full h-full flex flex-col items-center justify-center p-4 text-center cursor-pointer transition-colors ${
                dragActive ? 'bg-emerald-950/40 text-emerald-300' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Upload className="w-7 h-7 mb-2 text-emerald-400" />
              <span className="font-bold text-xs">[ DRAG_DROP_SELFIE_PAYLOAD ]</span>
              <span className="text-[10px] text-slate-500 mt-1">PNG, JPG, WEBP &lt; 10MB</span>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
            </div>
          )}
        </div>

        {/* HUD Bottom Status Bar */}
        <div className="absolute bottom-3 left-3 right-3 z-30 flex items-center justify-between text-[9px] text-slate-400 bg-slate-950/80 px-2 py-0.5 border border-slate-800">
          <span>ENTROPY: {coordTelemetry.entropy}</span>
          <span className="text-emerald-400 font-semibold">128-D READY</span>
        </div>
      </div>

      {/* Camera Error Message */}
      {cameraError && (
        <div className="w-full max-w-sm my-2 p-2 bg-amber-950/40 border border-amber-800/60 text-amber-300 text-[11px] flex items-center gap-2">
          <AlertCircle className="w-3.5 h-3.5 shrink-0 text-amber-400" />
          <span>{cameraError}</span>
        </div>
      )}

      {/* Control Buttons */}
      <div className="flex items-center gap-2.5 mt-3">
        {capturedImage ? (
          <button
            type="button"
            onClick={handleRetake}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs font-semibold border border-slate-700 flex items-center gap-1.5 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>[ RETAKE_SELFIE ]</span>
          </button>
        ) : (
          <>
            {useWebcam && (
              <button
                type="button"
                onClick={handleSnap}
                disabled={isProcessing}
                className="px-6 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-2 border border-emerald-400 shadow-[0_0_15px_rgba(34,197,94,0.4)] transition-all active:scale-95 disabled:opacity-50"
              >
                <Camera className="w-3.5 h-3.5" />
                <span>{isProcessing ? '[ EXTRACTING_VECTORS... ]' : '[ CAPTURE_PROBE ]'}</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                cyberAudio.playClick();
                setUseWebcam(!useWebcam);
                setCameraError(null);
              }}
              className="px-3 py-2 bg-slate-950 hover:bg-slate-900 text-slate-400 hover:text-slate-200 text-xs border border-slate-800 flex items-center gap-1.5 transition-colors"
            >
              {useWebcam ? (
                <>
                  <Upload className="w-3.5 h-3.5" />
                  <span>[ UPLOAD_FILE ]</span>
                </>
              ) : (
                <>
                  <Camera className="w-3.5 h-3.5" />
                  <span>[ WEBCAM_STREAM ]</span>
                </>
              )}
            </button>
          </>
        )}
      </div>
    </div>
  );
};

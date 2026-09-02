import React, { useRef, useState, useEffect } from 'react';
import { Camera, X, RefreshCw, Check, AlertTriangle, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface WebcamModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (base64DataUrl: string) => void;
}

export const WebcamModal: React.FC<WebcamModalProps> = ({ isOpen, onClose, onCapture }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');

  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      stopCamera();
      setCapturedPhoto(null);
      setErrorMsg(null);
    }
    return () => {
      stopCamera();
    };
  }, [isOpen, facingMode]);

  const startCamera = async () => {
    stopCamera();
    setErrorMsg(null);
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err: any) {
      setErrorMsg(
        'Camera permission was denied or camera device is unavailable. Please check browser permissions.'
      );
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  };

  const handleTriggerCountdown = () => {
    setCountdown(3);
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(interval);
          takeSnapshot();
          return null;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const takeSnapshot = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // If front camera, flip horizontally for natural mirror image
    if (facingMode === 'user') {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
    setCapturedPhoto(dataUrl);
  };

  const handleConfirm = () => {
    if (capturedPhoto) {
      onCapture(capturedPhoto);
      onClose();
    }
  };

  const handleRetake = () => {
    setCapturedPhoto(null);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl space-y-4 p-5"
        >
          {/* Modal Header */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center space-x-2">
              <Camera className="w-5 h-5 text-cyan-400" />
              <h3 className="text-sm font-semibold text-white">Live Selfie Capture</h3>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Camera Viewport / Preview */}
          <div className="relative aspect-[4/3] bg-slate-950 rounded-xl overflow-hidden flex items-center justify-center border border-slate-800">
            {errorMsg ? (
              <div className="p-6 text-center text-red-300 text-xs space-y-2">
                <AlertTriangle className="w-8 h-8 mx-auto text-red-400" />
                <p>{errorMsg}</p>
                <button
                  type="button"
                  onClick={startCamera}
                  className="px-3 py-1.5 rounded-lg bg-red-900/60 border border-red-700 text-white text-xs"
                >
                  Retry Camera
                </button>
              </div>
            ) : capturedPhoto ? (
              <img src={capturedPhoto} alt="Captured Selfie" className="w-full h-full object-cover" />
            ) : (
              <>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`w-full h-full object-cover ${facingMode === 'user' ? '-scale-x-100' : ''}`}
                />
                {/* Oval Face Guide */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-48 h-64 border-2 border-dashed border-cyan-400/80 rounded-[50%] shadow-[0_0_20px_rgba(6,182,212,0.2)] flex items-center justify-center">
                    <span className="text-[10px] font-mono text-cyan-300 bg-slate-950/80 px-2 py-0.5 rounded">
                      Align Face in Oval
                    </span>
                  </div>
                </div>

                {/* Countdown Overlay */}
                {countdown !== null && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                    <span className="text-6xl font-bold font-mono text-cyan-400 animate-ping">
                      {countdown}
                    </span>
                  </div>
                )}
              </>
            )}

            <canvas ref={canvasRef} className="hidden" />
          </div>

          {/* Controls Footer */}
          <div className="flex items-center justify-between pt-2">
            {!capturedPhoto ? (
              <>
                <button
                  type="button"
                  onClick={() => setFacingMode((prev) => (prev === 'user' ? 'environment' : 'user'))}
                  className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 text-xs hover:bg-slate-800 transition"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Flip Camera</span>
                </button>

                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={handleTriggerCountdown}
                    disabled={countdown !== null || Boolean(errorMsg)}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition"
                  >
                    3s Timer
                  </button>
                  <button
                    type="button"
                    onClick={takeSnapshot}
                    disabled={Boolean(errorMsg)}
                    className="flex items-center space-x-1.5 px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow-[0_0_15px_rgba(6,182,212,0.3)] transition"
                  >
                    <Camera className="w-4 h-4" />
                    <span>Capture Photo</span>
                  </button>
                </div>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={handleRetake}
                  className="px-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 text-xs hover:bg-slate-800 transition"
                >
                  Retake
                </button>

                <button
                  type="button"
                  onClick={handleConfirm}
                  className="flex items-center space-x-1.5 px-6 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow transition"
                >
                  <Check className="w-4 h-4" />
                  <span>Use This Selfie</span>
                </button>
              </>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

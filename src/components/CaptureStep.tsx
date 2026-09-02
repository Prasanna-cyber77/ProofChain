import React from 'react';
import { motion } from 'motion/react';
import { ArrowRight, ArrowLeft, Camera, ShieldCheck, Terminal, Crosshair } from 'lucide-react';
import { WebcamCapture } from './WebcamCapture';
import { cyberAudio } from '../lib/cyberAudio';
import { ScrambleText } from './ScrambleText';

interface CaptureStepProps {
  selfieImage: string | null;
  onCapture: (imageData: string) => void;
  onNext: () => void;
  onBack: () => void;
}

export const CaptureStep: React.FC<CaptureStepProps> = ({
  selfieImage,
  onCapture,
  onNext,
  onBack
}) => {
  return (
    <div className="w-full max-w-xl mx-auto px-3 py-4 space-y-5 font-mono" id="capture-step-view">
      {/* Header Info */}
      <div className="bg-[#080a0f] border border-emerald-500/30 p-4 corner-brackets">
        <div className="flex items-center justify-between text-xs text-emerald-400 border-b border-emerald-500/20 pb-2 mb-2">
          <span className="font-bold uppercase flex items-center gap-1.5">
            <Crosshair className="w-3.5 h-3.5 animate-spin" />
            <ScrambleText text="STAGE_01 // LIVE_OPTICAL_PROBE" />
          </span>
          <span className="text-slate-500 text-[10px]">FPS: 30.0 | RESOLUTION: 640x480</span>
        </div>
        <p className="text-xs text-slate-300">
          Center face in optical reticle. Real-time landmark detector analyzes facial contrast and spatial entropy before extracting 128-d vector embeddings.
        </p>
      </div>

      {/* Cyber Camera / HUD Scanner Module */}
      <WebcamCapture
        onCapture={onCapture}
        initialImage={selfieImage}
      />

      {/* Navigation Controls */}
      <div className="flex items-center justify-between pt-1">
        <button
          type="button"
          onClick={() => {
            cyberAudio.playClick();
            onBack();
          }}
          className="px-4 py-2.5 bg-slate-950 hover:bg-slate-900 text-slate-400 hover:text-slate-200 text-xs font-semibold border border-slate-800 flex items-center gap-1.5 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>[ BACK ]</span>
        </button>

        <button
          type="button"
          onClick={() => {
            cyberAudio.playSuccess();
            onNext();
          }}
          disabled={!selfieImage}
          className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-2 border border-emerald-400 shadow-[0_0_15px_rgba(34,197,94,0.35)] transition-all active:scale-95 disabled:opacity-30 disabled:pointer-events-none"
          id="btn-continue-link-post"
        >
          <span>[ PROCEED_TO_TARGET_MEDIA ]</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

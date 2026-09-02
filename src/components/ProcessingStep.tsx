import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Cpu, Zap, Sparkles, Terminal, Hash, Crosshair } from 'lucide-react';
import { runBiometricMatch, MatchResponse } from '../lib/api';
import { cyberAudio } from '../lib/cyberAudio';
import { ScrambleText } from './ScrambleText';

interface ProcessingStepProps {
  selfieImage: string;
  postUrl: string;
  postImageUrl?: string;
  onMatchComplete: (result: MatchResponse) => void;
  onError: (errorMsg: string) => void;
}

export const ProcessingStep: React.FC<ProcessingStepProps> = ({
  selfieImage,
  postUrl,
  postImageUrl,
  onMatchComplete,
  onError
}) => {
  const [currentStageIndex, setCurrentStageIndex] = useState(0);
  const [vectorDump, setVectorDump] = useState<string[]>([]);

  const stages = [
    { code: 'ENTROPY_PASS', desc: 'Analyzing 68-landmark spatial entropy matrix' },
    { code: 'VEC128_EMBED',  desc: 'Synthesizing 128-d L2 normalized gradient vectors' },
    { code: 'COSINE_DIST',   desc: 'Calculating Euclidean distance dot-product similarity' },
    { code: 'KECCAK_ROOT',   desc: 'Deriving canonical bytes32 EVM root hash' }
  ];

  useEffect(() => {
    cyberAudio.playScanHum();

    // Stage progression
    const stageTimer = setInterval(() => {
      setCurrentStageIndex((prev) => (prev < stages.length - 1 ? prev + 1 : prev));
      cyberAudio.playBlip(600 + Math.random() * 400, 0.03);
    }, 400);

    // Vector matrix stream simulation
    const vectorTimer = setInterval(() => {
      const hex = Array.from({ length: 8 }, () => Math.floor(Math.random() * 256).toString(16).padStart(2, '0')).join(' ');
      setVectorDump((prev) => [hex, ...prev.slice(0, 4)]);
    }, 120);

    let isMounted = true;

    async function execute() {
      try {
        const result = await runBiometricMatch(selfieImage, postUrl, postImageUrl, 75.0);
        if (!isMounted) return;

        setTimeout(() => {
          if (isMounted) {
            cyberAudio.playSuccess();
            onMatchComplete(result);
          }
        }, 900);
      } catch (err: any) {
        if (!isMounted) return;
        cyberAudio.playAlert();
        onError(err.message || 'VECTOR_MATCH_EXECUTION_FAILED');
      }
    }

    execute();

    return () => {
      isMounted = false;
      clearInterval(stageTimer);
      clearInterval(vectorTimer);
    };
  }, []);

  return (
    <div className="w-full max-w-2xl mx-auto px-3 py-6 space-y-6 font-mono text-xs text-center" id="processing-step-view">
      {/* Title Bar */}
      <div className="bg-[#080a0f] border border-cyan-500/30 p-3 corner-brackets inline-block max-w-md mx-auto">
        <div className="flex items-center justify-center gap-2 text-cyan-300 font-bold">
          <Cpu className="w-4 h-4 animate-spin text-cyan-400" />
          <ScrambleText text="COMPUTING_128D_BIOMETRIC_COSINE_SIMILARITY" />
        </div>
      </div>

      {/* Split Screen Cyber Radar Matcher */}
      <div className="relative flex items-center justify-between gap-4 max-w-lg mx-auto py-2">
        {/* Left: Probe Selfie Frame */}
        <div className="flex flex-col items-center space-y-2 relative">
          <div className="w-28 h-28 sm:w-32 sm:h-32 bg-slate-950 border-2 border-cyan-400 p-0.5 relative overflow-hidden shadow-[0_0_20px_rgba(6,182,212,0.3)]">
            <img
              src={selfieImage}
              alt="Probe Selfie"
              className="w-full h-full object-cover"
            />
            {/* Corner Markers */}
            <span className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-cyan-300" />
            <span className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-cyan-300" />
            <motion.div
              className="absolute inset-0 bg-cyan-400/10 pointer-events-none"
              animate={{ opacity: [0.1, 0.4, 0.1] }}
              transition={{ duration: 1.2, repeat: Infinity }}
            />
          </div>
          <span className="text-[11px] font-bold text-cyan-300">[ PROBE_01: SELFIE ]</span>
        </div>

        {/* Center: Laser Matrix Bus */}
        <div className="flex-1 relative flex flex-col items-center justify-center px-2">
          {/* Laser beam */}
          <div className="w-full h-1 bg-slate-900 relative overflow-hidden border border-slate-700">
            <motion.div
              className="absolute top-0 bottom-0 w-1/3 bg-gradient-to-r from-transparent via-cyan-400 to-emerald-400 shadow-[0_0_10px_#10b981]"
              animate={{ left: ['-30%', '100%'] }}
              transition={{ duration: 0.9, repeat: Infinity, ease: 'linear' }}
            />
          </div>

          <div className="my-2 px-2 py-1 bg-slate-950 border border-slate-700 text-[10px] text-emerald-400 font-bold shadow-md">
            COSINE Δ
          </div>

          <span className="text-[9px] text-slate-500 font-mono tracking-tighter">
            L2_NORM_DOT
          </span>
        </div>

        {/* Right: Target Post Asset Frame */}
        <div className="flex flex-col items-center space-y-2 relative">
          <div className="w-28 h-28 sm:w-32 sm:h-32 bg-slate-950 border-2 border-emerald-400 p-0.5 relative overflow-hidden shadow-[0_0_20px_rgba(16,185,129,0.3)]">
            <img
              src={postImageUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop&q=80'}
              alt="Target Post Asset"
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
            {/* Corner Markers */}
            <span className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-emerald-300" />
            <span className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-emerald-300" />
            <motion.div
              className="absolute inset-0 bg-emerald-400/10 pointer-events-none"
              animate={{ opacity: [0.1, 0.4, 0.1] }}
              transition={{ duration: 1.2, repeat: Infinity, delay: 0.4 }}
            />
          </div>
          <span className="text-[11px] font-bold text-emerald-300">[ TARGET_02: OG_POST ]</span>
        </div>
      </div>

      {/* Real-Time Processing Console & Hex Stream */}
      <div className="max-w-md mx-auto bg-[#080a0f] border border-slate-800 p-3 space-y-2 text-left">
        <div className="flex items-center justify-between text-[11px] text-emerald-400 border-b border-slate-800 pb-1">
          <span className="font-bold flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 bg-emerald-400 animate-ping" />
            STAGE: {stages[currentStageIndex].code}
          </span>
          <span className="text-slate-500 font-mono">[{currentStageIndex + 1}/4]</span>
        </div>

        <p className="text-[11px] text-slate-300 font-mono">
          &gt; {stages[currentStageIndex].desc}...
        </p>

        {/* Streaming Hex Values */}
        <div className="p-2 bg-slate-950 border border-slate-800/80 font-mono text-[10px] text-slate-500 space-y-0.5">
          {vectorDump.map((v, i) => (
            <div key={i} className="flex items-center justify-between">
              <span className="text-slate-600">0x{(i * 16).toString(16).padStart(4, '0')}</span>
              <span className="text-cyan-400/80">{v}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

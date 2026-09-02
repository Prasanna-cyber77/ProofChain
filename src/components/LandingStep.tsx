import React from 'react';
import { motion } from 'motion/react';
import { Terminal, Shield, ArrowRight, Zap, Database, Lock, Cpu, Play } from 'lucide-react';
import { cyberAudio } from '../lib/cyberAudio';
import { ScrambleText } from './ScrambleText';
import { DEMO_PRESETS } from '../server/services/postFetchService';

interface LandingStepProps {
  onStart: () => void;
  onSelectPreset: (presetKey: string) => void;
  onOpenVerify: () => void;
}

export const LandingStep: React.FC<LandingStepProps> = ({
  onStart,
  onSelectPreset,
  onOpenVerify
}) => {
  const presets = [
    {
      key: 'alex-chen',
      name: 'ALEX_CHEN',
      handle: '@alexchen_web3',
      platform: 'X/TWITTER',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      desc: 'Mainnet announcement media payload'
    },
    {
      key: 'elena-rostova',
      name: 'ELENA_ROSTOVA',
      handle: 'Elena Rostova, PhD',
      platform: 'LINKEDIN',
      avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
      desc: 'Keynote presentation OpenGraph asset'
    },
    {
      key: 'marcus-vance',
      name: 'MARCUS_VANCE',
      handle: 'Marcus Vance',
      platform: 'MEDIUM_PUB',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      desc: 'Decentralized identity architecture blog'
    }
  ];

  const handleInit = () => {
    cyberAudio.playSuccess();
    onStart();
  };

  const handlePreset = (key: string) => {
    cyberAudio.playScanHum();
    onSelectPreset(key);
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-3 py-6 space-y-8 font-mono" id="landing-hero-view">
      {/* Hacker Command Terminal Box */}
      <div className="bg-[#080a0f] border border-emerald-500/30 rounded-none p-5 sm:p-7 relative corner-brackets shadow-[0_0_30px_rgba(34,197,94,0.08)]">
        {/* Terminal Title Bar */}
        <div className="flex items-center justify-between border-b border-emerald-500/20 pb-3 mb-6 text-xs text-emerald-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-emerald-400 animate-ping" />
            <span className="font-bold tracking-widest uppercase">
              <ScrambleText text="TERMINAL://PROOFCHAIN_NOTARY_DAEMON" />
            </span>
          </div>
          <span className="text-slate-500 text-[11px]">SYS_MODE: STANDALONE_EVM</span>
        </div>

        {/* ASCII / Cyberpunk Headline */}
        <div className="space-y-3 mb-8">
          <div className="text-xs text-emerald-400/80 font-bold uppercase tracking-widest flex items-center gap-2">
            <span className="text-cyan-400">&gt;&gt;</span>
            <span>SELF-SOVEREIGN BIOMETRIC ATTESTATION PROTOCOL</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-100 tracking-tight leading-tight">
            Cryptographic Biometric Proof <br className="hidden sm:inline" />
            <span className="text-emerald-400 text-glow-green">&amp; Social Origin Notary</span>
          </h1>

          <p className="text-xs sm:text-sm text-slate-400 max-w-2xl leading-relaxed">
            Extracts 128-dimensional facial vectors from your live camera, matches against published social media OpenGraph assets, and mints an immutable Keccak-256 root on Polygon Amoy.
          </p>
        </div>

        {/* Primary Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
          <button
            type="button"
            onClick={handleInit}
            className="w-full sm:w-auto px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 border border-emerald-400 transition-all shadow-[0_0_20px_rgba(34,197,94,0.4)] active:scale-95 group"
            id="btn-start-verification"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>[ INITIALIZE_NOTARY_SESSION ]</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </button>

          <button
            type="button"
            onClick={() => {
              cyberAudio.playClick();
              onOpenVerify();
            }}
            className="w-full sm:w-auto px-5 py-3 bg-slate-950 hover:bg-slate-900 border border-slate-700 hover:border-cyan-400 text-cyan-300 font-semibold text-xs flex items-center justify-center gap-2 transition-all active:scale-95"
            id="btn-open-verifier"
          >
            <Shield className="w-3.5 h-3.5 text-cyan-400" />
            <span>[ AUDIT_EXISTING_PROOF ]</span>
          </button>
        </div>
      </div>

      {/* Cyber Payload Injector Table */}
      <div className="bg-[#080a0f] border border-slate-800 p-4 space-y-3">
        <div className="flex items-center justify-between text-xs text-slate-400 border-b border-slate-800/80 pb-2">
          <span className="text-emerald-400 font-bold uppercase flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-yellow-400" />
            FAST_PAYLOAD_INJECTION (1-CLICK TEST VECTORS)
          </span>
          <span className="text-[10px] text-slate-500">READY_FOR_EXECUTION</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          {presets.map((p) => (
            <button
              key={p.key}
              type="button"
              onClick={() => handlePreset(p.key)}
              className="p-3 bg-slate-950 border border-slate-800 hover:border-emerald-400/80 text-left transition-all group flex items-center gap-3 active:scale-98 relative overflow-hidden"
            >
              <img
                src={p.avatar}
                alt={p.name}
                className="w-9 h-9 object-cover border border-slate-700 group-hover:border-emerald-400"
                referrerPolicy="no-referrer"
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-bold text-slate-200 group-hover:text-emerald-300">{p.name}</span>
                  <span className="text-[9px] text-slate-500 font-mono">{p.platform}</span>
                </div>
                <p className="text-[10px] text-slate-400 truncate mt-0.5">{p.desc}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Protocol Specifications Telemetry Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
        <div className="p-3 bg-[#080a0f] border border-slate-800/80 space-y-1">
          <span className="text-[10px] text-slate-500 block uppercase">EVM_NOTARY_CONTRACT</span>
          <p className="text-slate-200 font-bold text-xs truncate">0x98E237C567A3...Db2d1a</p>
          <span className="text-[10px] text-emerald-400 font-mono">Chain ID: 80002 (Polygon Amoy)</span>
        </div>

        <div className="p-3 bg-[#080a0f] border border-slate-800/80 space-y-1">
          <span className="text-[10px] text-slate-500 block uppercase">VECTOR_ENGINE</span>
          <p className="text-slate-200 font-bold text-xs">128-d Cosine Metric</p>
          <span className="text-[10px] text-cyan-400 font-mono">L2 Normalized Euclidean Dist</span>
        </div>

        <div className="p-3 bg-[#080a0f] border border-slate-800/80 space-y-1">
          <span className="text-[10px] text-slate-500 block uppercase">DATA_PRIVACY_TIER</span>
          <p className="text-slate-200 font-bold text-xs">Zero Raw Bytes On-Chain</p>
          <span className="text-[10px] text-purple-400 font-mono">Keccak-256 Proof Root Only</span>
        </div>
      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { ShieldCheck, Database, Terminal, Gauge, Volume2, VolumeX, Cpu, Activity } from 'lucide-react';
import { cyberAudio } from '../lib/cyberAudio';
import { ScrambleText } from './ScrambleText';

interface HeaderProps {
  activeView: 'app' | 'verify' | 'contract' | 'terminal' | 'benchmark';
  onNavigate: (view: 'app' | 'verify' | 'contract' | 'terminal' | 'benchmark') => void;
}

export const Header: React.FC<HeaderProps> = ({ activeView, onNavigate }) => {
  const [sfxEnabled, setSfxEnabled] = useState(true);
  const [blockHeight, setBlockHeight] = useState(14892010);

  useEffect(() => {
    const timer = setInterval(() => {
      setBlockHeight((prev) => prev + Math.floor(Math.random() * 2));
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  const toggleSfx = () => {
    const next = !sfxEnabled;
    setSfxEnabled(next);
    cyberAudio.enabled = next;
    if (next) cyberAudio.playBlip(900, 0.05);
  };

  const handleNav = (view: 'app' | 'verify' | 'contract' | 'terminal' | 'benchmark') => {
    cyberAudio.playClick();
    onNavigate(view);
  };

  return (
    <header className="w-full border-b border-emerald-500/20 bg-[#050608]/95 backdrop-blur-md sticky top-0 z-50 font-mono text-xs select-none">
      <div className="max-w-6xl mx-auto px-3 sm:px-4 h-14 flex items-center justify-between">
        {/* Left: Brand / Terminal ID */}
        <button
          type="button"
          onClick={() => handleNav('app')}
          className="flex items-center gap-2 text-left group focus:outline-none"
        >
          <div className="w-7 h-7 bg-emerald-950/60 border border-emerald-500/50 flex items-center justify-center text-emerald-400 group-hover:border-emerald-400 transition-colors shadow-[0_0_10px_rgba(34,197,94,0.3)]">
            <span className="font-bold text-xs tracking-tighter">0xP</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-100 tracking-wider text-sm">
                PROOFCHAIN<span className="text-emerald-400">://</span>CORE
              </span>
              <span className="text-[10px] px-1 py-0.5 bg-emerald-950 border border-emerald-500/40 text-emerald-400 font-bold">
                v2.4.0
              </span>
            </div>
          </div>
        </button>

        {/* Center: System Telemetry (Desktop) */}
        <div className="hidden lg:flex items-center gap-4 text-[11px] text-slate-400 border-x border-slate-800/80 px-4">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-slate-500">NET:</span>
            <span className="text-emerald-400 font-semibold">POLYGON_AMOY [80002]</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500">BLOCK:</span>
            <span className="text-slate-300 font-mono">#{blockHeight}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500">STATE:</span>
            <span className="text-cyan-400 font-bold">ARMED</span>
          </div>
        </div>

        {/* Right: Hacker Navigation Buttons */}
        <div className="flex items-center gap-1 sm:gap-1.5">
          <button
            type="button"
            onClick={() => handleNav('app')}
            className={`px-2.5 py-1.5 border transition-all ${
              activeView === 'app'
                ? 'bg-emerald-950/80 border-emerald-400 text-emerald-300 shadow-[0_0_10px_rgba(34,197,94,0.3)]'
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
            }`}
          >
            [01_NOTARIZE]
          </button>

          <button
            type="button"
            onClick={() => handleNav('verify')}
            className={`px-2.5 py-1.5 border transition-all ${
              activeView === 'verify'
                ? 'bg-cyan-950/80 border-cyan-400 text-cyan-300 shadow-[0_0_10px_rgba(6,182,212,0.3)]'
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
            }`}
          >
            [02_AUDIT]
          </button>

          <button
            type="button"
            onClick={() => handleNav('contract')}
            className={`px-2.5 py-1.5 border hidden md:inline-flex transition-all ${
              activeView === 'contract'
                ? 'bg-purple-950/80 border-purple-400 text-purple-300 shadow-[0_0_10px_rgba(168,85,247,0.3)]'
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
            }`}
          >
            [03_CONTRACT]
          </button>

          <button
            type="button"
            onClick={() => handleNav('terminal')}
            className={`p-1.5 border transition-all ${
              activeView === 'terminal'
                ? 'bg-slate-900 border-cyan-400 text-cyan-300'
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
            title="Real-Time Terminal"
          >
            <Terminal className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={() => handleNav('benchmark')}
            className={`p-1.5 border transition-all ${
              activeView === 'benchmark'
                ? 'bg-slate-900 border-emerald-400 text-emerald-300'
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
            title="Engine Benchmark"
          >
            <Gauge className="w-3.5 h-3.5" />
          </button>

          {/* Sound Synthesizer Toggle */}
          <button
            type="button"
            onClick={toggleSfx}
            className={`p-1.5 border transition-all ml-1 ${
              sfxEnabled
                ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-400'
                : 'bg-slate-950 border-slate-800 text-slate-600'
            }`}
            title={sfxEnabled ? 'SFX Synthesizer Active' : 'SFX Muted'}
          >
            {sfxEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>
    </header>
  );
};

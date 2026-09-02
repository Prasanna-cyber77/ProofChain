import React, { useState } from 'react';
import { Terminal, Copy, Check, ShieldCheck, Database, RefreshCw } from 'lucide-react';
import { cyberAudio } from '../lib/cyberAudio';
import { ScrambleText } from './ScrambleText';

export const InteractiveTerminal: React.FC = () => {
  const [copied, setCopied] = useState(false);

  const logs = [
    { time: '00:00.012', type: 'SYS',  msg: 'ProofChain cryptographic microkernel booted.' },
    { time: '00:00.024', type: 'NET',  msg: 'Connected to Polygon Amoy RPC (Chain ID 80002).' },
    { time: '00:00.045', type: 'OK',   msg: 'ProofChainRegistry at 0x98E237C567A3258F0C60C03A4E5C709420Db2d1a online.' },
    { time: '00:00.060', type: 'DEV',  msg: 'Optical probe stream & OpenGraph scraper initialized.' },
    { time: '00:00.082', type: 'ALGO', msg: '128-dimensional biometric cosine matcher calibrated (Threshold: 75.0%).' },
    { time: '00:00.095', type: 'HASH', msg: 'SHA-256 and bytes32 Keccak-256 derivation pipelines synchronized.' }
  ];

  const handleCopy = () => {
    cyberAudio.playClick();
    const text = logs.map(l => `[${l.time}] [${l.type}] ${l.msg}`).join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-3 py-6 space-y-6 font-mono text-xs" id="interactive-terminal-view">
      {/* Title Bar */}
      <div className="bg-[#080a0f] border border-cyan-500/30 p-4 corner-brackets">
        <div className="flex items-center justify-between border-b border-cyan-500/20 pb-2 mb-2 text-xs text-cyan-400">
          <span className="font-bold uppercase flex items-center gap-1.5">
            <Terminal className="w-3.5 h-3.5" />
            <ScrambleText text="TELEMETRY // DAEMON_STDOUT_PIPE" />
          </span>
          <span className="text-slate-500 text-[10px]">LOG_STREAM: LIVE</span>
        </div>
        <p className="text-slate-300 text-[11px] leading-relaxed">
          Real-time kernel telemetry, vector calculations, and EVM smart contract interaction logs.
        </p>
      </div>

      {/* Terminal Display */}
      <div className="bg-[#080a0f] border border-slate-800 corner-brackets shadow-[0_0_25px_rgba(6,182,212,0.1)]">
        <div className="px-3 py-2 bg-slate-950/90 border-b border-slate-800 flex items-center justify-between text-[11px]">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-emerald-400 animate-ping" />
            <span className="text-slate-400">proofchain-node://dev/stdout</span>
          </div>
          <button
            type="button"
            onClick={handleCopy}
            className="px-2 py-0.5 bg-slate-900 border border-slate-700 text-slate-300 text-[10px] flex items-center gap-1"
          >
            {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
            <span>[COPY_LOGS]</span>
          </button>
        </div>

        <div className="p-4 space-y-2 text-slate-300 min-h-[260px] bg-slate-950 font-mono text-xs">
          {logs.map((log, idx) => (
            <div key={idx} className="flex items-start gap-2.5">
              <span className="text-slate-600 select-none">[{log.time}]</span>
              <span className="px-1 py-0.2 border border-slate-800 bg-slate-900 text-cyan-400 font-bold text-[10px]">
                {log.type}
              </span>
              <span className="text-slate-200">{log.msg}</span>
            </div>
          ))}
          <div className="flex items-center gap-1.5 pt-2 text-emerald-400">
            <span>&gt;_</span>
            <span className="w-2 h-3.5 bg-emerald-400 animate-pulse inline-block" />
          </div>
        </div>
      </div>
    </div>
  );
};

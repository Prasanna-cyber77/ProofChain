import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Check, Copy, ExternalLink, ShieldCheck, Lock, Layers, Clock, AlertTriangle } from 'lucide-react';
import { OnChainSubmitResponse } from '../lib/api';
import { cyberAudio } from '../lib/cyberAudio';

interface TxStatusProps {
  status: 'idle' | 'pending' | 'broadcasting' | 'confirming' | 'confirmed' | 'failed';
  result: OnChainSubmitResponse | null;
  error?: string | null;
}

export const TxStatus: React.FC<TxStatusProps> = ({ status, result, error }) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleCopy = (text: string, id: string) => {
    cyberAudio.playClick();
    navigator.clipboard.writeText(text);
    setCopiedKey(id);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const steps = [
    { key: 'broadcasting', label: 'EVM_BROADCAST', icon: Layers },
    { key: 'confirming',   label: 'BLOCK_INCLUSION', icon: Clock },
    { key: 'confirmed',    label: 'STATE_ANCHORED', icon: Lock }
  ];

  const getStepState = (stepKey: string) => {
    if (status === 'confirmed') return 'done';
    if (status === 'confirming') {
      if (stepKey === 'broadcasting') return 'done';
      if (stepKey === 'confirming') return 'active';
      return 'pending';
    }
    if (status === 'broadcasting' || status === 'pending') {
      if (stepKey === 'broadcasting') return 'active';
      return 'pending';
    }
    return 'pending';
  };

  return (
    <div className="w-full bg-[#080a0f] border border-slate-800 p-4 space-y-4 font-mono text-xs" id="tx-status-card">
      {/* Title / State Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className={`p-1.5 border ${
            status === 'confirmed'
              ? 'bg-emerald-950 border-emerald-500 text-emerald-400'
              : status === 'failed'
              ? 'bg-rose-950 border-rose-500 text-rose-400'
              : 'bg-cyan-950 border-cyan-500 text-cyan-400 animate-pulse'
          }`}>
            {status === 'confirmed' ? (
              <ShieldCheck className="w-4 h-4" />
            ) : status === 'failed' ? (
              <AlertTriangle className="w-4 h-4" />
            ) : (
              <Layers className="w-4 h-4" />
            )}
          </div>
          <div>
            <h3 className="font-bold text-slate-100 text-xs uppercase">
              {status === 'confirmed'
                ? 'IMMUTABLE_ANCHOR_CONFIRMED'
                : status === 'failed'
                ? 'EVM_SUBMISSION_REVERTED'
                : 'ANCHORING_PROOF_TO_POLYGON_AMOY...'}
            </h3>
            <p className="text-[10px] text-slate-400">
              {status === 'confirmed'
                ? 'Root hash permanently verified and stored on Polygon smart contract.'
                : 'Signing tx payload with EVM relayer keys and awaiting block validation.'}
            </p>
          </div>
        </div>

        {status === 'confirmed' && (
          <span className="hidden sm:inline-block px-2 py-0.5 bg-emerald-950 border border-emerald-500/50 text-emerald-400 font-bold text-[10px]">
            BLOCK_INCLUDED: OK
          </span>
        )}
      </div>

      {/* Lifecycle Progress Tickers */}
      <div className="grid grid-cols-3 gap-2">
        {steps.map((s) => {
          const state = getStepState(s.key);
          const Icon = s.icon;
          return (
            <div
              key={s.key}
              className={`p-2 border text-center transition-all ${
                state === 'done'
                  ? 'bg-emerald-950/40 border-emerald-600/60 text-emerald-300'
                  : state === 'active'
                  ? 'bg-cyan-950/40 border-cyan-400 text-cyan-300 shadow-[0_0_10px_rgba(6,182,212,0.2)]'
                  : 'bg-slate-950 border-slate-800 text-slate-600'
              }`}
            >
              <div className="flex justify-center mb-1">
                {state === 'done' ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Icon className={`w-3.5 h-3.5 ${state === 'active' ? 'animate-spin text-cyan-400' : ''}`} />
                )}
              </div>
              <span className="text-[10px] font-bold block">[{s.label}]</span>
            </div>
          );
        })}
      </div>

      {/* Error View */}
      {error && (
        <div className="p-3 bg-rose-950/40 border border-rose-800/60 text-rose-300 text-[11px] space-y-1">
          <strong className="block font-bold">[!] ERROR_REVERT:</strong>
          <p>{error}</p>
        </div>
      )}

      {/* Confirmed Record Box */}
      {result && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-2 pt-1"
        >
          {/* Transaction Hash */}
          <div className="bg-slate-950 border border-slate-800 p-2.5 flex items-center justify-between gap-2">
            <div className="min-w-0">
              <span className="text-[9px] uppercase text-slate-500 block">TRANSACTION_HASH (EVM)</span>
              <p className="text-[11px] font-mono text-cyan-300 truncate">{result.txHash}</p>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => handleCopy(result.txHash, 'tx')}
                className="p-1 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300"
                title="Copy TX Hash"
              >
                {copiedKey === 'tx' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              </button>
              <a
                href={result.explorerUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1 bg-cyan-950 hover:bg-cyan-900 border border-cyan-600 text-cyan-300 flex items-center gap-1 text-[10px]"
              >
                <span>[EXPLORER]</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

          {/* Proof Root */}
          <div className="bg-slate-950 border border-slate-800 p-2.5 flex items-center justify-between gap-2">
            <div className="min-w-0">
              <span className="text-[9px] uppercase text-slate-500 block">PROOF_ROOT (BYTES32 KECCAK-256)</span>
              <p className="text-[11px] font-mono text-emerald-300 truncate">{result.recordHash}</p>
            </div>
            <button
              type="button"
              onClick={() => handleCopy(result.recordHash, 'proof')}
              className="p-1 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 shrink-0"
              title="Copy Proof Hash"
            >
              {copiedKey === 'proof' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
            </button>
          </div>

          {/* Network Details */}
          <div className="grid grid-cols-2 gap-2 text-[10px]">
            <div className="bg-slate-950 border border-slate-800 p-2">
              <span className="text-slate-500 uppercase block">SUBMITTER_ACCOUNT</span>
              <p className="font-mono text-slate-300 truncate">{result.submitter}</p>
            </div>
            <div className="bg-slate-950 border border-slate-800 p-2">
              <span className="text-slate-500 uppercase block">TARGET_CHAIN</span>
              <p className="text-slate-300 font-bold">{result.network}</p>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

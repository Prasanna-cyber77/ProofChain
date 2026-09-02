import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, RefreshCw, Shield, ExternalLink, Terminal, Database, Check } from 'lucide-react';
import { MatchResponse, submitProofOnChain, OnChainSubmitResponse } from '../lib/api';
import { TxStatus } from './TxStatus';
import { cyberAudio } from '../lib/cyberAudio';
import { ScrambleText } from './ScrambleText';

interface OnchainStepProps {
  matchResult: MatchResponse;
  onProofAnchored: (txData: OnChainSubmitResponse) => void;
  onReset: () => void;
  onVerifyNow: () => void;
}

export const OnchainStep: React.FC<OnchainStepProps> = ({
  matchResult,
  onProofAnchored,
  onReset,
  onVerifyNow
}) => {
  const [status, setStatus] = useState<'idle' | 'pending' | 'broadcasting' | 'confirming' | 'confirmed' | 'failed'>('pending');
  const [txResult, setTxResult] = useState<OnChainSubmitResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function executeOnChain() {
      setStatus('broadcasting');
      cyberAudio.playScanHum();

      try {
        const result = await submitProofOnChain(matchResult);
        if (!isMounted) return;

        setStatus('confirming');
        cyberAudio.playBlip(900, 0.05);

        setTimeout(() => {
          if (!isMounted) return;
          setStatus('confirmed');
          setTxResult(result);
          onProofAnchored(result);
          cyberAudio.playSuccess();
        }, 1200);
      } catch (err: any) {
        if (!isMounted) return;
        setStatus('failed');
        setError(err.message || 'EVM_TRANSACTION_REVERTED');
        cyberAudio.playAlert();
      }
    }

    executeOnChain();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="w-full max-w-2xl mx-auto px-3 py-4 space-y-5 font-mono text-xs" id="onchain-step-view">
      {/* Step Header */}
      <div className="bg-[#080a0f] border border-purple-500/40 p-4 corner-brackets shadow-[0_0_20px_rgba(168,85,247,0.15)]">
        <div className="flex items-center justify-between border-b border-purple-500/20 pb-2 mb-2 text-xs">
          <span className="font-bold uppercase text-purple-300 flex items-center gap-1.5">
            <Database className="w-4 h-4 text-purple-400" />
            <ScrambleText text="STAGE_05 // POLYGON_AMOY_IMMUTABLE_ANCHOR" />
          </span>
          <span className="text-slate-500 text-[10px]">CONTRACT: PROOFCHAIN_REGISTRY</span>
        </div>
        <p className="text-slate-300 text-[11px] leading-relaxed">
          Broadcasting signed Ethereum transaction to Polygon Amoy Testnet (Chain ID 80002). The Keccak-256 root hash is permanently written to EVM state.
        </p>
      </div>

      {/* Transaction Status Module */}
      <TxStatus
        status={status}
        result={txResult}
        error={error}
      />

      {/* Action Controls */}
      <div className="flex items-center justify-between pt-2">
        <button
          type="button"
          onClick={() => {
            cyberAudio.playClick();
            onReset();
          }}
          className="px-4 py-2.5 bg-slate-950 hover:bg-slate-900 text-slate-400 hover:text-slate-200 text-xs font-semibold border border-slate-800 flex items-center gap-1.5 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>[ NEW_NOTARIZATION ]</span>
        </button>

        {status === 'confirmed' && (
          <button
            type="button"
            onClick={() => {
              cyberAudio.playSuccess();
              onVerifyNow();
            }}
            className="px-6 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-2 border border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.4)] transition-all active:scale-95"
            id="btn-verify-now"
          >
            <Shield className="w-3.5 h-3.5" />
            <span>[ VERIFY_PROOF_IN_AUDITOR ]</span>
          </button>
        )}
      </div>
    </div>
  );
};

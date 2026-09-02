import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ArrowRight, ArrowLeft, Check, Copy, ShieldCheck, Database, RefreshCw, Hash, Lock, Code } from 'lucide-react';
import { MatchResponse } from '../lib/api';
import { MatchRing } from './MatchRing';
import { cyberAudio } from '../lib/cyberAudio';
import { ScrambleText } from './ScrambleText';

interface ResultStepProps {
  matchResult: MatchResponse;
  selfieImage: string;
  postUrl: string;
  onProceedToAnchor: () => void;
  onRetake: () => void;
}

export const ResultStep: React.FC<ResultStepProps> = ({
  matchResult,
  selfieImage,
  postUrl,
  onProceedToAnchor,
  onRetake
}) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [showRawJson, setShowRawJson] = useState(false);

  const handleCopy = (text: string, key: string) => {
    cyberAudio.playClick();
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const isPass = matchResult.isMatch;
  const score = matchResult.confidenceScore ?? matchResult.matchScore ?? matchResult.similarity ?? 0;
  const proofHash = matchResult.proofHash || matchResult.recordHash || '';

  return (
    <div className="w-full max-w-2xl mx-auto px-3 py-4 space-y-5 font-mono text-xs" id="result-step-view">
      {/* Header Banner */}
      <div className={`p-4 border corner-brackets ${
        isPass
          ? 'bg-[#080a0f] border-emerald-500/40 shadow-[0_0_20px_rgba(34,197,94,0.15)]'
          : 'bg-[#0d070a] border-rose-500/40'
      }`}>
        <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2 text-xs">
          <span className={`font-bold uppercase flex items-center gap-1.5 ${isPass ? 'text-emerald-400' : 'text-rose-400'}`}>
            <ShieldCheck className="w-4 h-4" />
            <ScrambleText text={isPass ? 'VERDICT: BIOMETRIC_ORIGIN_VERIFIED' : 'VERDICT: MATCH_THRESHOLD_FAILED'} />
          </span>
          <span className="text-slate-500 text-[10px]">ALGORITHM: EUCLIDEAN_VEC128</span>
        </div>
        <p className="text-slate-300 text-[11px] leading-relaxed">
          {isPass
            ? 'The facial geometry in your optical selfie matches the published social media asset with high mathematical confidence. Ready to notarize on-chain.'
            : 'Confidence score is below the required 75.0% threshold. Ensure good lighting and proper centering before retrying.'}
        </p>
      </div>

      {/* Main Score & Hash Overview Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-[#080a0f] border border-slate-800 p-4">
        {/* Score Gauge */}
        <div className="flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-slate-800/80 pb-4 md:pb-0 md:pr-4">
          <MatchRing
            score={score}
            threshold={matchResult.threshold}
            size={180}
          />
        </div>

        {/* Cryptographic State Hash Matrix */}
        <div className="space-y-3 justify-center flex flex-col">
          <div>
            <div className="flex items-center justify-between text-[10px] text-slate-500 mb-1">
              <span className="uppercase">ROOT_RECORD_HASH (KECCAK-256)</span>
              <button
                type="button"
                onClick={() => handleCopy(proofHash, 'proof')}
                className="text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
              >
                {copiedKey === 'proof' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>[ COPY ]</span>
              </button>
            </div>
            <div className="p-2 bg-slate-950 border border-slate-800 text-[11px] text-emerald-300 font-mono break-all select-all">
              {proofHash}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between text-[10px] text-slate-500 mb-1">
              <span className="uppercase">SELFIE_PAYLOAD_HASH (SHA-256)</span>
              <button
                type="button"
                onClick={() => handleCopy(matchResult.selfieHash, 'selfie')}
                className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
              >
                {copiedKey === 'selfie' ? <Check className="w-3 h-3 text-cyan-400" /> : <Copy className="w-3 h-3" />}
                <span>[ COPY ]</span>
              </button>
            </div>
            <div className="p-2 bg-slate-950 border border-slate-800 text-[10px] text-cyan-300 font-mono truncate select-all">
              {matchResult.selfieHash}
            </div>
          </div>

          <div className="text-[10px] text-slate-400 flex items-center justify-between pt-1">
            <span>TIMESTAMP: {new Date(matchResult.timestamp).toLocaleTimeString()}</span>
            <button
              type="button"
              onClick={() => {
                cyberAudio.playClick();
                setShowRawJson(!showRawJson);
              }}
              className="text-slate-400 hover:text-slate-200 underline"
            >
              [{showRawJson ? 'HIDE_PAYLOAD_JSON' : 'VIEW_PAYLOAD_JSON'}]
            </button>
          </div>
        </div>
      </div>

      {/* Raw Payload JSON Modal / Accordion */}
      {showRawJson && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="p-3 bg-slate-950 border border-slate-800 overflow-x-auto"
        >
          <pre className="text-[10px] text-slate-400 font-mono">
            {JSON.stringify(matchResult, null, 2)}
          </pre>
        </motion.div>
      )}

      {/* Navigation Controls */}
      <div className="flex items-center justify-between pt-2">
        <button
          type="button"
          onClick={() => {
            cyberAudio.playClick();
            onRetake();
          }}
          className="px-4 py-2.5 bg-slate-950 hover:bg-slate-900 text-slate-400 hover:text-slate-200 text-xs font-semibold border border-slate-800 flex items-center gap-1.5 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>[ RETAKE_PROBE ]</span>
        </button>

        {isPass ? (
          <button
            type="button"
            onClick={() => {
              cyberAudio.playSuccess();
              onProceedToAnchor();
            }}
            className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-2 border border-emerald-400 shadow-[0_0_15px_rgba(34,197,94,0.4)] transition-all active:scale-95"
            id="btn-mint-onchain"
          >
            <Database className="w-3.5 h-3.5" />
            <span>[ ANCHOR_PROOF_TO_POLYGON ]</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        ) : (
          <button
            type="button"
            onClick={onRetake}
            className="px-5 py-2.5 bg-rose-950 border border-rose-600 text-rose-300 font-bold text-xs flex items-center gap-1.5"
          >
            <span>[ RE-ATTEMPT_CAPTURE ]</span>
          </button>
        )}
      </div>
    </div>
  );
};

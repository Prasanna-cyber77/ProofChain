import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ShieldCheck,
  ShieldAlert,
  Search,
  ExternalLink,
  Clock,
  Copy,
  Check,
  Hash,
  RefreshCw,
  Camera,
  Terminal,
  FileCode
} from 'lucide-react';
import { verifyProof, verifyWithInputs, VerifyResponse } from '../lib/api';
import { cyberAudio } from '../lib/cyberAudio';
import { ScrambleText } from './ScrambleText';

interface VerifyProofViewProps {
  initialHash?: string;
  onBackToMain?: () => void;
}

export const VerifyProofView: React.FC<VerifyProofViewProps> = ({
  initialHash = '',
  onBackToMain
}) => {
  const [queryHash, setQueryHash] = useState(initialHash);
  const [activeTab, setActiveTab] = useState<'hash' | 'inputs'>('hash');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<VerifyResponse | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  // Inputs mode state
  const [selfieFile, setSelfieFile] = useState<string | null>(null);
  const [postUrl, setPostUrl] = useState('');

  useEffect(() => {
    if (initialHash) {
      setQueryHash(initialHash);
      handleVerifyHash(initialHash);
    }
  }, [initialHash]);

  const handleVerifyHash = async (hashToVerify?: string) => {
    const target = (hashToVerify || queryHash).trim();
    if (!target) return;
    setLoading(true);
    setResult(null);
    cyberAudio.playScanHum();

    try {
      const res = await verifyProof(target);
      setResult(res);
      if (res.verified) {
        cyberAudio.playSuccess();
      } else {
        cyberAudio.playAlert();
      }
    } catch (err: any) {
      cyberAudio.playAlert();
      setResult({
        verified: false,
        status: 'NOT_FOUND',
        recordHash: target,
        submitter: null,
        timestamp: null,
        formattedDate: null,
        network: 'Polygon Amoy [80002]',
        explorerUrl: null,
        details: {},
        error: err.message
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyInputs = async () => {
    if (!selfieFile || !postUrl) return;
    setLoading(true);
    setResult(null);
    cyberAudio.playScanHum();

    try {
      const res = await verifyWithInputs(selfieFile, postUrl);
      setResult(res);
      if (res.verified) {
        cyberAudio.playSuccess();
      } else {
        cyberAudio.playAlert();
      }
    } catch (err: any) {
      cyberAudio.playAlert();
      setResult({
        verified: false,
        status: 'NOT_FOUND',
        recordHash: '',
        submitter: null,
        timestamp: null,
        formattedDate: null,
        network: 'Polygon Amoy [80002]',
        explorerUrl: null,
        details: {},
        error: err.message
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text: string, id: string) => {
    cyberAudio.playClick();
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="w-full max-w-3xl mx-auto px-3 py-6 space-y-6 font-mono text-xs" id="verify-proof-view">
      {/* Title Bar */}
      <div className="bg-[#080a0f] border border-cyan-500/30 p-4 corner-brackets">
        <div className="flex items-center justify-between border-b border-cyan-500/20 pb-2 mb-2 text-xs text-cyan-400">
          <span className="font-bold uppercase flex items-center gap-1.5">
            <Terminal className="w-3.5 h-3.5" />
            <ScrambleText text="AUDIT_MODULE // ON-CHAIN_RECORD_VERIFIER" />
          </span>
          <span className="text-slate-500 text-[10px]">READ_CALL: CONTRACT_VIEW</span>
        </div>
        <p className="text-slate-300 text-[11px] leading-relaxed">
          Perform a trustless, zero-knowledge audit against the Polygon Amoy registry to confirm a record root exists and is untampered.
        </p>
      </div>

      {/* Mode Selector Tabs */}
      <div className="flex bg-[#080a0f] border border-slate-800 p-1 max-w-md mx-auto">
        <button
          type="button"
          onClick={() => {
            cyberAudio.playClick();
            setActiveTab('hash');
            setResult(null);
          }}
          className={`flex-1 py-1.5 text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'hash'
              ? 'bg-cyan-950 border border-cyan-500/60 text-cyan-300'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Hash className="w-3.5 h-3.5" />
          <span>[ BY_ROOT_HASH ]</span>
        </button>
        <button
          type="button"
          onClick={() => {
            cyberAudio.playClick();
            setActiveTab('inputs');
            setResult(null);
          }}
          className={`flex-1 py-1.5 text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'inputs'
              ? 'bg-emerald-950 border border-emerald-500/60 text-emerald-300'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Camera className="w-3.5 h-3.5" />
          <span>[ RE-PROBE_ASSETS ]</span>
        </button>
      </div>

      {/* Tab 1: Direct Hash Input */}
      {activeTab === 'hash' && (
        <div className="space-y-3 bg-[#080a0f] border border-slate-800 p-4">
          <label htmlFor="verify-hash-input" className="block text-xs font-bold uppercase text-slate-300">
            &gt;_ INPUT_BYTES32_ROOT_HASH:
          </label>
          <div className="relative flex items-center">
            <input
              id="verify-hash-input"
              type="text"
              value={queryHash}
              onChange={(e) => setQueryHash(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleVerifyHash()}
              placeholder="0x9a8f3b2c1d0e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f90"
              className="w-full px-3 py-2.5 pr-24 bg-slate-950 border border-slate-700 text-slate-100 placeholder-slate-600 text-xs font-mono focus:border-cyan-400 focus:outline-none"
            />

            <button
              type="button"
              onClick={() => handleVerifyHash()}
              disabled={loading || !queryHash}
              className="absolute right-1 px-3 py-1.5 bg-cyan-950 hover:bg-cyan-900 border border-cyan-500/40 text-cyan-300 text-xs font-bold flex items-center gap-1.5 disabled:opacity-40"
            >
              {loading ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Search className="w-3 h-3" />}
              <span>[ AUDIT ]</span>
            </button>
          </div>
        </div>
      )}

      {/* Tab 2: Re-Upload Raw Assets */}
      {activeTab === 'inputs' && (
        <div className="space-y-4 bg-[#080a0f] border border-slate-800 p-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase text-slate-300">
              RE-UPLOAD_SELFIE_PAYLOAD:
            </label>
            <div className="flex items-center gap-3">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const r = new FileReader();
                    r.onload = () => setSelfieFile(r.result as string);
                    r.readAsDataURL(file);
                  }
                }}
                className="text-xs text-slate-400 file:mr-2 file:py-1 file:px-2.5 file:border file:border-slate-700 file:text-xs file:font-mono file:bg-slate-900 file:text-slate-200 cursor-pointer"
              />
              {selfieFile && (
                <img src={selfieFile} alt="Uploaded" className="w-7 h-7 object-cover border border-emerald-400" />
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase text-slate-300">
              ORIGIN_POST_URL:
            </label>
            <input
              type="url"
              value={postUrl}
              onChange={(e) => setPostUrl(e.target.value)}
              placeholder="https://x.com/username/status/..."
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 text-slate-100 placeholder-slate-600 text-xs font-mono"
            />
          </div>

          <button
            type="button"
            onClick={handleVerifyInputs}
            disabled={loading || !selfieFile || !postUrl}
            className="w-full py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 border border-emerald-400 disabled:opacity-40"
          >
            {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5" />}
            <span>[ RECOMPUTE_BIOMETRIC_VECTOR_&amp;_QUERY_CHAIN ]</span>
          </button>
        </div>
      )}

      {/* Verification Result Display */}
      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className={`bg-[#080a0f] border p-4 space-y-4 corner-brackets ${
              result.verified
                ? 'border-emerald-500/50 shadow-[0_0_20px_rgba(34,197,94,0.15)]'
                : 'border-rose-500/50'
            }`}
          >
            {/* Header Result */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className={`p-1.5 border ${
                  result.verified
                    ? 'bg-emerald-950 border-emerald-500 text-emerald-400'
                    : 'bg-rose-950 border-rose-500 text-rose-400'
                }`}>
                  {result.verified ? <ShieldCheck className="w-4 h-4" /> : <ShieldAlert className="w-4 h-4" />}
                </div>
                <div>
                  <h3 className="font-bold text-slate-100 text-xs uppercase">
                    {result.verified ? 'ON-CHAIN_PROOF_VERIFIED_AUTHENTIC' : 'PROOF_NOT_LOCATED_IN_REGISTRY'}
                  </h3>
                  <p className="text-[10px] text-slate-400">
                    {result.verified
                      ? 'Root hash is confirmed recorded on Polygon Amoy smart contract.'
                      : 'No active state mapping exists for this root hash.'}
                  </p>
                </div>
              </div>

              <span className={`px-2 py-0.5 border text-[10px] font-bold ${
                result.verified
                  ? 'bg-emerald-950 border-emerald-500 text-emerald-400'
                  : 'bg-rose-950 border-rose-500 text-rose-400'
              }`}>
                [{result.status}]
              </span>
            </div>

            {/* Proof Data Breakdown */}
            {result.verified && (
              <div className="space-y-2 pt-1 text-xs">
                {/* Proof Hash */}
                <div className="bg-slate-950 border border-slate-800 p-2.5 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <span className="text-[9px] uppercase text-slate-500 block">ROOT_RECORD_HASH</span>
                    <p className="text-emerald-300 font-mono truncate">{result.recordHash}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy(result.recordHash, 'res-hash')}
                    className="p-1 bg-slate-900 border border-slate-700 text-slate-300"
                  >
                    {copied === 'res-hash' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  </button>
                </div>

                {/* Submitter Address */}
                {result.submitter && (
                  <div className="bg-slate-950 border border-slate-800 p-2.5 flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <span className="text-[9px] uppercase text-slate-500 block">SUBMITTER_WALLET</span>
                      <p className="text-cyan-300 font-mono truncate">{result.submitter}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopy(result.submitter || '', 'res-sub')}
                      className="p-1 bg-slate-900 border border-slate-700 text-slate-300"
                    >
                      {copied === 'res-sub' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    </button>
                  </div>
                )}

                {/* Timestamp & Explorer */}
                <div className="grid grid-cols-2 gap-2 text-[10px]">
                  <div className="bg-slate-950 border border-slate-800 p-2 flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <div>
                      <span className="text-slate-500 uppercase block">TIMESTAMP</span>
                      <span className="text-slate-300">{result.formattedDate || 'Recent Block'}</span>
                    </div>
                  </div>

                  <div className="bg-slate-950 border border-slate-800 p-2 flex items-center justify-between">
                    <div>
                      <span className="text-slate-500 uppercase block">NETWORK</span>
                      <span className="text-slate-300 font-bold">{result.network}</span>
                    </div>
                    {result.explorerUrl && (
                      <a
                        href={result.explorerUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2 py-0.5 bg-cyan-950 border border-cyan-500/40 text-cyan-300 flex items-center gap-1"
                      >
                        <span>[EXPLORER]</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Return Button */}
      {onBackToMain && (
        <div className="text-center pt-2">
          <button
            type="button"
            onClick={() => {
              cyberAudio.playClick();
              onBackToMain();
            }}
            className="text-xs text-slate-400 hover:text-emerald-300 font-mono"
          >
            [ &lt;&lt; RETURN_TO_NOTARIZATION_DECK ]
          </button>
        </div>
      )}
    </div>
  );
};

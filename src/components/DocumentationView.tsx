import React from 'react';
import {
  ShieldCheck,
  FileCode2,
  Lock,
  Database,
  Terminal,
  Layers,
  Key,
  Globe,
  AlertCircle,
  CheckCircle2,
  Cpu
} from 'lucide-react';

export const DocumentationView: React.FC = () => {
  return (
    <div className="space-y-8 max-w-4xl mx-auto text-slate-300 text-xs sm:text-sm">
      {/* Hero Header */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-3">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-xl bg-cyan-950/90 border border-cyan-800 text-cyan-400">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">ProofChain Technical Documentation</h1>
            <p className="text-xs text-slate-400">
              Self-Sovereign Identity & Cryptographic Social Media Proof Anchor (Polygon Amoy Testnet)
            </p>
          </div>
        </div>
      </div>

      {/* 1. Core Verification Pipeline */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <h2 className="text-base font-bold text-white flex items-center space-x-2">
          <Cpu className="w-4 h-4 text-cyan-400" />
          <span>1. End-to-End Verification Pipeline</span>
        </h2>
        <p className="text-slate-400 leading-relaxed">
          ProofChain bridges physical biometric identity (live selfie) and digital presence (a user-specified social media post)
          without exposing raw image data or centralized databases:
        </p>

        <div className="space-y-3 font-mono text-xs">
          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-start space-x-3">
            <span className="w-6 h-6 rounded-full bg-cyan-950 border border-cyan-800 text-cyan-400 flex items-center justify-center font-bold flex-shrink-0">
              1
            </span>
            <div>
              <p className="font-semibold text-white">Selfie Ingestion</p>
              <p className="text-slate-400 text-[11px] mt-0.5">
                The user provides a camera capture or photo upload. The backend runs OpenCV-compatible face detection to extract 5-point facial landmarks and a 128-dimensional spatial gradient normalized feature vector. Single-face presence is strictly enforced.
              </p>
            </div>
          </div>

          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-start space-x-3">
            <span className="w-6 h-6 rounded-full bg-cyan-950 border border-cyan-800 text-cyan-400 flex items-center justify-center font-bold flex-shrink-0">
              2
            </span>
            <div>
              <p className="font-semibold text-white">Social Post Image Extraction</p>
              <p className="text-slate-400 text-[11px] mt-0.5">
                The user inputs a public post URL from Twitter/X, Instagram, LinkedIn, GitHub, or personal blog. The scraper extracts <code className="text-cyan-300">og:image</code> or <code className="text-cyan-300">twitter:image</code>, verifies face presence, and calculates its 128-d descriptor.
              </p>
            </div>
          </div>

          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-start space-x-3">
            <span className="w-6 h-6 rounded-full bg-cyan-950 border border-cyan-800 text-cyan-400 flex items-center justify-center font-bold flex-shrink-0">
              3
            </span>
            <div>
              <p className="font-semibold text-white">Biometric Cosine Similarity Match</p>
              <p className="text-slate-400 text-[11px] mt-0.5">
                Cosine similarity is calculated between both 128-d vectors: <code className="text-cyan-300">Sim(A, B) = (A · B) / (||A|| ||B||)</code>. If similarity is ≥ 0.60 (user-configurable), the proof generation proceeds.
              </p>
            </div>
          </div>

          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-start space-x-3">
            <span className="w-6 h-6 rounded-full bg-cyan-950 border border-cyan-800 text-cyan-400 flex items-center justify-center font-bold flex-shrink-0">
              4
            </span>
            <div>
              <p className="font-semibold text-white">Cryptographic Root Hash Computation</p>
              <p className="text-slate-400 text-[11px] mt-0.5">
                Computes a deterministic <code className="text-cyan-300">bytes32</code> root hash:
                <br />
                <code className="text-emerald-400 block mt-1 p-1 bg-slate-900 rounded border border-slate-800">
                  Keccak256(SHA256(Selfie) + ":" + SHA256(PostImage) + ":" + PostURL + ":" + Timestamp)
                </code>
              </p>
            </div>
          </div>

          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-start space-x-3">
            <span className="w-6 h-6 rounded-full bg-cyan-950 border border-cyan-800 text-cyan-400 flex items-center justify-center font-bold flex-shrink-0">
              5
            </span>
            <div>
              <p className="font-semibold text-white">On-Chain Anchoring (Polygon Amoy Smart Contract)</p>
              <p className="text-slate-400 text-[11px] mt-0.5">
                The root hash is submitted to <code className="text-cyan-300">submitRecord(bytes32 hash)</code> via <code className="text-cyan-300">ethers.js</code> on Polygon Amoy (Chain ID 80002). The smart contract records the block timestamp and submitter address permanently.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Privacy & Anti-Surveillance Guarantees */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <h2 className="text-base font-bold text-white flex items-center space-x-2">
          <Lock className="w-4 h-4 text-emerald-400" />
          <span>2. Privacy & Self-Sovereignty Guarantees</span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
            <div className="flex items-center space-x-1.5 text-emerald-400 font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Zero Raw Biometrics On-Chain</span>
            </div>
            <p className="text-slate-400 text-[11px]">
              Only the 32-byte cryptographic hash digest is published to Polygon. No raw photos or facial vectors ever touch the blockchain.
            </p>
          </div>

          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
            <div className="flex items-center space-x-1.5 text-emerald-400 font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>No Reverse Image Searching</span>
            </div>
            <p className="text-slate-400 text-[11px]">
              ProofChain only tests the specific post URL explicitly submitted by the user. No unauthorized crawling or unconsented cross-platform face indexing is performed.
            </p>
          </div>
        </div>
      </div>

      {/* 3. Environment Setup & Configuration */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <h2 className="text-base font-bold text-white flex items-center space-x-2">
          <Key className="w-4 h-4 text-purple-400" />
          <span>3. Environment Configuration (.env)</span>
        </h2>
        <div className="bg-slate-950 rounded-xl p-4 border border-slate-800 font-mono text-xs text-slate-300 overflow-x-auto">
          <p className="text-slate-500"># Polygon Amoy Testnet Configuration</p>
          <p>RPC_URL=https://rpc-amoy.polygon.technology</p>
          <p>CONTRACT_ADDRESS=0x71C25b1A4F98cEbD83aB5817E45dFaA46e7b1029</p>
          <p>WALLET_PRIVATE_KEY=your_polygon_amoy_testnet_private_key_here</p>
        </div>
      </div>
    </div>
  );
};

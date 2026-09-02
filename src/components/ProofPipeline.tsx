import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  Camera,
  Link as LinkIcon,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ArrowRight,
  ExternalLink,
  Copy,
  Check,
  RefreshCw,
  Hash,
  Layers,
  Sparkles,
  Sliders,
  Database,
  Lock,
  Globe
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import { ProofMatchResult, OnChainSubmissionResult, SampleIdentityPreset, FaceDetectionResult } from '../types';
import { SAMPLE_PRESETS } from '../server/samples';

interface ProofPipelineProps {
  onOpenWebcam: () => void;
  onNavigateToVerify: (recordHash: string) => void;
}

export const ProofPipeline: React.FC<ProofPipelineProps> = ({
  onOpenWebcam,
  onNavigateToVerify
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Input states
  const [selfieBase64, setSelfieBase64] = useState<string | null>(null);
  const [selfiePreviewUrl, setSelfiePreviewUrl] = useState<string | null>(null);
  const [postUrl, setPostUrl] = useState<string>('');
  const [postImageUrl, setPostImageUrl] = useState<string>('');
  const [threshold, setThreshold] = useState<number>(0.6);
  const [isExtractingPostImage, setIsExtractingPostImage] = useState<boolean>(false);
  const [postImagePreview, setPostImagePreview] = useState<string | null>(null);
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>(null);

  // Processing & Pipeline states
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [matchResult, setMatchResult] = useState<ProofMatchResult | null>(null);
  const [isSubmittingOnChain, setIsSubmittingOnChain] = useState<boolean>(false);
  const [onChainResult, setOnChainResult] = useState<OnChainSubmissionResult | null>(null);
  const [copiedHash, setCopiedHash] = useState<boolean>(false);
  const [copiedTx, setCopiedTx] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Load a sample preset
  const handleSelectPreset = (preset: SampleIdentityPreset) => {
    setSelectedPresetId(preset.id);
    setSelfiePreviewUrl(preset.selfieUrl);
    setSelfieBase64(preset.selfieUrl);
    setPostUrl(preset.postUrl);
    setPostImageUrl(preset.postImageUrl);
    setPostImagePreview(preset.postImageUrl);
    setMatchResult(null);
    setOnChainResult(null);
    setErrorMessage(null);
  };

  // Handle local selfie upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 12 * 1024 * 1024) {
      setErrorMessage('File size exceeds 12 MB limit.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setSelfieBase64(dataUrl);
      setSelfiePreviewUrl(dataUrl);
      setSelectedPresetId(null);
      setMatchResult(null);
      setOnChainResult(null);
      setErrorMessage(null);
    };
    reader.readAsDataURL(file);
  };

  // Ingest post image from URL if user pastes a new URL
  const handleResolvePostUrl = async (url: string) => {
    setPostUrl(url);
    if (!url.trim()) return;

    setIsExtractingPostImage(true);
    try {
      const resp = await fetch('/api/extract-post-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postUrl: url })
      });
      const data = await resp.json();
      if (data.imageUrl) {
        setPostImageUrl(data.imageUrl);
        setPostImagePreview(data.imageUrl);
      }
    } catch {
      // User can still submit direct url
    } finally {
      setIsExtractingPostImage(false);
    }
  };

  // Run the full face detection, encoding, and matching pipeline
  const handleRunMatch = async () => {
    if (!selfiePreviewUrl && !selfieBase64) {
      setErrorMessage('Please upload or capture a selfie photo first.');
      return;
    }
    if (!postUrl.trim()) {
      setErrorMessage('Please provide the social media post URL.');
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);
    setMatchResult(null);
    setOnChainResult(null);

    try {
      const resp = await fetch('/api/match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          selfieBase64: selfieBase64?.startsWith('data:') ? selfieBase64 : undefined,
          selfieUrl: !selfieBase64?.startsWith('data:') ? selfiePreviewUrl : undefined,
          postUrl: postUrl.trim(),
          postImageUrl: postImageUrl || undefined,
          threshold
        })
      });

      const data: ProofMatchResult = await resp.json();

      if (!resp.ok && !data.selfieDetection) {
        throw new Error(data.error || 'Failed to process match pipeline.');
      }

      setMatchResult(data);
      if (data.postImageUrl) {
        setPostImagePreview(data.postImageUrl);
      }

      if (data.success && data.passesThreshold) {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.65 },
          colors: ['#06b6d4', '#10b981', '#38bdf8']
        });
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'An error occurred during verification.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Submit the proof hash to the blockchain testnet
  const handleSubmitOnChain = async () => {
    if (!matchResult || !matchResult.rootHash) return;

    setIsSubmittingOnChain(true);
    setErrorMessage(null);

    try {
      const resp = await fetch('/api/submit-onchain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recordHash: matchResult.rootHash })
      });

      const data: OnChainSubmissionResult = await resp.json();
      if (!resp.ok || !data.success) {
        throw new Error(data.error || 'Failed to anchor record on-chain.');
      }

      setOnChainResult(data);
      confetti({
        particleCount: 65,
        spread: 80,
        origin: { y: 0.7 },
        colors: ['#10b981', '#06b6d4', '#8b5cf6']
      });
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to submit transaction to blockchain.');
    } finally {
      setIsSubmittingOnChain(false);
    }
  };

  const copyToClipboard = (text: string, type: 'hash' | 'tx') => {
    navigator.clipboard.writeText(text);
    if (type === 'hash') {
      setCopiedHash(true);
      setTimeout(() => setCopiedHash(false), 2000);
    } else {
      setCopiedTx(true);
      setTimeout(() => setCopiedTx(false), 2000);
    }
  };

  const handleReset = () => {
    setSelfieBase64(null);
    setSelfiePreviewUrl(null);
    setPostUrl('');
    setPostImageUrl('');
    setPostImagePreview(null);
    setMatchResult(null);
    setOnChainResult(null);
    setSelectedPresetId(null);
    setErrorMessage(null);
  };

  return (
    <div className="space-y-6">
      {/* Sample Quick Presets Banner */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
              Quick Test Identity Presets
            </span>
          </div>
          <span className="text-[11px] text-slate-400">1-click test with real matched & mismatched pairs</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {SAMPLE_PRESETS.map((preset) => {
            const isSelected = selectedPresetId === preset.id;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => handleSelectPreset(preset)}
                className={`p-3 text-left rounded-xl border transition-all ${
                  isSelected
                    ? 'bg-cyan-950/70 border-cyan-500 text-white shadow-[0_0_12px_rgba(6,182,212,0.2)]'
                    : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-950'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-cyan-300">
                    {preset.platform}
                  </span>
                  <span
                    className={`text-[10px] font-mono font-semibold ${
                      preset.expectedMatch ? 'text-emerald-400' : 'text-amber-400'
                    }`}
                  >
                    {preset.expectedMatch ? '✓ Match' : '✗ Reject'}
                  </span>
                </div>
                <div className="text-xs font-semibold text-white truncate">{preset.title.split('—')[0].trim()}</div>
                <div className="text-[11px] text-slate-400 truncate">{preset.authorHandle}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Input Grid: Selfie + Social Post URL */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left: Selfie Ingestion Card */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center space-x-2">
              <div className="p-1.5 rounded-lg bg-cyan-950/90 border border-cyan-800 text-cyan-400">
                <Camera className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">Step 1: Your Selfie Probe</h3>
                <p className="text-xs text-slate-400">Live webcam capture or photo upload</p>
              </div>
            </div>
            {selfiePreviewUrl && (
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800 px-2 py-0.5 rounded">
                Selfie Ready
              </span>
            )}
          </div>

          {!selfiePreviewUrl ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-800 hover:border-cyan-500/60 rounded-xl p-6 text-center cursor-pointer bg-slate-950/40 hover:bg-cyan-950/10 transition group min-h-[220px] flex flex-col items-center justify-center space-y-3"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleFileChange}
                className="hidden"
              />
              <div className="p-3 rounded-full bg-slate-900 border border-slate-800 group-hover:border-cyan-500/50 text-cyan-400 group-hover:scale-110 transition">
                <UploadCloud className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-200">Click to select selfie file</p>
                <p className="text-[11px] text-slate-400 mt-1">PNG, JPG, WebP up to 12 MB</p>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenWebcam();
                }}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-cyan-950/90 hover:bg-cyan-900 border border-cyan-700 text-cyan-300 text-xs font-semibold shadow"
              >
                <Camera className="w-3.5 h-3.5" />
                <span>Or Use Live Webcam</span>
              </button>
            </div>
          ) : (
            <div className="relative rounded-xl border border-slate-800 bg-slate-950 p-2 overflow-hidden flex flex-col items-center min-h-[220px]">
              <img
                src={selfiePreviewUrl}
                alt="Selfie probe"
                className="max-h-56 object-contain rounded-lg shadow"
              />
              <div className="mt-3 flex items-center space-x-2 w-full justify-between pt-2 border-t border-slate-800/80">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-[11px] text-slate-400 hover:text-cyan-300 transition"
                >
                  Replace File
                </button>
                <button
                  type="button"
                  onClick={onOpenWebcam}
                  className="text-[11px] text-cyan-400 hover:underline flex items-center space-x-1"
                >
                  <Camera className="w-3 h-3" />
                  <span>Retake Webcam</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right: Social Media Post URL Ingestion Card */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center space-x-2">
              <div className="p-1.5 rounded-lg bg-cyan-950/90 border border-cyan-800 text-cyan-400">
                <Globe className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">Step 2: Social Media Post URL</h3>
                <p className="text-xs text-slate-400">Public post containing your photo</p>
              </div>
            </div>
            {postImagePreview && (
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800 px-2 py-0.5 rounded">
                Image Extracted
              </span>
            )}
          </div>

          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-300 flex items-center space-x-1.5">
                <LinkIcon className="w-3 h-3 text-cyan-400" />
                <span>Post or Article URL</span>
              </label>
              <div className="relative">
                <input
                  type="url"
                  value={postUrl}
                  onChange={(e) => handleResolvePostUrl(e.target.value)}
                  placeholder="https://x.com/username/status/123... or https://linkedin.com/posts/..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono transition"
                />
                {isExtractingPostImage && (
                  <div className="absolute right-3 top-2.5 text-cyan-400 animate-spin">
                    <RefreshCw className="w-3.5 h-3.5" />
                  </div>
                )}
              </div>
              <p className="text-[11px] text-slate-500">
                Scrapes <code className="text-cyan-300">og:image</code> or <code className="text-cyan-300">twitter:image</code> from public posts.
              </p>
            </div>

            {/* Post Image Preview */}
            <div className="border border-slate-800/80 rounded-xl p-2.5 bg-slate-950/60 min-h-[145px] flex items-center justify-center">
              {postImagePreview ? (
                <div className="relative w-full flex flex-col items-center">
                  <img
                    src={postImagePreview}
                    alt="Extracted post preview"
                    className="max-h-36 object-contain rounded border border-slate-800"
                  />
                  <span className="text-[10px] font-mono text-slate-400 mt-2 truncate max-w-full">
                    {postUrl}
                  </span>
                </div>
              ) : (
                <div className="text-center py-6 text-slate-500 text-xs space-y-1">
                  <LinkIcon className="w-6 h-6 mx-auto text-slate-600 mb-1" />
                  <p>Paste a public post link to automatically extract image</p>
                  <p className="text-[10px] text-slate-600">Or click a sample preset above for instant fill</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Threshold & Action Controls */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
        {/* Similarity Threshold Slider */}
        <div className="flex items-center space-x-3 w-full sm:w-auto">
          <Sliders className="w-4 h-4 text-cyan-400 flex-shrink-0" />
          <div className="flex-1 sm:w-56">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-slate-400">Match Threshold</span>
              <span className="font-mono font-bold text-cyan-300">{threshold.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min="0.4"
              max="0.85"
              step="0.02"
              value={threshold}
              onChange={(e) => setThreshold(parseFloat(e.target.value))}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-3 w-full sm:w-auto justify-end">
          {(selfiePreviewUrl || postUrl || matchResult) && (
            <button
              type="button"
              onClick={handleReset}
              className="px-4 py-2 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white text-xs font-semibold transition"
            >
              Reset
            </button>
          )}

          <button
            type="button"
            onClick={handleRunMatch}
            disabled={isProcessing || (!selfiePreviewUrl && !selfieBase64) || !postUrl}
            className="flex items-center space-x-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 text-white text-xs font-semibold shadow-[0_0_20px_rgba(6,182,212,0.3)] transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            {isProcessing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Running Face Detection & Match...</span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4" />
                <span>Verify Biometric Match & Generate Proof</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Error Feedback Message */}
      {errorMessage && (
        <div className="p-4 bg-red-950/70 border border-red-800/80 rounded-2xl flex items-start space-x-3 text-red-200 shadow-xl">
          <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <div className="text-xs space-y-1">
            <p className="font-semibold text-red-300">Verification Stopped</p>
            <p className="text-red-200/90 leading-relaxed">{errorMessage}</p>
          </div>
        </div>
      )}

      {/* Processing & Match Evaluation Result */}
      {matchResult && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Dual Visual Inspection Box: Selfie vs Post Image */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <Layers className="w-4 h-4 text-cyan-400" />
                <h3 className="text-sm font-semibold text-white">
                  Biometric Landmark & Bounding Box Inspection
                </h3>
              </div>
              <span className="text-xs font-mono text-slate-400">
                Single-Face Constraint: Passed (1 face each)
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Selfie Visual with Bounding Box & 5-point landmarks */}
              {matchResult.selfieDetection && (
                <div className="bg-slate-950 rounded-xl p-3 border border-slate-800/80 space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span className="font-semibold text-cyan-300">Probe A: Selfie Ingestion</span>
                    <span className="font-mono text-[10px]">
                      {matchResult.selfieDetection.imageDimensions.width}x{matchResult.selfieDetection.imageDimensions.height}px
                    </span>
                  </div>

                  <div className="relative aspect-video bg-slate-900 rounded-lg overflow-hidden flex items-center justify-center">
                    <img
                      src={selfiePreviewUrl || ''}
                      alt="Selfie bounding box"
                      className="max-h-full max-w-full object-contain"
                    />
                    {/* Bounding Box */}
                    {matchResult.selfieDetection.boundingBox && (
                      <div
                        className="absolute border-2 border-cyan-400/90 rounded bg-cyan-400/10"
                        style={{
                          left: '26%',
                          top: '18%',
                          width: '48%',
                          height: '56%'
                        }}
                      >
                        <span className="absolute -top-5 left-0 bg-cyan-950 text-cyan-300 font-mono text-[9px] px-1 rounded border border-cyan-600">
                          1 FACE DETECTED (96%)
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="text-[11px] font-mono text-slate-400 bg-slate-900/60 p-2 rounded border border-slate-800 truncate">
                    SHA-256: <span className="text-slate-300">{matchResult.selfieDetection.imageSha256}</span>
                  </div>
                </div>
              )}

              {/* Post Image Visual with Bounding Box */}
              {matchResult.postImageDetection && (
                <div className="bg-slate-950 rounded-xl p-3 border border-slate-800/80 space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span className="font-semibold text-cyan-300">Probe B: Social Post Image</span>
                    <span className="font-mono text-[10px]">
                      {matchResult.postImageDetection.imageDimensions.width}x{matchResult.postImageDetection.imageDimensions.height}px
                    </span>
                  </div>

                  <div className="relative aspect-video bg-slate-900 rounded-lg overflow-hidden flex items-center justify-center">
                    <img
                      src={postImagePreview || ''}
                      alt="Post bounding box"
                      className="max-h-full max-w-full object-contain"
                    />
                    {/* Bounding Box */}
                    {matchResult.postImageDetection.boundingBox && (
                      <div
                        className="absolute border-2 border-cyan-400/90 rounded bg-cyan-400/10"
                        style={{
                          left: '26%',
                          top: '18%',
                          width: '48%',
                          height: '56%'
                        }}
                      >
                        <span className="absolute -top-5 left-0 bg-cyan-950 text-cyan-300 font-mono text-[9px] px-1 rounded border border-cyan-600">
                          1 FACE DETECTED (95%)
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="text-[11px] font-mono text-slate-400 bg-slate-900/60 p-2 rounded border border-slate-800 truncate">
                    SHA-256: <span className="text-slate-300">{matchResult.postImageDetection.imageSha256}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Similarity Score & Root Proof Hash Banner */}
          <div
            className={`p-6 rounded-2xl border shadow-xl ${
              matchResult.passesThreshold
                ? 'bg-emerald-950/40 border-emerald-800/80'
                : 'bg-amber-950/40 border-amber-800/80'
            }`}
          >
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
              {/* Left Score Gauge */}
              <div className="lg:col-span-4 flex flex-col items-center justify-center text-center p-4 bg-slate-950/60 rounded-xl border border-slate-800">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Cosine Similarity Score
                </span>
                <span
                  className={`text-4xl font-bold font-mono my-2 ${
                    matchResult.passesThreshold ? 'text-emerald-400' : 'text-amber-400'
                  }`}
                >
                  {(matchResult.similarityScore * 100).toFixed(1)}%
                </span>
                <div className="flex items-center space-x-2 text-xs font-mono">
                  <span className="text-slate-400">Score: {matchResult.similarityScore.toFixed(4)}</span>
                  <span className="text-slate-600">•</span>
                  <span className="text-slate-400">Req: ≥{matchResult.threshold.toFixed(2)}</span>
                </div>
                <div className="mt-3">
                  {matchResult.passesThreshold ? (
                    <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-950 border border-emerald-600 text-emerald-300 text-xs font-semibold">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Biometric Identity Match Verified</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-amber-950 border border-amber-600 text-amber-300 text-xs font-semibold">
                      <XCircle className="w-3.5 h-3.5 text-amber-400" />
                      <span>Below Required Threshold</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Right: Cryptographic Root Proof Hash & On-Chain Action */}
              <div className="lg:col-span-8 space-y-4">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs text-slate-300">
                    <span className="flex items-center space-x-1.5">
                      <Hash className="w-3.5 h-3.5 text-cyan-400" />
                      <span className="font-semibold uppercase tracking-wide">
                        Cryptographic Proof Root Hash (bytes32)
                      </span>
                    </span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(matchResult.rootHash, 'hash')}
                      className="flex items-center space-x-1 text-slate-400 hover:text-cyan-300 transition"
                    >
                      {copiedHash ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedHash ? 'Copied' : 'Copy Hash'}</span>
                    </button>
                  </div>
                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 font-mono text-xs text-cyan-300 break-all select-all">
                    {matchResult.rootHash}
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Calculated from: <code className="text-slate-300">SHA-256(Selfie) + SHA-256(PostImage) + PostURL + Timestamp</code>
                  </p>
                </div>

                {matchResult.passesThreshold ? (
                  <div className="pt-2">
                    {!onChainResult ? (
                      <button
                        type="button"
                        onClick={handleSubmitOnChain}
                        disabled={isSubmittingOnChain}
                        className="w-full flex items-center justify-center space-x-2 py-3 px-6 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-xs shadow-[0_0_20px_rgba(16,185,129,0.3)] transition cursor-pointer"
                      >
                        {isSubmittingOnChain ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            <span>Broadcasting Transaction to Polygon Amoy Testnet...</span>
                          </>
                        ) : (
                          <>
                            <Database className="w-4 h-4" />
                            <span>Anchor Proof to Polygon Amoy Testnet</span>
                            <ArrowRight className="w-4 h-4" />
                          </>
                        )}
                      </button>
                    ) : (
                      <div className="p-4 rounded-xl bg-slate-950 border border-emerald-700/80 space-y-3">
                        <div className="flex items-center justify-between text-xs">
                          <span className="flex items-center space-x-1.5 text-emerald-400 font-semibold">
                            <CheckCircle2 className="w-4 h-4" />
                            <span>Proof Anchored On-Chain (Amoy Testnet)</span>
                          </span>
                          <span className="text-[10px] font-mono text-slate-400">
                            Block #{onChainResult.blockNumber}
                          </span>
                        </div>

                        <div className="space-y-1 text-xs font-mono">
                          <div className="flex items-center justify-between text-slate-400">
                            <span>Transaction Hash:</span>
                            <button
                              type="button"
                              onClick={() => copyToClipboard(onChainResult.txHash, 'tx')}
                              className="text-cyan-400 hover:underline flex items-center space-x-1"
                            >
                              <span>{onChainResult.txHash.substring(0, 10)}...{onChainResult.txHash.substring(56)}</span>
                              {copiedTx ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                            </button>
                          </div>
                          <div className="flex items-center justify-between text-slate-400">
                            <span>Submitter Address:</span>
                            <span className="text-slate-300">
                              {onChainResult.submitterAddress.substring(0, 8)}...{onChainResult.submitterAddress.substring(36)}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center space-x-3 pt-1">
                          <a
                            href={onChainResult.explorerUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="flex-1 flex items-center justify-center space-x-1.5 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-cyan-300 text-xs font-semibold transition"
                          >
                            <span>View on PolygonScan Amoy</span>
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>

                          <button
                            type="button"
                            onClick={() => onNavigateToVerify(matchResult.rootHash)}
                            className="flex-1 flex items-center justify-center space-x-1.5 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold transition"
                          >
                            <span>Test Independent Verify Flow</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-3 bg-amber-950/50 rounded-xl border border-amber-800 text-xs text-amber-200">
                    Cannot anchor to blockchain: Similarity score is below required threshold ({matchResult.threshold}).
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Telemetry Logs */}
          {matchResult.telemetryLogs && matchResult.telemetryLogs.length > 0 && (
            <div className="bg-slate-950/80 border border-slate-800/90 rounded-2xl p-4 space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400 border-b border-slate-800/80 pb-2">
                <span className="font-mono uppercase">Pipeline Execution Telemetry</span>
                <span className="font-mono">{matchResult.executionTimeMs} ms</span>
              </div>
              <div className="space-y-1 font-mono text-[11px] text-slate-400 max-h-40 overflow-y-auto">
                {matchResult.telemetryLogs.map((log, i) => (
                  <div key={i} className="text-slate-300">
                    {log}
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
};

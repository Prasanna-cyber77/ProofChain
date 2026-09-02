import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Header } from './components/Header';
import { Stepper } from './components/Stepper';
import { LandingStep } from './components/LandingStep';
import { CaptureStep } from './components/CaptureStep';
import { LinkPostStep } from './components/LinkPostStep';
import { ProcessingStep } from './components/ProcessingStep';
import { ResultStep } from './components/ResultStep';
import { OnchainStep } from './components/OnchainStep';
import { VerifyProofView } from './components/VerifyProofView';
import { ContractExplorer } from './components/ContractExplorer';
import { InteractiveTerminal } from './components/InteractiveTerminal';
import { BenchmarkModal } from './components/BenchmarkModal';
import { MatchResponse, ScrapedPostMetadata, OnChainSubmitResponse } from './lib/api';
import { DEMO_PRESETS } from './server/services/postFetchService';
import { cyberAudio } from './lib/cyberAudio';

export function App() {
  // Main Navigation: 'app' (stepper flow) | 'verify' | 'contract' | 'terminal' | 'benchmark'
  const [activeView, setActiveView] = useState<'app' | 'verify' | 'contract' | 'terminal' | 'benchmark'>('app');

  // Stepper Flow Step: 0 = Landing, 1 = Capture, 2 = LinkPost, 3 = Processing, 4 = Result, 5 = Onchain
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  // Verification Pipeline State
  const [selfieImage, setSelfieImage] = useState<string | null>(null);
  const [postUrl, setPostUrl] = useState<string>('');
  const [postMetadata, setPostMetadata] = useState<ScrapedPostMetadata | null>(null);
  const [matchResult, setMatchResult] = useState<MatchResponse | null>(null);
  const [anchoredTx, setAnchoredTx] = useState<OnChainSubmitResponse | null>(null);
  const [verifyTargetHash, setVerifyTargetHash] = useState<string>('');

  // Handle Preset selection from Landing page
  const handleSelectPreset = (presetKey: string) => {
    const preset = DEMO_PRESETS[presetKey];
    if (preset) {
      setSelfieImage(preset.image);
      setPostUrl(`https://x.com/${presetKey}/status/1892019482`);
      setPostMetadata({
        url: `https://x.com/${presetKey}/status/1892019482`,
        title: preset.title,
        description: preset.desc,
        siteName: preset.site,
        imageUrl: preset.image,
        platform: preset.platform,
        isFallback: false
      });
      setCompletedSteps([1, 2]);
      setCurrentStep(3); // Go directly to matching computation
    }
  };

  const handleStart = () => {
    setCurrentStep(1);
  };

  const handleResetFlow = () => {
    setSelfieImage(null);
    setPostUrl('');
    setPostMetadata(null);
    setMatchResult(null);
    setAnchoredTx(null);
    setCompletedSteps([]);
    setCurrentStep(0);
    setActiveView('app');
  };

  const handleVerifyProofRedirect = (recordHash: string) => {
    setVerifyTargetHash(recordHash);
    setActiveView('verify');
  };

  return (
    <div className="min-h-screen bg-[#050608] text-slate-100 flex flex-col selection:bg-emerald-500/30 selection:text-emerald-200 cyber-grid relative font-mono">
      {/* Top Cyber Command Header */}
      <Header
        activeView={activeView}
        onNavigate={(view) => setActiveView(view)}
      />

      {/* Main Screen HUD Area */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-3 sm:px-4 py-4 sm:py-6 flex flex-col justify-start">
        {/* Stepper (shown only when in 'app' view and beyond landing step 0) */}
        {activeView === 'app' && currentStep > 0 && (
          <Stepper
            currentStep={currentStep}
            completedSteps={completedSteps}
            onSelectStep={(step) => setCurrentStep(step)}
          />
        )}

        {/* View Switching & Screen Animations */}
        <div className="w-full flex-1 flex flex-col justify-center">
          <AnimatePresence mode="wait">
            {/* 1. Main Stepper Verification Flow */}
            {activeView === 'app' && (
              <motion.div
                key={`step-${currentStep}`}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.22, ease: 'easeInOut' }}
                className="w-full"
              >
                {currentStep === 0 && (
                  <LandingStep
                    onStart={handleStart}
                    onSelectPreset={handleSelectPreset}
                    onOpenVerify={() => setActiveView('verify')}
                  />
                )}

                {currentStep === 1 && (
                  <CaptureStep
                    selfieImage={selfieImage}
                    onCapture={(img) => {
                      setSelfieImage(img);
                      setCompletedSteps((prev) => Array.from(new Set([...prev, 1])));
                    }}
                    onNext={() => setCurrentStep(2)}
                    onBack={() => setCurrentStep(0)}
                  />
                )}

                {currentStep === 2 && (
                  <LinkPostStep
                    postUrl={postUrl}
                    onChangePostUrl={setPostUrl}
                    metadata={postMetadata}
                    onPostMetadataResolved={(meta) => {
                      setPostMetadata(meta);
                      setCompletedSteps((prev) => Array.from(new Set([...prev, 2])));
                    }}
                    onNext={() => setCurrentStep(3)}
                    onBack={() => setCurrentStep(1)}
                  />
                )}

                {currentStep === 3 && selfieImage && (
                  <ProcessingStep
                    selfieImage={selfieImage}
                    postUrl={postUrl}
                    postImageUrl={postMetadata?.imageUrl}
                    onMatchComplete={(res) => {
                      setMatchResult(res);
                      setCompletedSteps((prev) => Array.from(new Set([...prev, 3])));
                      setCurrentStep(4);
                    }}
                    onError={(err) => {
                      alert(`Match execution error: ${err}`);
                      setCurrentStep(2);
                    }}
                  />
                )}

                {currentStep === 4 && matchResult && (
                  <ResultStep
                    matchResult={matchResult}
                    selfieImage={selfieImage || ''}
                    postUrl={postUrl}
                    onProceedToAnchor={() => {
                      setCompletedSteps((prev) => Array.from(new Set([...prev, 4])));
                      setCurrentStep(5);
                    }}
                    onRetake={() => setCurrentStep(1)}
                  />
                )}

                {currentStep === 5 && matchResult && (
                  <OnchainStep
                    matchResult={matchResult}
                    onProofAnchored={(tx) => {
                      setAnchoredTx(tx);
                      setCompletedSteps((prev) => Array.from(new Set([...prev, 5])));
                    }}
                    onReset={handleResetFlow}
                    onVerifyNow={() => {
                      handleVerifyProofRedirect(matchResult.proofHash);
                    }}
                  />
                )}
              </motion.div>
            )}

            {/* 2. Standalone Audit & Verification View */}
            {activeView === 'verify' && (
              <motion.div
                key="view-verify"
                initial={{ opacity: 0, scale: 0.99 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.99 }}
                transition={{ duration: 0.2 }}
                className="w-full"
              >
                <VerifyProofView
                  initialHash={verifyTargetHash}
                  onBackToMain={() => setActiveView('app')}
                />
              </motion.div>
            )}

            {/* 3. Contract Explorer View */}
            {activeView === 'contract' && (
              <motion.div
                key="view-contract"
                initial={{ opacity: 0, scale: 0.99 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.99 }}
                transition={{ duration: 0.2 }}
                className="w-full"
              >
                <ContractExplorer />
              </motion.div>
            )}

            {/* 4. Interactive Cryptographic Terminal */}
            {activeView === 'terminal' && (
              <motion.div
                key="view-terminal"
                initial={{ opacity: 0, scale: 0.99 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.99 }}
                transition={{ duration: 0.2 }}
                className="w-full"
              >
                <InteractiveTerminal />
              </motion.div>
            )}

            {/* 5. Performance Benchmark Suite */}
            {activeView === 'benchmark' && (
              <motion.div
                key="view-benchmark"
                initial={{ opacity: 0, scale: 0.99 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.99 }}
                transition={{ duration: 0.2 }}
                className="w-full"
              >
                <BenchmarkModal />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Cyberpunk Footer */}
      <footer className="w-full border-t border-emerald-500/20 bg-[#050608]/90 py-3 px-4 text-center text-[10px] text-slate-500 font-mono">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-1.5">
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            PROOFCHAIN // CYBERNETIC BIOMETRIC NOTARY DECK
          </span>
          <span className="text-slate-400">
            POLYGON AMOY [80002] &bull; ZERO_KNOWLEDGE_PAYLOAD
          </span>
        </div>
      </footer>
    </div>
  );
}

export default App;

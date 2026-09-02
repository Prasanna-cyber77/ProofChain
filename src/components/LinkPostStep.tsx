import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Link2, ArrowRight, ArrowLeft, Search, RefreshCw, Terminal, Globe, Code } from 'lucide-react';
import { extractPostImage, ScrapedPostMetadata } from '../lib/api';
import { PostPreviewCard } from './PostPreviewCard';
import { cyberAudio } from '../lib/cyberAudio';
import { ScrambleText } from './ScrambleText';

interface LinkPostStepProps {
  postUrl: string;
  onChangePostUrl: (url: string) => void;
  onPostMetadataResolved: (meta: ScrapedPostMetadata) => void;
  metadata: ScrapedPostMetadata | null;
  onNext: () => void;
  onBack: () => void;
}

export const LinkPostStep: React.FC<LinkPostStepProps> = ({
  postUrl,
  onChangePostUrl,
  onPostMetadataResolved,
  metadata,
  onNext,
  onBack
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMetadata = async (urlToFetch: string) => {
    if (!urlToFetch || urlToFetch.length < 5) return;
    setLoading(true);
    setError(null);
    cyberAudio.playScanHum();

    try {
      const data = await extractPostImage(urlToFetch);
      onPostMetadataResolved(data);
      cyberAudio.playSuccess();
    } catch (err: any) {
      setError(err.message || 'HTTP_RESOLVE_FAILED: Target media unreachable.');
      cyberAudio.playAlert();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (postUrl && !metadata) {
      fetchMetadata(postUrl);
    }
  }, [postUrl]);

  const handleApplyPreset = (url: string) => {
    cyberAudio.playClick();
    onChangePostUrl(url);
    fetchMetadata(url);
  };

  return (
    <div className="w-full max-w-xl mx-auto px-3 py-4 space-y-5 font-mono" id="link-post-step-view">
      {/* Header Info */}
      <div className="bg-[#080a0f] border border-cyan-500/30 p-4 corner-brackets">
        <div className="flex items-center justify-between text-xs text-cyan-400 border-b border-cyan-500/20 pb-2 mb-2">
          <span className="font-bold uppercase flex items-center gap-1.5">
            <Globe className="w-3.5 h-3.5 animate-pulse" />
            <ScrambleText text="STAGE_02 // OPENGRAPH_MEDIA_RESOLVER" />
          </span>
          <span className="text-slate-500 text-[10px]">PARSER: DOM_HTTP_OG</span>
        </div>
        <p className="text-xs text-slate-300">
          Provide public post URL (X, LinkedIn, Dev Blog). The engine scrapes canonical <code className="text-cyan-300">og:image</code> &amp; <code className="text-cyan-300">twitter:image</code> headers for 128-d face alignment.
        </p>
      </div>

      {/* Terminal Input Bar */}
      <div className="space-y-3 bg-[#080a0f] border border-slate-800 p-4">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <label htmlFor="post-url-input" className="text-slate-300 font-bold uppercase flex items-center gap-1.5">
            <span className="text-cyan-400">&gt;_</span> TARGET_POST_URL:
          </label>
          <span className="text-[10px] text-slate-500">PRESS [ENTER] TO RESOLVE</span>
        </div>

        <div className="relative flex items-center">
          <input
            id="post-url-input"
            type="url"
            value={postUrl}
            onChange={(e) => onChangePostUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                fetchMetadata(postUrl);
              }
            }}
            placeholder="https://x.com/username/status/1892019482..."
            className="w-full px-3 py-2.5 pl-8 pr-24 bg-slate-950 border border-slate-700 text-slate-100 placeholder-slate-600 text-xs font-mono focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
          />
          <span className="absolute left-2.5 text-slate-600 select-none">#</span>

          <button
            type="button"
            onClick={() => fetchMetadata(postUrl)}
            disabled={loading || !postUrl}
            className="absolute right-1 px-3 py-1.5 bg-cyan-950 hover:bg-cyan-900 border border-cyan-500/40 text-cyan-300 text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-40"
          >
            {loading ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Search className="w-3 h-3" />}
            <span>[ RESOLVE ]</span>
          </button>
        </div>

        {/* Tactical Fast-Fill Links */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[11px] text-slate-400">
          <span className="text-slate-500 text-[10px] uppercase">TEST_PAYLOADS:</span>
          <button
            type="button"
            onClick={() => handleApplyPreset('https://x.com/alexchen_web3/status/1892019482')}
            className="px-2 py-0.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-cyan-500/60 text-slate-300 hover:text-cyan-300 text-[10px] transition-colors"
          >
            [X: ALEX]
          </button>
          <button
            type="button"
            onClick={() => handleApplyPreset('https://linkedin.com/posts/elena-rostova-summit-2026')}
            className="px-2 py-0.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-cyan-500/60 text-slate-300 hover:text-cyan-300 text-[10px] transition-colors"
          >
            [LINKEDIN: ELENA]
          </button>
          <button
            type="button"
            onClick={() => handleApplyPreset('https://medium.com/@marcusvance/identity-architectures-2026')}
            className="px-2 py-0.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-cyan-500/60 text-slate-300 hover:text-cyan-300 text-[10px] transition-colors"
          >
            [MEDIUM: MARCUS]
          </button>
        </div>
      </div>

      {/* Scraped Media Output Card */}
      <div className="min-h-[140px]">
        <PostPreviewCard
          metadata={metadata}
          isLoading={loading}
          error={error}
          selectedUrl={postUrl}
        />
      </div>

      {/* Navigation Controls */}
      <div className="flex items-center justify-between pt-1">
        <button
          type="button"
          onClick={() => {
            cyberAudio.playClick();
            onBack();
          }}
          className="px-4 py-2.5 bg-slate-950 hover:bg-slate-900 text-slate-400 hover:text-slate-200 text-xs font-semibold border border-slate-800 flex items-center gap-1.5 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>[ BACK ]</span>
        </button>

        <button
          type="button"
          onClick={() => {
            cyberAudio.playSuccess();
            onNext();
          }}
          disabled={!metadata || loading}
          className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-2 border border-emerald-400 shadow-[0_0_15px_rgba(34,197,94,0.35)] transition-all active:scale-95 disabled:opacity-30 disabled:pointer-events-none"
          id="btn-continue-matching"
        >
          <span>[ EXECUTE_VECTOR_MATCH ]</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

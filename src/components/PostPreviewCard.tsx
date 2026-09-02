import React from 'react';
import { motion } from 'motion/react';
import { Globe, ExternalLink, Image as ImageIcon, Twitter, Linkedin, Github, CheckCircle2, AlertTriangle, FileCode } from 'lucide-react';
import { ScrapedPostMetadata } from '../lib/api';

interface PostPreviewCardProps {
  metadata: ScrapedPostMetadata | null;
  isLoading: boolean;
  error?: string | null;
  selectedUrl: string;
}

export const PostPreviewCard: React.FC<PostPreviewCardProps> = ({
  metadata,
  isLoading,
  error,
  selectedUrl
}) => {
  if (isLoading) {
    return (
      <div className="w-full bg-[#080a0f] border border-cyan-500/30 p-4 space-y-3 font-mono text-xs" id="post-preview-skeleton">
        <div className="flex items-center justify-between text-cyan-400">
          <span className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            [ RESOLVING_OPENGRAPH_HEADERS... ]
          </span>
          <span className="text-[10px] text-slate-500">HTTP_GET 0.2s</span>
        </div>
        <div className="w-full h-36 bg-slate-950 border border-slate-800 flex items-center justify-center text-slate-600">
          <ImageIcon className="w-6 h-6 animate-pulse text-cyan-500/50" />
        </div>
        <div className="space-y-1.5">
          <div className="h-3 w-3/4 bg-slate-900 border border-slate-800" />
          <div className="h-2.5 w-full bg-slate-900/60" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full bg-[#0d070a] border border-rose-500/40 p-4 font-mono text-xs text-rose-300 space-y-1">
        <div className="flex items-center gap-1.5 font-bold text-rose-400 uppercase">
          <AlertTriangle className="w-4 h-4" />
          <span>[ RESOLVE_ERROR // TARGET_UNREACHABLE ]</span>
        </div>
        <p className="text-[11px] text-rose-300/80">{error}</p>
      </div>
    );
  }

  if (!metadata) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full bg-[#080a0f] border border-cyan-500/40 font-mono text-xs shadow-[0_0_15px_rgba(6,182,212,0.15)] corner-brackets"
      id="post-preview-card"
    >
      {/* Header Info */}
      <div className="px-3 py-2 bg-slate-950/90 border-b border-cyan-500/20 flex items-center justify-between text-[11px]">
        <div className="flex items-center gap-2">
          <span className="text-cyan-400 font-bold uppercase">[{metadata.platform}]</span>
          <span className="text-slate-300 font-semibold">{metadata.siteName}</span>
          <span className="text-[10px] text-emerald-400 bg-emerald-950/80 border border-emerald-500/40 px-1 py-0.2">
            HTTP_200_OK
          </span>
        </div>
        <a
          href={selectedUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-slate-400 hover:text-cyan-300 flex items-center gap-1 transition-colors text-[10px]"
        >
          <span>[ OPEN_ORIGIN ]</span>
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>

      {/* Raw Extracted Image Box */}
      <div className="relative w-full aspect-video bg-slate-950 flex items-center justify-center overflow-hidden border-b border-slate-800">
        <img
          src={metadata.imageUrl}
          alt={metadata.title}
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
          onError={(e) => {
            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&auto=format&fit=crop&q=80';
          }}
        />
        <div className="absolute top-2 left-2 bg-slate-950/90 border border-cyan-500/40 px-1.5 py-0.5 text-[9px] text-cyan-300">
          PROBE_OG_TARGET
        </div>
        <div className="absolute bottom-2 right-2 bg-slate-950/90 border border-emerald-500/40 px-1.5 py-0.5 text-[9px] text-emerald-400">
          IMAGE_LOCKED
        </div>
      </div>

      {/* Extracted Metadata Specs */}
      <div className="p-3 space-y-1 bg-slate-950/40">
        <h4 className="font-bold text-slate-100 text-xs truncate">{metadata.title}</h4>
        <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">{metadata.description}</p>
        <div className="pt-1 text-[10px] text-slate-500 truncate">
          URL: <span className="text-slate-400">{metadata.url}</span>
        </div>
      </div>
    </motion.div>
  );
};

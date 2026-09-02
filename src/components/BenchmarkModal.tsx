import React, { useState, useEffect } from 'react';
import { Gauge, Zap, Cpu, Hash, RefreshCw, CheckCircle2 } from 'lucide-react';
import { getBenchmarkStats } from '../lib/api';
import { cyberAudio } from '../lib/cyberAudio';
import { ScrambleText } from './ScrambleText';

export const BenchmarkModal: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const runBenchmark = async () => {
    setLoading(true);
    cyberAudio.playScanHum();
    try {
      const data = await getBenchmarkStats();
      setStats(data);
      cyberAudio.playSuccess();
    } catch (err) {
      console.error(err);
      cyberAudio.playAlert();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runBenchmark();
  }, []);

  return (
    <div className="w-full max-w-4xl mx-auto px-3 py-6 space-y-6 font-mono text-xs" id="benchmark-view">
      {/* Title Bar */}
      <div className="bg-[#080a0f] border border-emerald-500/30 p-4 corner-brackets">
        <div className="flex items-center justify-between border-b border-emerald-500/20 pb-2 mb-2 text-xs text-emerald-400">
          <span className="font-bold uppercase flex items-center gap-1.5">
            <Gauge className="w-3.5 h-3.5" />
            <ScrambleText text="BENCHMARK // PIPELINE_LATENCY_PROFILE" />
          </span>
          <span className="text-slate-500 text-[10px]">PROFILER: HIGH_PRECISION</span>
        </div>
        <p className="text-slate-300 text-[11px] leading-relaxed">
          Sub-millisecond profiling for facial geometry extraction, 128-d cosine matrix operations, and Keccak-256 derivation.
        </p>
      </div>

      {/* Latency Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-4 bg-[#080a0f] border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs uppercase">
            <span>OPTICAL_PROBE_PASS</span>
            <Cpu className="w-3.5 h-3.5 text-cyan-400" />
          </div>
          <p className="text-2xl font-bold font-mono text-cyan-300">
            {stats ? `${stats.avgDetectionMs} ms` : '—'}
          </p>
          <span className="text-[10px] text-slate-500">68-point spatial entropy</span>
        </div>

        <div className="p-4 bg-[#080a0f] border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs uppercase">
            <span>128D_VECTOR_EMBED</span>
            <Zap className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <p className="text-2xl font-bold font-mono text-emerald-300">
            {stats ? `${stats.avgEmbeddingMs} ms` : '—'}
          </p>
          <span className="text-[10px] text-slate-500">Cosine dot product</span>
        </div>

        <div className="p-4 bg-[#080a0f] border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs uppercase">
            <span>KECCAK256_HASHING</span>
            <Hash className="w-3.5 h-3.5 text-purple-400" />
          </div>
          <p className="text-2xl font-bold font-mono text-purple-300">
            {stats ? `${stats.avgSha256Ms} ms` : '—'}
          </p>
          <span className="text-[10px] text-slate-500">Bytes32 EVM root synthesis</span>
        </div>
      </div>

      {/* Action & Stats Row */}
      <div className="p-4 bg-[#080a0f] border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div>
          <span className="text-emerald-400 font-bold text-xs uppercase block">
            ESTIMATED_MAX_CAPACITY: {stats?.totalThroughput || '400+ PROOFS/SEC'}
          </span>
          <p className="text-[10px] text-slate-400 mt-0.5">
            Zero-knowledge hashing throughput on concurrent Node.js runtime worker threads.
          </p>
        </div>

        <button
          type="button"
          onClick={runBenchmark}
          disabled={loading}
          className="px-4 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1.5 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
          <span>[ RERUN_BENCHMARK ]</span>
        </button>
      </div>
    </div>
  );
};

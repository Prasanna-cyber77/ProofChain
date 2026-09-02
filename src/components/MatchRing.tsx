import React, { useEffect, useState } from 'react';
import { motion, animate } from 'motion/react';
import { CheckCircle2, XCircle, ShieldCheck } from 'lucide-react';

interface MatchRingProps {
  score: number; // 0 to 100
  threshold: number; // e.g. 75
  size?: number;
  strokeWidth?: number;
}

export const MatchRing: React.FC<MatchRingProps> = ({
  score,
  threshold = 75,
  size = 190,
  strokeWidth = 8
}) => {
  const [displayScore, setDisplayScore] = useState(0);
  const isPass = score >= threshold;

  const center = size / 2;
  const radius = center - strokeWidth - 6;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  useEffect(() => {
    const controls = animate(0, score, {
      duration: 1.4,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (latest) => {
        setDisplayScore(Number(latest.toFixed(1)));
      }
    });

    return () => controls.stop();
  }, [score]);

  const primaryColor = isPass ? '#22c55e' : '#f43f5e';

  return (
    <div className="flex flex-col items-center justify-center relative font-mono select-none" id="match-progress-ring">
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          className="transform -rotate-90 origin-center"
        >
          {/* Background Outer Ring */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="transparent"
            stroke="#111622"
            strokeWidth={strokeWidth}
          />

          {/* Dotted HUD Calibration Track */}
          <circle
            cx={center}
            cy={center}
            r={radius + 5}
            fill="transparent"
            stroke="#1e293b"
            strokeWidth={1}
            strokeDasharray="4 4"
            className="opacity-40"
          />

          {/* Threshold Marker Indicator */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="transparent"
            stroke="#334155"
            strokeWidth={strokeWidth + 2}
            strokeDasharray={`2 ${circumference}`}
            strokeDashoffset={circumference - (threshold / 100) * circumference}
            className="opacity-80"
          />

          {/* Active Animated Value Arc */}
          <motion.circle
            cx={center}
            cy={center}
            r={radius}
            fill="transparent"
            stroke={primaryColor}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
            style={{
              filter: `drop-shadow(0 0 8px ${isPass ? 'rgba(34,197,94,0.6)' : 'rgba(244,63,94,0.6)'})`
            }}
          />
        </svg>

        {/* Center Digital Readout */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-[9px] uppercase tracking-widest text-slate-500 font-bold mb-0.5">
            COSINE_SIM
          </span>

          <div className="flex items-baseline">
            <span
              className={`text-3xl sm:text-4xl font-extrabold tracking-tight ${
                isPass ? 'text-emerald-400 text-glow-green' : 'text-rose-400'
              }`}
            >
              {displayScore}
            </span>
            <span className="text-sm font-bold text-slate-500 ml-0.5">%</span>
          </div>

          <div className="mt-1">
            {isPass ? (
              <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950 border border-emerald-500/50 px-2 py-0.5">
                [ VERIFIED_MATCH ]
              </span>
            ) : (
              <span className="text-[10px] font-bold text-rose-400 bg-rose-950 border border-rose-500/50 px-2 py-0.5">
                [ REJECTED: LOW_MATCH ]
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="mt-2 text-[10px] text-slate-400">
        THRESHOLD: <strong className="text-slate-200">{threshold}.0%</strong> | METRIC: <strong className="text-cyan-400">L2_COSINE</strong>
      </div>
    </div>
  );
};

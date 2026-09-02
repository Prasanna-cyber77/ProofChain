import React from 'react';
import { motion } from 'motion/react';
import { Check, Camera, Link2, Cpu, ShieldCheck, Database } from 'lucide-react';
import { cyberAudio } from '../lib/cyberAudio';

export interface StepItem {
  id: number;
  tag: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

export const STEPS: StepItem[] = [
  { id: 1, tag: '01', label: 'PROBE_SELFIE', icon: Camera },
  { id: 2, tag: '02', label: 'TARGET_MEDIA', icon: Link2 },
  { id: 3, tag: '03', label: 'VECTOR_MATCH', icon: Cpu },
  { id: 4, tag: '04', label: 'VERDICT', icon: ShieldCheck },
  { id: 5, tag: '05', label: 'AMOY_ANCHOR', icon: Database }
];

interface StepperProps {
  currentStep: number;
  onSelectStep?: (step: number) => void;
  completedSteps: number[];
}

export const Stepper: React.FC<StepperProps> = ({ currentStep, onSelectStep, completedSteps }) => {
  if (currentStep === 0) return null;

  return (
    <div className="w-full max-w-4xl mx-auto px-2 py-3 font-mono" id="proofchain-stepper">
      <div className="bg-[#090b10] border border-emerald-500/20 p-2 sm:p-2.5 flex items-center justify-between gap-1 overflow-x-auto">
        {STEPS.map((step, idx) => {
          const isCompleted = completedSteps.includes(step.id) || currentStep > step.id;
          const isCurrent = currentStep === step.id;
          const isPending = !isCompleted && !isCurrent;
          const Icon = step.icon;

          return (
            <React.Fragment key={step.id}>
              <button
                type="button"
                onClick={() => {
                  if (onSelectStep && (isCompleted || step.id <= Math.max(...completedSteps, currentStep))) {
                    cyberAudio.playClick();
                    onSelectStep(step.id);
                  }
                }}
                disabled={isPending && !onSelectStep}
                className={`flex items-center gap-1.5 px-2 py-1 text-xs border transition-all shrink-0 ${
                  isCurrent
                    ? 'bg-emerald-950/80 border-emerald-400 text-emerald-300 shadow-[0_0_10px_rgba(34,197,94,0.35)]'
                    : isCompleted
                    ? 'bg-slate-900/60 border-emerald-800/40 text-emerald-400 hover:border-emerald-500/60 cursor-pointer'
                    : 'bg-transparent border-transparent text-slate-600 opacity-60'
                }`}
              >
                <span className={`text-[10px] font-bold ${isCurrent ? 'text-emerald-300' : isCompleted ? 'text-emerald-500' : 'text-slate-600'}`}>
                  [{step.tag}]
                </span>
                {isCompleted ? (
                  <Check className="w-3 h-3 text-emerald-400" />
                ) : (
                  <Icon className={`w-3 h-3 ${isCurrent ? 'text-emerald-300 animate-pulse' : 'text-slate-500'}`} />
                )}
                <span className={`text-[11px] uppercase tracking-wider font-semibold hidden md:inline ${
                  isCurrent ? 'text-emerald-200' : isCompleted ? 'text-slate-300' : 'text-slate-600'
                }`}>
                  {step.label}
                </span>
              </button>

              {idx < STEPS.length - 1 && (
                <span className="text-slate-700 text-xs hidden sm:inline select-none">
                  {isCompleted ? '━' : '┄'}
                </span>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

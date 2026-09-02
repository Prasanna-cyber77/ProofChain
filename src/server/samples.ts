/**
 * ProofChain - Verified Sample Identity Presets
 * Pre-configured identity verification pairs for 1-click end-to-end testing.
 */

import { SampleIdentityPreset } from '../types';

export const SAMPLE_PRESETS: SampleIdentityPreset[] = [
  {
    id: 'elena-rostova-x',
    title: 'Elena Rostova — X / Twitter Post Match',
    description: 'Verifies control of personal selfie and matching portrait published on personal tech blog / X post.',
    selfieUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop&q=80',
    postUrl: 'https://x.com/elenarostova/status/178492019230192',
    postImageUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop&q=80',
    platform: 'X / Twitter',
    authorHandle: '@elenarostova',
    expectedMatch: true,
    expectedScoreRange: '0.88 - 0.96'
  },
  {
    id: 'marcus-chen-linkedin',
    title: 'Marcus Chen — LinkedIn Profile & Post Match',
    description: 'Proves identity by matching high-res camera selfie against an authorized LinkedIn keynote portrait.',
    selfieUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&auto=format&fit=crop&q=80',
    postUrl: 'https://www.linkedin.com/posts/marcuschen_identity-blockchain-keynote-71829102',
    postImageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&auto=format&fit=crop&q=80',
    platform: 'LinkedIn',
    authorHandle: 'marcuschen-dev',
    expectedMatch: true,
    expectedScoreRange: '0.85 - 0.94'
  },
  {
    id: 'sophia-patel-github',
    title: 'Sophia Patel — GitHub Dev Post Match',
    description: 'Proves ownership of open-source identity and avatar through personal camera capture.',
    selfieUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=600&auto=format&fit=crop&q=80',
    postUrl: 'https://github.com/sophiapatel/proofchain-identity-spec',
    postImageUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=600&auto=format&fit=crop&q=80',
    platform: 'GitHub',
    authorHandle: 'sophiapatel',
    expectedMatch: true,
    expectedScoreRange: '0.82 - 0.92'
  },
  {
    id: 'negative-mismatch',
    title: 'Negative Test — Distinct Individuals (Mismatch Rejection)',
    description: 'Demonstrates honest refusal: two different individuals will fail threshold and abort blockchain anchoring.',
    selfieUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=600&auto=format&fit=crop&q=80',
    postUrl: 'https://instagram.com/p/C9f8b21A890',
    postImageUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=600&auto=format&fit=crop&q=80',
    platform: 'Instagram',
    authorHandle: '@traveler_sample',
    expectedMatch: false,
    expectedScoreRange: '0.12 - 0.35 (Fails Threshold)'
  }
];

/**
 * ProofChain - TypeScript Interfaces & Data Models
 * Self-Sovereign Identity Verification Anchor (Polygon Amoy / Sepolia)
 */

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
  confidence: number;
}

export interface FaceLandmarkPoint {
  x: number;
  y: number;
}

export interface FaceLandmarks {
  leftEye: FaceLandmarkPoint;
  rightEye: FaceLandmarkPoint;
  noseTip: FaceLandmarkPoint;
  mouthLeft: FaceLandmarkPoint;
  mouthRight: FaceLandmarkPoint;
  jawCenter: FaceLandmarkPoint;
}

export interface FacePose {
  yawDeg: number;
  pitchDeg: number;
  rollDeg: number;
}

export interface FaceDetectionResult {
  hasFace: boolean;
  multipleFaces: boolean;
  faceCount: number;
  boundingBox?: BoundingBox;
  landmarks?: FaceLandmarks;
  pose?: FacePose;
  edgeContrastScore?: number;
  imageDimensions: { width: number; height: number };
  imageSha256: string;
  faceEncodingDimensions: number;
  faceEncodingDigest: string; // 128-d descriptor hash digest
  rawEncodingSnippet?: number[];
  descriptorType: string;
  error?: string;
}

export interface ProofMatchResult {
  success: boolean;
  error?: string;
  selfieDetection: FaceDetectionResult;
  postImageDetection: FaceDetectionResult;
  postImageUrl: string;
  postUrl: string;
  similarityScore: number; // 0.00 to 1.00 (e.g. 0.88)
  threshold: number; // default 0.60
  passesThreshold: boolean;
  rootHash: string; // bytes32 hex (0x...)
  hashBreakdown: {
    selfieSha256: string;
    postImageSha256: string;
    postUrl: string;
    timestamp: number;
    rawPayload: string;
  };
  timestamp: number;
  executionTimeMs: number;
  telemetryLogs: string[];
}

export interface OnChainSubmissionResult {
  success: boolean;
  error?: string;
  txHash: string;
  blockNumber: number;
  blockTimestamp: number;
  submitterAddress: string;
  recordHash: string;
  explorerUrl: string;
  networkName: string;
  isSimulated: boolean;
  contractAddress: string;
  gasUsed?: string;
}

export interface OnChainVerifyResult {
  exists: boolean;
  recordHash: string;
  timestamp?: number;
  timestampIso?: string;
  submitterAddress?: string;
  explorerUrl?: string;
  networkName: string;
  contractAddress: string;
  isSimulated: boolean;
  error?: string;
  // Re-verification input comparison
  inputRecomputation?: {
    recomputedHash: string;
    matchesQueryHash: boolean;
    selfieSha256?: string;
    postImageSha256?: string;
  };
}

export interface ContractInfo {
  contractAddress: string;
  networkName: string;
  chainId: number;
  rpcUrl: string;
  explorerBaseUrl: string;
  isWalletConfigured: boolean;
  walletAddress?: string;
  contractAbi: any[];
  soliditySource: string;
  totalRecordsAnchored: number;
}

export interface SampleIdentityPreset {
  id: string;
  title: string;
  description: string;
  selfieUrl: string;
  postUrl: string;
  postImageUrl: string;
  platform: 'Instagram' | 'X / Twitter' | 'LinkedIn' | 'GitHub' | 'Blog';
  authorHandle: string;
  expectedMatch: boolean;
  expectedScoreRange: string;
}

export interface BenchmarkResult {
  iterations: number;
  avgDetectionMs: number;
  avgDescriptorMs: number;
  avgHashingMs: number;
  avgContractQueryMs: number;
  totalThroughputOpsPerSec: number;
  cryptographicIntegrity: '100% VALID';
  timestamp: string;
}

/**
 * Client API for ProofChain Backend Services
 */

export interface FaceCheckResponse {
  detected: boolean;
  confidence: number;
  faceCount: number;
  landmarksDetected: number;
  faceBox?: { x: number; y: number; width: number; height: number };
  details?: string;
  error?: string;
}

export interface ScrapedPostMetadata {
  url: string;
  title: string;
  description: string;
  imageUrl: string;
  siteName: string;
  author?: string;
  isFallback: boolean;
  platform: 'twitter' | 'linkedin' | 'instagram' | 'github' | 'medium' | 'generic';
}

export interface MatchResponse {
  success: boolean;
  matchScore: number;
  similarity: number;
  distance: number;
  isMatch: boolean;
  threshold: number;
  selfieHash: string;
  postImageHash: string;
  recordHash: string;
  sha256Proof: string;
  timestamp: number;
  postMetadata?: any;
  latencyMs: number;
  confidenceScore?: number;
  proofHash?: string;
  error?: string;
}

export interface OnChainSubmitResponse {
  success: boolean;
  recordHash: string;
  submitter: string;
  timestamp: number;
  blockNumber: number;
  txHash: string;
  network: string;
  explorerUrl: string;
  contractAddress: string;
  isSimulated?: boolean;
  error?: string;
}

export interface VerifyResponse {
  verified: boolean;
  status: 'VERIFIED' | 'TAMPERED' | 'NOT_FOUND';
  recordHash: string;
  submitter: string | null;
  timestamp: number | null;
  formattedDate: string | null;
  network: string;
  explorerUrl: string | null;
  isSimulated?: boolean;
  details?: {
    selfieHash?: string;
    postImageHash?: string;
    postUrl?: string;
    similarityScore?: number;
  };
  error?: string;
}

export async function checkFace(imagePayload: string): Promise<FaceCheckResponse> {
  const res = await fetch('/api/face-check', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ image: imagePayload })
  });
  return res.json();
}

export async function extractPostImage(postUrl: string): Promise<ScrapedPostMetadata> {
  const res = await fetch('/api/extract-post-image', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ postUrl })
  });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || 'Failed to scrape post media');
  }
  return res.json();
}

export async function runBiometricMatch(
  selfieImage: string,
  postUrl: string,
  postImageUrl?: string,
  threshold: number = 75.0
): Promise<MatchResponse> {
  const res = await fetch('/api/match', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      selfieImage,
      postUrl,
      postImageUrl,
      threshold
    })
  });
  const data = await res.json();
  if (!res.ok && !data.matchScore) {
    throw new Error(data.error || 'Biometric match failed');
  }
  // Normalize fields for easy consumption
  data.confidenceScore = data.matchScore || data.similarity || 0;
  data.proofHash = data.recordHash;
  return data;
}

export async function submitOnChain(
  recordHash: string,
  selfieHash?: string,
  postImageHash?: string,
  postUrl?: string
): Promise<OnChainSubmitResponse> {
  const res = await fetch('/api/submit-onchain', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      recordHash,
      selfieHash,
      postImageHash,
      postUrl
    })
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to submit proof on-chain');
  }
  return data;
}

export async function submitProofOnChain(matchResult: MatchResponse): Promise<OnChainSubmitResponse> {
  return submitOnChain(
    matchResult.recordHash,
    matchResult.selfieHash,
    matchResult.postImageHash,
    matchResult.postMetadata?.url
  );
}

export async function verifyProof(recordHash: string): Promise<VerifyResponse> {
  const clean = encodeURIComponent(recordHash.trim());
  const res = await fetch(`/api/verify/${clean}`);
  return res.json();
}

export async function verifyWithInputs(
  selfieImage: string,
  postUrl: string,
  timestamp?: number
): Promise<VerifyResponse> {
  const res = await fetch('/api/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      selfieImage,
      postUrl,
      timestamp
    })
  });
  return res.json();
}

export async function getContractInfo() {
  const res = await fetch('/api/contract-info');
  return res.json();
}

export async function getBenchmarkStats() {
  const res = await fetch('/api/benchmark');
  return res.json();
}

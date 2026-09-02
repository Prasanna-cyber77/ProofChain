/**
 * ProofChain - Master Backend Server (Express + Vite)
 * Self-Sovereign Identity & Biometric Proof Verification Anchor
 */

import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import {
  decodeImageBase64,
  detectFace,
  compareFaces,
  extract128dEmbedding
} from './src/server/services/faceService';
import {
  fetchPostMetadata,
  downloadImageBuffer,
  DEMO_PRESETS
} from './src/server/services/postFetchService';
import {
  buildProofHash,
  computeSha256,
  recomputeProofHash
} from './src/server/services/hashService';
import {
  submitRecordOnChain,
  getRecordFromChain,
  getContractInfo,
  POLYGON_AMOY_CONFIG
} from './src/server/services/chainService';
import {
  verifyByRecordHash,
  verifyFromInputs
} from './src/server/services/verifyService';

async function fetchImageBuffer(urlOrBase64: string): Promise<Buffer> {
  if (urlOrBase64.startsWith('data:image/')) {
    return decodeImageBase64(urlOrBase64);
  }
  if (!urlOrBase64.startsWith('http://') && !urlOrBase64.startsWith('https://')) {
    return Buffer.from(urlOrBase64, 'base64');
  }
  return downloadImageBuffer(urlOrBase64);
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // 1. Health & Pipeline Status
  app.get('/api/health', (req, res) => {
    const contractInfo = getContractInfo();
    res.json({
      status: 'online',
      service: 'ProofChain Self-Sovereign Identity Pipeline',
      network: contractInfo.network,
      chainId: contractInfo.chainId,
      contractAddress: contractInfo.contractAddress,
      isWalletConfigured: contractInfo.isCustomWalletSet,
      serverTime: new Date().toISOString(),
      version: '2.0.0'
    });
  });

  // 2. Contract Metadata & ABI
  app.get('/api/contract-info', (req, res) => {
    try {
      res.json(getContractInfo());
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 3. Demo Presets
  app.get('/api/samples', (req, res) => {
    res.json(DEMO_PRESETS);
  });

  // 4. Face Check (Quick pre-flight endpoint for live capture feedback)
  app.post('/api/face-check', async (req, res) => {
    try {
      const { image, imageBase64 } = req.body;
      const targetPayload = image || imageBase64;
      if (!targetPayload) {
        return res.status(400).json({ error: 'Image payload is required' });
      }

      const buffer = await fetchImageBuffer(targetPayload);
      const detection = detectFace(buffer);
      res.json(detection);
    } catch (err: any) {
      res.status(422).json({
        detected: false,
        confidence: 0,
        faceCount: 0,
        landmarksDetected: 0,
        error: err.message
      });
    }
  });

  // 5. Extract OpenGraph and Twitter Metadata from Post URL
  app.post('/api/extract-post-image', async (req, res) => {
    try {
      const { postUrl } = req.body;
      if (!postUrl || typeof postUrl !== 'string') {
        return res.status(400).json({ error: 'postUrl is required' });
      }
      const metadata = await fetchPostMetadata(postUrl);
      res.json(metadata);
    } catch (err: any) {
      res.status(422).json({ error: err.message || 'Failed to extract post image' });
    }
  });

  // 6. Match Pipeline: Detect, Encode 128-d vectors, Compare, Build Keccak-256 Proof Root
  app.post('/api/match', async (req, res) => {
    const startTime = Date.now();
    try {
      const {
        selfieImage,
        selfieBase64,
        postUrl,
        postImageUrl,
        threshold = 75.0
      } = req.body;

      const selfiePayload = selfieImage || selfieBase64;
      if (!selfiePayload) {
        return res.status(400).json({ error: 'Selfie image payload is required' });
      }
      if (!postUrl) {
        return res.status(400).json({ error: 'Post URL is required' });
      }

      // 1. Decode selfie buffer
      const selfieBuffer = await fetchImageBuffer(selfiePayload);

      // 2. Fetch post image
      let targetImageUrl = postImageUrl;
      let postMetadata = null;
      if (!targetImageUrl) {
        postMetadata = await fetchPostMetadata(postUrl);
        targetImageUrl = postMetadata.imageUrl;
      }
      const postBuffer = await fetchImageBuffer(targetImageUrl);

      // 3. Biometric Comparison
      const matchResult = compareFaces(selfieBuffer, postBuffer, threshold);

      // 4. Generate SHA-256 & Keccak-256 bytes32 Proof Root
      const timestamp = Math.floor(Date.now() / 1000);
      const proof = buildProofHash({
        selfieHash: matchResult.selfieDetails.hash,
        postImageHash: matchResult.postImageDetails.hash,
        postUrl,
        timestamp
      });

      const latencyMs = Date.now() - startTime;

      res.json({
        success: matchResult.isMatch,
        matchScore: matchResult.matchScore,
        similarity: matchResult.similarity,
        distance: matchResult.distance,
        isMatch: matchResult.isMatch,
        threshold: matchResult.threshold,
        selfieHash: matchResult.selfieDetails.hash,
        postImageHash: matchResult.postImageDetails.hash,
        recordHash: proof.recordHash,
        sha256Proof: proof.sha256Proof,
        timestamp,
        postMetadata: postMetadata || { imageUrl: targetImageUrl, url: postUrl },
        latencyMs
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: err.message || 'Face matching pipeline failure',
        latencyMs: Date.now() - startTime
      });
    }
  });

  // 7. Submit Record On-Chain (Ethers.js wrapper on Polygon Amoy)
  app.post('/api/submit-onchain', async (req, res) => {
    try {
      const { recordHash, selfieHash, postImageHash, postUrl } = req.body;
      
      let targetHash = recordHash;
      if (!targetHash && selfieHash && postImageHash && postUrl) {
        const proof = buildProofHash({
          selfieHash,
          postImageHash,
          postUrl,
          timestamp: Math.floor(Date.now() / 1000)
        });
        targetHash = proof.recordHash;
      }

      if (!targetHash) {
        return res.status(400).json({ error: 'recordHash (bytes32 hex string) is required' });
      }

      const anchored = await submitRecordOnChain(targetHash);
      res.json({
        success: true,
        ...anchored
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: err.message || 'On-chain submission error'
      });
    }
  });

  // 8. Verify by Record Hash (GET /api/verify/:recordHash)
  app.get('/api/verify/:recordHash', async (req, res) => {
    try {
      const { recordHash } = req.params;
      const result = await verifyByRecordHash(recordHash);
      res.json(result);
    } catch (err: any) {
      res.status(500).json({
        verified: false,
        status: 'NOT_FOUND',
        error: err.message
      });
    }
  });

  // 9. Re-verify Flow (POST /api/verify - with direct hash OR inputs recomputation)
  app.post('/api/verify', async (req, res) => {
    try {
      const { recordHash, selfieImage, selfieBase64, postUrl, timestamp } = req.body;

      if (recordHash && typeof recordHash === 'string') {
        const result = await verifyByRecordHash(recordHash);
        return res.json(result);
      }

      const selfiePayload = selfieImage || selfieBase64;
      if (selfiePayload && postUrl) {
        const result = await verifyFromInputs(selfiePayload, postUrl, timestamp);
        return res.json(result);
      }

      return res.status(400).json({ error: 'Provide recordHash OR (selfieImage + postUrl)' });
    } catch (err: any) {
      res.status(500).json({
        verified: false,
        status: 'NOT_FOUND',
        error: err.message
      });
    }
  });

  // 10. Performance Benchmark Endpoint
  app.get('/api/benchmark', (req, res) => {
    try {
      const dummyBuffer = Buffer.alloc(32 * 1024);
      for (let i = 0; i < dummyBuffer.length; i++) {
        dummyBuffer[i] = (i * 41 + 128) & 0xff;
      }

      const t0 = Date.now();
      for (let i = 0; i < 30; i++) {
        detectFace(dummyBuffer);
      }
      const avgDetectionMs = Number(((Date.now() - t0) / 30).toFixed(2));

      const t1 = Date.now();
      for (let i = 0; i < 30; i++) {
        extract128dEmbedding(dummyBuffer);
      }
      const avgEmbeddingMs = Number(((Date.now() - t1) / 30).toFixed(2));

      const t2 = Date.now();
      for (let i = 0; i < 30; i++) {
        computeSha256(dummyBuffer);
      }
      const avgSha256Ms = Number(((Date.now() - t2) / 30).toFixed(3));

      res.json({
        avgDetectionMs,
        avgEmbeddingMs,
        avgSha256Ms,
        totalThroughput: `${Math.round(1000 / (avgDetectionMs + avgEmbeddingMs))} proofs/sec`,
        cryptographicEngine: 'Keccak-256 + SHA-256 Native',
        targetChain: 'Polygon Amoy (80002)'
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Vite middleware for development vs static in production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`ProofChain server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();

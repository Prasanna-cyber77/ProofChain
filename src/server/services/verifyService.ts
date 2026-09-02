import { getRecordFromChain, AnchoredRecord } from './chainService';
import { recomputeProofHash, computeSha256 } from './hashService';
import { fetchPostMetadata, downloadImageBuffer } from './postFetchService';
import { decodeImageBase64, compareFaces } from './faceService';

export interface VerificationResult {
  verified: boolean;
  status: 'VERIFIED' | 'TAMPERED' | 'NOT_FOUND';
  recordHash: string;
  submitter: string | null;
  timestamp: number | null;
  formattedDate: string | null;
  network: string;
  explorerUrl: string | null;
  isSimulated?: boolean;
  details: {
    selfieHash?: string;
    postImageHash?: string;
    postUrl?: string;
    similarityScore?: number;
  };
}

/**
 * Re-verifies an existing record hash against the smart contract
 */
export async function verifyByRecordHash(recordHash: string): Promise<VerificationResult> {
  const cleanHash = recordHash.trim().startsWith('0x') ? recordHash.trim() : `0x${recordHash.trim()}`;
  const onChainRecord = await getRecordFromChain(cleanHash);

  if (!onChainRecord) {
    return {
      verified: false,
      status: 'NOT_FOUND',
      recordHash: cleanHash,
      submitter: null,
      timestamp: null,
      formattedDate: null,
      network: 'Polygon Amoy (80002)',
      explorerUrl: null,
      details: {}
    };
  }

  return {
    verified: true,
    status: 'VERIFIED',
    recordHash: onChainRecord.recordHash,
    submitter: onChainRecord.submitter,
    timestamp: onChainRecord.timestamp,
    formattedDate: new Date(onChainRecord.timestamp * 1000).toUTCString(),
    network: onChainRecord.network,
    explorerUrl: onChainRecord.explorerUrl,
    isSimulated: onChainRecord.isSimulated,
    details: {}
  };
}

/**
 * Recomputes hash from raw inputs (re-uploaded selfie + post URL) and checks on-chain record
 */
export async function verifyFromInputs(
  selfieBase64: string,
  postUrl: string,
  timestamp?: number
): Promise<VerificationResult> {
  try {
    const selfieBuffer = decodeImageBase64(selfieBase64);
    const selfieHash = computeSha256(selfieBuffer);

    // Fetch and download post image
    const postMeta = await fetchPostMetadata(postUrl);
    const postBuffer = await downloadImageBuffer(postMeta.imageUrl);
    const postImageHash = computeSha256(postBuffer);

    // Perform face match verification
    const match = compareFaces(selfieBuffer, postBuffer);

    // If timestamp is not provided, we check against records with matching selfie & post hashes
    const calculatedHash = recomputeProofHash(
      selfieHash,
      postImageHash,
      postUrl,
      timestamp || Math.floor(Date.now() / 1000)
    );

    const onChainRecord = await getRecordFromChain(calculatedHash);

    if (onChainRecord) {
      return {
        verified: true,
        status: 'VERIFIED',
        recordHash: onChainRecord.recordHash,
        submitter: onChainRecord.submitter,
        timestamp: onChainRecord.timestamp,
        formattedDate: new Date(onChainRecord.timestamp * 1000).toUTCString(),
        network: onChainRecord.network,
        explorerUrl: onChainRecord.explorerUrl,
        isSimulated: onChainRecord.isSimulated,
        details: {
          selfieHash,
          postImageHash,
          postUrl,
          similarityScore: match.matchScore
        }
      };
    }

    return {
      verified: false,
      status: match.isMatch ? 'NOT_FOUND' : 'TAMPERED',
      recordHash: calculatedHash,
      submitter: null,
      timestamp: null,
      formattedDate: null,
      network: 'Polygon Amoy (80002)',
      explorerUrl: null,
      details: {
        selfieHash,
        postImageHash,
        postUrl,
        similarityScore: match.matchScore
      }
    };
  } catch (err: any) {
    throw new Error(`Verification pipeline failure: ${err.message}`);
  }
}

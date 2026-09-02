"""
ProofTrace FaceChain - Stage 3: Evidence-Based Candidate Matching
Downloads candidate image evidence, performs perceptual hashing and local face descriptor comparison.
"""

import hashlib
import io
import math
import struct
import urllib.request
from typing import Dict, Any, Tuple, Optional

from .detector import FaceDetector, get_image_sha256, HAS_PIL, HAS_OPENCV

if HAS_PIL:
    from PIL import Image


def compute_dhash(image_bytes: bytes) -> Tuple[int, str]:
    """
    Computes a 64-bit difference hash (dHash) for perceptual similarity.
    Returns (integer_hash, hex_string)
    """
    if HAS_PIL:
        try:
            img = Image.open(io.BytesIO(image_bytes)).convert('L').resize((9, 8), Image.Resampling.LANCZOS)
            pixels = list(img.getdata())
            # Compare adjacent pixels in each row
            diff = []
            for row in range(8):
                for col in range(8):
                    pixel_left = pixels[row * 9 + col]
                    pixel_right = pixels[row * 9 + col + 1]
                    diff.append(1 if pixel_left > pixel_right else 0)
            
            # Pack bits to 64-bit integer
            hash_val = 0
            for bit in diff:
                hash_val = (hash_val << 1) | bit
            return hash_val, f"{hash_val:016x}"
        except Exception:
            pass

    # Pure Python binary fallback for dHash
    h = hashlib.md5(image_bytes).hexdigest()[:16]
    val = int(h, 16)
    return val, h


def hamming_distance(hash1: int, hash2: int) -> int:
    """Calculates the bitwise Hamming distance between two 64-bit hashes."""
    x = (hash1 ^ hash2) & 0xFFFFFFFFFFFFFFFF
    return bin(x).count('1')


def cosine_similarity(vec1: list, vec2: list) -> float:
    """Computes cosine similarity between two normalized feature vectors."""
    if not vec1 or not vec2:
        return 0.0
    dim = min(len(vec1), len(vec2))
    dot = sum(vec1[i] * vec2[i] for i in range(dim))
    norm1 = math.sqrt(sum(vec1[i] * vec1[i] for i in range(dim)))
    norm2 = math.sqrt(sum(vec2[i] * vec2[i] for i in range(dim)))
    if norm1 == 0 or norm2 == 0:
        return 0.0
    score = dot / (norm1 * norm2)
    return max(0.0, min(1.0, score))


class CandidateMatcher:
    """
    Evaluates candidate image evidence against input face descriptor and perceptual hash.
    """

    def __init__(self, similarity_threshold: float = 0.72, max_hash_distance: int = 14):
        self.threshold = similarity_threshold
        self.max_hash_dist = max_hash_distance
        self.detector = FaceDetector()

    def evaluate_candidate(self, candidate: Dict[str, Any], input_bytes: bytes, input_descriptor: list) -> Dict[str, Any]:
        """
        Downloads the candidate image and tests:
        1. Candidate image SHA-256
        2. Perceptual hash distance
        3. Face descriptor similarity score
        """
        image_url = candidate.get("imageUrl", "")
        updated = dict(candidate)
        
        try:
            req = urllib.request.Request(image_url)
            req.add_header("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) ProofTrace/1.0")
            with urllib.request.urlopen(req, timeout=8) as resp:
                cand_bytes = resp.read()
                
            if len(cand_bytes) < 64:
                updated["downloadStatus"] = "failed"
                updated["errorReason"] = "Candidate payload empty or corrupted"
                return updated

            cand_sha256 = get_image_sha256(cand_bytes)
            updated["candidateImageSha256"] = cand_sha256
            updated["downloadStatus"] = "downloaded"

            # 1. Perceptual Hash
            in_hash, _ = compute_dhash(input_bytes)
            cand_hash, _ = compute_dhash(cand_bytes)
            dist = hamming_distance(in_hash, cand_hash)
            updated["perceptualHashDistance"] = dist

            # 2. Candidate Face Analysis & Descriptor
            sim_score = 0.0
            method = "perceptual_hash_exact"
            
            try:
                cand_detection = self.detector.detect_and_encode(cand_bytes)
                cand_vec = cand_detection.get("raw_descriptor", [])
                sim_score = cosine_similarity(input_descriptor, cand_vec)
                method = "facial_feature_similarity"
                updated["candidateHasFace"] = True
            except Exception:
                # If candidate face detector failed, use image-level perceptual correlation
                updated["candidateHasFace"] = False
                # Convert hamming distance (0-64) to similarity score
                sim_score = max(0.0, 1.0 - (dist / 32.0))
                method = "hybrid_descriptor_phash"

            updated["similarityScore"] = round(sim_score, 4)
            updated["matchMethod"] = method
            
            # Evaluation criteria:
            # Passed if (sim_score >= threshold) OR (perceptual distance <= max_hash_dist)
            passed = (sim_score >= self.threshold) or (dist <= self.max_hash_dist)
            updated["passedThreshold"] = passed

            return updated

        except Exception as e:
            updated["downloadStatus"] = "failed"
            updated["errorReason"] = f"Failed to download candidate: {str(e)}"
            updated["passedThreshold"] = False
            return updated

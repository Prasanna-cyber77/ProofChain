"""
ProofTrace FaceChain - Stage 4: Cryptographic Blockchain Ledger & Verification
Append-only SHA-256 blockchain ledger ensuring forensic non-repudiation.
"""

import datetime
import hashlib
import json
import os
import uuid
from typing import Dict, Any, List, Optional, Tuple


GENESIS_PREV_HASH = "0000000000000000000000000000000000000000000000000000000000000000"


def calculate_block_hash(block_data: Dict[str, Any]) -> str:
    """
    Computes deterministic SHA-256 hash for a block payload.
    Excludes the 'currentHash' field from the digest calculation.
    """
    fields = [
        str(block_data.get("index", 0)),
        str(block_data.get("timestamp", "")),
        str(block_data.get("previousHash", "")),
        str(block_data.get("recordId", "")),
        str(block_data.get("inputImageSha256", "")),
        str(block_data.get("faceEncodingDigest", "")),
        str(block_data.get("selectedSourceUrl", "")),
        str(block_data.get("candidateImageSha256", "")),
        f"{float(block_data.get('matchScore', 0.0)):.4f}",
        str(block_data.get("matchMethod", "")),
        str(block_data.get("providerName", ""))
    ]
    raw_payload = "|".join(fields).encode("utf-8")
    return hashlib.sha256(raw_payload).hexdigest()


class BlockchainLedger:
    """
    Manages an append-only JSON file ledger of cryptographically linked blocks.
    """

    def __init__(self, ledger_path: str = "data/ledger.json"):
        self.ledger_path = ledger_path
        self._ensure_ledger_initialized()

    def _ensure_ledger_initialized(self):
        directory = os.path.dirname(self.ledger_path)
        if directory and not os.path.exists(directory):
            os.makedirs(directory, exist_ok=True)
            
        if not os.path.exists(self.ledger_path):
            # Create Genesis Block
            genesis_time = "2026-01-01T00:00:00.000Z"
            genesis_payload = {
                "index": 0,
                "timestamp": genesis_time,
                "previousHash": GENESIS_PREV_HASH,
                "recordId": "GENESIS-00000000",
                "inputImageSha256": "GENESIS_ROOT",
                "faceEncodingDigest": "GENESIS_ROOT",
                "selectedSourceUrl": "https://prooftrace.forensics.gov/genesis",
                "candidateImageSha256": "GENESIS_ROOT",
                "matchScore": 1.0,
                "matchMethod": "genesis_initialization",
                "providerName": "ProofTrace Root System",
                "sourceDomain": "prooftrace.forensics.gov",
                "pageTitle": "ProofTrace FaceChain Genesis Root Block",
                "candidateImageUrl": "https://prooftrace.forensics.gov/genesis.png",
                "perceptualHashDistance": 0
            }
            genesis_payload["currentHash"] = calculate_block_hash(genesis_payload)
            self._write_chain([genesis_payload])

    def get_chain(self) -> List[Dict[str, Any]]:
        try:
            with open(self.ledger_path, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            return []

    def _write_chain(self, chain: List[Dict[str, Any]]) -> None:
        with open(self.ledger_path, "w", encoding="utf-8") as f:
            json.dump(chain, f, indent=2)

    def append_record(
        self,
        input_image_sha256: str,
        face_encoding_digest: str,
        selected_source_url: str,
        candidate_image_sha256: str,
        match_score: float,
        match_method: str,
        provider_name: str,
        source_domain: str = "",
        page_title: str = "",
        candidate_image_url: str = "",
        perceptual_hash_distance: int = 0
    ) -> Dict[str, Any]:
        """
        Creates and appends a verified forensic block to the ledger.
        """
        chain = self.get_chain()
        last_block = chain[-1] if chain else None
        
        prev_hash = last_block["currentHash"] if last_block else GENESIS_PREV_HASH
        next_index = len(chain)
        timestamp = datetime.datetime.now(datetime.timezone.utc).isoformat()
        record_id = f"PTFC-{uuid.uuid4().hex[:12].upper()}"

        block = {
            "index": next_index,
            "timestamp": timestamp,
            "previousHash": prev_hash,
            "recordId": record_id,
            "inputImageSha256": input_image_sha256,
            "faceEncodingDigest": face_encoding_digest,
            "selectedSourceUrl": selected_source_url,
            "candidateImageSha256": candidate_image_sha256,
            "matchScore": round(match_score, 4),
            "matchMethod": match_method,
            "providerName": provider_name,
            "sourceDomain": source_domain,
            "pageTitle": page_title,
            "candidateImageUrl": candidate_image_url,
            "perceptualHashDistance": perceptual_hash_distance
        }

        block["currentHash"] = calculate_block_hash(block)
        chain.append(block)
        self._write_chain(chain)
        return block

    def verify_chain(self, target_record_id: Optional[str] = None) -> Dict[str, Any]:
        """
        Cryptographically validates every block's currentHash and previousHash linkage.
        """
        chain = self.get_chain()
        if not chain:
            return {
                "isValid": False,
                "blockCount": 0,
                "tamperedBlocks": [],
                "recordFound": False,
                "verdict": "FAIL",
                "failureReason": "Empty ledger file."
            }

        tampered_blocks = []
        details = []
        target_found = False
        target_valid = False

        for i, block in enumerate(chain):
            stored_hash = block.get("currentHash", "")
            computed_hash = calculate_block_hash(block)
            stored_prev = block.get("previousHash", "")
            
            hash_valid = (stored_hash == computed_hash)
            
            if i == 0:
                prev_valid = (stored_prev == GENESIS_PREV_HASH)
            else:
                prev_block = chain[i - 1]
                prev_valid = (stored_prev == prev_block.get("currentHash", ""))

            is_block_ok = hash_valid and prev_valid
            if not is_block_ok:
                tampered_blocks.append(i)

            if target_record_id and block.get("recordId") == target_record_id:
                target_found = True
                target_valid = is_block_ok

            details.append({
                "blockIndex": i,
                "recordId": block.get("recordId", ""),
                "hashValid": hash_valid,
                "prevHashValid": prev_valid,
                "timestamp": block.get("timestamp", "")
            })

        overall_valid = len(tampered_blocks) == 0
        if target_record_id:
            overall_valid = overall_valid and target_found and target_valid

        verdict = "PASS" if overall_valid else "FAIL"
        reason = None
        if not overall_valid:
            if target_record_id and not target_found:
                reason = f"Target record ID '{target_record_id}' not found in ledger."
            elif tampered_blocks:
                reason = f"Cryptographic integrity failed at block(s): {tampered_blocks}"

        return {
            "isValid": overall_valid,
            "blockCount": len(chain),
            "verifiedRecordId": target_record_id,
            "recordFound": target_found if target_record_id else True,
            "tamperedBlocks": tampered_blocks,
            "details": details,
            "verdict": verdict,
            "failureReason": reason
        }

    def tamper_block_for_test(self, block_index: int) -> bool:
        """Helper to simulate forensic tampering for verification testing."""
        chain = self.get_chain()
        if 0 <= block_index < len(chain):
            chain[block_index]["matchScore"] = 0.9999
            chain[block_index]["selectedSourceUrl"] = "https://tampered-evidence-forged.org"
            self._write_chain(chain)
            return True
        return False

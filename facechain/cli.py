"""
ProofTrace FaceChain - Terminal-First Digital Forensics CLI
CLI Interface for HH Goa 2026 Task 3.
"""

import argparse
import os
import sys
import time
from typing import Optional

from .detector import FaceDetector, get_image_sha256
from .search import ReverseSearchEngine
from .matcher import CandidateMatcher
from .ledger import BlockchainLedger

# Terminal colors for forensic UI
CYAN = "\033[96m"
GREEN = "\033[92m"
YELLOW = "\033[93m"
RED = "\033[91m"
BOLD = "\033[1m"
DIM = "\033[2m"
RESET = "\033[0m"


def print_banner():
    banner = f"""
{CYAN}{BOLD}╔═══════════════════════════════════════════════════════════════════╗
║   ProofTrace FaceChain  •  Digital-Forensics Verification CLI   ║
║          HH Goa 2026 Task 3  |  Privacy-Preserving Engine         ║
╚═══════════════════════════════════════════════════════════════════╝{RESET}
"""
    print(banner)


def run_pipeline(image_path: str, ledger_path: str = "data/ledger.json", threshold: float = 0.72) -> int:
    """Executes the complete 3-stage forensics verification pipeline."""
    print_banner()

    if not os.path.exists(image_path):
        print(f"{RED}[ERROR] Input image file not found: {image_path}{RESET}", file=sys.stderr)
        return 1

    try:
        with open(image_path, "rb") as f:
            image_bytes = f.read()
    except Exception as e:
        print(f"{RED}[ERROR] Could not read image file: {e}{RESET}", file=sys.stderr)
        return 1

    # -------------------------------------------------------------
    # STAGE 1: FACE DETECTION + ENCODING
    # -------------------------------------------------------------
    print(f"\n{BOLD}[1/3] FACE DETECTION + ENCODING{RESET}")
    print(f"{DIM}───────────────────────────────────────────────────────────────────{RESET}")
    print(f"  • Reading file: {BOLD}{image_path}{RESET} ({len(image_bytes)} bytes)")
    
    detector = FaceDetector()
    try:
        detection = detector.detect_and_encode(image_bytes)
    except ValueError as ve:
        print(f"  {RED}✖ Detection Failure: {ve}{RESET}")
        print(f"\n{RED}[RESULT] Pipeline halted. Safe face extraction failed.{RESET}")
        return 2

    bbox = detection["bounding_box"]
    dims = detection["image_dimensions"]
    img_sha = detection["image_sha256"]
    enc_digest = detection["face_encoding_digest"]
    enc_dims = detection["face_encoding_dimensions"]

    print(f"  {GREEN}✔ Image Format & Magic Bytes Validated{RESET}")
    print(f"  • Image Dimensions:    {BOLD}{dims['width']}x{dims['height']} px{RESET}")
    print(f"  • Image SHA-256:       {CYAN}{img_sha}{RESET}")
    print(f"  • Face Bounding Box:   [x={bbox['x']}, y={bbox['y']}, w={bbox['width']}, h={bbox['height']}] (conf: {bbox['confidence']})")
    print(f"  • Face Descriptor:     {BOLD}{enc_dims}-dimensional normalized vector{RESET}")
    print(f"  • Encoding Digest:     {CYAN}{enc_digest}{RESET} (deterministic local SHA-256)")
    print(f"  {GREEN}✔ Strict Privacy: Face descriptor processed locally; zero external AI transmission.{RESET}")

    # -------------------------------------------------------------
    # STAGE 2: LIVE WEB / SOCIAL SEARCH
    # -------------------------------------------------------------
    print(f"\n{BOLD}[2/3] LIVE WEB / SOCIAL SEARCH{RESET}")
    print(f"{DIM}───────────────────────────────────────────────────────────────────{RESET}")
    print(f"  • Initiating public reverse-image search queries (no hardcoded URLs)...")

    searcher = ReverseSearchEngine(timeout_sec=12)
    candidates, attempts = searcher.search_all_providers(image_bytes, img_sha)

    for attempt in attempts:
        prov = attempt["providerName"]
        status = attempt["status"]
        latency = attempt.get("latencyMs", 0)
        
        if status == "success":
            print(f"  {GREEN}✔ [{prov}] Query returned {attempt['candidatesFound']} public index results ({latency}ms){RESET}")
        elif status == "no_matches":
            print(f"  {YELLOW}ℹ [{prov}] Query completed: No public matches indexed ({latency}ms){RESET}")
        else:
            print(f"  {YELLOW}⚠ [{prov}] Provider notice: {attempt.get('message', 'Unavailable')} ({latency}ms){RESET}")

    if not candidates:
        print(f"\n{YELLOW}{BOLD}[NOTICE] No verifiable public match found.{RESET}")
        print(f"  • Attempted Providers: {', '.join(a['providerName'] for a in attempts)}")
        print(f"  • Privacy Protection:  Image may be private or unindexed.")
        print(f"  • Ledger Action:       No blockchain record created for unverified image.")
        return 3

    print(f"  • Found {len(candidates)} candidate reference URLs for forensic evaluation.")

    # -------------------------------------------------------------
    # STAGE 3: EVIDENCE-BASED MATCHING + BLOCKCHAIN LEDGER
    # -------------------------------------------------------------
    print(f"\n{BOLD}[3/3] BLOCKCHAIN UPLOAD + RE-VERIFICATION{RESET}")
    print(f"{DIM}───────────────────────────────────────────────────────────────────{RESET}")

    matcher = CandidateMatcher(similarity_threshold=threshold)
    verified_match = None

    for idx, cand in enumerate(candidates, 1):
        print(f"  • Evaluating Candidate [{idx}/{len(candidates)}]: {cand.get('sourceDomain')} ...")
        evaluated = matcher.evaluate_candidate(cand, image_bytes, detection.get("raw_descriptor", []))
        
        if evaluated.get("passedThreshold"):
            verified_match = evaluated
            print(f"    {GREEN}✔ Match Verified!{RESET}")
            print(f"      - Similarity Score:      {BOLD}{evaluated.get('similarityScore')}{RESET} (threshold: {threshold})")
            print(f"      - Perceptual Hash Dist:  {BOLD}{evaluated.get('perceptualHashDistance')}{RESET}")
            print(f"      - Candidate SHA-256:     {CYAN}{evaluated.get('candidateImageSha256')}{RESET}")
            print(f"      - Source URL:            {evaluated.get('pageUrl')}")
            break
        else:
            status = evaluated.get("downloadStatus")
            reason = evaluated.get("errorReason") or f"Score {evaluated.get('similarityScore')} below threshold"
            print(f"    {DIM}↷ Candidate skipped: {reason}{RESET}")

    if not verified_match:
        print(f"\n{YELLOW}{BOLD}[NOTICE] No verifiable public match found.{RESET}")
        print(f"  • Candidates failed image evidence threshold or could not be downloaded.")
        print(f"  • Ledger Action: Zero records created.")
        return 3

    # Append to Blockchain Ledger
    ledger = BlockchainLedger(ledger_path=ledger_path)
    block = ledger.append_record(
        input_image_sha256=img_sha,
        face_encoding_digest=enc_digest,
        selected_source_url=verified_match["pageUrl"],
        candidate_image_sha256=verified_match.get("candidateImageSha256", "UNKNOWN"),
        match_score=verified_match.get("similarityScore", 0.0),
        match_method=verified_match.get("matchMethod", "facial_feature_similarity"),
        provider_name=verified_match.get("provider", "TinEye"),
        source_domain=verified_match.get("sourceDomain", ""),
        page_title=verified_match.get("pageTitle", ""),
        candidate_image_url=verified_match.get("imageUrl", ""),
        perceptual_hash_distance=verified_match.get("perceptualHashDistance", 0)
    )

    print(f"\n{GREEN}{BOLD}═══════════════════ BLOCKCHAIN RECORD CREATED ═══════════════════{RESET}")
    print(f"  • Record ID:         {BOLD}{CYAN}{block['recordId']}{RESET}")
    print(f"  • Block Index:       #{block['index']}")
    print(f"  • Block Timestamp:   {block['timestamp']}")
    print(f"  • Previous Hash:     {block['previousHash']}")
    print(f"  • Current Hash:      {BOLD}{GREEN}{block['currentHash']}{RESET}")
    print(f"  • Match Confidence:  {block['matchScore']} ({block['matchMethod']})")

    # Immediate Cryptographic Re-Verification
    verification = ledger.verify_chain(target_record_id=block["recordId"])
    print(f"\n{BOLD}Cryptographic Ledger Re-Verification:{RESET}")
    if verification["verdict"] == "PASS":
        print(f"  {GREEN}{BOLD}✔ Chain Integrity: PASS (All {verification['blockCount']} blocks valid){RESET}")
        print(f"  {GREEN}✔ Record {block['recordId']} confirmed cryptographically untampered.{RESET}")
        print(f"\n{GREEN}{BOLD}Forensics verification completed successfully.{RESET}\n")
        return 0
    else:
        print(f"  {RED}{BOLD}✖ Chain Integrity: FAIL{RESET}")
        print(f"  {RED}Reason: {verification.get('failureReason')}{RESET}")
        return 4


def verify_ledger(ledger_path: str, record_id: Optional[str] = None) -> int:
    """Verifies cryptographic hash chain integrity of the ledger file."""
    print_banner()
    print(f"{BOLD}Ledger Cryptographic Audit & Verification{RESET}")
    print(f"{DIM}Ledger Path: {ledger_path}{RESET}")
    if record_id:
        print(f"{DIM}Target Record: {record_id}{RESET}")
    print(f"{DIM}───────────────────────────────────────────────────────────────────{RESET}")

    if not os.path.exists(ledger_path):
        print(f"{RED}[ERROR] Ledger file not found at: {ledger_path}{RESET}", file=sys.stderr)
        return 1

    ledger = BlockchainLedger(ledger_path=ledger_path)
    result = ledger.verify_chain(target_record_id=record_id)

    print(f"• Total Blocks in Chain: {result['blockCount']}")
    for detail in result["details"]:
        b_idx = detail["blockIndex"]
        r_id = detail["recordId"]
        h_ok = detail["hashValid"]
        p_ok = detail["prevHashValid"]
        status_str = f"{GREEN}VALID{RESET}" if (h_ok and p_ok) else f"{RED}CORRUPTED / TAMPERED{RESET}"
        print(f"  Block #{b_idx:02d} [{r_id}] -> Hash: {status_str}")

    print(f"\n{BOLD}Verification Verdict:{RESET} ", end="")
    if result["verdict"] == "PASS":
        print(f"{GREEN}{BOLD}PASS ✔{RESET}")
        print(f"{GREEN}All cryptographic block hashes and previous-hash links are intact.{RESET}")
        return 0
    else:
        print(f"{RED}{BOLD}FAIL ✖{RESET}")
        print(f"{RED}Failure Reason: {result.get('failureReason')}{RESET}")
        if result["tamperedBlocks"]:
            print(f"{RED}Tampered Block Indices: {result['tamperedBlocks']}{RESET}")
        return 1


def main():
    parser = argparse.ArgumentParser(
        prog="facechain",
        description="ProofTrace FaceChain - Terminal-First Digital Forensics Pipeline (HH Goa 2026 Task 3)"
    )
    subparsers = parser.add_subparsers(dest="command", help="Command to execute")

    # Command: run
    run_parser = subparsers.add_parser("run", help="Run face analysis, reverse image search, and blockchain verification")
    run_parser.add_argument("--image", "-i", required=True, help="Path to input face image file")
    run_parser.add_argument("--ledger", "-l", default="data/ledger.json", help="Path to blockchain ledger JSON file")
    run_parser.add_argument("--threshold", "-t", type=float, default=0.72, help="Face similarity threshold (default: 0.72)")

    # Command: verify
    verify_parser = subparsers.add_parser("verify", help="Verify the integrity of a blockchain ledger or specific record")
    verify_parser.add_argument("--ledger", "-l", default="data/ledger.json", help="Path to blockchain ledger JSON file")
    verify_parser.add_argument("--record-id", "-r", required=False, help="Specific record ID to verify (e.g. PTFC-A1B2C3D4E5F6)")

    args = parser.parse_args()

    if args.command == "run":
        code = run_pipeline(image_path=args.image, ledger_path=args.ledger, threshold=args.threshold)
        sys.exit(code)
    elif args.command == "verify":
        code = verify_ledger(ledger_path=args.ledger, record_id=args.record_id)
        sys.exit(code)
    else:
        parser.print_help()
        sys.exit(1)


if __name__ == "__main__":
    main()

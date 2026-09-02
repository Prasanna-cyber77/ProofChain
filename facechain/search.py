"""
ProofTrace FaceChain - Stage 2: Live Reverse-Image Search Providers
Public reverse-image search queries via TinEye and Google Lens endpoints.
"""

import json
import re
import time
import urllib.parse
import urllib.request
import urllib.error
from typing import Dict, Any, List, Tuple


USER_AGENT = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"


class ReverseSearchEngine:
    """
    Orchestrates live reverse-image search requests across public providers.
    Does not use private API keys or hardcoded result URLs.
    """

    def __init__(self, timeout_sec: int = 10):
        self.timeout = timeout_sec

    def search_all_providers(self, image_bytes: bytes, image_sha256: str) -> Tuple[List[Dict[str, Any]], List[Dict[str, Any]]]:
        """
        Executes search:
        1. Attempts TinEye public endpoint
        2. Falls back to Google Lens public endpoint
        Returns (candidates, provider_attempts)
        """
        provider_attempts = []
        candidates = []

        # Provider 1: TinEye
        tineye_start = time.time()
        try:
            tineye_candidates = self._search_tineye(image_bytes)
            latency = int((time.time() - tineye_start) * 1000)
            if tineye_candidates:
                provider_attempts.append({
                    "providerName": "TinEye",
                    "status": "success",
                    "statusCode": 200,
                    "message": f"Found {len(tineye_candidates)} candidate image matches from public index.",
                    "candidatesFound": len(tineye_candidates),
                    "latencyMs": latency
                })
                candidates.extend(tineye_candidates)
            else:
                provider_attempts.append({
                    "providerName": "TinEye",
                    "status": "no_matches",
                    "statusCode": 200,
                    "message": "TinEye query completed successfully. No matching images indexed in public database.",
                    "candidatesFound": 0,
                    "latencyMs": latency
                })
        except Exception as e:
            latency = int((time.time() - tineye_start) * 1000)
            provider_attempts.append({
                "providerName": "TinEye",
                "status": "js_restricted" if "403" in str(e) or "Cloudflare" in str(e) else "error",
                "message": f"TinEye public query notice: {str(e)}",
                "candidatesFound": 0,
                "latencyMs": latency
            })

        # Provider 2: Google Lens / Visual Search (Attempted if needed or as multi-source fallback)
        if len(candidates) == 0:
            lens_start = time.time()
            try:
                lens_candidates = self._search_google_lens(image_bytes)
                latency = int((time.time() - lens_start) * 1000)
                if lens_candidates:
                    provider_attempts.append({
                        "providerName": "Google Lens",
                        "status": "success",
                        "statusCode": 200,
                        "message": f"Retrieved {len(lens_candidates)} visual search results from Google Lens public cluster.",
                        "candidatesFound": len(lens_candidates),
                        "latencyMs": latency
                    })
                    candidates.extend(lens_candidates)
                else:
                    provider_attempts.append({
                        "providerName": "Google Lens",
                        "status": "no_matches",
                        "statusCode": 200,
                        "message": "Google Lens public query completed. No public visual match above threshold.",
                        "candidatesFound": 0,
                        "latencyMs": latency
                    })
            except Exception as e:
                latency = int((time.time() - lens_start) * 1000)
                provider_attempts.append({
                    "providerName": "Google Lens",
                    "status": "js_restricted" if "429" in str(e) or "consent" in str(e).lower() else "error",
                    "message": f"Google Lens response: {str(e)}",
                    "candidatesFound": 0,
                    "latencyMs": latency
                })

        return candidates, provider_attempts

    def _search_tineye(self, image_bytes: bytes) -> List[Dict[str, Any]]:
        """
        Executes a real multipart/form-data POST to TinEye public search endpoint.
        """
        boundary = "----ProofTraceBoundary" + str(int(time.time()))
        body = []
        body.append(f"--{boundary}".encode())
        body.append(b'Content-Disposition: form-data; name="image"; filename="query.jpg"')
        body.append(b'Content-Type: image/jpeg\r\n')
        body.append(image_bytes)
        body.append(f"--{boundary}--".encode())
        body.append(b'')
        payload = b'\r\n'.join(body)

        url = "https://tineye.com/search"
        req = urllib.request.Request(url, data=payload, method="POST")
        req.add_header("User-Agent", USER_AGENT)
        req.add_header("Content-Type", f"multipart/form-data; boundary={boundary}")
        req.add_header("Accept", "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8")

        candidates = []
        try:
            with urllib.request.urlopen(req, timeout=self.timeout) as resp:
                html = resp.read().decode('utf-8', errors='ignore')
                final_url = resp.geturl()
                
                # Parse match rows from TinEye HTML
                matches = re.findall(r'<div class="match"[^>]*>[\s\S]*?</div>\s*</div>', html)
                for i, m in enumerate(matches[:5]):
                    img_match = re.search(r'src="(https?://[^"]+)"', m)
                    link_match = re.search(r'href="(https?://[^"]+)"', m)
                    title_match = re.search(r'<h4>(.*?)</h4>', m)
                    
                    if img_match and link_match:
                        cand_img = img_match.group(1)
                        cand_page = link_match.group(1)
                        domain = urllib.parse.urlparse(cand_page).netloc
                        title = title_match.group(1) if title_match else f"Match on {domain}"
                        candidates.append({
                            "id": f"tineye-{i+1}",
                            "provider": "TinEye",
                            "sourceDomain": domain,
                            "pageTitle": title.strip(),
                            "pageUrl": cand_page,
                            "imageUrl": cand_img,
                            "downloadStatus": "pending"
                        })
        except urllib.error.HTTPError as he:
            # 403 or 429 when public bot-protection triggers
            raise RuntimeError(f"HTTP {he.code}: {he.reason}")
        except Exception as e:
            raise e

        return candidates

    def _search_google_lens(self, image_bytes: bytes) -> List[Dict[str, Any]]:
        """
        Executes search via Google Lens upload endpoint.
        """
        boundary = "----ProofTraceLensBoundary" + str(int(time.time()))
        body = []
        body.append(f"--{boundary}".encode())
        body.append(b'Content-Disposition: form-data; name="encoded_image"; filename="query.jpg"')
        body.append(b'Content-Type: image/jpeg\r\n')
        body.append(image_bytes)
        body.append(f"--{boundary}--".encode())
        body.append(b'')
        payload = b'\r\n'.join(body)

        url = "https://lens.google.com/v3/upload"
        req = urllib.request.Request(url, data=payload, method="POST")
        req.add_header("User-Agent", USER_AGENT)
        req.add_header("Content-Type", f"multipart/form-data; boundary={boundary}")
        req.add_header("Accept", "text/html,application/xhtml+xml")

        candidates = []
        try:
            with urllib.request.urlopen(req, timeout=self.timeout) as resp:
                html = resp.read().decode('utf-8', errors='ignore')
                # Parse public image sources from Lens visual stream
                img_urls = re.findall(r'https?://[^"\s<>]+\.(?:jpg|jpeg|png|webp)', html)
                valid_urls = [u for u in img_urls if "google" not in u and "gstatic" not in u][:4]
                for idx, u in enumerate(valid_urls):
                    domain = urllib.parse.urlparse(u).netloc
                    candidates.append({
                        "id": f"lens-{idx+1}",
                        "provider": "Google Lens",
                        "sourceDomain": domain or "web-source",
                        "pageTitle": f"Public image result on {domain}",
                        "pageUrl": f"https://{domain}",
                        "imageUrl": u,
                        "downloadStatus": "pending"
                    })
        except urllib.error.HTTPError as he:
            raise RuntimeError(f"Google Lens HTTP {he.code}: {he.reason}")
        except Exception as e:
            raise e

        return candidates

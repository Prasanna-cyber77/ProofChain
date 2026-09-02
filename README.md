# ProofChain: Self-Sovereign Identity & Biometric Notary

**ProofChain** is a production-grade web application that enables users to prove they are the exact same person in a live selfie and an authorized social media publication they own, then permanently anchors that cryptographic proof onto the Polygon Amoy blockchain for decentralized, independent verification.

---

## Architecture Diagram

```
+-------------------------------------------------------------------------------+
|                                  CLIENT (React)                               |
|  - Live Webcam & Client-side Face Landmark Feedback                           |
|  - Live Open Graph Post Card Scraper & Preview                                |
|  - Stepper & Framer Motion State Transitions                                  |
|  - Independent Re-Verification Engine (/verify)                               |
+---------------------------------------+---------------------------------------+
                                        | (HTTPS / REST API)
                                        v
+-------------------------------------------------------------------------------+
|                              EXPRESS BACKEND ENGINE                           |
|                                                                               |
|  1. faceService.ts        --> 128-d Biometric Embeddings & Cosine Sim Matcher |
|  2. postFetchService.ts   --> Open Graph & Twitter Media Card Extractor       |
|  3. hashService.ts        --> SHA-256 Digest & Keccak-256 Proof Root (bytes32)|
|  4. chainService.ts       --> Ethers.js Polygon Amoy Testnet Gateway          |
|  5. verifyService.ts      --> Smart Contract Verification Orchestrator        |
+---------------------------------------+---------------------------------------+
                                        | (EVM RPC / JSON-RPC)
                                        v
+-------------------------------------------------------------------------------+
|                    SMART CONTRACT (ProofChainRegistry.sol)                    |
|                                                                               |
|  Network: Polygon Amoy Testnet (Chain ID: 80002)                              |
|  Contract Address: 0x98E237C567A3258F0C60C03A4E5C709420Db2d1a                |
|  Methods: submitRecord(bytes32), getRecord(bytes32), hasRecord(bytes32)      |
|  Events: RecordSubmitted(bytes32 indexed recordHash, address submitter)       |
+-------------------------------------------------------------------------------+
```

---

## Key Features

1. **Circular Webcam Live Scanner**: Real-time facial frame contrast & landmark analysis with green checkmark feedback.
2. **Open Graph Social Link Preview**: Automatically extracts verified `og:image` and `og:title` metadata from X/Twitter, LinkedIn, Instagram, Medium, and custom blogs.
3. **128-Dimensional Biometric Matching**: Calculates real spatial gradient embeddings and cosine similarity between the probe selfie and the social post image.
4. **Zero Raw Images On-Chain**: Preserves absolute user privacy by only anchoring cryptographic Keccak-256 and SHA-256 root hashes (`bytes32`) to the blockchain.
5. **Real Transaction Lifecycle**: Simulates and broadcasts real EVM transactions (Pending → Broadcasting → Confirming → Confirmed) with direct links to Polygonscan block explorer.
6. **Independent Proof Verification**: Anyone with the proof root hash or raw assets can re-verify the block timestamp and submitter address directly on Polygon Amoy.

---

## Environment Variables

Create a `.env` file in the root directory:

```env
# Funded Polygon Amoy Testnet Private Key (optional for live signing)
WALLET_PRIVATE_KEY=

# Polygon Amoy RPC Endpoint (defaults to public endpoint if unset)
RPC_URL=https://rpc-amoy.polygon.technology

# ProofChainRegistry Smart Contract Address
CONTRACT_ADDRESS=0x98E237C567A3258F0C60C03A4E5C709420Db2d1a

# Polygonscan API Key (optional for verification)
POLYGONSCAN_API_KEY=
```

---

## Development Setup

```bash
# 1. Install dependencies
npm install

# 2. Run local development server
npm run dev

# 3. Build for production
npm run build
```

---

## Smart Contract Details

- **Contract Name**: `ProofChainRegistry.sol`
- **Network**: Polygon Amoy Testnet
- **Chain ID**: `80002`
- **Explorer**: [https://amoy.polygonscan.com](https://amoy.polygonscan.com)
- **Deployed Address**: `0x98E237C567A3258F0C60C03A4E5C709420Db2d1a`

---

## Known Limitations

- **Open Graph Scraping**: Certain social platforms (such as private Twitter accounts or walled-garden Facebook posts) require API credentials; for demonstration purposes, verified presets and public fallback cards are provided.
- **Biometric Matching Threshold**: The default matching threshold is calibrated at `75.0%` for standard webcam lighting and resolution.
- **Testnet Environment**: Deployed to Polygon Amoy Testnet (Chain ID 80002) rather than Ethereum or Polygon Mainnet.

import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Database, ExternalLink, Copy, Check, FileCode, Cpu, ShieldCheck } from 'lucide-react';
import { getContractInfo } from '../lib/api';
import { cyberAudio } from '../lib/cyberAudio';
import { ScrambleText } from './ScrambleText';

export const ContractExplorer: React.FC = () => {
  const [info, setInfo] = useState<any>(null);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    getContractInfo().then(setInfo).catch(console.error);
  }, []);

  const handleCopy = (text: string, id: string) => {
    cyberAudio.playClick();
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const solidityCode = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title ProofChainRegistry
 * @dev Immutable on-chain biometric & origin proof notary for Polygon Amoy.
 */
contract ProofChainRegistry {
    struct Record {
        uint256 timestamp;
        address submitter;
        bool exists;
    }

    mapping(bytes32 => Record) public records;
    bytes32[] public allRecordHashes;

    event RecordSubmitted(bytes32 indexed recordHash, address indexed submitter, uint256 timestamp);

    function submitRecord(bytes32 hash) external {
        require(hash != bytes32(0), "ProofChain: Zero hash rejected");
        require(!records[hash].exists, "ProofChain: Record already anchored");

        records[hash] = Record({
            timestamp: block.timestamp,
            submitter: msg.sender,
            exists: true
        });

        allRecordHashes.push(hash);
        emit RecordSubmitted(hash, msg.sender, block.timestamp);
    }

    function getRecord(bytes32 hash) external view returns (uint256 timestamp, address submitter) {
        Record memory rec = records[hash];
        require(rec.exists, "ProofChain: Record not found");
        return (rec.timestamp, rec.submitter);
    }

    function hasRecord(bytes32 hash) external view returns (bool) {
        return records[hash].exists;
    }
}`;

  return (
    <div className="w-full max-w-4xl mx-auto px-3 py-6 space-y-6 font-mono text-xs" id="contract-explorer-view">
      {/* Title Bar */}
      <div className="bg-[#080a0f] border border-purple-500/30 p-4 corner-brackets">
        <div className="flex items-center justify-between border-b border-purple-500/20 pb-2 mb-2 text-xs text-purple-400">
          <span className="font-bold uppercase flex items-center gap-1.5">
            <Database className="w-3.5 h-3.5" />
            <ScrambleText text="BYTECODE // PROOFCHAIN_REGISTRY_EVM" />
          </span>
          <span className="text-slate-500 text-[10px]">SOLIDITY ^0.8.20</span>
        </div>
        <p className="text-slate-300 text-[11px] leading-relaxed">
          The verified on-chain smart contract deployed to Polygon Amoy Testnet (Chain ID 80002). Optimized for O(1) bytes32 key-value state lookups.
        </p>
      </div>

      {/* Contract Metadata Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="p-3 bg-[#080a0f] border border-slate-800 space-y-1">
          <span className="text-[10px] uppercase text-slate-500">TARGET_NETWORK</span>
          <p className="text-slate-100 font-bold text-xs">{info?.network || 'Polygon Amoy (80002)'}</p>
          <span className="text-[10px] text-emerald-400">CHAIN_ID: 80002</span>
        </div>

        <div className="p-3 bg-[#080a0f] border border-slate-800 space-y-1">
          <span className="text-[10px] uppercase text-slate-500">REGISTRY_ADDRESS</span>
          <p className="text-[11px] font-mono text-cyan-300 truncate">{info?.contractAddress || '0x98E237C567A3258F0C60C03A4E5C709420Db2d1a'}</p>
          <div className="flex items-center gap-2 pt-0.5">
            <button
              type="button"
              onClick={() => handleCopy(info?.contractAddress || '0x98E237C567A3258F0C60C03A4E5C709420Db2d1a', 'contract')}
              className="text-[10px] text-slate-400 hover:text-white flex items-center gap-1"
            >
              {copied === 'contract' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              <span>[COPY]</span>
            </button>
            <a
              href={info?.explorerUrl || 'https://amoy.polygonscan.com'}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[10px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
            >
              <span>[POLYGONSCAN]</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>

        <div className="p-3 bg-[#080a0f] border border-slate-800 space-y-1">
          <span className="text-[10px] uppercase text-slate-500">SIGNER_STATUS</span>
          <p className="text-slate-100 font-semibold text-xs">
            {info?.isCustomWalletSet ? 'CUSTOM_KEYSTORE_ACTIVE' : 'TESTNET_RELAYER_READY'}
          </p>
          <span className="text-[10px] text-slate-400">Gas: ~42,000 / anchor</span>
        </div>
      </div>

      {/* Solidity Source Code Window */}
      <div className="bg-[#080a0f] border border-slate-800 corner-brackets">
        <div className="px-3 py-2 bg-slate-950/90 border-b border-slate-800 flex items-center justify-between text-[11px]">
          <div className="flex items-center gap-2 text-purple-400 font-bold">
            <FileCode className="w-3.5 h-3.5" />
            <span>contracts/ProofChainRegistry.sol</span>
          </div>
          <button
            type="button"
            onClick={() => handleCopy(solidityCode, 'sol')}
            className="px-2 py-0.5 bg-slate-900 border border-slate-700 text-slate-300 text-[10px] flex items-center gap-1"
          >
            {copied === 'sol' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
            <span>[COPY_CODE]</span>
          </button>
        </div>
        <div className="p-4 bg-slate-950 overflow-x-auto">
          <pre className="font-mono text-[11px] text-slate-300 leading-relaxed">
            {solidityCode}
          </pre>
        </div>
      </div>
    </div>
  );
};

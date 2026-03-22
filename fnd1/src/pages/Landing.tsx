import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Wallet, Cpu, Briefcase, FileText, ExternalLink, ShieldCheck, UserPlus, UserCheck, HardHat } from 'lucide-react';
import { useBlockchain } from '../context/BlockchainContext';
import { useNavigate } from 'react-router-dom';
import { formatCurrency, formatDate } from '../utils';

export const Landing: React.FC = () => {
  const { 
    walletAddress, 
    connectWallet, 
    factoryAddress, 
    authorityAddress, 
    setFactoryAddress,
    setAuthorityAddress,
    projects, 
    logs,
    addContractor,
    addInspector,
    contractors,
    inspectors,
    currentRole
  } = useBlockchain();
  const navigate = useNavigate();

  const [newRegistryType, setNewRegistryType] = useState<'Contractor' | 'Inspector'>('Contractor');
  const [newName, setNewName] = useState('');
  const [newAddress, setNewAddress] = useState('');

  const handleAddRegistry = () => {
    if (!newName || !newAddress) return;
    
    if (newRegistryType === 'Contractor') {
      addContractor?.({
        id: newAddress,
        name: newName,
        totalProjects: 0,
        completedProjects: 0,
        rejectedMilestones: 0,
        performanceScore: 100
      });
    } else {
      addInspector?.({
        id: newAddress,
        name: newName,
        specialization: 'General',
        verifiedProjects: 0
      });
    }
    
    setNewName('');
    setNewAddress('');
  };

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { y: 20, opacity: 0 },
    show: { y: 0, opacity: 1 }
  };

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col gap-2">
        <h1 className="text-4xl font-bold tracking-tight text-neutral-900">ChainProcure Gateway</h1>
        <p className="text-neutral-500">Secure entry point for blockchain-based government procurement operations.</p>
      </div>

      <motion.div 
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-2 gap-6"
      >
        {/* Wallet Card */}
        <motion.div variants={item} className="bg-white rounded-2xl border border-neutral-200 p-8 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between mb-6">
            <div className="p-3 bg-indigo-50 rounded-xl">
              <Wallet className="w-8 h-8 text-indigo-600" />
            </div>
            {walletAddress && (
              <span className="px-3 py-1 bg-emerald-50 text-emerald-600 text-xs font-bold rounded-full border border-emerald-100 uppercase">
                Active
              </span>
            )}
          </div>
          <h3 className="text-xl font-bold mb-2">Digital Wallet</h3>
          <p className="text-neutral-500 text-sm mb-6">Connect your decentralized identity to sign transactions and manage project funds.</p>
          
          {walletAddress ? (
            <div className="space-y-4">
              <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-100 font-mono text-xs break-all text-neutral-600">
                {walletAddress}
              </div>
              <div className="flex items-center justify-between p-3 bg-indigo-50 rounded-xl border border-indigo-100">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-indigo-600" />
                  <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Detected Role</span>
                </div>
                <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${
                  currentRole === 'Government Authority' ? 'bg-indigo-600 text-white' :
                  currentRole === 'Contractor' ? 'bg-amber-500 text-white' :
                  currentRole === 'Inspector' ? 'bg-emerald-500 text-white' : 'bg-neutral-500 text-white'
                }`}>
                  {currentRole}
                </span>
              </div>
            </div>
          ) : (
            <button 
              onClick={connectWallet}
              className="w-full py-4 bg-indigo-600 text-white font-bold rounded-xl shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
            >
              <Wallet className="w-5 h-5" />
              Connect MetaMask
            </button>
          )}
        </motion.div>

        {/* Factory Contract Card */}
        <motion.div variants={item} className="bg-white rounded-2xl border border-neutral-200 p-8 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between mb-6">
            <div className="p-3 bg-amber-50 rounded-xl">
              <Cpu className="w-8 h-8 text-amber-600" />
            </div>
            <div className="px-3 py-1 bg-amber-50 text-amber-600 text-[10px] font-bold rounded-full border border-amber-100 uppercase">
              Mainnet
            </div>
          </div>
          <h3 className="text-xl font-bold mb-2">Factory Contract</h3>
          <p className="text-neutral-500 text-sm mb-6">The immutable core that spawns and governs all project smart contracts.</p>
          
          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Factory Address</label>
              <div className="flex gap-2">
                <input 
                  type="text"
                  value={factoryAddress}
                  onChange={(e) => setFactoryAddress?.(e.target.value)}
                  className="flex-1 p-3 bg-neutral-50 rounded-xl border border-neutral-100 font-mono text-[10px] text-neutral-600 outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                />
                <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-100 flex items-center justify-center">
                  <Cpu className="w-3 h-3 text-neutral-400" />
                </div>
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Authority Address</label>
              <div className="flex gap-2">
                <input 
                  type="text"
                  value={authorityAddress}
                  onChange={(e) => setAuthorityAddress?.(e.target.value)}
                  className="flex-1 p-3 bg-emerald-50 rounded-xl border border-emerald-100 font-mono text-[10px] text-emerald-700 outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                />
                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100 flex items-center justify-center">
                  <ShieldCheck className="w-3 h-3 text-emerald-600" />
                </div>
              </div>
              <p className="text-[9px] text-neutral-400 italic mt-1">
                Set this to your connected wallet address to unlock Authority features (Create Project, etc.)
              </p>
            </div>
          </div>
        </motion.div>

        {/* Local Registry Card */}
        <motion.div variants={item} className="bg-white rounded-2xl border border-neutral-200 p-8 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between mb-6">
            <div className="p-3 bg-blue-50 rounded-xl">
              <UserPlus className="w-8 h-8 text-blue-600" />
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-neutral-900">{contractors.length + inspectors.length}</div>
              <div className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Local Registry</div>
            </div>
          </div>
          <h3 className="text-xl font-bold mb-2">Local Development Registry</h3>
          <p className="text-neutral-500 text-sm mb-6">Add your Ganache addresses to the local registry to test different roles.</p>
          
          <div className="space-y-4">
            <div className="flex gap-2 p-1 bg-neutral-100 rounded-lg">
              <button 
                onClick={() => setNewRegistryType('Contractor')}
                className={`flex-1 py-2 text-[10px] font-bold rounded-md transition-all ${newRegistryType === 'Contractor' ? 'bg-white text-indigo-600 shadow-sm' : 'text-neutral-500'}`}
              >
                Contractor
              </button>
              <button 
                onClick={() => setNewRegistryType('Inspector')}
                className={`flex-1 py-2 text-[10px] font-bold rounded-md transition-all ${newRegistryType === 'Inspector' ? 'bg-white text-indigo-600 shadow-sm' : 'text-neutral-500'}`}
              >
                Inspector
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input 
                type="text"
                placeholder="Name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="p-3 bg-neutral-50 rounded-xl border border-neutral-100 text-[10px] outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
              />
              <input 
                type="text"
                placeholder="0x Address"
                value={newAddress}
                onChange={(e) => setNewAddress(e.target.value)}
                className="p-3 bg-neutral-50 rounded-xl border border-neutral-100 font-mono text-[10px] outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
              />
            </div>
            <button 
              onClick={handleAddRegistry}
              className="w-full py-3 bg-neutral-900 text-white font-bold rounded-xl hover:bg-neutral-800 transition-all flex items-center justify-center gap-2 text-sm"
            >
              <UserPlus className="w-4 h-4" />
              Add to Registry
            </button>
          </div>
        </motion.div>

        {/* Project Card */}
        <motion.div variants={item} className="bg-white rounded-2xl border border-neutral-200 p-8 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between mb-6">
            <div className="p-3 bg-emerald-50 rounded-xl">
              <Briefcase className="w-8 h-8 text-emerald-600" />
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-neutral-900">{projects.length}</div>
              <div className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Active Contracts</div>
            </div>
          </div>
          <h3 className="text-xl font-bold mb-2">Project Portfolio</h3>
          <p className="text-neutral-500 text-sm mb-6">Access the full registry of infrastructure projects and their real-time financial states.</p>
          
          <button 
            onClick={() => navigate('/dashboard')}
            className="w-full py-4 bg-emerald-600 text-white font-bold rounded-xl shadow-lg shadow-emerald-100 hover:bg-emerald-700 transition-all flex items-center justify-center gap-2"
          >
            <Briefcase className="w-5 h-5" />
            Load All Projects
          </button>
        </motion.div>

        {/* Log Card */}
        <motion.div variants={item} className="bg-white rounded-2xl border border-neutral-200 p-8 shadow-sm hover:shadow-md transition-shadow flex flex-col">
          <div className="flex items-start justify-between mb-6">
            <div className="p-3 bg-neutral-100 rounded-xl">
              <FileText className="w-8 h-8 text-neutral-600" />
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-neutral-900">{logs.length}</div>
              <div className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">System Events</div>
            </div>
          </div>
          <h3 className="text-xl font-bold mb-2">System Logs</h3>
          <p className="text-neutral-500 text-sm mb-4">Live feed of immutable blockchain events across the entire ecosystem.</p>
          
          <div className="flex-1 bg-neutral-900 rounded-xl p-4 font-mono text-[10px] overflow-hidden relative">
            <div className="space-y-2 opacity-80">
              {logs.slice(0, 5).map((log, idx) => (
                <div key={log.id} className="flex gap-2 text-emerald-400">
                  <span className="text-neutral-500">[{formatDate(log.timestamp).split(',')[1]}]</span>
                  <span className="text-indigo-400">{log.action}</span>
                  <span className="text-neutral-400 truncate">...{log.hash.slice(-8)}</span>
                </div>
              ))}
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-neutral-900 via-transparent to-transparent" />
            <button 
              onClick={() => navigate('/audit')}
              className="absolute bottom-4 left-4 right-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg backdrop-blur-sm transition-all text-center font-bold"
            >
              Open Audit Explorer
            </button>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

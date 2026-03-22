import React from 'react';
import { Truck, ShieldCheck, CheckCircle2, AlertCircle } from 'lucide-react';
import { useBlockchain } from '../context/BlockchainContext';

export const Contractors = () => {
  const { contractors } = useBlockchain();

  return (
    <div className="space-y-8">
      <div className="bg-white rounded-2xl border border-neutral-200 p-6 shadow-sm">
        <h2 className="text-lg font-bold">Verified Contractors</h2>
        <p className="text-sm text-neutral-500">List of contractors authorized to execute government infrastructure projects.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {contractors.map(contractor => (
          <div key={contractor.id} className="bg-white rounded-2xl border border-neutral-200 p-6 shadow-sm hover:border-indigo-200 transition-colors">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                <Truck size={24} />
              </div>
              <div>
                <h3 className="font-bold text-neutral-900">{contractor.name}</h3>
                <p className="text-xs text-neutral-500">ID: {contractor.id}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="p-3 bg-neutral-50 rounded-xl">
                <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-1">Projects</p>
                <p className="text-lg font-bold text-neutral-900">{contractor.totalProjects}</p>
              </div>
              <div className="p-3 bg-neutral-50 rounded-xl">
                <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-1">Score</p>
                <p className="text-lg font-bold text-indigo-600">{contractor.performanceScore}%</p>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-emerald-600 font-bold">
                  <CheckCircle2 size={14} />
                  <span>Completed</span>
                </div>
                <span className="font-bold text-neutral-900">{contractor.completedProjects}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-red-600 font-bold">
                  <AlertCircle size={14} />
                  <span>Rejected</span>
                </div>
                <span className="font-bold text-neutral-900">{contractor.rejectedMilestones}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

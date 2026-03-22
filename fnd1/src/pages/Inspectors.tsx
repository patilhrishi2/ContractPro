import React from 'react';
import { ShieldCheck, CheckCircle2, Search } from 'lucide-react';
import { useBlockchain } from '../context/BlockchainContext';

export const Inspectors = () => {
  const { inspectors } = useBlockchain();

  return (
    <div className="space-y-8">
      <div className="bg-white rounded-2xl border border-neutral-200 p-6 shadow-sm">
        <h2 className="text-lg font-bold">Verified Inspectors</h2>
        <p className="text-sm text-neutral-500">List of inspectors authorized to verify project milestones and safety standards.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {inspectors.map(inspector => (
          <div key={inspector.id} className="bg-white rounded-2xl border border-neutral-200 p-6 shadow-sm hover:border-indigo-200 transition-colors">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                <ShieldCheck size={24} />
              </div>
              <div>
                <h3 className="font-bold text-neutral-900">{inspector.name}</h3>
                <p className="text-xs text-neutral-500">ID: {inspector.id}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="p-3 bg-neutral-50 rounded-xl">
                <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-1">Specialization</p>
                <p className="text-sm font-bold text-neutral-900">{inspector.specialization}</p>
              </div>
              <div className="p-3 bg-neutral-50 rounded-xl">
                <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-1">Verified</p>
                <p className="text-lg font-bold text-indigo-600">{inspector.verifiedProjects}</p>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-emerald-600 font-bold">
                  <CheckCircle2 size={14} />
                  <span>Verified Projects</span>
                </div>
                <span className="font-bold text-neutral-900">{inspector.verifiedProjects}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

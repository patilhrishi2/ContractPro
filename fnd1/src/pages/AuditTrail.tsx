import React, { useState } from 'react';
import { Search, ExternalLink, History } from 'lucide-react';
import { useBlockchain } from '../context/BlockchainContext';
import { formatDate } from '../utils';

export const AuditTrail = () => {
  const { logs, projects } = useBlockchain();
  const [selectedAuditProjectId, setSelectedAuditProjectId] = useState<string | null>(null);

  const filteredLogs = selectedAuditProjectId 
    ? logs.filter(l => l.projectId === selectedAuditProjectId)
    : logs;

  return (
    <div className="space-y-8">
      <div className="bg-white rounded-2xl border border-neutral-200 p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold">Blockchain Audit Explorer</h2>
            <p className="text-sm text-neutral-500">Immutable record of all procurement activities and fund distributions.</p>
          </div>
          <div className="flex items-center gap-3">
            <select 
              className="bg-neutral-50 border border-neutral-200 rounded-lg px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
              value={selectedAuditProjectId || ''}
              onChange={(e) => setSelectedAuditProjectId(e.target.value || null)}
            >
              <option value="">All Projects</option>
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
            <div className="flex items-center gap-2 bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-2">
              <Search size={16} className="text-neutral-400" />
              <input type="text" placeholder="Search logs..." className="bg-transparent border-none outline-none text-sm w-48" />
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {filteredLogs.map((log, idx) => (
          <div key={log.id} className="bg-white rounded-2xl border border-neutral-200 p-6 shadow-sm hover:border-indigo-200 transition-colors relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-1 h-full bg-indigo-600"></div>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0">
                  <History size={24} />
                </div>
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="font-bold text-neutral-900">{log.action}</h3>
                    <span className="px-2 py-0.5 bg-neutral-100 text-neutral-500 rounded text-[10px] font-bold uppercase tracking-wider">Block #{log.blockNumber}</span>
                  </div>
                  <p className="text-sm text-neutral-600 mb-2">{log.details}</p>
                  <div className="flex items-center gap-4 text-xs text-neutral-400">
                    <span className="font-medium text-indigo-600">{log.role}</span>
                    <span>•</span>
                    <span>{formatDate(log.timestamp)}</span>
                    <span>•</span>
                    <span className="font-mono truncate w-32">{log.hash}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <button className="p-2 hover:bg-neutral-50 text-neutral-400 hover:text-indigo-600 rounded-lg transition-colors">
                  <ExternalLink size={18} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

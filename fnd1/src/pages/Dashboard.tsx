import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LayoutDashboard, Wallet, ShieldCheck, CheckCircle2, Search, ChevronRight } from 'lucide-react';
import { useBlockchain } from '../context/BlockchainContext';
import { formatCurrency } from '../utils';

const StatCard = ({ title, value, icon }: { title: string, value: string | number, icon: React.ReactNode }) => (
  <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm hover:shadow-md transition-shadow">
    <div className="flex items-center justify-between mb-4">
      <div className="p-3 bg-neutral-50 rounded-xl">
        {icon}
      </div>
    </div>
    <p className="text-sm font-semibold text-neutral-500 mb-1">{title}</p>
    <h3 className="text-2xl font-bold text-neutral-900">{value}</h3>
  </div>
);

export const Dashboard = () => {
  const { projects, currentRole, walletAddress } = useBlockchain();
  const navigate = useNavigate();

  const filteredProjects = projects.filter(p => {
    if (currentRole === 'Government Authority' || currentRole === 'Regulator') return true;
    if (currentRole === 'Contractor') return p.assignedContractorId?.toLowerCase() === walletAddress?.toLowerCase();
    if (currentRole === 'Inspector') return p.milestones.some(m => m.assignedInspectorIds.some(id => id.toLowerCase() === walletAddress?.toLowerCase()));
    return false;
  });

  const totalBudget = filteredProjects.reduce((acc, p) => acc + p.totalBudget, 0);
  const releasedFunds = filteredProjects.reduce((acc, p) => acc + (p.milestones || []).filter(m => m.status === 'Approved').reduce((mAcc, m) => mAcc + m.budget, 0), 0);
  const activeMilestones = filteredProjects.reduce((acc, p) => acc + (p.milestones || []).filter(m => m.status === 'Submitted').length, 0);

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Projects" value={filteredProjects.length} icon={<LayoutDashboard className="text-blue-600" />} />
        <StatCard title="Total Budget" value={formatCurrency(totalBudget)} icon={<Wallet className="text-emerald-600" />} />
        <StatCard title="Released Funds" value={formatCurrency(releasedFunds)} icon={<ShieldCheck className="text-indigo-600" />} />
        <StatCard title="Active Milestones" value={activeMilestones} icon={<CheckCircle2 className="text-amber-600" />} />
      </div>

      <div className="bg-white rounded-2xl border border-neutral-200 overflow-hidden shadow-sm">
        <div className="p-6 border-b border-neutral-100 flex items-center justify-between">
          <h2 className="text-lg font-bold">Project Portfolio</h2>
          <div className="flex items-center gap-2 bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-1.5">
            <Search size={16} className="text-neutral-400" />
            <input type="text" placeholder="Search projects..." className="bg-transparent border-none outline-none text-sm w-48" />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-neutral-50 text-neutral-500 text-xs uppercase tracking-wider font-semibold">
              <tr>
                <th className="px-6 py-4">Project Name</th>
                <th className="px-6 py-4">Type</th>
                <th className="px-6 py-4">Budget</th>
                <th className="px-6 py-4">Progress</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {filteredProjects.map(project => {
                const milestones = project.milestones || [];
                const progress = Math.round((milestones.filter(m => m.status === 'Approved').length / Math.max(1, milestones.length)) * 100);
                return (
                  <tr key={project.id} className="hover:bg-neutral-50 transition-colors group">
                    <td className="px-6 py-4">
                      <p className="font-semibold text-neutral-900">{project.name}</p>
                      <p className="text-xs text-neutral-500">ID: {project.id}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 bg-neutral-100 text-neutral-600 rounded text-xs font-medium">{project.type}</span>
                    </td>
                    <td className="px-6 py-4 font-medium">{formatCurrency(project.totalBudget)}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-2 bg-neutral-100 rounded-full overflow-hidden">
                          <div className="h-full bg-indigo-600 rounded-full" style={{ width: `${progress}%` }}></div>
                        </div>
                        <span className="text-xs font-bold text-neutral-600">{progress}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        project.status === 'Completed' ? 'bg-emerald-100 text-emerald-700' : 
                        project.status === 'On Hold' ? 'bg-orange-100 text-orange-700' : 'bg-amber-100 text-amber-700'
                      }`}>
                        {project.status === 'Active' ? 'Pending' : project.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => navigate(`/project/${project.id}`)}
                        className="p-2 hover:bg-indigo-50 text-indigo-600 rounded-lg transition-colors"
                      >
                        <ChevronRight size={20} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

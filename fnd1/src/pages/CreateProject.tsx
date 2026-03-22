import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Save, AlertCircle } from 'lucide-react';
import { useBlockchain } from '../context/BlockchainContext';

export const CreateProject = () => {
  const { contractors, createProject } = useBlockchain();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    type: 'Road' as any,
    budget: 0,
    contractorId: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.contractorId || formData.budget <= 0) return;
    const success = await createProject(formData.name, formData.type, formData.budget, formData.contractorId);
    if (success) {
      navigate('/dashboard');
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-3xl border border-neutral-200 shadow-xl overflow-hidden">
        <div className="bg-indigo-600 p-8 text-white">
          <h2 className="text-2xl font-bold mb-2">Initialize New Project</h2>
          <p className="text-indigo-100 text-sm">Create a new infrastructure project and assign it to a verified contractor.</p>
        </div>
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-bold text-neutral-700">Project Name</label>
            <input 
              type="text" 
              placeholder="e.g. Smart City Highway Expansion"
              className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
            />
          </div>
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-neutral-700">Project Type</label>
              <select 
                className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                value={formData.type}
                onChange={(e) => setFormData({...formData, type: e.target.value as any})}
              >
                <option value="Road">Road</option>
                <option value="Bridge">Bridge</option>
                <option value="Building">Building</option>
                <option value="Energy">Energy</option>
                <option value="Water">Water</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-neutral-700">Total Budget ($)</label>
              <input 
                type="number" 
                placeholder="0.00"
                className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                value={formData.budget || ''}
                onChange={(e) => setFormData({...formData, budget: Number(e.target.value)})}
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-bold text-neutral-700">Assign Contractor</label>
            <select 
              className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
              value={formData.contractorId}
              onChange={(e) => setFormData({...formData, contractorId: e.target.value})}
            >
              <option value="">Select a contractor</option>
              {contractors.map(c => (
                <option key={c.id} value={c.id}>{c.name} (Score: {c.performanceScore})</option>
              ))}
            </select>
          </div>
          <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 flex gap-3">
            <AlertCircle className="text-amber-600 shrink-0" size={20} />
            <p className="text-xs text-amber-800 leading-relaxed">
              Initializing a project will record the contract on the blockchain. This action is immutable and will be visible to all auditors.
            </p>
          </div>
          <button 
            type="submit"
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-indigo-100 transition-all flex items-center justify-center gap-2"
          >
            <Save size={20} />
            Deploy Project Contract
          </button>
        </form>
      </div>
    </div>
  );
};

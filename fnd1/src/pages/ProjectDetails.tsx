import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ChevronRight, ShieldCheck, AlertCircle, CheckCircle2, PlusCircle, 
  Edit3, X, Save, Unlock, Lock, FileText, Package, History, ExternalLink 
} from 'lucide-react';
import { useBlockchain } from '../context/BlockchainContext';
import { formatCurrency, formatDate } from '../utils';

export const ProjectDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { 
    projects, contractors, inspectors, currentRole,
    createMilestone, updateMilestone, deleteMilestone, submitMilestone,
    assignInspector, inspectorVerifyMilestone, govVerifyMilestone,
    requestFunds, handleFundRequest, requestProjectCompletion,
    approveProjectCompletion, reassignContractor, recordPurchase, deleteProject,
    releasePayment, resumeMilestone, walletAddress
  } = useBlockchain();

  const project = projects.find(p => p.id === id);

  const [editingMilestoneId, setEditingMilestoneId] = useState<string | null>(null);
  const [showAddMilestoneModal, setShowAddMilestoneModal] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState<{ projectId: string; milestoneId: string } | null>(null);
  const [showInspectorModal, setShowInspectorModal] = useState<{ projectId: string; milestoneId: string; approved: boolean } | null>(null);
  const [showFundRequestModal, setShowFundRequestModal] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <AlertCircle size={48} className="text-neutral-300 mb-4" />
        <h2 className="text-xl font-bold text-neutral-900">Project Not Found</h2>
        <p className="text-neutral-500 mb-6">The project you are looking for does not exist or has been removed.</p>
        <button 
          onClick={() => navigate('/dashboard')}
          className="px-6 py-2 bg-indigo-600 text-white rounded-xl font-bold"
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <button 
          onClick={() => navigate('/dashboard')} 
          className="flex items-center gap-2 text-neutral-500 hover:text-neutral-900 transition-colors"
        >
          <ChevronRight size={20} className="rotate-180" />
          Back to Portfolio
        </button>
        <div className="flex items-center gap-3">
          {currentRole === 'Government Authority' && (
            <button 
              onClick={() => setShowDeleteConfirm(project.id)}
              className="px-3 py-1 bg-red-50 text-red-600 rounded-full text-xs font-bold uppercase tracking-wider hover:bg-red-100 transition-colors"
            >
              Delete Project
            </button>
          )}
          <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
            project.status === 'Completed' ? 'bg-emerald-100 text-emerald-700' : 
            project.status === 'On Hold' ? 'bg-orange-100 text-orange-700' : 'bg-amber-100 text-amber-700'
          }`}>
            {project.status === 'Active' ? 'Pending' : project.status}
          </span>
          <span className="font-mono text-xs text-neutral-400">ID: {project.id}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Overview & Milestones */}
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white rounded-2xl border border-neutral-200 p-8 shadow-sm">
            <h2 className="text-2xl font-bold mb-4">{project.name}</h2>
            <p className="text-neutral-600 mb-8">This project is managed via a milestone-based smart contract. Payments are automatically released upon verification by an authorized inspector.</p>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
              <div>
                <p className="text-xs font-bold text-neutral-400 uppercase tracking-widest mb-1">Total Budget</p>
                <p className="text-xl font-bold text-neutral-900">{formatCurrency(project.totalBudget)}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-neutral-400 uppercase tracking-widest mb-1">Spent</p>
                <p className="text-xl font-bold text-red-600">{formatCurrency(project.milestones.filter(m => m.status === 'Approved').reduce((acc, m) => acc + m.budget, 0))}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-neutral-400 uppercase tracking-widest mb-1">Remaining</p>
                <p className="text-xl font-bold text-emerald-600">{formatCurrency(project.totalBudget - project.milestones.filter(m => m.status === 'Approved').reduce((acc, m) => acc + m.budget, 0))}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-neutral-400 uppercase tracking-widest mb-1">Contractor</p>
                <p className="text-sm font-bold text-indigo-600 truncate">{contractors.find(c => c.id === project.assignedContractorId)?.name}</p>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-[10px] font-bold text-neutral-400 uppercase tracking-widest">
                <span>Budget Allocation</span>
                <span>{Math.round((project.milestones.filter(m => m.status === 'Approved').reduce((acc, m) => acc + m.budget, 0) / project.totalBudget) * 100)}% Spent</span>
              </div>
              <div className="h-4 bg-neutral-100 rounded-full overflow-hidden border border-neutral-200">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${(project.milestones.filter(m => m.status === 'Approved').reduce((acc, m) => acc + m.budget, 0) / project.totalBudget) * 100}%` }}
                  className="h-full bg-red-500 rounded-full"
                />
              </div>
              <p className="text-[10px] text-neutral-400 italic">Funds are locked in the smart contract and released only upon verified milestone completion.</p>
            </div>
          </div>

          {/* On Hold Controls */}
          {project.status === 'On Hold' && currentRole === 'Government Authority' && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 space-y-4">
              <div className="flex items-center gap-3 text-amber-800">
                <AlertCircle size={24} />
                <h3 className="font-bold">Project On Hold - Authority Intervention Required</h3>
              </div>
              <p className="text-sm text-amber-700">A milestone was rejected. You must decide how to proceed.</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white p-4 rounded-xl border border-amber-100 space-y-3">
                  <h4 className="font-bold text-sm">Option A: Reassign Same Contractor</h4>
                  <p className="text-xs text-neutral-500">Reset the rejected milestone to Pending and unlock future milestones for the current contractor.</p>
                  <button 
                    onClick={() => reassignContractor(project.id, project.assignedContractorId, true)}
                    className="w-full py-2 bg-amber-600 text-white rounded-lg text-xs font-bold hover:bg-amber-700 transition-colors"
                  >
                    Reset & Resume
                  </button>
                </div>
                <div className="bg-white p-4 rounded-xl border border-amber-100 space-y-3">
                  <h4 className="font-bold text-sm">Option B: Assign New Contractor</h4>
                  <select id="new-contractor-select" className="w-full border border-neutral-200 rounded-lg px-3 py-2 text-xs outline-none">
                    {contractors.filter(c => c.id !== project.assignedContractorId).map(c => (
                      <option key={c.id} value={c.id}>{c.name} (Score: {c.performanceScore})</option>
                    ))}
                  </select>
                  <button 
                    onClick={() => {
                      const select = document.getElementById('new-contractor-select') as HTMLSelectElement;
                      reassignContractor(project.id, select.value, true);
                    }}
                    className="w-full py-2 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700 transition-colors"
                  >
                    Assign & Resume
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Milestones Section */}
          <div className="bg-white rounded-2xl border border-neutral-200 overflow-hidden shadow-sm">
            <div className="p-6 border-b border-neutral-100 flex items-center justify-between">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <CheckCircle2 size={20} className="text-indigo-600" />
                Project Milestones
              </h3>
              {currentRole === 'Contractor' && project.status === 'Active' && (
                <button 
                  onClick={() => setShowAddMilestoneModal(true)}
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
                >
                  <PlusCircle size={14} /> Add Milestone
                </button>
              )}
            </div>
            <div className="divide-y divide-neutral-100">
              {project.milestones.map((m, idx) => (
                <div key={m.id} className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 group">
                  <div className="flex gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${
                      m.status === 'Approved' || m.status === 'Paid' ? 'bg-emerald-100 text-emerald-600' : 
                      m.status === 'Rejected' ? 'bg-red-100 text-red-600' :
                      m.status === 'Submitted' ? 'bg-blue-100 text-blue-600' : 
                      m.status === 'InReview' ? 'bg-indigo-100 text-indigo-600' : 'bg-amber-100 text-amber-600'
                    }`}>
                      {idx + 1}
                    </div>
                    <div>
                      {editingMilestoneId === m.id ? (
                        <div className="space-y-3 mt-1">
                          <input 
                            id={`edit-title-${m.id}`}
                            defaultValue={m.title}
                            className="w-full border border-neutral-200 rounded-lg px-3 py-1.5 text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                          <textarea 
                            id={`edit-desc-${m.id}`}
                            defaultValue={m.description}
                            className="w-full border border-neutral-200 rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                          <div className="flex items-center gap-2">
                            <label className="text-xs font-bold text-neutral-400">Payment %</label>
                            <input 
                              id={`edit-percent-${m.id}`}
                              type="number"
                              defaultValue={m.paymentPercentage}
                              className="w-20 border border-neutral-200 rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                          </div>
                          <div className="flex gap-2 pt-2">
                            <button 
                              onClick={() => {
                                const title = (document.getElementById(`edit-title-${m.id}`) as HTMLInputElement).value;
                                const desc = (document.getElementById(`edit-desc-${m.id}`) as HTMLTextAreaElement).value;
                                const percent = Number((document.getElementById(`edit-percent-${m.id}`) as HTMLInputElement).value);
                                updateMilestone(project.id, m.id, { title, description: desc, paymentPercentage: percent });
                                setEditingMilestoneId(null);
                              }}
                              className="flex items-center gap-1 px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-bold"
                            >
                              <Save size={14} /> Save
                            </button>
                            <button 
                              onClick={() => setEditingMilestoneId(null)}
                              className="px-3 py-1.5 bg-neutral-100 text-neutral-600 rounded-lg text-xs font-bold"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <h4 className="font-bold text-neutral-900 flex items-center gap-2">
                            {m.title}
                            {currentRole === 'Contractor' && m.status === 'Pending' && (
                              <div className="flex items-center gap-1">
                                <button 
                                  onClick={() => setEditingMilestoneId(m.id)}
                                  className="p-1 hover:bg-neutral-100 text-neutral-400 hover:text-indigo-600 rounded transition-colors"
                                >
                                  <Edit3 size={14} />
                                </button>
                                <button 
                                  onClick={() => deleteMilestone(project.id, m.id)}
                                  className="p-1 hover:bg-neutral-100 text-neutral-400 hover:text-red-600 rounded transition-colors"
                                >
                                  <X size={14} />
                                </button>
                              </div>
                            )}
                          </h4>
                          <p className="text-sm text-neutral-500">{m.description}</p>
                          
                          {m.status === 'Rejected' && m.rejectionReason && (
                            <div className="mt-2 p-3 bg-red-50 border-l-4 border-red-500 rounded text-xs text-red-700">
                              <strong>Rejection Reason:</strong> {m.rejectionReason}
                            </div>
                          )}

                          {m.status === 'InReview' && m.inspectionReport && (
                            <div className="mt-2 p-3 bg-indigo-50 border-l-4 border-indigo-500 rounded text-xs text-indigo-700">
                              <strong>Inspection Report:</strong> {m.inspectionReport}
                            </div>
                          )}

                          {(m.status === 'Approved' || m.status === 'Paid') && m.inspectionReport && (
                            <div className="mt-2 p-3 bg-emerald-50 border-l-4 border-emerald-500 rounded text-xs text-emerald-700">
                              <strong>Inspection Report:</strong> {m.inspectionReport}
                            </div>
                          )}

                          <div className="flex items-center gap-4 mt-2">
                            <span className="text-xs font-semibold text-indigo-600">Payment: {m.paymentPercentage}% ({formatCurrency(m.budget)})</span>
                            {m.submittedAt && <span className="text-[10px] text-neutral-400">Submitted: {formatDate(m.submittedAt)}</span>}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${
                        m.status === 'Approved' || m.status === 'Paid' ? 'bg-emerald-100 text-emerald-700' : 
                        m.status === 'InReview' ? 'bg-indigo-100 text-indigo-700' :
                        m.status === 'Submitted' ? 'bg-blue-100 text-blue-700' : 
                        m.status === 'Rejected' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                      }`}>
                        {m.status === 'InReview' ? 'In Review' : m.status}
                      </span>
                      <div className="flex flex-col gap-1 mt-1 justify-end">
                        <div className="flex items-center gap-1">
                          {m.status === 'Paid' ? <Unlock size={12} className="text-emerald-600" /> : <Lock size={12} className="text-neutral-400" />}
                          <span className={`text-[10px] font-bold ${m.status === 'Paid' ? 'text-emerald-600' : 'text-neutral-400'}`}>
                            {m.status === 'Paid' ? 'Payment Released' : 'Payment Locked'}
                          </span>
                        </div>
                        {m.inspectorEvidenceUrl && (
                          <a href={m.inspectorEvidenceUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-[10px] font-bold text-indigo-600 hover:underline">
                            <FileText size={12} /> Inspector Evidence
                          </a>
                        )}
                      </div>
                    </div>

                      {/* Actions based on role */}
                      {currentRole === 'Government Authority' && m.status === 'Rejected' && (
                        <div className="flex gap-2">
                          <button 
                            onClick={() => resumeMilestone(project.id, m.id)}
                            className="px-3 py-1.5 bg-amber-600 text-white rounded-lg text-xs font-bold flex items-center gap-1"
                          >
                            <History size={14} /> Resume Milestone
                          </button>
                        </div>
                      )}
                      {currentRole === 'Government Authority' && m.status === 'InReview' && (
                        <div className="flex gap-2">
                          <button 
                            onClick={() => govVerifyMilestone(project.id, m.id, true)}
                            className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-bold flex items-center gap-1"
                          >
                            <ShieldCheck size={14} /> Final Approve
                          </button>
                        </div>
                      )}
                      {currentRole === 'Government Authority' && m.status === 'Approved' && (
                        <div className="flex gap-2">
                          <button 
                            onClick={() => releasePayment(project.id, m.id)}
                            className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-bold flex items-center gap-1"
                          >
                            <Unlock size={14} /> Release Payment
                          </button>
                        </div>
                      )}
                      {currentRole === 'Contractor' && m.status === 'Pending' && !m.isLocked && (
                        <div className="flex flex-col gap-2">
                          <button 
                            onClick={() => setShowSubmitModal({ projectId: project.id, milestoneId: m.id })}
                            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-bold transition-all"
                          >
                            Submit
                          </button>
                        </div>
                      )}
                      {currentRole === 'Contractor' && m.isLocked && (
                        <div className="p-2 bg-neutral-100 text-neutral-400 rounded-lg" title="Milestone Locked">
                          <Lock size={20} />
                        </div>
                      )}
                      {currentRole === 'Government Authority' && m.status === 'Submitted' && (
                        <div className="flex flex-col gap-2">
                          <select 
                            id={`assign-inspector-${m.id}`}
                            className="text-xs border border-neutral-200 rounded px-2 py-1 outline-none"
                          >
                            <option value="">Assign Inspector</option>
                            {inspectors.filter(ins => !m.assignedInspectorIds.includes(ins.id)).map(ins => (
                              <option key={ins.id} value={ins.id}>{ins.name}</option>
                            ))}
                          </select>
                          <button 
                            onClick={() => {
                              const insId = (document.getElementById(`assign-inspector-${m.id}`) as HTMLSelectElement).value;
                              if (insId) assignInspector(project.id, m.id, insId);
                            }}
                            className="px-2 py-1 bg-indigo-600 text-white rounded text-[10px] font-bold"
                          >
                            Add Inspector
                          </button>
                        </div>
                      )}
                      {currentRole === 'Inspector' && m.status === 'Submitted' && m.assignedInspectorIds.some(id => id.toLowerCase() === walletAddress?.toLowerCase()) && (
                        <div className="flex gap-2">
                          <button 
                            onClick={() => setShowInspectorModal({ projectId: project.id, milestoneId: m.id, approved: true })}
                            className="p-2 bg-emerald-100 hover:bg-emerald-200 text-emerald-700 rounded-lg transition-colors"
                          >
                            <CheckCircle2 size={20} />
                          </button>
                          <button 
                            onClick={() => setShowInspectorModal({ projectId: project.id, milestoneId: m.id, approved: false })}
                            className="p-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg transition-colors"
                          >
                            <X size={20} />
                          </button>
                        </div>
                      )}
                      {m.assignedInspectorIds.length > 0 && (
                        <div className="text-right">
                          <p className="text-[10px] text-neutral-400 uppercase font-bold">Assigned to</p>
                          <div className="flex flex-col gap-1">
                            {m.assignedInspectorIds.map(id => (
                              <p key={id} className="text-xs font-semibold text-indigo-600">
                                {inspectors.find(ins => ins.id === id)?.name}
                              </p>
                            ))}
                          </div>
                        </div>
                      )}
                  </div>
                </div>
              ))}
            </div>
          </div>
          {/* Material Purchases Section */}
          <div className="bg-white rounded-2xl border border-neutral-200 overflow-hidden shadow-sm">
            <div className="p-6 border-b border-neutral-100 flex items-center justify-between">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <Package size={20} className="text-indigo-600" />
                Material Purchases
              </h3>
            </div>
            
            {currentRole === 'Contractor' && project.status === 'Active' && (
              <div className="p-6 bg-neutral-50 border-b border-neutral-100">
                <h4 className="text-sm font-bold mb-4 text-neutral-700">Record New Purchase</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Milestone Used In</label>
                    <select id="pur-milestone" className="w-full border border-neutral-200 rounded-lg px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-indigo-500">
                      {project.milestones.map(m => (
                        <option key={m.id} value={m.id}>{m.title}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Item Name</label>
                    <input id="pur-item" type="text" placeholder="e.g. Cement Bags" className="w-full border border-neutral-200 rounded-lg px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-indigo-500" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Supplier Name</label>
                    <input id="pur-supplier" type="text" placeholder="e.g. Global Supplies Ltd" className="w-full border border-neutral-200 rounded-lg px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-indigo-500" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Material</label>
                    <input id="pur-material" type="text" placeholder="e.g. Concrete" className="w-full border border-neutral-200 rounded-lg px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-indigo-500" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Cost ($)</label>
                    <input id="pur-cost" type="number" placeholder="500" className="w-full border border-neutral-200 rounded-lg px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-indigo-500" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Evidence (URL)</label>
                    <input id="pur-evidence" type="text" placeholder="e.g. https://storage.com/invoice.pdf" className="w-full border border-neutral-200 rounded-lg px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-indigo-500" />
                  </div>
                </div>
                <button 
                  onClick={() => {
                    const milestoneId = (document.getElementById('pur-milestone') as HTMLSelectElement).value;
                    const itemName = (document.getElementById('pur-item') as HTMLInputElement).value;
                    const supplierName = (document.getElementById('pur-supplier') as HTMLInputElement).value;
                    const material = (document.getElementById('pur-material') as HTMLInputElement).value;
                    const cost = Number((document.getElementById('pur-cost') as HTMLInputElement).value);
                    const evidenceUrl = (document.getElementById('pur-evidence') as HTMLInputElement).value;
                    
                    if (milestoneId && itemName && supplierName && material && cost) {
                      recordPurchase(project.id, milestoneId, itemName, supplierName, material, cost, evidenceUrl);
                      // Clear inputs
                      (document.getElementById('pur-item') as HTMLInputElement).value = '';
                      (document.getElementById('pur-supplier') as HTMLInputElement).value = '';
                      (document.getElementById('pur-material') as HTMLInputElement).value = '';
                      (document.getElementById('pur-cost') as HTMLInputElement).value = '';
                      (document.getElementById('pur-evidence') as HTMLInputElement).value = '';
                    }
                  }}
                  className="w-full py-2 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700 transition-colors"
                >
                  Add Purchase Record
                </button>
              </div>
            )}

            <div className="divide-y divide-neutral-100">
              {(!project.purchases || project.purchases.length === 0) ? (
                <div className="p-8 text-center text-neutral-400 text-sm italic">No purchases recorded for this project.</div>
              ) : (
                project.purchases.map(p => (
                  <div key={p.id} className="p-6 hover:bg-neutral-50 transition-colors">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-bold text-neutral-900">{p.itemName}</h4>
                        <p className="text-xs text-neutral-500">{p.supplierName} • {p.material}</p>
                      </div>
                      <p className="font-bold text-indigo-600">{formatCurrency(p.cost)}</p>
                    </div>
                    <div className="flex items-center justify-between mt-4">
                      <div className="flex items-center gap-4">
                        <div className="flex flex-col">
                          <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Milestone</span>
                          <span className="text-xs font-semibold text-neutral-700">{project.milestones.find(m => m.id === p.milestoneId)?.title || 'Unknown'}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Date</span>
                          <span className="text-xs font-semibold text-neutral-700">{formatDate(p.timestamp)}</span>
                        </div>
                      </div>
                      {p.evidenceUrl && (
                        <a href={p.evidenceUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-[10px] font-bold text-indigo-600 hover:underline">
                          <FileText size={12} /> View Evidence
                        </a>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Actions */}
        <div className="space-y-8">
          {/* Fund Requests Section */}
          <div className="bg-white rounded-2xl border border-neutral-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-neutral-400 uppercase tracking-widest">Fund Requests</h3>
              {currentRole === 'Contractor' && (
                <button 
                  onClick={() => setShowFundRequestModal(project.id)}
                  className="text-[10px] font-bold text-indigo-600 hover:underline"
                >
                  New Request
                </button>
              )}
            </div>
            <div className="space-y-3">
              {(!project.fundRequests || project.fundRequests.length === 0) ? (
                <p className="text-xs text-neutral-400 italic text-center py-2">No fund requests.</p>
              ) : (
                project.fundRequests.map(fr => (
                  <div key={fr.id} className="p-3 border border-neutral-100 rounded-xl space-y-2">
                    <div className="flex justify-between items-start">
                      <p className="font-bold text-sm">{formatCurrency(fr.amount)}</p>
                      <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase ${
                        fr.status === 'Approved' ? 'bg-emerald-100 text-emerald-700' : 
                        fr.status === 'Rejected' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                      }`}>
                        {fr.status}
                      </span>
                    </div>
                    <p className="text-[10px] text-neutral-500 line-clamp-2">{fr.reason}</p>
                    {currentRole === 'Government Authority' && fr.status === 'Pending' && (
                      <div className="flex gap-2 pt-1">
                        <button 
                          onClick={() => handleFundRequest(project.id, fr.id, true)}
                          className="flex-1 py-1 bg-emerald-600 text-white rounded text-[10px] font-bold"
                        >
                          Approve
                        </button>
                        <button 
                          onClick={() => handleFundRequest(project.id, fr.id, false)}
                          className="flex-1 py-1 bg-red-600 text-white rounded text-[10px] font-bold"
                        >
                          Reject
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
          {/* Role-Specific Actions */}
          <div className="bg-white rounded-2xl border border-neutral-200 p-6 shadow-sm">
            <h3 className="text-sm font-bold text-neutral-400 uppercase tracking-widest mb-4">Role Actions</h3>
            
            {currentRole === 'Contractor' && project.status !== 'Completed' && !project.completionRequested && (
              project.milestones.length > 0 && project.milestones.every(m => m.status === 'Approved') ? (
                <div className="space-y-4">
                  <p className="text-sm text-neutral-600">All milestones are approved. You can now request final project completion.</p>
                  <button 
                    onClick={() => requestProjectCompletion(project.id)}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-lg transition-all flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 size={18} />
                    Request Project Completion
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center space-y-3">
                  <AlertCircle size={32} className="text-neutral-300" />
                  <p className="text-sm text-neutral-500 italic">Complete and get approval for all milestones to request project completion.</p>
                </div>
              )
            )}

            {currentRole === 'Regulator' && (
              <div className="space-y-4">
                <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-xl">
                  <p className="text-xs font-bold text-indigo-700 uppercase mb-2">Regulator Access</p>
                  <p className="text-[10px] text-indigo-600">You have read-only access to all project data, material logs, and audit trails for compliance monitoring.</p>
                </div>
                <button 
                  onClick={() => navigate('/audit')}
                  className="w-full py-2 bg-white border border-indigo-200 text-indigo-600 rounded-lg text-xs font-bold hover:bg-indigo-50 transition-colors flex items-center justify-center gap-2"
                >
                  <History size={14} /> View Full Audit Trail
                </button>
              </div>
            )}

            {currentRole === 'Government Authority' && project.status !== 'Completed' && (
              project.completionRequested ? (
                <div className="space-y-4">
                  <p className="text-sm text-neutral-600">The contractor has requested project completion. Please review and approve if all work is satisfactory.</p>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => approveProjectCompletion(project.id, true)}
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-lg transition-all flex items-center justify-center gap-2"
                    >
                      <ShieldCheck size={18} />
                      Approve
                    </button>
                    <button 
                      onClick={() => approveProjectCompletion(project.id, false)}
                      className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-lg transition-all flex items-center justify-center gap-2"
                    >
                      <X size={18} />
                      Reject
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center space-y-3">
                  <AlertCircle size={32} className="text-neutral-300" />
                  <p className="text-sm text-neutral-500 italic">Waiting for contractor to request project completion after all milestones are approved.</p>
                </div>
              )
            )}

            {project.status === 'Completed' && (
              <div className="flex flex-col items-center justify-center py-8 text-center space-y-3">
                <CheckCircle2 size={32} className="text-emerald-500" />
                <p className="text-sm text-emerald-600 font-bold">Project is Completed & Finalized</p>
                <p className="text-xs text-neutral-500 italic">No further actions can be performed.</p>
              </div>
            )}

            {currentRole !== 'Government Authority' && currentRole !== 'Contractor' && currentRole !== 'Inspector' && project.status !== 'Completed' && (
              <div className="flex flex-col items-center justify-center py-8 text-center space-y-3">
                <AlertCircle size={32} className="text-neutral-300" />
                <p className="text-sm text-neutral-500 italic">No specific actions available for your role on this project.</p>
              </div>
            )}
          </div>

          {/* Milestone Invoices */}
          <div className="bg-white rounded-2xl border border-neutral-200 overflow-hidden shadow-sm">
            <div className="p-4 border-b border-neutral-100 bg-neutral-50">
              <h3 className="text-sm font-bold flex items-center gap-2">
                <FileText size={16} className="text-indigo-600" />
                Milestone Invoices
              </h3>
            </div>
            <div className="divide-y divide-neutral-100 max-h-[400px] overflow-y-auto">
              {((project.milestones || []).filter(m => m.invoiceUrl)).length === 0 ? (
                <div className="p-8 text-center text-neutral-400 text-sm">No invoices uploaded yet.</div>
              ) : (
                (project.milestones || []).filter(m => m.invoiceUrl).map(m => (
                  <div key={m.id} className="p-4 space-y-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-bold text-sm">{m.title}</p>
                        <p className="text-[10px] text-neutral-500">Submitted: {formatDate(m.submittedAt!)}</p>
                      </div>
                      <a 
                        href={m.invoiceUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="p-2 hover:bg-indigo-50 text-indigo-600 rounded-lg transition-colors"
                      >
                        <ExternalLink size={16} />
                      </a>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {showAddMilestoneModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl"
            >
              <h3 className="text-xl font-bold mb-6">Add Project Milestone</h3>
              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                createMilestone(project.id, {
                  title: formData.get('title') as string,
                  description: formData.get('description') as string,
                  paymentPercentage: Number(formData.get('percentage'))
                });
                setShowAddMilestoneModal(false);
              }} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-neutral-400 uppercase">Title</label>
                  <input name="title" required className="w-full border border-neutral-200 rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-neutral-400 uppercase">Description</label>
                  <textarea name="description" required className="w-full border border-neutral-200 rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-neutral-400 uppercase">Payment Percentage (%)</label>
                  <input name="percentage" type="number" required className="w-full border border-neutral-200 rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div className="flex gap-3 pt-4">
                  <button type="button" onClick={() => setShowAddMilestoneModal(false)} className="flex-1 py-3 font-bold text-neutral-500 hover:bg-neutral-50 rounded-xl transition-colors">Cancel</button>
                  <button type="submit" className="flex-1 py-3 bg-indigo-600 text-white font-bold rounded-xl shadow-lg shadow-indigo-100">Create</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {showSubmitModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl"
            >
              <h3 className="text-xl font-bold mb-2">Submit Milestone</h3>
              <p className="text-sm text-neutral-500 mb-6">Provide evidence of work completion and your invoice for verification.</p>
              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                submitMilestone(showSubmitModal.projectId, showSubmitModal.milestoneId, formData.get('evidence') as string, formData.get('invoice') as string);
                setShowSubmitModal(null);
              }} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-neutral-400 uppercase">Evidence URL (Photos/Reports)</label>
                  <input name="evidence" required className="w-full border border-neutral-200 rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-neutral-400 uppercase">Invoice URL (PDF)</label>
                  <input name="invoice" required className="w-full border border-neutral-200 rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div className="flex gap-3 pt-4">
                  <button type="button" onClick={() => setShowSubmitModal(null)} className="flex-1 py-3 font-bold text-neutral-500 hover:bg-neutral-50 rounded-xl transition-colors">Cancel</button>
                  <button type="submit" className="flex-1 py-3 bg-indigo-600 text-white font-bold rounded-xl shadow-lg shadow-indigo-100">Submit for Review</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {showInspectorModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl"
            >
              <h3 className="text-xl font-bold mb-2">{showInspectorModal.approved ? 'Verify Milestone' : 'Reject Milestone'}</h3>
              <p className="text-sm text-neutral-500 mb-6">Provide your inspection report and evidence of the site visit.</p>
              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                inspectorVerifyMilestone(
                  showInspectorModal.projectId, 
                  showInspectorModal.milestoneId, 
                  showInspectorModal.approved, 
                  formData.get('report') as string,
                  formData.get('evidence') as string
                );
                setShowInspectorModal(null);
              }} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-neutral-400 uppercase">Inspection Report Summary</label>
                  <textarea name="report" required className="w-full border border-neutral-200 rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-neutral-400 uppercase">Inspection Evidence URL</label>
                  <input name="evidence" required className="w-full border border-neutral-200 rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div className="flex gap-3 pt-4">
                  <button type="button" onClick={() => setShowInspectorModal(null)} className="flex-1 py-3 font-bold text-neutral-500 hover:bg-neutral-50 rounded-xl transition-colors">Cancel</button>
                  <button type="submit" className={`flex-1 py-3 text-white font-bold rounded-xl shadow-lg ${showInspectorModal.approved ? 'bg-emerald-600 shadow-emerald-100' : 'bg-red-600 shadow-red-100'}`}>
                    {showInspectorModal.approved ? 'Confirm Verification' : 'Confirm Rejection'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {showFundRequestModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl"
            >
              <h3 className="text-xl font-bold mb-2">Request Emergency Funds</h3>
              <p className="text-sm text-neutral-500 mb-6">Request additional funds for unexpected project costs. Subject to authority approval.</p>
              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                requestFunds(showFundRequestModal, Number(formData.get('amount')), formData.get('reason') as string);
                setShowFundRequestModal(null);
              }} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-neutral-400 uppercase">Amount ($)</label>
                  <input name="amount" type="number" required className="w-full border border-neutral-200 rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-neutral-400 uppercase">Reason for Request</label>
                  <textarea name="reason" required className="w-full border border-neutral-200 rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div className="flex gap-3 pt-4">
                  <button type="button" onClick={() => setShowFundRequestModal(null)} className="flex-1 py-3 font-bold text-neutral-500 hover:bg-neutral-50 rounded-xl transition-colors">Cancel</button>
                  <button type="submit" className="flex-1 py-3 bg-indigo-600 text-white font-bold rounded-xl shadow-lg shadow-indigo-100">Submit Request</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {showDeleteConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl"
            >
              <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <AlertCircle size={32} />
              </div>
              <h3 className="text-xl font-bold mb-2 text-center">Delete Project?</h3>
              <p className="text-sm text-neutral-500 mb-8 text-center">This action is irreversible. All smart contract data and audit logs will be permanently archived.</p>
              <div className="flex gap-3">
                <button onClick={() => setShowDeleteConfirm(null)} className="flex-1 py-3 font-bold text-neutral-500 hover:bg-neutral-50 rounded-xl transition-colors">Cancel</button>
                <button 
                  onClick={() => {
                    deleteProject(showDeleteConfirm);
                    setShowDeleteConfirm(null);
                    navigate('/dashboard');
                  }} 
                  className="flex-1 py-3 bg-red-600 text-white font-bold rounded-xl shadow-lg shadow-red-100"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

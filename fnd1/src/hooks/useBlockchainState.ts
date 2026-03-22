import { useState, useEffect, useCallback, useRef } from 'react';
import { ethers } from 'ethers';
import { Project, AuditLog, UserRole, Milestone, Contractor, Inspector, MilestoneRequest, FundRequest, Purchase } from '../types';
import { INITIAL_PROJECTS, INITIAL_LOGS, INITIAL_CONTRACTORS, INITIAL_INSPECTORS } from '../constants';
import { generateHash } from '../utils';
import { FACTORY_ABI, PROJECT_ABI } from '../contracts/abis';

export const useBlockchainState = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [contractors, setContractors] = useState<Contractor[]>([]);
  const [inspectors, setInspectors] = useState<Inspector[]>([]);
  const [currentRole, setCurrentRole] = useState<UserRole>('Regulator');
  const [notifications, setNotifications] = useState<{ id: string; message: string; type: 'success' | 'info' | 'error' | 'warning' }[]>([]);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [signer, setSigner] = useState<ethers.JsonRpcSigner | null>(null);
  const [network, setNetwork] = useState<string | null>(null);
  const walletAddressRef = useRef<string | null>(null);

  const [factoryAddress, setFactoryAddress] = useState(() => localStorage.getItem('blockchain_factory_address') || "0x742d35Cc6634C0532925a3b844Bc454e4438f44e");
  const [authorityAddress, setAuthorityAddress] = useState(() => localStorage.getItem('blockchain_authority_address') || "0x1234567890abcdef1234567890abcdef12345678");

  useEffect(() => {
    localStorage.setItem('blockchain_factory_address', factoryAddress);
  }, [factoryAddress]);

  useEffect(() => {
    localStorage.setItem('blockchain_authority_address', authorityAddress);
  }, [authorityAddress]);

  // Load from localStorage
  useEffect(() => {
    const savedProjects = localStorage.getItem('blockchain_projects');
    const savedLogs = localStorage.getItem('blockchain_logs');
    const savedContractors = localStorage.getItem('blockchain_contractors');
    const savedInspectors = localStorage.getItem('blockchain_inspectors');
    
    if (savedProjects) {
      const parsedProjects: Project[] = JSON.parse(savedProjects);
      // Deduplicate projects and their internal arrays by ID
      const uniqueProjects = parsedProjects.filter((p, index, self) =>
        index === self.findIndex((t) => t.id === p.id)
      ).map(p => ({
        ...p,
        milestones: (p.milestones || []).filter((m, idx, arr) => 
          idx === arr.findIndex((t) => t.id === m.id)
        ).map(m => ({
          ...m,
          assignedInspectorIds: m.assignedInspectorIds || []
        })),
        milestoneRequests: (p.milestoneRequests || []).filter((r, idx, arr) => 
          idx === arr.findIndex((t) => t.id === r.id)
        ),
      }));
      setProjects(uniqueProjects);
    } else setProjects(INITIAL_PROJECTS);

    if (savedLogs) {
      const parsedLogs: AuditLog[] = JSON.parse(savedLogs);
      // Deduplicate by ID
      const uniqueLogs = parsedLogs.filter((log, index, self) =>
        index === self.findIndex((t) => t.id === log.id)
      );
      setLogs(uniqueLogs);
    } else setLogs(INITIAL_LOGS);

    if (savedContractors) {
      const parsedContractors: Contractor[] = JSON.parse(savedContractors);
      const uniqueContractors = parsedContractors.filter((c, index, self) =>
        index === self.findIndex((t) => t.id === c.id)
      );
      setContractors(uniqueContractors);
    } else setContractors(INITIAL_CONTRACTORS);

    if (savedInspectors) {
      const parsedInspectors: Inspector[] = JSON.parse(savedInspectors);
      const uniqueInspectors = parsedInspectors.filter((s, index, self) =>
        index === self.findIndex((t) => t.id === s.id)
      );
      setInspectors(uniqueInspectors);
    } else setInspectors(INITIAL_INSPECTORS);
  }, []);

  // Role detection
  useEffect(() => {
    const detectRole = () => {
      if (!walletAddress) {
        console.log("No wallet connected, defaulting to Regulator");
        setCurrentRole('Regulator');
        return;
      }
      
      const addr = walletAddress.toLowerCase();
      const authAddr = authorityAddress.toLowerCase();
      console.log(`[Role Detection] Checking address: ${addr}`);
      console.log(`[Role Detection] Authority address: ${authAddr}`);
      
      if (addr === authAddr) {
        console.log("[Role Detection] MATCH: Government Authority");
        setCurrentRole('Government Authority');
      } else {
        const contractor = contractors.find(c => c.id.toLowerCase() === addr);
        if (contractor) {
          console.log(`[Role Detection] MATCH: Contractor (${contractor.name})`);
          setCurrentRole('Contractor');
        } else {
          const inspector = inspectors.find(i => i.id.toLowerCase() === addr);
          if (inspector) {
            console.log(`[Role Detection] MATCH: Inspector (${inspector.name})`);
            setCurrentRole('Inspector');
          } else {
            console.log("[Role Detection] NO MATCH: Defaulting to Regulator");
            setCurrentRole('Regulator');
          }
        }
      }
    };
    detectRole();
  }, [walletAddress, contractors, inspectors, authorityAddress]);

  // Log role changes
  useEffect(() => {
    console.log("Current role updated to:", currentRole);
  }, [currentRole]);

  const generateUniqueId = (prefix: string) => {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  };

  const addNotification = (message: string, type: 'success' | 'info' | 'error' | 'warning' = 'success') => {
    const id = generateUniqueId('notif');
    setNotifications(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 4000);
  };

  const addLog = (projectId: string, action: string, details: string, txHash?: string) => {
    const newLog: AuditLog = {
      id: generateUniqueId('log'),
      projectId,
      action,
      role: currentRole,
      timestamp: new Date().toISOString(),
      blockNumber: 10000 + logs.length + 1,
      hash: generateHash(),
      txHash,
      details,
    };
    setLogs(prev => {
      const combined = [newLog, ...prev];
      return combined.filter((log, index, self) =>
        index === self.findIndex((t) => t.id === log.id)
      );
    });
    return newLog;
  };

  const refreshProjects = useCallback(async () => {
    if (!provider) return;
    try {
      // Check if factory exists before creating contract instance
      const code = await provider.getCode(factoryAddress);
      if (!code || code === '0x') {
        console.warn(`Factory contract not found at ${factoryAddress}. Using initial data.`);
        if (projects.length === 0) {
          setProjects(INITIAL_PROJECTS);
          addNotification('Factory contract not found. Using local mock data.', 'warning');
        }
        return;
      }

      const factory = new ethers.Contract(factoryAddress, FACTORY_ABI, provider);
      const count = await factory.getProjectCount();
      const loadedProjects: Project[] = [];

      for (let i = 0; i < Number(count); i++) {
        const info = await factory.getProject(i);
        const projectContract = new ethers.Contract(info.contractAddress, PROJECT_ABI, provider);
        
        const summary = await projectContract.getBudgetSummary();
        const totalBudget = Number(ethers.formatEther(summary.total));
        const isCompleted = await projectContract.projectCompleted();
        const contractorMarkedComplete = await projectContract.contractorMarkedComplete();

        const mCount = await projectContract.getMilestoneCount();
        const milestones: Milestone[] = [];
        for (let j = 0; j < Number(mCount); j++) {
          const m = await projectContract.getMilestone(j);
          const mAmount = Number(ethers.formatEther(m.amount));
          milestones.push({
            id: `m-${j}`,
            title: m.name,
            description: m.description,
            budget: mAmount,
            paymentPercentage: totalBudget > 0 ? Math.round((mAmount / totalBudget) * 100) : 0,
            status: ['Pending', 'Submitted', 'InReview', 'Approved', 'Paid', 'Rejected', 'Deleted'][m.status] as any,
            assignedInspectorIds: m.milestoneInspector !== ethers.ZeroAddress ? [m.milestoneInspector] : [],
            invoiceUrl: m.invoiceHash !== ethers.ZeroHash ? `ipfs://${m.invoiceHash}` : undefined,
            inspectorEvidenceUrl: m.evidenceHash !== ethers.ZeroHash ? `ipfs://${m.evidenceHash}` : undefined,
            inspectionReport: m.evidenceDescription,
            rejectionReason: m.rejectionReason
          });
        }

        // Fetch Fund Requests
        const frCount = await projectContract.getFundRequestCount();
        const fundRequests: FundRequest[] = [];
        for (let j = 0; j < Number(frCount); j++) {
          const fr = await projectContract.getFundRequest(j);
          fundRequests.push({
            id: `freq-${j}`,
            amount: Number(ethers.formatEther(fr.amount)),
            reason: fr.reason,
            status: ['Pending', 'Approved', 'Rejected'][fr.status] as any,
            timestamp: new Date(Number(fr.timestamp) * 1000).toISOString()
          });
        }

        // Fetch Material Logs (Purchases)
        const mlCount = await projectContract.getMaterialLogCount();
        const purchases: Purchase[] = [];
        for (let j = 0; j < Number(mlCount); j++) {
          const ml = await projectContract.getMaterialLog(j);
          purchases.push({
            id: `ml-${j}`,
            itemName: ml.materialDescription,
            supplierName: ml.supplierName,
            material: ml.materialDescription,
            cost: Number(ethers.formatEther(ml.cost)),
            milestoneId: `m-${ml.milestoneIndex}`,
            evidenceUrl: ml.invoiceHash !== ethers.ZeroHash ? `ipfs://${ml.invoiceHash}` : undefined,
            timestamp: new Date(Number(ml.timestamp) * 1000).toISOString()
          });
        }

        loadedProjects.push({
          id: info.contractAddress,
          name: info.name,
          type: "Infrastructure", // Default or fetch from events
          totalBudget: Number(ethers.formatEther(summary.total)),
          allocatedBudget: Number(ethers.formatEther(summary.total)),
          status: isCompleted ? 'Completed' : 'Active',
          milestones,
          fundRequests,
          purchases,
          createdAt: new Date().toISOString(),
          createdBy: info.authority,
          assignedContractorId: info.contractor,
          milestoneRequests: [],
          completionRequested: contractorMarkedComplete
        });
      }
      setProjects(loadedProjects);
    } catch (error) {
      console.error("Failed to load projects:", error);
      if (projects.length === 0) setProjects(INITIAL_PROJECTS);
    }
  }, [provider, factoryAddress]);

  useEffect(() => {
    if (provider) refreshProjects();
  }, [provider, refreshProjects]);

  const createProject = async (name: string, type: Project['type'], budget: number, contractorId: string) => {
    if (!signer) {
      addNotification('Please connect your wallet first', 'error');
      return;
    }
    try {
      // Check if factory exists
      const code = await provider?.getCode(factoryAddress);
      const isMock = !code || code === '0x';
      
      if (isMock) {
        console.warn(`Factory contract not found at ${factoryAddress}. Creating mock project locally.`);
        const mockProject: Project = {
          id: `mock-${Date.now()}`,
          name,
          type,
          totalBudget: budget,
          allocatedBudget: budget,
          status: 'Active',
          createdAt: new Date().toISOString(),
          createdBy: walletAddress!,
          assignedContractorId: contractorId,
          milestones: [],
          milestoneRequests: [],
          fundRequests: [],
          purchases: [],
        };
        setProjects(prev => [mockProject, ...prev]);
        addLog(mockProject.id, 'Project Created (Mock)', `Project "${name}" created locally (Blockchain not found)`);
        addNotification('Project Created Locally (Mock Mode)');
        return;
      }

      const factory = new ethers.Contract(factoryAddress, FACTORY_ABI, signer);
      
      // Check balance
      const balance = await provider?.getBalance(walletAddress!);
      const budgetWei = ethers.parseEther(budget.toString());
      if (balance && balance < budgetWei) {
        throw new Error(`Insufficient balance. You need ${budget} ETH but have ${ethers.formatEther(balance)} ETH.`);
      }

      // Validate contractor address
      if (!ethers.isAddress(contractorId)) {
        throw new Error('Invalid contractor address');
      }

      const tx = await factory.createProject(name, contractorId, { 
        value: ethers.parseEther(budget.toString()),
        gasLimit: 3000000 // Add explicit gas limit for safety
      });
      
      addNotification('Transaction Sent. Waiting for confirmation...', 'info');
      const receipt = await tx.wait();
      
      // Extract project address from logs if possible
      const projectAddress = receipt.logs[0]?.address || 'New Project';
      
      addLog(projectAddress, 'Project Created', `Project "${name}" created with budget ${budget} ETH`, tx.hash);
      addNotification('Project Created on Blockchain!');
      refreshProjects();
      return true;
    } catch (error: any) {
      console.error("Create Project Error:", error);
      const errorMessage = error.reason || error.message || 'Failed to create project';
      addNotification(errorMessage, 'error');
      return false;
    }
  };

  const submitMilestone = async (projectId: string, milestoneId: string, evidenceUrl: string, invoiceUrl: string) => {
    if (!signer) return;
    try {
      const projectContract = new ethers.Contract(projectId, PROJECT_ABI, signer);
      const index = parseInt(milestoneId.split('-')[1]);
      
      // Convert URL to hash (mocking IPFS hash for now)
      const invoiceHash = ethers.id(invoiceUrl);
      
      const tx = await projectContract.markComplete(index, invoiceHash);
      addNotification('Submitting Milestone...', 'info');
      await tx.wait();
      addLog(projectId, 'Milestone Submitted', `Milestone ${index} submitted for review`, tx.hash);
      addNotification('Milestone Submitted Successfully');
      refreshProjects();
    } catch (error) {
      console.error(error);
      addNotification('Failed to submit milestone', 'error');
    }
  };

  const assignInspector = async (projectId: string, milestoneId: string, inspectorId: string) => {
    if (!signer) return;
    try {
      const projectContract = new ethers.Contract(projectId, PROJECT_ABI, signer);
      const index = parseInt(milestoneId.split('-')[1]);
      
      const tx = await projectContract.assignInspector(index, inspectorId);
      addNotification('Assigning Inspector...', 'info');
      await tx.wait();
      addLog(projectId, 'Inspector Assigned', `Inspector ${inspectorId} assigned to milestone ${index}`, tx.hash);
      addNotification('Inspector Assigned Successfully');
      refreshProjects();
    } catch (error) {
      console.error(error);
      addNotification('Failed to assign inspector', 'error');
    }
  };

  const deleteProject = (projectId: string) => {
    setProjects(prev => prev.filter(p => p.id !== projectId));
    addLog(projectId, 'Project Deleted', `Government Authority deleted the project.`);
    addNotification('Project Deleted Successfully', 'warning');
  };

  const createMilestone = async (projectId: string, data: { title: string, description: string, paymentPercentage: number }) => {
    if (!signer) return;
    try {
      const projectContract = new ethers.Contract(projectId, PROJECT_ABI, signer);
      const project = projects.find(p => p.id === projectId);
      if (!project) return;
      
      const amount = (project.totalBudget * data.paymentPercentage) / 100;
      const tx = await projectContract.addMilestone(data.title, data.description, ethers.parseEther(amount.toString()));
      addNotification('Adding Milestone...', 'info');
      await tx.wait();
      addLog(projectId, 'Milestone Added', `New milestone "${data.title}" added to project`, tx.hash);
      addNotification('Milestone Added Successfully');
      refreshProjects();
    } catch (error) {
      console.error(error);
      addNotification('Failed to add milestone', 'error');
    }
  };

  const deleteMilestone = async (projectId: string, milestoneId: string) => {
    if (!signer) return;
    try {
      const projectContract = new ethers.Contract(projectId, PROJECT_ABI, signer);
      const index = parseInt(milestoneId.split('-')[1]);
      
      const tx = await projectContract.deleteMilestone(index);
      addNotification('Deleting Milestone...', 'info');
      await tx.wait();
      addLog(projectId, 'Milestone Deleted', `Milestone index ${index} deleted from project`, tx.hash);
      addNotification('Milestone Deleted Successfully');
      refreshProjects();
    } catch (error) {
      console.error(error);
      addNotification('Failed to delete milestone', 'error');
    }
  };

  const requestFunds = async (projectId: string, amount: number, reason: string) => {
    if (!signer) return;
    try {
      const projectContract = new ethers.Contract(projectId, PROJECT_ABI, signer);
      const tx = await projectContract.createFundRequest(ethers.parseEther(amount.toString()), reason);
      addNotification('Requesting Funds...', 'info');
      await tx.wait();
      addLog(projectId, 'Fund Request Created', `Contractor requested ${amount} ETH for: ${reason}`, tx.hash);
      addNotification('Fund Request Submitted Successfully');
      refreshProjects();
    } catch (error) {
      console.error(error);
      addNotification('Failed to request funds', 'error');
    }
  };

  const handleFundRequest = async (projectId: string, requestId: string, approved: boolean) => {
    if (!signer) return;
    try {
      const projectContract = new ethers.Contract(projectId, PROJECT_ABI, signer);
      const index = parseInt(requestId.split('-')[1]); // Assuming requestId is freq-index
      
      let tx;
      if (approved) {
        const project = projects.find(p => p.id === projectId);
        const request = project?.fundRequests.find(r => r.id === requestId);
        tx = await projectContract.approveFundRequest(index, { value: ethers.parseEther(request?.amount.toString() || "0") });
      } else {
        tx = await projectContract.rejectFundRequest(index);
      }
      
      addNotification('Processing Fund Request...', 'info');
      await tx.wait();
      addLog(projectId, approved ? 'Fund Request Approved' : 'Fund Request Rejected', `Authority ${approved ? 'approved' : 'rejected'} fund request index ${index}`, tx.hash);
      addNotification(approved ? 'Fund Request Approved' : 'Fund Request Rejected');
      refreshProjects();
    } catch (error) {
      console.error(error);
      addNotification('Failed to handle fund request', 'error');
    }
  };

  const recordPurchase = async (projectId: string, milestoneId: string, itemName: string, supplierName: string, material: string, cost: number, evidenceUrl?: string) => {
    if (!signer) return;
    try {
      const projectContract = new ethers.Contract(projectId, PROJECT_ABI, signer);
      const mIndex = parseInt(milestoneId.split('-')[1]);
      const invoiceHash = evidenceUrl ? ethers.id(evidenceUrl) : ethers.ZeroHash;
      
      const tx = await projectContract.logMaterial(mIndex, supplierName, material, ethers.parseEther(cost.toString()), invoiceHash);
      addNotification('Recording Purchase...', 'info');
      await tx.wait();
      addLog(projectId, 'Purchase Recorded', `Material "${material}" from ${supplierName} recorded for milestone ${mIndex}`, tx.hash);
      addNotification('Purchase Recorded Successfully');
      refreshProjects();
    } catch (error) {
      console.error(error);
      addNotification('Failed to record purchase', 'error');
    }
  };

  const inspectorVerifyMilestone = async (projectId: string, milestoneId: string, approved: boolean, report: string, evidenceUrl?: string) => {
    if (!signer) return;
    try {
      const projectContract = new ethers.Contract(projectId, PROJECT_ABI, signer);
      const index = parseInt(milestoneId.split('-')[1]);
      
      let tx;
      if (approved) {
        const evidenceHash = evidenceUrl ? ethers.id(evidenceUrl) : ethers.ZeroHash;
        // Step 1: Submit Evidence
        const tx1 = await projectContract.submitEvidence(index, evidenceHash, report);
        addNotification('Submitting Evidence...', 'info');
        await tx1.wait();
        
        // Step 2: Approve Milestone
        tx = await projectContract.approveMilestone(index);
        addNotification('Approving Milestone...', 'info');
      } else {
        tx = await projectContract.rejectMilestone(index, report);
      }
      
      await tx.wait();
      addLog(projectId, approved ? 'Milestone Verified' : 'Milestone Rejected', `Inspector ${approved ? 'verified' : 'rejected'} milestone ${index}`, tx.hash);
      addNotification(approved ? 'Milestone Approved by Inspector' : 'Milestone Rejected by Inspector');
      refreshProjects();
    } catch (error) {
      console.error(error);
      addNotification('Failed to verify milestone', 'error');
    }
  };

  const govVerifyMilestone = async (projectId: string, milestoneId: string, approved: boolean) => {
    if (!signer) return;
    try {
      const projectContract = new ethers.Contract(projectId, PROJECT_ABI, signer);
      const index = parseInt(milestoneId.split('-')[1]);
      
      let tx;
      if (approved) {
        tx = await projectContract.confirmMilestone(index);
      } else {
        // Authority can't directly reject in this contract, they can resume if rejected by inspector
        // or we might need a different logic. For now, let's assume they can only confirm if inspector approved.
        addNotification('Authority can only confirm inspector-approved milestones or resume rejected ones', 'warning');
        return;
      }
      
      addNotification('Processing Government Confirmation...', 'info');
      await tx.wait();
      addLog(projectId, approved ? 'Milestone Confirmed' : 'Milestone Rejected', `Authority ${approved ? 'confirmed' : 'rejected'} milestone ${index}`, tx.hash);
      addNotification(approved ? 'Milestone Fully Confirmed' : 'Milestone Rejected by Government');
      refreshProjects();
    } catch (error) {
      console.error(error);
      addNotification('Failed to process government confirmation', 'error');
    }
  };

  const releasePayment = async (projectId: string, milestoneId: string) => {
    if (!signer) return;
    try {
      const projectContract = new ethers.Contract(projectId, PROJECT_ABI, signer);
      const index = parseInt(milestoneId.split('-')[1]);
      
      const tx = await projectContract.releasePayment(index);
      addNotification('Releasing Payment...', 'info');
      await tx.wait();
      addLog(projectId, 'Payment Released', `Authority released payment for milestone ${index}`, tx.hash);
      addNotification('Payment Released Successfully');
      refreshProjects();
    } catch (error) {
      console.error(error);
      addNotification('Failed to release payment', 'error');
    }
  };

  const requestProjectCompletion = async (projectId: string) => {
    if (!signer) return;
    try {
      const projectContract = new ethers.Contract(projectId, PROJECT_ABI, signer);
      const tx = await projectContract.markProjectComplete();
      addNotification('Requesting Completion...', 'info');
      await tx.wait();
      addLog(projectId, 'Completion Requested', `Contractor requested project completion`, tx.hash);
      addNotification('Project Completion Requested');
      refreshProjects();
    } catch (error) {
      console.error(error);
      addNotification('Failed to request completion', 'error');
    }
  };

  const approveProjectCompletion = async (projectId: string, approved: boolean) => {
    if (!signer) return;
    try {
      const projectContract = new ethers.Contract(projectId, PROJECT_ABI, signer);
      if (!approved) {
        addNotification('Rejection of completion not implemented in contract yet', 'warning');
        return;
      }
      const tx = await projectContract.approveProjectCompletion();
      addNotification('Approving Completion...', 'info');
      await tx.wait();
      addLog(projectId, 'Project Completed', `Authority approved project completion`, tx.hash);
      addNotification('Project Fully Completed');
      refreshProjects();
    } catch (error) {
      console.error(error);
      addNotification('Failed to approve completion', 'error');
    }
  };

  const updateMilestone = (projectId: string, milestoneId: string, updates: Partial<Milestone>) => {
    setProjects(prev => prev.map(p => {
      if (p.id === projectId) {
        if (p.status === 'Completed') {
          addNotification('Project is completed. No further actions allowed.', 'error');
          return p;
        }
        const updatedMilestones = p.milestones.map(m => {
          if (m.id === milestoneId) {
            addLog(projectId, 'Milestone Updated', `Government Authority updated ${m.title}.`);
            addNotification('Milestone Updated');
            return { ...m, ...updates };
          }
          return m;
        });
        return { ...p, milestones: updatedMilestones };
      }
      return p;
    }));
  };

  const resumeMilestone = async (projectId: string, milestoneId: string) => {
    if (!signer) return;
    try {
      const projectContract = new ethers.Contract(projectId, PROJECT_ABI, signer);
      const index = parseInt(milestoneId.split('-')[1]);
      
      const tx = await projectContract.resumeMilestone(index);
      addNotification('Resuming Milestone...', 'info');
      await tx.wait();
      addLog(projectId, 'Milestone Resumed', `Authority resumed rejected milestone index ${index}`, tx.hash);
      addNotification('Milestone Resumed Successfully');
      refreshProjects();
    } catch (error) {
      console.error(error);
      addNotification('Failed to resume milestone', 'error');
    }
  };

  const reassignContractor = async (projectId: string, newContractorId: string, resetMilestone: boolean) => {
    if (!signer) return;
    try {
      const projectContract = new ethers.Contract(projectId, PROJECT_ABI, signer);
      const tx = await projectContract.replaceContractor(newContractorId);
      addNotification('Reassigning Contractor...', 'info');
      await tx.wait();
      addNotification('Contractor Reassigned Successfully');
      refreshProjects();
    } catch (error) {
      console.error(error);
      addNotification('Failed to reassign contractor', 'error');
    }
  };

  const requestNewMilestone = async (projectId: string, title: string, description: string, budget: number) => {
    if (!signer) return;
    try {
      const projectContract = new ethers.Contract(projectId, PROJECT_ABI, signer);
      // We'll use addMilestone directly if the contractor is allowed, 
      // or if the contract requires authority approval, we'd call a different function.
      // Assuming addMilestone is the one.
      const tx = await projectContract.addMilestone(title, description, ethers.parseEther(budget.toString()));
      addNotification('Requesting New Milestone...', 'info');
      await tx.wait();
      addNotification('Milestone Added Successfully');
      refreshProjects();
    } catch (error) {
      console.error(error);
      addNotification('Failed to request new milestone', 'error');
    }
  };

  const handleMilestoneRequest = async (projectId: string, requestId: string, approved: boolean) => {
    // If the contract handles requests, we'd call an approve function.
    // For now, if approved, we might have already added it via requestNewMilestone mapping to addMilestone.
    // If there's a specific handle function in the contract, use it.
    addNotification('Handling Milestone Request...', 'info');
    // Placeholder for actual contract call if exists
    refreshProjects();
  };

  const connectWallet = async () => {
    if (!window.ethereum) {
      addNotification('MetaMask not found. Please install it.', 'error');
      return;
    }
    try {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      const newAddress = accounts[0];
      walletAddressRef.current = newAddress;
      setWalletAddress(newAddress);
      if (provider) {
        const s = await provider.getSigner();
        setSigner(s);
      }
      addNotification('Wallet Connected Successfully');
      refreshProjects();
    } catch (error) {
      console.error(error);
      addNotification('Failed to connect wallet', 'error');
    }
  };

  // Initialize Ethers
  useEffect(() => {
    if (window.ethereum) {
      const browserProvider = new ethers.BrowserProvider(window.ethereum);
      setProvider(browserProvider);
    }
  }, []);

  // Listeners
  useEffect(() => {
    if (!provider || !window.ethereum) return;

    const updateNetwork = async () => {
      const net = await provider.getNetwork();
      setNetwork(`${net.name} (${net.chainId})`);
    };

    const handleAccountsChanged = async (accounts: string[]) => {
      console.log("MetaMask accounts changed:", accounts);
      const newAddress = accounts.length > 0 ? accounts[0] : null;

      if (newAddress?.toLowerCase() === walletAddressRef.current?.toLowerCase()) {
        console.log("Account same as current, skipping update");
        return;
      }

      const wasConnected = !!walletAddressRef.current;
      walletAddressRef.current = newAddress;
      setWalletAddress(newAddress);

      if (newAddress) {
        const newSigner = await provider.getSigner();
        setSigner(newSigner);
        await updateNetwork();
        
        if (!wasConnected) {
          addNotification(`Wallet connected: ${newAddress.substring(0, 6)}...${newAddress.substring(38)}`, 'success');
        } else {
          addNotification(`Account changed to ${newAddress.substring(0, 6)}...${newAddress.substring(38)}`, 'info');
        }
        
        // Force refresh projects and role detection will happen via useEffect
        refreshProjects();
      } else {
        setSigner(null);
        setNetwork(null);
        setCurrentRole('Regulator'); // Reset to default role on disconnect
        if (wasConnected) {
          addNotification('Wallet disconnected', 'warning');
        }
      }
    };

    const handleChainChanged = () => {
      window.location.reload();
    };

    window.ethereum.on('accountsChanged', handleAccountsChanged);
    window.ethereum.on('chainChanged', handleChainChanged);
    
    // Initial check
    window.ethereum.request({ method: 'eth_accounts' }).then(handleAccountsChanged);
    updateNetwork();

    return () => {
      if (window.ethereum && window.ethereum.removeListener) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      }
    };
  }, [provider, refreshProjects]);

  useEffect(() => {
    if (provider) refreshProjects();
  }, [provider, refreshProjects]);

  const addContractor = (contractor: Contractor) => {
    const updated = [...contractors, contractor];
    setContractors(updated);
    localStorage.setItem('blockchain_contractors', JSON.stringify(updated));
    addNotification('Contractor added to local registry', 'success');
  };

  const addInspector = (inspector: Inspector) => {
    const updated = [...inspectors, inspector];
    setInspectors(updated);
    localStorage.setItem('blockchain_inspectors', JSON.stringify(updated));
    addNotification('Inspector added to local registry', 'success');
  };

  return {
    projects,
    logs,
    contractors,
    inspectors,
    currentRole,
    setCurrentRole,
    notifications,
    walletAddress,
    factoryAddress,
    setFactoryAddress,
    authorityAddress,
    setAuthorityAddress,
    connectWallet,
    network,
    createProject,
    submitMilestone,
    assignInspector,
    inspectorVerifyMilestone,
    govVerifyMilestone,
    releasePayment,
    resumeMilestone,
    updateMilestone,
    reassignContractor,
    requestNewMilestone,
    handleMilestoneRequest,
    requestProjectCompletion,
    approveProjectCompletion,
    deleteProject,
    createMilestone,
    deleteMilestone,
    requestFunds,
    handleFundRequest,
    recordPurchase,
    addContractor,
    addInspector,
    refreshProjects
  };
};

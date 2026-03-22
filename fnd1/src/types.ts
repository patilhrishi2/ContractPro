export type UserRole = 
  | 'Government Authority' 
  | 'Contractor' 
  | 'Inspector' 
  | 'Regulator';

declare global {
  interface Window {
    ethereum?: any;
  }
}

export interface Milestone {
  id: string;
  title: string;
  description: string;
  budget: number;
  paymentPercentage: number;
  status: 'Pending' | 'Submitted' | 'InReview' | 'Approved' | 'Paid' | 'Rejected' | 'Deleted';
  submittedAt?: string;
  inspectorApprovedAt?: string;
  approvedAt?: string;
  isLocked?: boolean;
  assignedInspectorIds: string[];
  invoiceUrl?: string;
  inspectorEvidenceUrl?: string;
  inspectionReport?: string;
  rejectionReason?: string;
}

export interface FundRequest {
  id: string;
  amount: number;
  reason: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  timestamp: string;
}

export interface Purchase {
  id: string;
  itemName: string;
  supplierName: string;
  material: string;
  cost: number;
  milestoneId: string; // Linked to a specific milestone
  evidenceUrl?: string; // Evidence (file - img or pdf)
  timestamp: string;
}

export interface MilestoneRequest {
  id: string;
  projectId: string;
  title: string;
  description: string;
  budget: number;
  paymentPercentage: number;
  status: 'Pending' | 'Approved' | 'Rejected';
  timestamp: string;
}

export interface Contractor {
  id: string;
  name: string;
  totalProjects: number;
  completedProjects: number;
  rejectedMilestones: number;
  performanceScore: number; // 0-100
}

export interface Inspector {
  id: string;
  name: string;
  specialization: string;
  verifiedProjects: number;
}

export interface Project {
  id: string;
  name: string;
  type: string;
  totalBudget: number;
  allocatedBudget: number;
  status: 'Active' | 'On Hold' | 'Completed';
  milestones: Milestone[];
  fundRequests: FundRequest[];
  purchases: Purchase[];
  createdAt: string;
  createdBy: string;
  assignedContractorId: string;
  milestoneRequests?: MilestoneRequest[];
  completionRequested?: boolean;
}

export interface AuditLog {
  id: string;
  projectId: string;
  action: string;
  role: UserRole;
  timestamp: string;
  blockNumber: number;
  hash: string;
  txHash?: string;
  details: string;
}

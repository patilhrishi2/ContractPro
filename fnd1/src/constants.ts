import { Project, AuditLog, Contractor, Inspector } from './types';

export const INITIAL_CONTRACTORS: Contractor[] = [
  {
    id: '0x1111111111111111111111111111111111111111',
    name: 'BuildRight Infrastructure',
    totalProjects: 12,
    completedProjects: 10,
    rejectedMilestones: 2,
    performanceScore: 88,
  },
  {
    id: '0x2222222222222222222222222222222222222222',
    name: 'Apex Construction Group',
    totalProjects: 8,
    completedProjects: 7,
    rejectedMilestones: 1,
    performanceScore: 92,
  },
  {
    id: '0x3333333333333333333333333333333333333333',
    name: 'Urban Development Co.',
    totalProjects: 5,
    completedProjects: 3,
    rejectedMilestones: 4,
    performanceScore: 65,
  }
];

export const INITIAL_INSPECTORS: Inspector[] = [
  {
    id: '0x4444444444444444444444444444444444444444',
    name: 'Sarah Johnson',
    specialization: 'Civil Engineering',
    verifiedProjects: 45,
  },
  {
    id: '0x5555555555555555555555555555555555555555',
    name: 'Michael Chen',
    specialization: 'Structural Safety',
    verifiedProjects: 32,
  },
  {
    id: '0x6666666666666666666666666666666666666666',
    name: 'Elena Rodriguez',
    specialization: 'Urban Planning',
    verifiedProjects: 28,
  }
];

export const INITIAL_PROJECTS: Project[] = [
  {
    id: 'proj-1',
    name: 'Smart City Highway Expansion',
    type: 'Road',
    totalBudget: 5000000,
    allocatedBudget: 2000000,
    status: 'Active',
    createdAt: new Date(Date.now() - 86400000 * 10).toISOString(),
    createdBy: 'Gov-Admin-01',
    assignedContractorId: '0x1111111111111111111111111111111111111111',
    milestoneRequests: [],
    fundRequests: [],
    purchases: [],
    milestones: [
      {
        id: 'm1',
        title: 'Site Survey & Clearance',
        description: 'Initial land survey and clearing of obstacles.',
        budget: 500000,
        paymentPercentage: 10,
        status: 'Approved',
        submittedAt: new Date(Date.now() - 86400000 * 8).toISOString(),
        approvedAt: new Date(Date.now() - 86400000 * 7).toISOString(),
        assignedInspectorIds: ['0x4444444444444444444444444444444444444444'],
        invoiceUrl: 'https://example.com/invoice1.pdf'
      },
      {
        id: 'm2',
        title: 'Foundation Laying',
        description: 'Laying the base layer for the highway.',
        budget: 1000000,
        paymentPercentage: 20,
        status: 'Submitted',
        submittedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
        assignedInspectorIds: ['0x5555555555555555555555555555555555555555'],
        invoiceUrl: 'https://example.com/invoice2.pdf'
      },
      {
        id: 'm3',
        title: 'Asphalt Paving',
        description: 'Final asphalt layer and marking.',
        budget: 3500000,
        paymentPercentage: 70,
        status: 'Pending',
        assignedInspectorIds: []
      }
    ]
  }
];

export const INITIAL_LOGS: AuditLog[] = [
  {
    id: 'log-1',
    projectId: 'proj-1',
    action: 'Project Created',
    role: 'Government Authority',
    timestamp: new Date(Date.now() - 86400000 * 10).toISOString(),
    blockNumber: 10245,
    hash: '0xabc123...',
    details: 'Project "Smart City Highway Expansion" initialized with budget $5,000,000'
  },
  {
    id: 'log-2',
    projectId: 'proj-1',
    action: 'Budget Allocated',
    role: 'Government Authority',
    timestamp: new Date(Date.now() - 86400000 * 9).toISOString(),
    blockNumber: 10250,
    hash: '0xdef456...',
    details: 'Allocated $2,000,000 to project escrow.'
  }
];

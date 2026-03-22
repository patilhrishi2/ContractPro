export const FACTORY_ABI = [
  "function createProject(string _name, address payable _contractor) payable public",
  "function getProjectCount() public view returns (uint256)",
  "function getProject(uint256 _index) public view returns (address contractAddress, string name, address contractor, uint256 initialBudget, address authority)",
  "event ProjectCreated(uint256 index, address contractAddress, string name, address contractor, uint256 budget)"
];

export const PROJECT_ABI = [
  "function addMilestone(string _name, string _description, uint256 _amount) public",
  "function assignInspector(uint256 _index, address _inspector) public",
  "function markComplete(uint256 _index, bytes32 _invoiceHash) public",
  "function submitEvidence(uint256 _index, bytes32 _evidenceHash, string _description) public",
  "function approveMilestone(uint256 _index) public",
  "function rejectMilestone(uint256 _index, string _reason) public",
  "function resumeMilestone(uint256 _index) public",
  "function releasePayment(uint256 _index) public",
  "function markProjectComplete() public",
  "function approveProjectCompletion() public",
  "function createFundRequest(uint256 _amount, string _reason) public",
  "function approveFundRequest(uint256 _index) payable public",
  "function rejectFundRequest(uint256 _index) public",
  "function logMaterial(uint256 _milestoneIndex, string _supplierName, string _materialDescription, uint256 _cost, bytes32 _invoiceHash) public",
  "function getMilestone(uint256 _index) public view returns (string name, string description, uint256 amount, uint8 status, bytes32 invoiceHash, address milestoneInspector, bool inspectorApproved, bool authorityConfirmed, bytes32 evidenceHash, bool evidenceSubmitted, string evidenceDescription, string rejectionReason)",
  "function getMilestoneCount() public view returns (uint256)",
  "function getBudgetSummary() public view returns (uint256 total, uint256 spent, uint256 remaining)",
  "function contractorMarkedComplete() public view returns (bool)",
  "function projectCompleted() public view returns (bool)",
  "function authority() public view returns (address)",
  "function contractor() public view returns (address)",
  "function getFundRequestCount() public view returns (uint256)",
  "function getFundRequest(uint256 _index) public view returns (uint256 amount, string reason, uint8 status, uint256 timestamp)",
  "function getMaterialLogCount() public view returns (uint256)",
  "function getMaterialLog(uint256 _index) public view returns (uint256 milestoneIndex, string supplierName, string materialDescription, uint256 cost, bytes32 invoiceHash, uint256 timestamp)",
  "function replaceContractor(address payable _newContractor) public"
];

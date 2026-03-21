// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract Project {

    address public authority;
    address payable public contractor;

    uint256 public totalBudget;
    uint256 public spentAmount;

    bool public contractorMarkedComplete;
    bool public projectCompleted;

    enum MilestoneStatus { Pending, Complete, InReview, Approved, Paid, Rejected, Deleted }
    enum FundRequestStatus { Pending, Approved, Rejected }

    struct Milestone {
        string name;
        string description;
        uint256 amount;
        MilestoneStatus status;
        bytes32 invoiceHash;
        address milestoneInspector;
        bool inspectorApproved;
        bool authorityConfirmed;
        bytes32 evidenceHash;
        bool evidenceSubmitted;
        string evidenceDescription;
        string rejectionReason;
    }

    struct FundRequest {
        uint256 amount;
        string reason;
        FundRequestStatus status;
        uint256 timestamp;
    }

    struct MaterialLog {
        uint256 milestoneIndex;
        string supplierName;
        string materialDescription;
        uint256 cost;
        bytes32 invoiceHash;
        uint256 timestamp;
    }

    Milestone[] public milestones;
    FundRequest[] public fundRequests;
    MaterialLog[] public materialLogs;
    mapping(bytes32 => bool) public usedHashes;

    event MilestoneAdded(uint256 index, string name, string description, uint256 amount);
    event MilestoneDeleted(uint256 index);
    event MilestoneMarkedComplete(uint256 index, address contractor, bytes32 invoiceHash);
    event InspectorAssigned(uint256 index, address inspector);
    event EvidenceSubmitted(uint256 index, bytes32 evidenceHash, string description, address inspector);
    event InspectorApproved(uint256 index, address inspector);
    event InspectorRejected(uint256 index, address inspector, string reason);
    event MilestoneResumed(uint256 index);
    event ContractorReplaced(address oldContractor, address newContractor);
    event AuthorityConfirmed(uint256 index, address authority);
    event MilestoneApproved(uint256 index, address approvedBy);
    event PaymentReleased(uint256 index, uint256 amount);
    event FundsReceived(address sender, uint256 amount);
    event BudgetSet(uint256 totalBudget);
    event InvoiceSubmitted(uint256 index, bytes32 invoiceHash);
    event FundRequestCreated(uint256 requestIndex, uint256 amount, string reason);
    event FundRequestApproved(uint256 requestIndex, uint256 amount);
    event FundRequestRejected(uint256 requestIndex);
    event ContractorMarkedProjectComplete();
    event ProjectCompleted(address authority);
    event MaterialLogged(
        uint256 logIndex, uint256 milestoneIndex,
        string supplierName, string materialDescription,
        uint256 cost, bytes32 invoiceHash
    );

    modifier onlyAuthority() {
        require(msg.sender == authority, "Only authority can call this");
        _;
    }

    modifier onlyContractor() {
        require(msg.sender == contractor, "Only contractor can call this");
        _;
    }

    modifier onlyMilestoneInspector(uint256 _index) {
        require(msg.sender == milestones[_index].milestoneInspector, "Only assigned inspector");
        _;
    }

    constructor(address _authority, address payable _contractor) payable {
        authority  = _authority;
        contractor = _contractor;
        if (msg.value > 0) {
            totalBudget = msg.value;
            emit BudgetSet(totalBudget);
            emit FundsReceived(msg.sender, msg.value);
        }
    }

    receive() external payable {
        totalBudget += msg.value;
        emit BudgetSet(totalBudget);
        emit FundsReceived(msg.sender, msg.value);
    }

    // ── MILESTONES ──────────────────────────────────────────

    function addMilestone(
        string memory _name,
        string memory _description,
        uint256 _amount
    ) external onlyContractor {
        require(!projectCompleted, "Project already completed");
        milestones.push(Milestone({
            name: _name,
            description: _description,
            amount: _amount,
            status: MilestoneStatus.Pending,
            invoiceHash: bytes32(0),
            milestoneInspector: address(0),
            inspectorApproved: false,
            authorityConfirmed: false,
            evidenceHash: bytes32(0),
            evidenceSubmitted: false,
            evidenceDescription: "",
            rejectionReason: ""
        }));
        emit MilestoneAdded(milestones.length - 1, _name, _description, _amount);
    }

    // Contractor deletes a milestone (only if Pending)
    function deleteMilestone(uint256 _index) external onlyContractor {
        require(_index < milestones.length, "Invalid index");
        require(milestones[_index].status == MilestoneStatus.Pending, "Can only delete pending milestones");
        milestones[_index].status = MilestoneStatus.Deleted;
        emit MilestoneDeleted(_index);
    }

    // Contractor marks milestone complete — invoice is REQUIRED and bundled here
    function markComplete(uint256 _index, bytes32 _invoiceHash) external onlyContractor {
        require(_index < milestones.length, "Invalid index");
        require(
            milestones[_index].status == MilestoneStatus.Pending ||
            milestones[_index].status == MilestoneStatus.Rejected,
            "Must be Pending or Rejected to mark complete"
        );
        require(_invoiceHash != bytes32(0), "Invoice hash required");
        require(!usedHashes[_invoiceHash], "Duplicate invoice hash");
        usedHashes[_invoiceHash] = true;
        milestones[_index].invoiceHash = _invoiceHash;
        milestones[_index].status = MilestoneStatus.Complete;
        emit InvoiceSubmitted(_index, _invoiceHash);
        emit MilestoneMarkedComplete(_index, msg.sender, _invoiceHash);
    }

    // Authority assigns inspector to a completed milestone
    function assignInspector(uint256 _index, address _inspector) external onlyAuthority {
        require(_index < milestones.length, "Invalid index");
        require(milestones[_index].status == MilestoneStatus.Complete, "Not complete yet");
        require(_inspector != address(0), "Invalid inspector");
        require(_inspector != authority, "Authority cannot inspect");
        require(_inspector != contractor, "Contractor cannot inspect");
        milestones[_index].milestoneInspector = _inspector;
        milestones[_index].status = MilestoneStatus.InReview;
        // Reset previous rejection if any
        milestones[_index].inspectorApproved = false;
        milestones[_index].evidenceSubmitted = false;
        milestones[_index].evidenceHash = bytes32(0);
        milestones[_index].evidenceDescription = "";
        milestones[_index].rejectionReason = "";
        emit InspectorAssigned(_index, _inspector);
    }

    // Inspector submits evidence
    function submitEvidence(
        uint256 _index,
        bytes32 _evidenceHash,
        string memory _description
    ) external onlyMilestoneInspector(_index) {
        require(_index < milestones.length, "Invalid index");
        require(milestones[_index].status == MilestoneStatus.InReview, "Not in review");
        require(_evidenceHash != bytes32(0), "Invalid evidence hash");
        milestones[_index].evidenceHash = _evidenceHash;
        milestones[_index].evidenceSubmitted = true;
        milestones[_index].evidenceDescription = _description;
        emit EvidenceSubmitted(_index, _evidenceHash, _description, msg.sender);
    }

    // Inspector approves milestone
    function approveMilestone(uint256 _index) external onlyMilestoneInspector(_index) {
        require(_index < milestones.length, "Invalid index");
        require(milestones[_index].status == MilestoneStatus.InReview, "Not in review");
        require(milestones[_index].evidenceSubmitted, "Submit evidence first");
        require(!milestones[_index].inspectorApproved, "Already approved");
        milestones[_index].inspectorApproved = true;
        emit InspectorApproved(_index, msg.sender);
        if (milestones[_index].authorityConfirmed) {
            milestones[_index].status = MilestoneStatus.Approved;
            emit MilestoneApproved(_index, msg.sender);
        }
    }

    // Inspector rejects milestone with reason
    function rejectMilestone(uint256 _index, string memory _reason) external onlyMilestoneInspector(_index) {
        require(_index < milestones.length, "Invalid index");
        require(milestones[_index].status == MilestoneStatus.InReview, "Not in review");
        milestones[_index].status = MilestoneStatus.Rejected;
        milestones[_index].rejectionReason = _reason;
        milestones[_index].inspectorApproved = false;
        emit InspectorRejected(_index, msg.sender, _reason);
    }

    // Authority: resume rejected milestone (contractor can redo work)
    function resumeMilestone(uint256 _index) external onlyAuthority {
        require(_index < milestones.length, "Invalid index");
        require(milestones[_index].status == MilestoneStatus.Rejected, "Not rejected");
        milestones[_index].status = MilestoneStatus.Pending;
        milestones[_index].invoiceHash = bytes32(0);
        milestones[_index].inspectorApproved = false;
        milestones[_index].authorityConfirmed = false;
        milestones[_index].evidenceSubmitted = false;
        milestones[_index].evidenceHash = bytes32(0);
        milestones[_index].evidenceDescription = "";
        milestones[_index].rejectionReason = "";
        emit MilestoneResumed(_index);
    }

    // Authority: replace contractor
    function replaceContractor(address payable _newContractor) external onlyAuthority {
        require(_newContractor != address(0), "Invalid address");
        require(_newContractor != authority, "Cannot be authority");
        address old = contractor;
        contractor = _newContractor;
        emit ContractorReplaced(old, _newContractor);
    }

    // Authority: confirm milestone after inspector approves
    function confirmMilestone(uint256 _index) external onlyAuthority {
        require(_index < milestones.length, "Invalid index");
        require(milestones[_index].inspectorApproved, "Inspector must approve first");
        require(!milestones[_index].authorityConfirmed, "Already confirmed");
        milestones[_index].authorityConfirmed = true;
        milestones[_index].status = MilestoneStatus.Approved;
        emit AuthorityConfirmed(_index, msg.sender);
        emit MilestoneApproved(_index, msg.sender);
    }

    // Authority: release payment
    function releasePayment(uint256 _index) external onlyAuthority {
        require(_index < milestones.length, "Invalid index");
        require(milestones[_index].status == MilestoneStatus.Approved, "Not approved");
        require(address(this).balance >= milestones[_index].amount, "Insufficient balance");
        milestones[_index].status = MilestoneStatus.Paid;
        spentAmount += milestones[_index].amount;
        contractor.transfer(milestones[_index].amount);
        emit PaymentReleased(_index, milestones[_index].amount);
    }

    // ── PROJECT COMPLETION ──────────────────────────────────

    // Contractor marks project complete — all milestones must be Paid or Deleted
    function markProjectComplete() external onlyContractor {
        require(!projectCompleted, "Already completed");
        require(!contractorMarkedComplete, "Already requested completion");
        for (uint256 i = 0; i < milestones.length; i++) {
            MilestoneStatus s = milestones[i].status;
            require(
                s == MilestoneStatus.Paid || s == MilestoneStatus.Deleted,
                "All milestones must be Paid or Deleted"
            );
        }
        contractorMarkedComplete = true;
        emit ContractorMarkedProjectComplete();
    }

    // Authority gives final project approval
    function approveProjectCompletion() external onlyAuthority {
        require(contractorMarkedComplete, "Contractor must mark complete first");
        require(!projectCompleted, "Already completed");
        projectCompleted = true;
        emit ProjectCompleted(msg.sender);
    }

    // ── FUND REQUESTS ───────────────────────────────────────

    function createFundRequest(uint256 _amount, string memory _reason) external onlyContractor {
        require(!projectCompleted, "Project completed");
        require(_amount > 0, "Amount must be > 0");
        require(bytes(_reason).length > 0, "Reason required");
        fundRequests.push(FundRequest({
            amount: _amount,
            reason: _reason,
            status: FundRequestStatus.Pending,
            timestamp: block.timestamp
        }));
        emit FundRequestCreated(fundRequests.length - 1, _amount, _reason);
    }

    // Authority approves fund request — sends ETH
    function approveFundRequest(uint256 _requestIndex) external payable onlyAuthority {
        require(_requestIndex < fundRequests.length, "Invalid index");
        require(fundRequests[_requestIndex].status == FundRequestStatus.Pending, "Not pending");
        require(msg.value == fundRequests[_requestIndex].amount, "Send exact amount");
        fundRequests[_requestIndex].status = FundRequestStatus.Approved;
        totalBudget += msg.value;
        emit FundRequestApproved(_requestIndex, msg.value);
        emit BudgetSet(totalBudget);
        emit FundsReceived(msg.sender, msg.value);
    }

    // Authority rejects fund request
    function rejectFundRequest(uint256 _requestIndex) external onlyAuthority {
        require(_requestIndex < fundRequests.length, "Invalid index");
        require(fundRequests[_requestIndex].status == FundRequestStatus.Pending, "Not pending");
        fundRequests[_requestIndex].status = FundRequestStatus.Rejected;
        emit FundRequestRejected(_requestIndex);
    }

    // ── MATERIAL LOGS ───────────────────────────────────────

    function logMaterial(
        uint256 _milestoneIndex,
        string memory _supplierName,
        string memory _materialDescription,
        uint256 _cost,
        bytes32 _invoiceHash
    ) external onlyContractor {
        require(_milestoneIndex < milestones.length, "Invalid index");
        require(bytes(_supplierName).length > 0, "Supplier required");
        require(bytes(_materialDescription).length > 0, "Description required");
        require(_cost > 0, "Cost must be > 0");
        if (_invoiceHash != bytes32(0)) {
            require(!usedHashes[_invoiceHash], "Duplicate hash");
            usedHashes[_invoiceHash] = true;
        }
        materialLogs.push(MaterialLog({
            milestoneIndex: _milestoneIndex,
            supplierName: _supplierName,
            materialDescription: _materialDescription,
            cost: _cost,
            invoiceHash: _invoiceHash,
            timestamp: block.timestamp
        }));
        emit MaterialLogged(
            materialLogs.length - 1, _milestoneIndex,
            _supplierName, _materialDescription, _cost, _invoiceHash
        );
    }

    // ── GETTERS ─────────────────────────────────────────────

    function getBudgetSummary() external view returns (
        uint256 total, uint256 spent, uint256 remaining
    ) {
        uint256 rem = totalBudget > spentAmount ? totalBudget - spentAmount : 0;
        return (totalBudget, spentAmount, rem);
    }

    function getMilestoneCount() external view returns (uint256) {
        return milestones.length;
    }

    function getBalance() external view returns (uint256) {
        return address(this).balance;
    }

    function getMilestone(uint256 _index) external view returns (
        string memory name,
        string memory description,
        uint256 amount,
        MilestoneStatus status,
        bytes32 invoiceHash,
        address milestoneInspector,
        bool inspectorApproved,
        bool authorityConfirmed,
        bytes32 evidenceHash,
        bool evidenceSubmitted,
        string memory evidenceDescription,
        string memory rejectionReason
    ) {
        require(_index < milestones.length, "Invalid index");
        Milestone storage m = milestones[_index];
        return (
            m.name, m.description, m.amount, m.status,
            m.invoiceHash, m.milestoneInspector,
            m.inspectorApproved, m.authorityConfirmed,
            m.evidenceHash, m.evidenceSubmitted,
            m.evidenceDescription, m.rejectionReason
        );
    }

    function getFundRequestCount() external view returns (uint256) {
        return fundRequests.length;
    }

    function getFundRequest(uint256 _index) external view returns (
        uint256 amount,
        string memory reason,
        FundRequestStatus status,
        uint256 timestamp
    ) {
        require(_index < fundRequests.length, "Invalid index");
        FundRequest storage r = fundRequests[_index];
        return (r.amount, r.reason, r.status, r.timestamp);
    }

    function getMaterialLogCount() external view returns (uint256) {
        return materialLogs.length;
    }

    function getMaterialLog(uint256 _index) external view returns (
        uint256 milestoneIndex,
        string memory supplierName,
        string memory materialDescription,
        uint256 cost,
        bytes32 invoiceHash,
        uint256 timestamp
    ) {
        require(_index < materialLogs.length, "Invalid index");
        MaterialLog storage l = materialLogs[_index];
        return (l.milestoneIndex, l.supplierName, l.materialDescription, l.cost, l.invoiceHash, l.timestamp);
    }
}
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract Project {

    address public authority;
    address payable public contractor;
    address public inspector;

    uint256 public totalBudget;
    uint256 public spentAmount;

    enum MilestoneStatus { Pending, InReview, Approved, Paid }

    struct Milestone {
        string description;
        uint256 amount;
        MilestoneStatus status;
        bytes32 invoiceHash;
        bool inspectorApproved;   // NEW
        bool authorityConfirmed;  // NEW
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
    MaterialLog[] public materialLogs;
    mapping(bytes32 => bool) public usedHashes;

    event MilestoneAdded(uint256 index, string description, uint256 amount);
    event InspectorApproved(uint256 index, address inspector);   // NEW
    event AuthorityConfirmed(uint256 index, address authority);  // NEW
    event MilestoneApproved(uint256 index, address approvedBy);
    event PaymentReleased(uint256 index, uint256 amount);
    event FundsReceived(address sender, uint256 amount);
    event InvoiceSubmitted(uint256 index, bytes32 invoiceHash);
    event BudgetSet(uint256 totalBudget);
    event MaterialLogged(
        uint256 logIndex,
        uint256 milestoneIndex,
        string supplierName,
        string materialDescription,
        uint256 cost,
        bytes32 invoiceHash
    );

    modifier onlyAuthority() {
        require(msg.sender == authority, "Only authority can call this");
        _;
    }

    modifier onlyInspector() {
        require(msg.sender == inspector, "Only inspector can call this");
        _;
    }

    constructor(address _authority, address payable _contractor, address _inspector) {
        authority  = _authority;
        contractor = _contractor;
        inspector  = _inspector;
    }

    receive() external payable {
        if (totalBudget == 0) {
            totalBudget = msg.value;
        } else {
            totalBudget += msg.value;
        }
        emit BudgetSet(totalBudget);
        emit FundsReceived(msg.sender, msg.value);
    }

    function addMilestone(string memory _description, uint256 _amount) external onlyAuthority {
        milestones.push(Milestone({
            description: _description,
            amount: _amount,
            status: MilestoneStatus.Pending,
            invoiceHash: bytes32(0),
            inspectorApproved: false,
            authorityConfirmed: false
        }));
        emit MilestoneAdded(milestones.length - 1, _description, _amount);
    }

    // STEP 1: Inspector approves — moves to InReview
    function approveMilestone(uint256 _index) external onlyInspector {
        require(_index < milestones.length, "Invalid milestone index");
        require(milestones[_index].status == MilestoneStatus.Pending, "Not pending");
        require(!milestones[_index].inspectorApproved, "Inspector already approved");
        milestones[_index].inspectorApproved = true;
        milestones[_index].status = MilestoneStatus.InReview;
        emit InspectorApproved(_index, msg.sender);
        // Check if authority already confirmed (edge case)
        if (milestones[_index].authorityConfirmed) {
            milestones[_index].status = MilestoneStatus.Approved;
            emit MilestoneApproved(_index, msg.sender);
        }
    }

    // STEP 2: Authority confirms — only after inspector approved
    function confirmMilestone(uint256 _index) external onlyAuthority {
        require(_index < milestones.length, "Invalid milestone index");
        require(milestones[_index].inspectorApproved, "Inspector must approve first");
        require(!milestones[_index].authorityConfirmed, "Authority already confirmed");
        milestones[_index].authorityConfirmed = true;
        milestones[_index].status = MilestoneStatus.Approved;
        emit AuthorityConfirmed(_index, msg.sender);
        emit MilestoneApproved(_index, msg.sender);
    }

    // STEP 3: Authority releases payment — only after both approved
    function releasePayment(uint256 _index) external onlyAuthority {
        require(_index < milestones.length, "Invalid milestone index");
        require(milestones[_index].status == MilestoneStatus.Approved, "Not fully approved");
        require(address(this).balance >= milestones[_index].amount, "Insufficient contract balance");
        milestones[_index].status = MilestoneStatus.Paid;
        spentAmount += milestones[_index].amount;
        contractor.transfer(milestones[_index].amount);
        emit PaymentReleased(_index, milestones[_index].amount);
    }

    function submitInvoice(uint256 _index, bytes32 _invoiceHash) external onlyAuthority {
        require(_index < milestones.length, "Invalid milestone index");
        require(_invoiceHash != bytes32(0), "Invalid hash");
        require(!usedHashes[_invoiceHash], "Duplicate invoice hash");
        usedHashes[_invoiceHash] = true;
        milestones[_index].invoiceHash = _invoiceHash;
        emit InvoiceSubmitted(_index, _invoiceHash);
    }

    function logMaterial(
        uint256 _milestoneIndex,
        string memory _supplierName,
        string memory _materialDescription,
        uint256 _cost,
        bytes32 _invoiceHash
    ) external onlyAuthority {
        require(_milestoneIndex < milestones.length, "Invalid milestone index");
        require(bytes(_supplierName).length > 0, "Supplier name required");
        require(bytes(_materialDescription).length > 0, "Material description required");
        require(_cost > 0, "Cost must be greater than 0");
        if (_invoiceHash != bytes32(0)) {
            require(!usedHashes[_invoiceHash], "Duplicate invoice hash");
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
            materialLogs.length - 1,
            _milestoneIndex,
            _supplierName,
            _materialDescription,
            _cost,
            _invoiceHash
        );
    }

    function getBudgetSummary() external view returns (
        uint256 total,
        uint256 spent,
        uint256 remaining
    ) {
        uint256 rem = totalBudget > spentAmount ? totalBudget - spentAmount : 0;
        return (totalBudget, spentAmount, rem);
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
        require(_index < materialLogs.length, "Invalid log index");
        MaterialLog storage l = materialLogs[_index];
        return (l.milestoneIndex, l.supplierName, l.materialDescription, l.cost, l.invoiceHash, l.timestamp);
    }

    function getInvoice(uint256 _index) external view returns (bytes32) {
        require(_index < milestones.length, "Invalid milestone index");
        return milestones[_index].invoiceHash;
    }

    function getMilestoneCount() external view returns (uint256) {
        return milestones.length;
    }

    function getBalance() external view returns (uint256) {
        return address(this).balance;
    }

    // Updated to return inspectorApproved and authorityConfirmed flags
    function getMilestone(uint256 _index) external view returns (
        string memory description,
        uint256 amount,
        MilestoneStatus status,
        bytes32 invoiceHash,
        bool inspectorApproved,
        bool authorityConfirmed
    ) {
        require(_index < milestones.length, "Invalid index");
        Milestone storage m = milestones[_index];
        return (m.description, m.amount, m.status, m.invoiceHash, m.inspectorApproved, m.authorityConfirmed);
    }
}
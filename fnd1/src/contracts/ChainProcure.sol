// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract Project {
    enum MilestoneStatus { Pending, Submitted, InReview, Approved, Paid, Rejected, Deleted }
    
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
        uint8 status; // 0: Pending, 1: Approved, 2: Rejected
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

    address payable public authority;
    address payable public contractor;
    string public name;
    uint256 public initialBudget;
    bool public contractorMarkedComplete;
    bool public projectCompleted;

    Milestone[] public milestones;
    FundRequest[] public fundRequests;
    MaterialLog[] public materialLogs;

    modifier onlyAuthority() {
        require(msg.sender == authority, "Only authority can call this");
        _;
    }

    modifier onlyContractor() {
        require(msg.sender == contractor, "Only contractor can call this");
        _;
    }

    constructor(string memory _name, address payable _authority, address payable _contractor) payable {
        name = _name;
        authority = _authority;
        contractor = _contractor;
        initialBudget = msg.value;
    }

    function addMilestone(string memory _name, string memory _description, uint256 _amount) public onlyAuthority {
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
    }

    function assignInspector(uint256 _index, address _inspector) public onlyAuthority {
        require(_index < milestones.length, "Invalid milestone index");
        milestones[_index].milestoneInspector = _inspector;
    }

    function markComplete(uint256 _index, bytes32 _invoiceHash) public onlyContractor {
        require(_index < milestones.length, "Invalid milestone index");
        milestones[_index].status = MilestoneStatus.Submitted;
        milestones[_index].invoiceHash = _invoiceHash;
    }

    function submitEvidence(uint256 _index, bytes32 _evidenceHash, string memory _description) public {
        require(_index < milestones.length, "Invalid milestone index");
        require(msg.sender == milestones[_index].milestoneInspector, "Only assigned inspector");
        milestones[_index].evidenceHash = _evidenceHash;
        milestones[_index].evidenceDescription = _description;
        milestones[_index].evidenceSubmitted = true;
        milestones[_index].status = MilestoneStatus.InReview;
    }

    function approveMilestone(uint256 _index) public {
        require(_index < milestones.length, "Invalid milestone index");
        require(msg.sender == milestones[_index].milestoneInspector, "Only assigned inspector");
        milestones[_index].inspectorApproved = true;
        milestones[_index].status = MilestoneStatus.Approved;
    }

    function rejectMilestone(uint256 _index, string memory _reason) public {
        require(_index < milestones.length, "Invalid milestone index");
        require(msg.sender == milestones[_index].milestoneInspector, "Only assigned inspector");
        milestones[_index].status = MilestoneStatus.Rejected;
        milestones[_index].rejectionReason = _reason;
    }

    function resumeMilestone(uint256 _index) public onlyAuthority {
        require(_index < milestones.length, "Invalid milestone index");
        milestones[_index].status = MilestoneStatus.Pending;
    }

    function releasePayment(uint256 _index) public onlyAuthority {
        require(_index < milestones.length, "Invalid milestone index");
        require(milestones[_index].status == MilestoneStatus.Approved, "Milestone not approved");
        milestones[_index].status = MilestoneStatus.Paid;
        contractor.transfer(milestones[_index].amount);
    }

    function markProjectComplete() public onlyContractor {
        contractorMarkedComplete = true;
    }

    function approveProjectCompletion() public onlyAuthority {
        require(contractorMarkedComplete, "Contractor hasn't marked complete");
        projectCompleted = true;
    }

    function createFundRequest(uint256 _amount, string memory _reason) public onlyContractor {
        fundRequests.push(FundRequest({
            amount: _amount,
            reason: _reason,
            status: 0,
            timestamp: block.timestamp
        }));
    }

    function approveFundRequest(uint256 _index) public payable onlyAuthority {
        require(_index < fundRequests.length, "Invalid index");
        fundRequests[_index].status = 1;
        contractor.transfer(fundRequests[_index].amount);
    }

    function rejectFundRequest(uint256 _index) public onlyAuthority {
        require(_index < fundRequests.length, "Invalid index");
        fundRequests[_index].status = 2;
    }

    function logMaterial(uint256 _milestoneIndex, string memory _supplierName, string memory _materialDescription, uint256 _cost, bytes32 _invoiceHash) public onlyContractor {
        materialLogs.push(MaterialLog({
            milestoneIndex: _milestoneIndex,
            supplierName: _supplierName,
            materialDescription: _materialDescription,
            cost: _cost,
            invoiceHash: _invoiceHash,
            timestamp: block.timestamp
        }));
    }

    function getMilestone(uint256 _index) public view returns (
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
        Milestone storage m = milestones[_index];
        return (m.name, m.description, m.amount, m.status, m.invoiceHash, m.milestoneInspector, m.inspectorApproved, m.authorityConfirmed, m.evidenceHash, m.evidenceSubmitted, m.evidenceDescription, m.rejectionReason);
    }

    function getMilestoneCount() public view returns (uint256) {
        return milestones.length;
    }

    function getFundRequestCount() public view returns (uint256) {
        return fundRequests.length;
    }

    function getFundRequest(uint256 _index) public view returns (uint256 amount, string memory reason, uint8 status, uint256 timestamp) {
        FundRequest storage fr = fundRequests[_index];
        return (fr.amount, fr.reason, fr.status, fr.timestamp);
    }

    function getMaterialLogCount() public view returns (uint256) {
        return materialLogs.length;
    }

    function getMaterialLog(uint256 _index) public view returns (uint256 milestoneIndex, string memory supplierName, string memory materialDescription, uint256 cost, bytes32 invoiceHash, uint256 timestamp) {
        MaterialLog storage ml = materialLogs[_index];
        return (ml.milestoneIndex, ml.supplierName, ml.materialDescription, ml.cost, ml.invoiceHash, ml.timestamp);
    }

    function getBudgetSummary() public view returns (uint256 total, uint256 spent, uint256 remaining) {
        return (initialBudget, address(this).balance, address(this).balance);
    }

    function replaceContractor(address payable _newContractor) public onlyAuthority {
        contractor = _newContractor;
    }

    receive() external payable {}
}

contract ProjectFactory {
    struct ProjectInfo {
        address contractAddress;
        string name;
        address contractor;
        uint256 initialBudget;
        address authority;
    }

    ProjectInfo[] public projects;

    event ProjectCreated(uint256 index, address contractAddress, string name, address contractor, uint256 budget);

    function createProject(string memory _name, address payable _contractor) payable public {
        Project newProject = (new Project){value: msg.value}(_name, payable(msg.sender), _contractor);
        projects.push(ProjectInfo({
            contractAddress: address(newProject),
            name: _name,
            contractor: _contractor,
            initialBudget: msg.value,
            authority: msg.sender
        }));
        emit ProjectCreated(projects.length - 1, address(newProject), _name, _contractor, msg.value);
    }

    function getProjectCount() public view returns (uint256) {
        return projects.length;
    }

    function getProject(uint256 _index) public view returns (address contractAddress, string memory name, address contractor, uint256 initialBudget, address authority) {
        ProjectInfo storage info = projects[_index];
        return (info.contractAddress, info.name, info.contractor, info.initialBudget, info.authority);
    }
}

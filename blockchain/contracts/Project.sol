// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract Project {

    address public authority;
    address payable public contractor;

    enum MilestoneStatus { Pending, Approved, Paid }

    struct Milestone {
        string description;
        uint256 amount;
        MilestoneStatus status;
        bytes32 invoiceHash;
    }

    Milestone[] public milestones;

    event MilestoneAdded(uint256 index, string description, uint256 amount);
    event MilestoneApproved(uint256 index);
    event PaymentReleased(uint256 index, uint256 amount);
    event FundsReceived(address sender, uint256 amount);
    event InvoiceSubmitted(uint256 index, bytes32 invoiceHash);

    modifier onlyAuthority() {
        require(msg.sender == authority, "Only authority can call this");
        _;
    }

    // ← authority is now passed in explicitly
    constructor(address _authority, address payable _contractor) {
        authority   = _authority;
        contractor  = _contractor;
    }

    receive() external payable {
        emit FundsReceived(msg.sender, msg.value);
    }

    function addMilestone(string memory _description, uint256 _amount) external onlyAuthority {
        milestones.push(Milestone({
            description: _description,
            amount: _amount,
            status: MilestoneStatus.Pending,
            invoiceHash: bytes32(0)
        }));
        emit MilestoneAdded(milestones.length - 1, _description, _amount);
    }

    function approveMilestone(uint256 _index) external onlyAuthority {
        require(_index < milestones.length, "Invalid milestone index");
        require(milestones[_index].status == MilestoneStatus.Pending, "Not pending");
        milestones[_index].status = MilestoneStatus.Approved;
        emit MilestoneApproved(_index);
    }

    function releasePayment(uint256 _index) external onlyAuthority {
        require(_index < milestones.length, "Invalid milestone index");
        require(milestones[_index].status == MilestoneStatus.Approved, "Not approved");
        require(address(this).balance >= milestones[_index].amount, "Insufficient contract balance");
        milestones[_index].status = MilestoneStatus.Paid;
        contractor.transfer(milestones[_index].amount);
        emit PaymentReleased(_index, milestones[_index].amount);
    }

    function submitInvoice(uint256 _index, bytes32 _invoiceHash) external onlyAuthority {
        require(_index < milestones.length, "Invalid milestone index");
        require(_invoiceHash != bytes32(0), "Invalid hash");
        milestones[_index].invoiceHash = _invoiceHash;
        emit InvoiceSubmitted(_index, _invoiceHash);
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

    function getMilestone(uint256 _index) external view returns (
        string memory description,
        uint256 amount,
        MilestoneStatus status,
        bytes32 invoiceHash
    ) {
        require(_index < milestones.length, "Invalid index");
        Milestone storage m = milestones[_index];
        return (m.description, m.amount, m.status, m.invoiceHash);
    }
}
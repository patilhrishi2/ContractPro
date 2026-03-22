// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./Project.sol";

contract ProjectFactory {

    address public authority;

    struct ProjectInfo {
        address contractAddress;
        string name;
        address contractor;
        uint256 initialBudget;
    }

    ProjectInfo[] public projects;

    event ProjectCreated(uint256 index, address contractAddress, string name, address contractor, uint256 budget);

    modifier onlyAuthority() {
        require(msg.sender == authority, "Only authority can call this");
        _;
    }

    constructor() {
        authority = msg.sender;
    }

    // Authority creates project AND sends initial budget in same transaction
    function createProject(
        string memory _name,
        address payable _contractor
    ) external payable onlyAuthority {
        require(_contractor != address(0), "Invalid contractor");
        require(msg.value > 0, "Initial budget required");
        Project newProject = new Project{value: msg.value}(msg.sender, _contractor);
        projects.push(ProjectInfo({
            contractAddress: address(newProject),
            name: _name,
            contractor: _contractor,
            initialBudget: msg.value
        }));
        emit ProjectCreated(projects.length - 1, address(newProject), _name, _contractor, msg.value);
    }

    function getProjectCount() external view returns (uint256) {
        return projects.length;
    }

    function getProject(uint256 _index) external view returns (
        address contractAddress,
        string memory name,
        address contractor,
        uint256 initialBudget
    ) {
        require(_index < projects.length, "Invalid index");
        ProjectInfo storage p = projects[_index];
        return (p.contractAddress, p.name, p.contractor, p.initialBudget);
    }
}

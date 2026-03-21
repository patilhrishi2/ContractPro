// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./Project.sol";

contract ProjectFactory {

    address public authority;

    struct ProjectInfo {
        address contractAddress;
        string name;
        address contractor;
        address inspector;
    }

    ProjectInfo[] public projects;

    event ProjectCreated(uint256 index, address contractAddress, string name, address contractor, address inspector);

    modifier onlyAuthority() {
        require(msg.sender == authority, "Only authority can call this");
        _;
    }

    constructor() {
        authority = msg.sender;
    }

    function createProject(
        string memory _name,
        address payable _contractor,
        address _inspector
    ) external onlyAuthority {
        Project newProject = new Project(msg.sender, _contractor, _inspector);
        projects.push(ProjectInfo({
            contractAddress: address(newProject),
            name: _name,
            contractor: _contractor,
            inspector: _inspector
        }));
        emit ProjectCreated(projects.length - 1, address(newProject), _name, _contractor, _inspector);
    }

    function getProjectCount() external view returns (uint256) {
        return projects.length;
    }

    function getProject(uint256 _index) external view returns (
        address contractAddress,
        string memory name,
        address contractor,
        address inspector
    ) {
        require(_index < projects.length, "Invalid index");
        ProjectInfo storage p = projects[_index];
        return (p.contractAddress, p.name, p.contractor, p.inspector);
    }
}
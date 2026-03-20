const Project = artifacts.require("Project");

module.exports = function (deployer, network, accounts) {
  const authority   = accounts[0];
  const contractor  = accounts[1];
  deployer.deploy(Project, authority, contractor);
};
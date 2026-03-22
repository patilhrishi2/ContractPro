const Project = artifacts.require("Project");

module.exports = function (deployer, network, accounts) {
  const authority  = accounts[0];
  const contractor = accounts[1];
  // Deploy with 0 ETH — budget is set at factory level now
  deployer.deploy(Project, authority, contractor);
};
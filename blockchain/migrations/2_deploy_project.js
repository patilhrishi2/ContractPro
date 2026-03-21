const Project = artifacts.require("Project");

module.exports = function (deployer, network, accounts) {
  const authority  = accounts[0];
  const contractor = accounts[1];
  const inspector  = accounts[2]; // third Ganache account
  deployer.deploy(Project, authority, contractor, inspector);
};
const Escrow = artifacts.require("Escrow");

module.exports = async function (deployer, network, accounts) {
  await deployer.deploy(Escrow, { from: accounts[0] });
  const escrow = await Escrow.deployed();
  console.log("Escrow Deployed at: ", escrow.address);
};

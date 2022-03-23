const { assert } = require("console");

const Escrow = artifacts.require("Escrow");

contract("Escrow Contract Testing", async (accounts) => {
  let instance;
  let deployer = accounts[0];
  let attacker = accounts[1];
  let user = accounts[2];

  it("Should be deployed properly", async () => {
    instance = await Escrow.new({ from: deployer });
    const numberOfContracts = (await instance.contractsCount()).toNumber();
    assert(
      numberOfContracts === 0,
      "Contracts count should be 0 at the beginning",
    );
  });

  it("Parameter amount sould be greater than zero", async () => {
    try {
      await instance.createContract(accounts[3], 0, {
        from: deployer,
        value: 20000,
      });
    } catch (err) {
      // console.log(err);
      assert(err.reason === "amount must be greater than 0");
    }
  });

  it("Parameter amount should not be more than the sent amount", async () => {
    try {
      await instance.createContract(accounts[3], 30000, {
        from: deployer,
        value: 20000,
      });
    } catch (err) {
      // console.log(err);
      assert(err.reason === "amount must be equal or lesss then to msg.value");
    }
  });
});

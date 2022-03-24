const { assert } = require("console");

const Escrow = artifacts.require("Escrow");

const truffleAssert = require("truffle-assertions");

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

  it("While Creating Parameter amount sould be greater than zero", async () => {
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

  it("While Creating Parameter amount should not be more than the sent amount", async () => {
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

  it("Event is emitting succesfully after creating the contract", async () => {
    const tx = await instance.createContract(accounts[3], 20000, {
      from: deployer,
      value: 25000,
    });

    const numberOfContracts = (await instance.contractsCount()).toNumber();

    truffleAssert.eventEmitted(tx, "ContractSuccesfull", (ev) => {
      const { id, owner, beneficiary, fees, isCompleted, isVerified } = ev;

      return (
        id.toNumber() === numberOfContracts &&
        owner === deployer &&
        beneficiary === accounts[3] &&
        fees.toNumber() === 20000 &&
        isCompleted === false &&
        isVerified === false
      );
    });
  });

  it("Except beneficiary, others can not complete the contract", async () => {
    try {
      await instance.completeContract(1, { from: attacker });
    } catch (err) {
      // console.log(err);
      assert(err.reason === "only beneficiary can complete the contract");
    }
  });

  it("Only beneficiary can complete the contract", async () => {
    await instance.completeContract(1, { from: accounts[3] });
    const contract = await instance.viewContract(1, { from: deployer });
    // console.log(contract);
    assert(contract.isCompleted === true);
  });

  it("Only Owner can view the contract details", async () => {
    try {
      await instance.viewContract(1, { from: attacker });
    } catch (err) {
      const key = Object.keys(err.data)[0];
      // console.log(err.data[key].reason);
      assert(err.data[key].reason === "You are not the owner");
    }
  });

  it("Only owner can verify a particular contract", async () => {
    try {
      await instance.verifyContract(1, { from: attacker });
    } catch (err) {
      assert(err.reason === "only owner can Verify the contract");
    }
  });

  it("Verification is only possible, when the contract is already completed by the beneficiary", async () => {
    try {
      await instance.createContract(accounts[5], 10000000000000, {
        from: user,
        value: 20000000000000,
      });

      const contractCount = (await instance.contractsCount()).toNumber();

      await instance.verifyContract(contractCount, { from: user });
    } catch (err) {
      // console.log(err);
      assert(err.reason === "contract is not completed by the beneficiary");
    }
  });

  it("Only beneficiary can demand fees", async () => {
    try {
      await instance.demandFees(1, { from: attacker });
    } catch (err) {
      assert(err.reason === "only beneficiary can demand fees");
    }
  });

  it("Beneficiary can not demand fees before completing it", async () => {
    try {
      await instance.demandFees(2, { from: accounts[5] });
    } catch (err) {
      assert(err.reason === "contract is not completed by the beneficiary");
    }
  });

  it("Beneficiary will not get any fees until, the owner verifies the confirmation", async () => {
    try {
      await instance.completeContract(2, { from: accounts[5] });
      await instance.demandFees(2, { from: accounts[5] });
    } catch (err) {
      assert(err.reason === "contract is not verified by the owner");
    }
  });

  it("Beneficiary can get his fees succesfully and Contract get destroyed", async () => {
    await instance.verifyContract(2, { from: user });
    await instance.demandFees(2, { from: accounts[5] });
    const availablity = await instance.contractsAvailability(2);
    assert(availablity === false);
  });
});

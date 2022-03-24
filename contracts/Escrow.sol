// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;

contract Escrow {
    uint256 public contractsCount = 0;

    struct Contract {
        uint256 id;
        address owner;
        address beneficiary;
        uint256 fees;
        bool isCompleted;
        bool isVerified;
    }

    mapping(uint256 => Contract) private contracts;
    mapping(uint256 => bool) public contractsAvailability;

    event ContractSuccesfull(
        uint256 indexed id,
        address indexed owner,
        address indexed beneficiary,
        uint256 fees,
        bool isCompleted,
        bool isVerified
    );

    function createContract(address beneficiary, uint256 amt) external payable {
        require(beneficiary != address(0), "beneficiary cannot be 0");
        require(amt > 0, "amount must be greater than 0");
        require(
            amt <= msg.value,
            "amount must be equal or lesss then to msg.value"
        );

        // amt = amt * 10**18;
        contractsCount++;
        contracts[contractsCount] = Contract(
            contractsCount,
            msg.sender,
            beneficiary,
            amt,
            false,
            false
        );

        contractsAvailability[contractsCount] = true;

        emit ContractSuccesfull(
            contractsCount,
            msg.sender,
            beneficiary,
            amt,
            false,
            false
        );
    }

    function viewContract(uint256 id)
        external
        view
        returns (
            address owner,
            address beneficiary,
            uint256 fees,
            bool isCompleted,
            bool isVerified
        )
    {
        require(contractsAvailability[id] == true, "contract is not available");
        require(contracts[id].owner == msg.sender, "You are not the owner");
        return (
            contracts[id].owner,
            contracts[id].beneficiary,
            contracts[id].fees,
            contracts[id].isCompleted,
            contracts[id].isVerified
        );
    }

    function completeContract(uint256 id) external {
        require(
            msg.sender == contracts[id].beneficiary,
            "only beneficiary can complete the contract"
        );
        require(contractsAvailability[id] == true, "contract is not available");

        contracts[id].isCompleted = true;
    }

    function verifyContract(uint256 id) external {
        require(
            msg.sender == contracts[id].owner,
            "only owner can Verify the contract"
        );
        require(contractsAvailability[id] == true, "contract is not available");
        require(
            contracts[id].isCompleted == true,
            "contract is not completed by the beneficiary"
        );

        contracts[id].isVerified = true;
    }

    function demandFees(uint256 id) external {
        require(
            msg.sender == contracts[id].beneficiary,
            "only beneficiary can demand fees"
        );

        require(contractsAvailability[id] == true, "contract is not available");

        require(
            contracts[id].isCompleted == true,
            "contract is not completed by the beneficiary"
        );

        require(
            contracts[id].isVerified == true,
            "contract is not verified by the owner"
        );

        payable(contracts[id].beneficiary).transfer(contracts[id].fees);
        contractsAvailability[id] = false;
    }
}

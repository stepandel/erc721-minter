const hre = require("hardhat");

async function main() {

  const Contract = await hre.ethers.getContractFactory("ERC721NFTs");
  const contract = await Contract.deploy("name", "symbol");

  await contract.deployed();

  console.log("Contract deployed to:", contract.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

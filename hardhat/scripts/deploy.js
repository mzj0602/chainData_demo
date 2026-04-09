const { ethers, run, network } = require("hardhat");

async function main() {
  console.log(`Deploying DataLogger to ${network.name}...`);

  const [deployer] = await ethers.getSigners();
  console.log("Deployer:", deployer.address);
  console.log("Balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "ETH");

  const DataLogger = await ethers.getContractFactory("DataLogger");
  const dataLogger = await DataLogger.deploy();
  await dataLogger.waitForDeployment();

  const address = await dataLogger.getAddress();
  console.log("DataLogger deployed to:", address);

  // Etherscan verify（仅 Sepolia 网络）
  if (network.name === "sepolia") {
    console.log("Waiting 30s before verification...");
    await new Promise(r => setTimeout(r, 30000));

    await run("verify:verify", {
      address,
      constructorArguments: [],
    });
    console.log("Contract verified on Etherscan!");
  }

  console.log("\n=== 部署完成 ===");
  console.log("合约地址:", address);
  console.log("请将此地址填入 frontend/.env 和 subgraph/subgraph.yaml");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

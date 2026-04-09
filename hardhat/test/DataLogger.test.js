const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("DataLogger", function () {
  let dataLogger;
  let owner;

  beforeEach(async function () {
    [owner] = await ethers.getSigners();
    const DataLogger = await ethers.getContractFactory("DataLogger");
    dataLogger = await DataLogger.deploy();
    await dataLogger.waitForDeployment();
  });

  it("should emit DataStored event with correct fields", async function () {
    const hexData = "0x48656c6c6f576f726c64"; // "HelloWorld" in hex

    await expect(dataLogger.storeData(hexData))
      .to.emit(dataLogger, "DataStored")
      .withArgs(owner.address, hexData, await getTimestamp());
  });

  it("should store multiple entries from same sender", async function () {
    const tx1 = await dataLogger.storeData("0xaabbcc");
    await tx1.wait();
    const tx2 = await dataLogger.storeData("0xddeeff");
    await tx2.wait();

    const filter = dataLogger.filters.DataStored(owner.address);
    const events = await dataLogger.queryFilter(filter);
    expect(events.length).to.equal(2);
  });

  it("should revert on empty data", async function () {
    await expect(dataLogger.storeData(""))
      .to.be.revertedWith("DataLogger: empty data");
  });
});

async function getTimestamp() {
  const block = await ethers.provider.getBlock("latest");
  return block.timestamp + 1;
}

const { utils } = require("ethers");
const { ethers } = require("hardhat");
const { expect } = require("chai");
const chalk = require("chalk");

let owner;
let user;
let anotherUser;
let testTokenIns;
let vaultIns;

function dim() {
  if (!process.env.HIDE_DEPLOY_LOG) {
    console.log(chalk.dim.call(chalk, ...arguments));
  }
}

// title
function cyan() {
  if (!process.env.HIDE_DEPLOY_LOG) {
    console.log(chalk.cyan.call(chalk, ...arguments));
  }
}

// address display
function yellow() {
  if (!process.env.HIDE_DEPLOY_LOG) {
    console.log(chalk.yellow.call(chalk, ...arguments));
  }
}

// contract return result display
function green() {
  if (!process.env.HIDE_DEPLOY_LOG) {
    console.log(chalk.green.call(chalk, ...arguments));
  }
}

describe("0. Smart Contract Deployment\n", function () {
  beforeEach(async () => {
    [owner, user, anotherUser] = await ethers.getSigners();
  });
  it("🟢 Deploy Valut contract", async () => {
    const VaultContract = await ethers.getContractFactory("Vault");
    vaultIns = await VaultContract.deploy();
    await vaultIns.deployed();
    yellow("Vault contract address: ", vaultIns.address);
  });
  it("🟢 Deploy Test token contract", async () => {
    const TestTokenContract = await ethers.getContractFactory("TestToken");
    testTokenIns = await TestTokenContract.deploy();
    await testTokenIns.deployed();
    yellow("Test Token contract address: ", testTokenIns.address);
  });
});

describe("1. Smart Contract Test\n", function () {
  describe("🚀 whitelistToken, removeTokenFromWhitelist functions test", function () {
    it("🟢 Owner should add token to whitelist", async () => {
      await expect(vaultIns.whitelistToken(testTokenIns.address))
        .to.emit(vaultIns, "TokenWhitelisted")
        .withArgs(testTokenIns.address);
    });
    it("🟢 Owner should remove token from whitelist", async () => {
      await expect(vaultIns.removeTokenFromWhitelist(testTokenIns.address))
        .to.emit(vaultIns, "TokenRemovedFromWhitelist")
        .withArgs(testTokenIns.address);
    });
    it("🔴 Owner should not remove non whitelisted token", async () => {
      await expect(
        vaultIns.removeTokenFromWhitelist(testTokenIns.address)
      ).to.be.revertedWith("Token is not whitelisted");
    });
    it("🔴 Owner should not add already whitelisted token", async () => {
      await vaultIns.whitelistToken(testTokenIns.address);
      await expect(
        vaultIns.whitelistToken(testTokenIns.address)
      ).to.be.revertedWith("Token is already whitelisted");
    });
    it("🔴 User should not add token to whitelist", async () => {
      await expect(
        vaultIns.connect(user).whitelistToken(testTokenIns.address)
      ).to.be.revertedWith("Only admins can call this function");
    });
    it("🔴 User should not remove token from whitelist", async () => {
      await expect(
        vaultIns.connect(user).removeTokenFromWhitelist(testTokenIns.address)
      ).to.be.revertedWith("Only admins can call this function");
    });
  });
  describe("🚀 addAdmin, removeAdmin functions test", function () {
    it("🟢 Owner should add another admin", async () => {
      await expect(vaultIns.addAdmin(anotherUser.address))
        .to.emit(vaultIns, "AdminAdded")
        .withArgs(anotherUser.address);
    });
    it("🟢 Owner should remove another admin", async () => {
      await expect(vaultIns.removeAdmin(anotherUser.address))
        .to.emit(vaultIns, "AdminRemoved")
        .withArgs(anotherUser.address);
    });
    it("🔴 Owner should not remove last admin", async () => {
      await expect(vaultIns.removeAdmin(owner.address)).to.be.revertedWith(
        "Cannot remove the last admin"
      );
    });
    it("🔴 Owner should not add admin", async () => {
      await expect(vaultIns.addAdmin(owner.address)).to.be.revertedWith(
        "Address is already an admin"
      );
    });
    it("🔴 User should not add admin", async () => {
      await expect(
        vaultIns.connect(user).addAdmin(anotherUser.address)
      ).to.be.revertedWith("Only admins can call this function");
    });
    it("🔴 User should not remove admin", async () => {
      await expect(
        vaultIns.connect(user).removeAdmin(owner.address)
      ).to.be.revertedWith("Only admins can call this function");
    });
  });
  describe("🚀 pause, unpause functions test", function () {
    it("🟢 Owner should pause the contract", async () => {
      await vaultIns.pause();
      expect(await vaultIns.paused()).to.equal(true);
    });
    it("🟢 Owner should unpause the contract", async () => {
      await vaultIns.unpause();
      expect(await vaultIns.paused()).to.equal(false);
    });
    it("🔴 User should not pause the contract", async () => {
      await expect(vaultIns.connect(user).pause()).to.be.revertedWith(
        "Only admins can call this function"
      );
    });
    it("🔴 User should not unpause the contract", async () => {
      await expect(vaultIns.connect(user).unpause()).to.be.revertedWith(
        "Only admins can call this function"
      );
    });
  });
  describe("🚀 deposit, withdraw functions test", function () {
    it("🟢 User should deposit the whitelisted token", async () => {
      await testTokenIns.transfer(user.address, utils.parseEther("100"));
      const depositAmount = ethers.utils.parseEther("1");
      const initialBalance = await testTokenIns.balanceOf(user.address);
      await testTokenIns.connect(user).approve(vaultIns.address, depositAmount);
      await expect(
        vaultIns.connect(user).deposit(testTokenIns.address, depositAmount)
      )
        .to.emit(vaultIns, "Deposit")
        .withArgs(user.address, testTokenIns.address, depositAmount);

      const finalUserBalance = await testTokenIns.balanceOf(user.address);
      const finalVaultBalance = await testTokenIns.balanceOf(vaultIns.address);
      expect(finalUserBalance).to.equal(initialBalance.sub(depositAmount));
      expect(finalVaultBalance).to.equal(depositAmount);
    });
    it("🟢 User should withdraw the whitelisted token", async () => {
      const withdrawalAmount = ethers.utils.parseEther("1");
      const initialVaultBalance = await testTokenIns.balanceOf(
        vaultIns.address
      );
      const initialUserBalance = await testTokenIns.balanceOf(user.address);

      await expect(
        vaultIns.connect(user).withdraw(testTokenIns.address, withdrawalAmount)
      )
        .to.emit(vaultIns, "Withdrawal")
        .withArgs(user.address, testTokenIns.address, withdrawalAmount);

      const finalVaultBalance = await testTokenIns.balanceOf(vaultIns.address);
      const finalUserBalance = await testTokenIns.balanceOf(user.address);
      expect(finalVaultBalance).to.equal(
        initialVaultBalance.sub(withdrawalAmount)
      );
      expect(finalUserBalance).to.equal(
        withdrawalAmount.add(initialUserBalance)
      );
    });
    it("🔴 User should not deposit the non whiltelisted token", async () => {
      await vaultIns.removeTokenFromWhitelist(testTokenIns.address);
      const depositAmount = ethers.utils.parseEther("1");
      await testTokenIns.connect(user).approve(vaultIns.address, depositAmount);
      await expect(
        vaultIns.connect(user).deposit(testTokenIns.address, depositAmount)
      ).to.be.revertedWith("Token is not whitelisted");
    });
    it("🔴 User should not withdraw the non whiltelisted token", async () => {
      const withdrawAmount = ethers.utils.parseEther("1");
      await expect(
        vaultIns.connect(user).withdraw(testTokenIns.address, withdrawAmount)
      ).to.be.revertedWith("Token is not whitelisted");
    });
    it("🔴 User should not depsoit the zero amount token", async () => {
      await vaultIns.whitelistToken(testTokenIns.address);
      await expect(
        vaultIns.connect(user).deposit(testTokenIns.address, 0)
      ).to.be.revertedWith("Amount must be greater than zero");
    });
    it("🔴 User should not withdraw the zero amount token", async () => {
      await expect(
        vaultIns.connect(user).withdraw(testTokenIns.address, 0)
      ).to.be.revertedWith("Amount must be greater than zero");
    });
    it("🔴 User should not depsoit when contract is paused", async () => {
      await vaultIns.pause();
      await expect(
        vaultIns
          .connect(user)
          .deposit(testTokenIns.address, utils.parseEther("1"))
      ).to.be.revertedWith("Contract is paused");
    });
    it("🔴 User should not withdraw when contract is paused", async () => {
      await expect(
        vaultIns
          .connect(user)
          .withdraw(testTokenIns.address, utils.parseEther("1"))
      ).to.be.revertedWith("Contract is paused");
    });
  });
});

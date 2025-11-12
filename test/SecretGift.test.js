const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("SecretGift", function () {
  let secretGift;
  let owner;
  let sender;
  let receiver;
  let usdc;

  beforeEach(async function () {
    [owner, sender, receiver] = await ethers.getSigners();

    // Deploy mock USDC
    const MockERC20 = await ethers.getContractFactory("MockERC20");
    usdc = await MockERC20.deploy("USD Coin", "USDC", 6);
    await usdc.waitForDeployment();

    // Deploy SecretGift
    const SecretGift = await ethers.getContractFactory("SecretGift");
    secretGift = await SecretGift.deploy(await usdc.getAddress());
    await secretGift.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should set the correct USDC address", async function () {
      expect(await secretGift.usdc()).to.equal(await usdc.getAddress());
    });
  });

  describe("Creating Gifts", function () {
    it("Should create a gift with ETH", async function () {
      const amount = ethers.parseEther("0.1");
      await expect(
        secretGift.connect(sender).createGift(
          receiver.address,
          "What has keys but no locks?",
          "piano",
          amount,
          true,
          { value: amount }
        )
      ).to.emit(secretGift, "GiftCreated");
    });

    it("Should create a gift with USDC", async function () {
      const amount = ethers.parseUnits("10", 6);
      await usdc.mint(sender.address, amount);
      await usdc.connect(sender).approve(await secretGift.getAddress(), amount);

      await expect(
        secretGift.connect(sender).createGift(
          receiver.address,
          "What has keys but no locks?",
          "piano",
          amount,
          false
        )
      ).to.emit(secretGift, "GiftCreated");
    });

    it("Should reject gift to self", async function () {
      const amount = ethers.parseEther("0.1");
      await expect(
        secretGift.connect(sender).createGift(
          sender.address,
          "Riddle",
          "Answer",
          amount,
          true,
          { value: amount }
        )
      ).to.be.revertedWith("Cannot send gift to yourself");
    });
  });

  describe("Claiming Gifts", function () {
    it("Should allow receiver to claim with correct answer", async function () {
      const amount = ethers.parseEther("0.1");
      await secretGift.connect(sender).createGift(
        receiver.address,
        "What has keys but no locks?",
        "piano",
        amount,
        true,
        { value: amount }
      );

      await expect(
        secretGift.connect(receiver).claimGift(0, "piano")
      ).to.emit(secretGift, "GiftClaimed");
    });

    it("Should reject incorrect answer", async function () {
      const amount = ethers.parseEther("0.1");
      await secretGift.connect(sender).createGift(
        receiver.address,
        "What has keys but no locks?",
        "piano",
        amount,
        true,
        { value: amount }
      );

      await expect(
        secretGift.connect(receiver).claimGift(0, "wrong")
      ).to.be.revertedWith("Incorrect answer");
    });

    it("Should reject claim from non-receiver", async function () {
      const amount = ethers.parseEther("0.1");
      await secretGift.connect(sender).createGift(
        receiver.address,
        "Riddle",
        "Answer",
        amount,
        true,
        { value: amount }
      );

      await expect(
        secretGift.connect(sender).claimGift(0, "Answer")
      ).to.be.revertedWith("Not the gift receiver");
    });
  });
});


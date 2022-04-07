const { expect } = require("chai");
const { ethers } = require("hardhat");

const toWei = (value) => ethers.utils.parseEther(value.toString());

describe("Staker", () => {
  // Advance time 2 days so that depositors can get rewards
  // await ethers.provider.send("evm_increaseTime", [5 * 24 * 60 * 60]); // 5 days
  let deployer, alice, bob;
  let users;
  let token, stakingPool;
  beforeEach(async () => {
    [deployer, alice, bob] = await ethers.getSigners();
    users = [alice, bob];

    const TokenFactory = await ethers.getContractFactory(
      "ERC20Token",
      deployer
    );
    const StakerFactory = await ethers.getContractFactory("Staker", deployer);

    token = await TokenFactory.deploy("Token", "TKN");
    stakingPool = await StakerFactory.deploy();

    // Alice deposits 100 TKN. Bob deposits 90 TKN
    for (let i = 0; i < users.length; i++) {
      let amount = toWei(100);
      await token.transfer(users[i].address, amount);

      amount = toWei(100 - 10 * i);
      await token.connect(users[i]).approve(stakingPool.address, amount);
      await stakingPool.connect(users[i]).stake(amount, token.address);
    }
  });
  describe("Alice and Bob deposit 100 TKN and 90 TKN respectively.", async () => {
    it("Should validate that Alice and Bob have 0 TKN and 10 TKN left", async () => {
      expect((await token.balanceOf(alice.address)).toString()).to.eq("0");
      expect((await token.balanceOf(bob.address)).toString()).to.eq(toWei(10));
    });

    it("Should validate that token balance of staking pool is 190 TKN", async () => {
      expect((await token.balanceOf(stakingPool.address)).toString()).to.eq(
        toWei(190)
      );
    });

    it("Should validate staked amount of each user has been stored in staking pool", async () => {
      const stakeOfAlice = await stakingPool.getStakeOf(
        alice.address,
        token.address
      );
      expect(stakeOfAlice.toString()).to.eq(toWei(100));

      const stakeOfBob = await stakingPool.getStakeOf(
        bob.address,
        token.address
      );
      expect(stakeOfBob.toString()).to.eq(toWei(90));
    });

    it("Should validate staked amount of each user has been stored in staking pool", async () => {});
  });
  describe("Alice wants to unstake her funds before staking period is completed", async () => {
    it("Should not allow Alice to withdraw her funds", async () => {
      const balance = await stakingPool.getStakeOf(
        alice.address,
        token.address
      );
      await token.connect(alice).approve(alice.address, balance);
      await expect(stakingPool.connect(alice).unstake(token.address)).to.be
        .reverted;
    });
  });
  describe("Bob wants to unstake her funds after staking period is completed", async () => {
    // Advance time 2 days ahead so that depositors can unstake
    await ethers.provider.send("evm_increaseTime", [2 * 24 * 60 * 60]);

    it("Should allow Bob to withdraw his funds", async () => {
      const balance = await stakingPool.getStakeOf(bob.address, token.address);
      await token.connect(bob).approve(bob.address, balance);
      await stakingPool.connect(bob).unstake(token.address);

      expect((await token.balanceOf(bob.address)).toString()).to.eq(toWei(100));
    });
  });
});

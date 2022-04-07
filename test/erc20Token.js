const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("ERC20Token", function () {
  it("Should deploy token contract", async function () {
    const token = await (
      await ethers.getContractFactory("ERC20Token")
    ).deploy("Token", "TKN");
    await token.deployed();

    expect(await token.name()).to.equal("Token");
    expect(await token.symbol()).to.equal("TKN");
    expect((await token.totalSupply()).toString()).to.equal(
      ethers.utils.parseEther("100000")
    );
  });

  it("Should send funds to users", async function () {
    [deployer, alice, bob] = await ethers.getSigners();
    let users;
    users = [alice, bob];

    const TokenFactory = await ethers.getContractFactory(
      "ERC20Token",
      deployer
    );

    const token1 = await TokenFactory.deploy("Token1", "TKN1");
    const token2 = await TokenFactory.deploy("Token2", "TKN2");

    expect(
      (await token1.connect(alice).balanceOf(alice.address)).toString()
    ).to.eq("0");
    expect((await token1.connect(bob).balanceOf(bob.address)).toString()).to.eq(
      "0"
    );

    for (let i = 0; i < users.length; i++) {
      const amount = ethers.utils.parseEther("100");
      await token1.transfer(users[i].address, amount);
      await token2.transfer(users[i].address, amount);
    }

    const tokens = [token1, token2];
    for (let i = 0; i < tokens.length; i++) {
      for (let j = 0; j < users.length; j++) {
        let tokenBalanceOfUser = await tokens[i]
          .connect(users[j])
          .balanceOf(users[j].address);

        expect(tokenBalanceOfUser.toString()).to.equal(
          ethers.utils.parseEther("100")
        );
      }
    }
  });
});

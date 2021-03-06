
const CentralizedBugOracle = artifacts.require("CentralizedBugOracle");
const CentralizedBugOracleProxy = artifacts.require("CentralizedBugOracleProxy")

const assertRevert = async promise => {
  try {
    await promise;
    assert.fail('Expected revert not received');
  } catch (error) {
    const revertFound = error.message.search('revert') >= 0;
    assert(revertFound, `Expected "revert", got ${error} instead`);
  }
};

contract("OracleBugBounty", (accounts) => {

  let cbo, proxy, masterCopy = {}

  const owner = accounts[0];
  const maker = accounts[3];
  const taker = accounts[4];
  const outcome = 1;
  const hash = "QmT4AeWE9Q9EaoyLJiqaZuYQ8mJeq4ZBncjjFH9dQ9uD01";

  before(async() => {
    masterCopy = await CentralizedBugOracle.new()
  })

  context("testing the Oracle Bug Oracle proxy", async () => {
    it("Has correct storage structure", async() =>{

      cbo = await CentralizedBugOracleProxy.new(masterCopy.address, owner, hash, maker, taker);

      let o = await cbo.owner()
      let m = await cbo.maker()
      let t = await cbo.taker()
      let h = await cbo.ipfsHash()
      let mc = await cbo.masterCopy();

      assert.equal(o, accounts[0]);
      assert.equal(m, maker);
      assert.equal(t, taker);
      assert.equal(web3.toAscii(h), hash)
      assert.equal(mc, masterCopy.address);
    })

    it("Fails to inilize with incorrect parameters", async() =>{
      let bigHash = hash + hash;
      await assertRevert(CentralizedBugOracleProxy.new(masterCopy.address, owner, bigHash, maker, taker))
    })

    it("Initializes with empty rulling", async() => {
      proxy = await CentralizedBugOracle.at(cbo.address);
      let isSet = await proxy.isOutcomeSet();
      assert.isFalse(isSet);
    })

    it("Denies rulling from non-owner", async() => {
      await assertRevert(proxy.setOutcome(outcome, {from: accounts[8]}))
    })

    it("Owner can give a rulling", async() => {
      await proxy.setOutcome(outcome);
      let out = await proxy.getOutcome();
      let isSet = await proxy.isOutcomeSet();
      assert.isTrue(isSet);
      assert.equal(out.toNumber(), outcome)
    })


    it("Owner can not give a rulling twice", async() => {
      await assertRevert(proxy.setOutcome(outcome + 1));
    })

  })


})
async function advanceBlock() {
    return ethers.provider.send("evm_mine", [])
}
   
async function advanceBlockTo(blockNumber) {
    // Soon we can replace with hardhat_mine (empty blocks should be more performant):
    //  https://www.notion.so/Mining-multiple-blocks-edad145bbce94d958d778b134588f9d6
    for (let i = await ethers.provider.getBlockNumber(); i < blockNumber; i++) {
      await advanceBlock()
    }
}
   
async function advanceBlockBy(blockNumber) {
    for (let i = 0; i < blockNumber; i++) {
      await advanceBlock()
    }
}

module.exports = { advanceBlockBy };
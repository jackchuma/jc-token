async function advanceBlock() {
    return ethers.provider.send("evm_mine", [])
}
   
async function advanceBlockBy(blockNumber) {
    for (let i = 0; i < blockNumber; i++) {
      await advanceBlock()
    }
}

module.exports = { advanceBlockBy };
import React, { useState } from "react";
import { ethers } from "ethers";
import { RPC_URL, PRIVATE_KEY0 } from "../../components/accountSetting";
import kokoToken from "../../artifacts/contracts/kokoDao/kokoToken.sol/kokoToken.json";
import TimeLock from "../../artifacts/contracts/kokoDao/TimeLock.sol/TimeLock.json";
import xytGovernor from "../../artifacts/contracts/kokoDao/xytGovernor.sol/xytGovernor.json";
import Box from "../../artifacts/contracts/kokoDao/Box.sol/Box.json";
export var proposalId, description, calldata;

/**
 * 提出提案
 */
async function propose(
  xytGovernorAddress,
  targetAddress,
  proposeValue,
  proposeDescription
) {
  await window.ethereum.request({ method: "eth_requestAccounts" });
  const provider = new ethers.providers.Web3Provider(window.ethereum);
  const signer = provider.getSigner();
  // const provider = new ethers.providers.JsonRpcProvider(RPC_URL);
  // const signer = new ethers.Wallet(PRIVATE_KEY0, provider);
  // const signerAddress = await signer.getAddress();

  // const xytGovernorAddress = "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0";
  const xytGovernorContract = new ethers.Contract(
    xytGovernorAddress,
    xytGovernor.abi,
    provider
  );
  const kokoTokenAddress = await xytGovernorContract.token();
  const kokoTokenContract = new ethers.Contract(
    kokoTokenAddress,
    kokoToken.abi,
    provider
  );
  const BoxContract = new ethers.Contract(targetAddress, Box.abi, provider);
  // console.log(`--------------03-Delegate----------------`);
  // // 授权 投票权
  // const delegate = await kokoTokenContract
  //   .connect(signer)
  //   .delegate(signerAddress);
  // const delegateTx = await delegate.wait();
  // console.log("delegateTx:", delegateTx);
  console.log(`--------------02-propose----------------`);
  // 设置提案参数
  const calldata = BoxContract.connect(signer).interface.encodeFunctionData(
    "store",
    [488]
  );

  const targets = [BoxContract.address];
  const values = [proposeValue]; // 交易价值，设置为 0
  const calldatas = [calldata];
  const description = proposeDescription.toString();

  console.log("xytGovernorContract 地址: ", xytGovernorContract.address);

  // 提出第 1 个proposal
  const propose = await xytGovernorContract
    .connect(signer)
    .propose(targets, values, calldatas, description);

  // 加快区块进度
  // await moveBlocks(2);

  // 等待交易完成并获取提案 ID
  const proposeTx = await propose.wait();
  console.log("proposeTx:", proposeTx);
  const plog = xytGovernorContract.interface.parseLog(proposeTx.logs[0]);
  const proposalId = plog.args.proposalId.toString();
  console.log("proposalId:", proposalId);

  // 获取提案状态:  0 Pending,1 Active,2 Canceled,3 Defeated,4 Succeeded,5 Queued,6 Expired,Executed
  let proposalState = await xytGovernorContract.state(proposalId);
  console.log(`提案状态: ${proposalState}`);

  const allProposals = await xytGovernorContract.getAllProposals();
  console.log("all proposals: ", allProposals);
  if (proposalState == 0 || proposalState == 1) {
    console.log(`提案创建成功！提案内容: ${description}`);
    console.log(`提案 proposalId: ${proposalId}`);
    return true;
  } else {
    console.log(`proposal state error`);
    return false;
  }
}
/**
 * 将区块链状态前进指定数量的区块
 * @param {number} amount - 要前进的区块数量
 */
export async function moveBlocks(amount) {
  for (let i = 0; i < amount; i++) {
    const provider = new ethers.providers.JsonRpcProvider(
      "https://eth-sepolia.g.alchemy.com/v2/2KkFyvuudsLojSoqpr7iZiC-iWImsIKk"
    );

    await provider.send("evm_mine", []); // 使用 provider.send 发送矿块请求
  }
  console.log(`Moved ${amount} blocks`);
}
export default propose;

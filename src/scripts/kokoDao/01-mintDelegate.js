import React, { useState } from "react";
import { ethers } from "ethers";
import { RPC_URL, PRIVATE_KEY0 } from "../../components/accountSetting";
import kokoToken from "../../artifacts/contracts/kokoDao/kokoToken.sol/kokoToken.json";
import TimeLock from "../../artifacts/contracts/kokoDao/TimeLock.sol/TimeLock.json";
import xytGovernor from "../../artifacts/contracts/kokoDao/xytGovernor.sol/xytGovernor.json";
import Box from "../../artifacts/contracts/kokoDao/Box.sol/Box.json";
export var proposalId, description, calldata;

async function mintRole(xytGovernorAddress, account2Input, amountInput) {
  await window.ethereum.request({ method: "eth_requestAccounts" });
  const provider = new ethers.providers.Web3Provider(window.ethereum);
  const signer = provider.getSigner();
  const signerAddress = await signer.getAddress();
  // const provider = new ethers.providers.JsonRpcProvider(RPC_URL);
  // const signer = new ethers.Wallet(PRIVATE_KEY0, provider);
  // const signerAddress = signer.address;
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
  const TimeLockContract = new ethers.Contract(
    kokoTokenAddress,
    kokoToken.abi,
    provider
  );
  console.log("kokoTokenContract address:", kokoTokenContract.address);

  console.log(`--------------02-mint----------------`);
  // 查看 account2 的 koko 余额
  let kokoBalance01 = await kokoTokenContract.balanceOf(signerAddress);
  console.log("account1 koko Balance: ", kokoBalance01);
  let kokoBalance02 = await kokoTokenContract.balanceOf(account2Input);
  console.log("account2 koko Balance: ", kokoBalance02);
  // 给 account2 mint koko币
  const amount = ethers.utils.parseEther(amountInput.toString());
  const transfer = await kokoTokenContract
    .connect(signer)
    .mint(account2Input, amount);
  const transferTx = await transfer.wait();
  console.log("transferTx:", transferTx);
  kokoBalance01 = await kokoTokenContract.balanceOf(signerAddress);
  console.log(
    "after transfer, account1 koko Balance: ",
    ethers.utils.formatUnits(kokoBalance01.toString(), 18)
  );
  kokoBalance02 = await kokoTokenContract.balanceOf(account2Input);
  console.log(
    "after transfer, account2 koko Balance: ",
    ethers.utils.formatUnits(kokoBalance02.toString(), 18)
  );
  // console.log(`--------------02-setRole----------------`);
  // // 设置 的权限
  // // 获取所需的角色
  // const proposerRole = await TimeLockContract.PROPOSER_ROLE();
  // const executorRole = await TimeLockContract.EXECUTOR_ROLE();
  // const cancellerRole = await TimeLockContract.CANCELLER_ROLE();

  // // 授予 TimeLock不同 角色给 不同地址
  // const xytGovernor_Address = xytGovernorContract.address;
  // const proposerTx1 = await TimeLockContract.grantRole(
  //   proposerRole,
  //   xytGovernor_Address
  // );
  // await proposerTx1.wait(1);

  // const executorTx = await TimeLockContract.grantRole(
  //   executorRole,
  //   account2Input
  // );
  // await executorTx.wait();
  return true;
}

export default mintRole;

import { ethers } from "ethers";
import { RPC_URL, PRIVATE_KEY0 } from "../../components/accountSetting";

import kokoToken from "../../artifacts/contracts/kokoDao/kokoToken.sol/kokoToken.json";
import TimeLock from "../../artifacts/contracts/kokoDao/TimeLock.sol/TimeLock.json";
import xytGovernor from "../../artifacts/contracts/kokoDao/xytGovernor.sol/xytGovernor.json";
import Box from "../../artifacts/contracts/kokoDao/Box.sol/Box.json";

export var contractArray,
  testcontractAddress,
  kokoTokenContract,
  TimeLockContract,
  xytGovernorContract,
  BoxContract,
  BoxContract2,
  boxAddress22;
/**
 * 部署合约函数
 */
async function deploy() {
  const provider = new ethers.providers.JsonRpcProvider(RPC_URL);
  const signer = new ethers.Wallet(PRIVATE_KEY0, provider);
  const signerAddress = signer.address;
  console.log("signer", signerAddress);
  console.log(`--------------01-deploy-Dao---------------`);

  // 部署 kokoToken 合约, 并挖了100个koko币
  const kokoTokenFactory = new ethers.ContractFactory(
    kokoToken.abi,
    kokoToken.bytecode,
    signer
  );
  kokoTokenContract = await kokoTokenFactory.deploy(
    signerAddress,
    signerAddress
  );
  await kokoTokenContract.deployTransaction.wait();
  const kokoTokenAddress = kokoTokenContract.address;
  console.log(`kokoToken 合约 部署在 ${kokoTokenAddress}`);
  // sepolia版
  // const kokoTokenAddress = "0x59817A23F4D8550eC7bf8BBF8f63DAeFa8831b62";
  // const kokoTokenContract = new ethers.Contract(
  //   kokoTokenAddress,
  //   kokoToken.abi,
  //   provider
  // );
  // console.log(`kokoToken 合约 部署在 ${kokoTokenAddress}`);

  // 部署 TimeLock 合约
  const TimeLockFactory = new ethers.ContractFactory(
    TimeLock.abi,
    TimeLock.bytecode,
    signer
  );
  TimeLockContract = await TimeLockFactory.deploy(
    3600, // 最小延迟时间（单位：秒），这里为1小时
    [signerAddress], // 提案者地址列表
    [signerAddress], // 执行者地址列表
    signerAddress // 管理员地址，赋予 signerAddress 管理权限
  );
  await TimeLockContract.deployTransaction.wait();
  console.log(`TimeLock 合约 部署在 ${TimeLockContract.address}`);

  // 部署 Governonr 治理 合约
  const xytGovernorFactory = new ethers.ContractFactory(
    xytGovernor.abi,
    xytGovernor.bytecode,
    signer
  );
  xytGovernorContract = await xytGovernorFactory.deploy(
    kokoTokenAddress, // kokoToken 合约地址
    TimeLockContract.address, // TimeLock 合约地址
    0, // 最低投票延迟 12秒
    1000, // 投票持续时间 50*12s
    5 // 投票阈值
  );
  await xytGovernorContract.deployTransaction.wait();
  console.log(`xytGovernor 合约 部署在 ${xytGovernorContract.address}`);

  // 部署 提案执行的合约 ,Box Box2
  const boxFactory = new ethers.ContractFactory(Box.abi, Box.bytecode, signer);
  BoxContract = await boxFactory.deploy(signerAddress);
  await BoxContract.deployTransaction.wait();
  const boxAddress = BoxContract.address;
  console.log(`box1 合约 部署在 ${boxAddress}`);

  BoxContract2 = await boxFactory.deploy(signerAddress);
  await BoxContract2.deployTransaction.wait();
  boxAddress22 = BoxContract2.address;
  console.log(`box2 合约 部署在 ${boxAddress22}`);

  const BoxContract3 = await boxFactory.deploy(signerAddress);
  await BoxContract3.deployTransaction.wait();
  const boxAddress33 = BoxContract3.address;
  console.log(`box3 合约 部署在 ${boxAddress33}`);

  const BoxContract4 = await boxFactory.deploy(signerAddress);
  await BoxContract4.deployTransaction.wait();
  const boxAddress44 = BoxContract2.address;
  console.log(`box4 合约 部署在 ${boxAddress44}`);

  // 设置 xytGovernor 的权限
  await kokoTokenContract.connect(signer).delegate(signerAddress); // 将投票权委托给部署者
  console.log("Setting up roles...");

  // 获取所需的角色
  const proposerRole = await TimeLockContract.PROPOSER_ROLE();
  const executorRole = await TimeLockContract.EXECUTOR_ROLE();
  const cancellerRole = await TimeLockContract.CANCELLER_ROLE();

  // 授予 TimeLock不同 角色给 不同地址
  const xytGovernor_Address = xytGovernorContract.address;
  const proposerTx1 = await TimeLockContract.grantRole(
    proposerRole,
    xytGovernor_Address
  );
  await proposerTx1.wait(1);

  // const executorTx = await TimeLockContract.grantRole(
  //   executorRole,
  //   signerAddress
  // );
  // await executorTx.wait();

  // const cancellerTx = await TimeLockContract.grantRole(
  //   cancellerRole,
  //   signerAddress
  // );
  // await cancellerTx.wait();
  console.log("deploy end");
  return xytGovernorContract.address;
}

/**
 * 将区块链状态前进指定数量的区块
 * @param {number} amount - 要前进的区块数量
 */
export async function moveBlocks(amount) {
  for (let i = 0; i < amount; i++) {
    const provider = new ethers.providers.JsonRpcProvider(RPC_URL);

    await provider.send("evm_mine", []); // 使用 provider.send 发送矿块请求
  }
  console.log(`Moved ${amount} blocks`);
}
export default deploy;

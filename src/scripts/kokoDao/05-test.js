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
async function kokoDaotest() {
  const provider = new ethers.providers.JsonRpcProvider(RPC_URL);
  const signer = new ethers.Wallet(PRIVATE_KEY0, provider);
  const account2 = new ethers.Wallet(PRIVATE_KEY1, provider);
  const signerAddress = signer.address;
  const account2Address = account2.address;
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

  // 部署 Governonr 治理 合约
  const xytGovernorFactory = new ethers.ContractFactory(
    xytGovernor.abi,
    xytGovernor.bytecode,
    signer
  );
  xytGovernorContract = await xytGovernorFactory.deploy(
    kokoTokenContract.address, // kokoToken 合约地址
    TimeLockContract.address, // TimeLock 合约地址
    1, // 最低投票延迟 12秒
    5, // 投票持续时间 1分钟
    0 // 投票阈值
  );
  await xytGovernorContract.deployTransaction.wait();
  console.log("deploy end");

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
  await kokoTokenContract.delegate(signerAddress); // 将投票权委托给部署者
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

  const executorTx = await TimeLockContract.grantRole(
    executorRole,
    signerAddress
  );
  await executorTx.wait();

  const cancellerTx = await TimeLockContract.grantRole(
    cancellerRole,
    signerAddress
  );
  await cancellerTx.wait();

  console.log(`--------------02-propose----------------`);
  // 查看 account2 的 koko 余额
  let kokoBalance01 = await kokoTokenContract.balanceOf(signerAddress);
  console.log("account1 koko Balance: ", kokoBalance01);
  let kokoBalance02 = await kokoTokenContract.balanceOf(account2Address);
  console.log("account2 koko Balance: ", kokoBalance02);
  // 给 account2 转钱
  const amount = ethers.utils.parseEther("33");
  const transfer = await kokoTokenContract
    .connect(signer)
    .mint(account2Address, amount);
  kokoBalance01 = await kokoTokenContract.balanceOf(signerAddress);
  // 授权 投票权
  const delegate = await kokoTokenContract
    .connect(account2)
    .delegate(account2Address);
  console.log(
    "after transfer, account1 koko Balance: ",
    ethers.utils.formatUnits(kokoBalance01.toString(), 18)
  );
  kokoBalance02 = await kokoTokenContract.balanceOf(account2Address);
  console.log(
    "after transfer, account2 koko Balance: ",
    ethers.utils.formatUnits(kokoBalance02.toString(), 18)
  );
  // 设置提案参数
  const calldata = BoxContract.connect(signer).interface.encodeFunctionData(
    "store",
    [488]
  );
  //   console.log("目标合约地址11: ", BoxContract.address, "calldata: ", calldata);

  const targets = [BoxContract.address];
  const values = [0]; // 交易价值，设置为 0
  const calldatas = [calldata];
  const description = "proposal description: help pat";
  //   description = proposalDescription.toString();

  console.log("xytGovernorContract 地址: ", xytGovernorContract.address);

  // 提出第 1 个proposal
  const proposeTx = await xytGovernorContract
    .connect(signer)
    .propose(targets, values, calldatas, description);

  // 等待交易完成并获取提案 ID
  const proposeReceipt = await proposeTx.wait();
  const plog = xytGovernorContract.interface.parseLog(proposeReceipt.logs[0]);
  const proposalId = plog.args.proposalId.toString();

  // 提出第 2 个proposal
  const targets2 = [BoxContract2.address];
  const proposeTx2 = await xytGovernorContract
    .connect(signer)
    .propose(targets2, values, calldatas, description);
  const proposeReceipt2 = await proposeTx.wait();
  const plog2 = xytGovernorContract.interface.parseLog(proposeReceipt2.logs[0]);
  const proposalId2 = plog2.args.proposalId.toString();

  // 加快区块进度
  await moveBlocks(2);

  // 获取提案状态:  0 Pending,1 Active,2 Canceled,3 Defeated,4 Succeeded,5 Queued,6 Expired,Executed
  let proposalState = await xytGovernorContract.state(proposalId);
  console.log(`提案 1 状态: ${proposalState}`);
  proposalState = await xytGovernorContract.state(proposalId2);
  console.log(`提案 2 状态: ${proposalState}`);

  const allProposals = await xytGovernorContract.getAllProposals();
  console.log("all proposals: ", allProposals);
  if (proposalState) {
    console.log(`提案创建成功！提案内容: ${description}`);
    console.log(`提案 proposalId: ${proposalId}`);

    console.log(`--------------03-vote----------------`);

    // 获取投票前提案状态: 0 Pending,1 Active,2 Canceled,3 Defeated,4 Succeeded,5 Queued,6 Expired,Executed
    proposalState = await xytGovernorContract.state(proposalId);
    console.log("投票前提案状态: ", proposalState);
    // 投票前，用户必须拥有koko币，同时授权币用于投票
    // 第一个人投票
    console.log(`第一个人投票：`);
    let voteWight = await xytGovernorContract
      .connect(signer)
      .castVote(proposalId, 0);
    await voteWight.wait();
    const hasVoted01 = await xytGovernorContract.hasVoted(
      proposalId,
      signerAddress
    );
    console.log("hasVoted 01", hasVoted01);
    proposalState = await xytGovernorContract.state(proposalId);
    console.log(`01后，提案状态: ${proposalState}`);
    console.log(`第二个人投票：`);
    const proposalSnapshot = await xytGovernorContract.proposalSnapshot(
      proposalId
    );
    const getPastVotes = await kokoTokenContract.getPastVotes(
      account2Address,
      proposalSnapshot
    );
    console.log("getPastVotes: ", getPastVotes);
    const getVotes = await xytGovernorContract.getVotes(
      account2Address,
      proposalSnapshot
    );
    console.log("getVotes: ", getVotes);
    voteWight = await xytGovernorContract
      .connect(account2)
      .castVote(proposalId, 1);
    await voteWight.wait();
    const hasVoted02 = await xytGovernorContract.hasVoted(
      proposalId,
      account2Address
    );
    console.log("hasVoted 02", hasVoted02);

    // await moveBlocks(3);

    // 获取投票后提案状态
    proposalState = await xytGovernorContract.state(proposalId);
    console.log(`投票完成后提案状态: ${proposalState}`);
    console.log("---------------- 投票完成 ---------------");
    const proposalVotes = await xytGovernorContract.proposalVotes(proposalId);
    const abstain = proposalVotes.abstainVotes;
    const against = proposalVotes.againstVotes;
    const forvote = proposalVotes.forVotes;
    console.log("0 proposal abstain vote status: ", abstain.toString());
    console.log("1 proposal against vote status: ", against.toString());
    console.log("2 proposal forvote status: ", forvote.toString());
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
    const provider = new ethers.providers.JsonRpcProvider(RPC_URL);

    await provider.send("evm_mine", []); // 使用 provider.send 发送矿块请求
  }
  console.log(`Moved ${amount} blocks`);
}
export default kokoDaotest;

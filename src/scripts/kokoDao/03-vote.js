import { ethers } from "ethers"; // 导入 ethers 库，用于与以太坊区块链交互
import {
  contractArray,
  kokoTokenContract,
  TimeLockContract,
  xytGovernorContract,
  BoxContract,
  moveBlocks,
} from "./01-deploy.js";
import kokoToken from "../../artifacts/contracts/kokoDao/kokoToken.sol/kokoToken.json";
import TimeLock from "../../artifacts/contracts/kokoDao/TimeLock.sol/TimeLock.json";
import xytGovernor from "../../artifacts/contracts/kokoDao/xytGovernor.sol/xytGovernor.json";
import Box from "../../artifacts/contracts/kokoDao/Box.sol/Box.json";
// import { proposalId } from "./02-propose.js";
import {
  RPC_URL,
  PRIVATE_KEY0,
  PRIVATE_KEY1,
} from "../../components/accountSetting";

/**
 * 发送投票
 * @param {string} proposalIdInput - 提案 ID
 * @param {number} supportInput - 支持类型 (0: 反对, 1: 支持, 2: 弃权)
 * @param {number} accountNumberInput - 投票账户地址索引 (从 0 开始)
 */
async function vote(
  xytGovernorAddress,
  proposalIdInput,
  supportInput,
  accountNumberInput
) {
  console.log("开始投票...");
  await window.ethereum.request({ method: "eth_requestAccounts" });
  const provider = new ethers.providers.Web3Provider(window.ethereum);
  const signer = provider.getSigner();
  // const provider = new ethers.providers.JsonRpcProvider(RPC_URL);
  // const signer = new ethers.Wallet(PRIVATE_KEY0, provider);
  const account2 = new ethers.Wallet(PRIVATE_KEY1, provider);
  const signerAddress = signer.getAddress();
  const account2Address = account2.address;
  // 获取 治理合约实例
  const xytGovernorContract = new ethers.Contract(
    xytGovernorAddress,
    xytGovernor.abi,
    provider
  );

  console.log(`--------------03-vote----------------`);

  // 获取投票前提案状态: 0 Pending,1 Active,2 Canceled,3 Defeated,4 Succeeded,5 Queued,6 Expired,Executed
  let proposalState = await xytGovernorContract.state(proposalIdInput);
  console.log("投票前提案状态: ", proposalState);
  // 投票前，用户必须拥有koko币，同时授权币用于投票
  // 第一个人投票
  let voteWight;
  if (accountNumberInput == 0) {
    voteWight = await xytGovernorContract
      .connect(signer)
      .castVote(proposalIdInput, supportInput);
  } else if (accountNumberInput == 1) {
    voteWight = await xytGovernorContract
      .connect(account2)
      .castVote(proposalIdInput, supportInput);
  }
  await voteWight.wait();
  const hasVoted01 = await xytGovernorContract.hasVoted(
    proposalIdInput,
    signerAddress
  );
  console.log("投票是否成功：", hasVoted01);
  // await moveBlocks(3);

  // 获取投票后提案状态
  proposalState = await xytGovernorContract.state(proposalIdInput);
  console.log(`投票完成后提案状态: ${proposalState}`);

  const proposalVotes = await xytGovernorContract.proposalVotes(
    proposalIdInput
  );
  const abstain = proposalVotes.abstainVotes;
  const against = proposalVotes.againstVotes;
  const forvote = proposalVotes.forVotes;
  console.log("0 proposal abstain vote status: ", abstain.toString());
  console.log("1 proposal against vote status: ", against.toString());
  console.log("2 proposal forvote status: ", forvote.toString());
  console.log("---------------- 投票完成 ---------------");
  return true;
}

export default vote;

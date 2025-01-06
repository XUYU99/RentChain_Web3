import { ethers } from "ethers";
import { moveBlocks, xytGovernorContract, BoxContract } from "./01-deploy.js";
import { calldata, description } from "./02-propose.js";
import kokoToken from "../../artifacts/contracts/kokoDao/kokoToken.sol/kokoToken.json";
import TimeLock from "../../artifacts/contracts/kokoDao/TimeLock.sol/TimeLock.json";
import xytGovernor from "../../artifacts/contracts/kokoDao/xytGovernor.sol/xytGovernor.json";
import Box from "../../artifacts/contracts/kokoDao/Box.sol/Box.json";
import { RPC_URL, PRIVATE_KEY0 } from "../../components/accountSetting";
import { proposalId } from "./01-mintDelegate.js";

/**
 * 执行提案
 * @param {string} executeProposalIdInput
 */
async function execute(xytGovernorAddress, executeProposalIdInput) {
  await window.ethereum.request({ method: "eth_requestAccounts" });
  const provider = new ethers.providers.Web3Provider(window.ethereum);
  const signer = provider.getSigner();
  // const provider = new ethers.providers.JsonRpcProvider(RPC_URL);
  // const signer = new ethers.Wallet(PRIVATE_KEY0, provider);
  const xytGovernorContract = new ethers.Contract(
    xytGovernorAddress,
    xytGovernor.abi,
    provider
  );

  // 通过输入的 executeProposalId 来查找 proposal 的信息

  const proposalData = await xytGovernorContract.getProposal(
    executeProposalIdInput
  );
  console.log("04-execute-proposalData:", proposalData);
  const BoxContract = new ethers.Contract(
    proposalData.targets[0],
    Box.abi,
    provider
  );

  console.log("执行提案Id: ", executeProposalIdInput);
  let value = await BoxContract.retrieve();
  console.log(`Box 合约的值为: ${value}`);
  const proposalState = await xytGovernorContract.state(executeProposalIdInput);
  console.log(`proposalState: ${proposalState}`);

  // 设置提案参数
  const calldata = BoxContract.connect(signer).interface.encodeFunctionData(
    "store",
    [488]
  );

  // const targets = [proposalData.targets[0]];
  // const values = [proposalData[9]]; // 交易价值，设置为 0
  // const calldatas = [proposalData.calldatas[0]];
  // const description = proposalData.description;
  // const descriptionHash = ethers.utils.keccak256(
  //   ethers.utils.toUtf8Bytes(description)
  // );
  const targets = [proposalData.targets[0]];
  const values = [0]; // 交易价值，设置为 0
  const calldatas = [calldata];
  const description = proposalData.description;
  const descriptionHash = ethers.utils.keccak256(
    ethers.utils.toUtf8Bytes(description)
  );

  console.log(`targets: ${proposalData.targets[0]}`);
  console.log(`values: ${proposalData[9]}`);
  console.log(`calldatas: ${proposalData.calldatas[0]}`);
  console.log(`descriptionHash: ${proposalData.description}`);

  console.log(`targets: ${targets}`);
  console.log(`values: ${values}`);
  console.log(`calldatas: ${calldatas}`);
  console.log(`descriptionHash: ${description}`);
  // 将提案添加到队列中
  const queueTx = await xytGovernorContract
    .connect(signer)
    .queue(targets, values, calldatas, descriptionHash);
  await queueTx.wait(1);
  console.log("提案已加入队列");

  // 推进区块链状态，确保满足时间锁条件
  await moveBlocks(20);

  // 执行提案
  const executeTx = await xytGovernorContract
    .connect(signer)
    .execute(targets, values, calldatas, descriptionHash);
  await executeTx.wait(1);
  console.log("提案执行完毕");

  // 检查目标合约状态
  value = await BoxContract.retrieve();
  console.log(`执行后 Box 合约的值为: ${value}`);
  return true;
}

/**
 * 根据 proposalId 查找提案信息
 * @param {string} proposalId - 提案的 ID
 * @returns {object} 包含 targets, values, calldatas 的提案信息；如果未找到返回 null
 */
function getProposalDetails(proposalId) {}
export default execute;

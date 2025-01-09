import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ethers } from "ethers";
import "./kokodao.css";
import { RPC_URL, PRIVATE_KEY0, HARDHAT_RPC_URL } from "../accountSetting";
import kokoToken from "../../artifacts/contracts/kokoDao/kokoToken.sol/kokoToken.json";
import TimeLock from "../../artifacts/contracts/kokoDao/TimeLock.sol/TimeLock.json";
import xytGovernor from "../../artifacts/contracts/kokoDao/xytGovernor.sol/xytGovernor.json";
import { moveBlocks } from "../../scripts/kokoDao/01-deploy"; // 引入 moveBlocks 函数

const ProposalData = ({ xytGovernorAddress, refreshFlag }) => {
  // 使用 React 的状态钩子存储
  const [clock, setclock] = useState();
  const [proposalDataList, setProposalDataList] = useState([]); // 提案数据列表状态
  const [refreshFlag2, setRefreshFlag2] = useState(false); // 刷新标志

  async function refreshOnclick() {
    setRefreshFlag2((refreshFlag2) => !refreshFlag2);
    // await getProposalData();
  }
  // 获取所有的 proposal 数据
  const getProposalData = async () => {
    // sepolia 版本
    // const provider = new ethers.providers.JsonRpcProvider(
    //   "https://eth-sepolia.g.alchemy.com/v2/2KkFyvuudsLojSoqpr7iZiC-iWImsIKk"
    // );
    const provider = new ethers.providers.JsonRpcProvider(RPC_URL);
    // const xytGovernorAddress = "0xA4899D35897033b927acFCf422bc745916139776";
    const xytGovernorContract = new ethers.Contract(
      xytGovernorAddress,
      xytGovernor.abi,
      provider
    );
    // 获取 dao 治理合约所使用的 token 的地址
    // const tokenAddress = await xytGovernorContract.token();
    // console.log("tokenAddress: ", tokenAddress);
    const nowTimestamp = await xytGovernorContract.clock();
    setclock(nowTimestamp);
    const allProposals = await xytGovernorContract.getAllProposals();
    // console.log("allProposals: ", allProposals.toString());
    // 初始化提案数组
    var proposalArray = [];
    // 获取当前时间戳（秒）
    // 循环处理每个proposal
    for (let i = 0; i < allProposals.length; i++) {
      // 提案状态
      const state = await xytGovernorContract.state(allProposals[i].proposalId);
      const isPollEnded =
        allProposals[i].voteStart + allProposals[i].voteDuration < nowTimestamp;
      // console.log(
      //   "allProposals[i].proposalDeadline: ",
      //   allProposals[i].proposalDeadline
      // );
      // 获取提案投票情况
      const proposalVotes = await xytGovernorContract.proposalVotes(
        allProposals[i].proposalId
      );
      const totalVotes = proposalVotes.abstainVotes
        .add(proposalVotes.againstVotes)
        .add(proposalVotes.forVotes);
      // console.log("totalVotes: ", totalVotes.toString()); // 获取总投票数

      // 设置提案数据
      const proposal = {
        proposalId: allProposals[i].proposalId.toString(), // 提案id
        proposer: allProposals[i].proposer, // 提案者
        voteStart: new Date(
          allProposals[i].voteStart * 1000
        ).toLocaleDateString(), // 开始时间，，并转换为年月日格式

        voteDuration: allProposals[i].voteDuration.toString(), // 持续时间（单位：秒）
        executed: allProposals[i].executed, // 是否执行
        canceled: allProposals[i].canceled, // 是否取消
        etaSeconds: allProposals[i].etaSeconds.toString(), // 时间锁秒数
        proposalDeadline: new Date(
          allProposals[i].proposalDeadline * 1000
        ).toLocaleDateString(), // 结束时间（开始时间 + 持续时间），并转换为年月日格式
        targets: allProposals[i].targets,
        values: allProposals[i].values,
        calldatas: allProposals[i].calldatas,
        description: allProposals[i].description,
        isPollEnded: isPollEnded,
        // nowClock: nowTimestamp.toString(),
        state: state,
        // 投票情况，处理成百分比
        forVotes:
          totalVotes > 0
            ? ((proposalVotes.forVotes / totalVotes) * 100).toFixed(1)
            : "0.0",
        abstainVotes:
          totalVotes > 0
            ? ((proposalVotes.abstainVotes / totalVotes) * 100).toFixed(1)
            : "0.0",
        againstVotes:
          totalVotes > 0
            ? ((proposalVotes.againstVotes / totalVotes) * 100).toFixed(1)
            : "0.0",
      };
      // 将提案数据放入 提案数组 中
      proposalArray.push(proposal);
    }
    // 循环处理完所有提案后，放入 ProposalDataList
    setProposalDataList(proposalArray);
    // 刷新页面
    // setRefreshFlag((prevFlag) => !prevFlag); // 切换刷新标志
  };
  // 根据刷新标志更新提案数据列表;
  useEffect(() => {
    console.log("proposalData Page-useEffect()");
    getProposalData();
  }, [refreshFlag, refreshFlag2]); // 每次刷新标志变化时触发
  // 定时每 5 秒更新一次刷新标志
  // useEffect(() => {
  //   const interval = setInterval(() => {
  //     setRefreshFlag2((prevFlag) => !prevFlag); // 切换刷新标志
  //   }, 3000);

  //   return () => clearInterval(interval); // 清除定时器，防止内存泄漏
  // }, []);
  // moveBlocks 的按钮点击事件
  async function moveBlocksOnclick() {
    await moveBlocks(100);
    await refreshOnclick();
  }

  return (
    <div>
      <div className="proposal-container">
        <div className="proposal_card_list">
          {proposalDataList.map((proposalData) => {
            return (
              <div key={proposalData.proposalId} className="proposal-card">
                <p className="proposal-timestamp">{proposalData.voteStart}</p>

                <button className="proposal-description-btn">
                  {proposalData.description}
                </button>

                <p className="proposal-id">
                  Proposal ID: {proposalData.proposalId}
                </p>
                <div className="proposal-status">
                  <span
                    className={`proposal-status ${
                      proposalData.isPollEnded
                        ? "poll-ended"
                        : "poll-in-progress"
                    }`}
                  >
                    {proposalData.isPollEnded
                      ? "⏰ POLL ENDED "
                      : "🕒 POLLING "}
                    state: {proposalData.state}
                    <br />{" "}
                  </span>
                </div>
                <div className="proposal-endtime">
                  <h5> End time:{proposalData.proposalDeadline}</h5>
                </div>
                <div className="progress-bar">
                  <div
                    className="progress-bar-support"
                    style={{
                      width: `${proposalData.forVotes}%`,
                    }}
                    title={`Support: ${proposalData.forVotes}%`}
                  ></div>
                  <div
                    className="progress-bar-abstain"
                    style={{
                      width: `${proposalData.abstainVotes}%`,
                      left: `${proposalData.forVotes}%`,
                      position: "absolute", // 确保 abstain 部分位于正确位置
                    }}
                    title={`Abstain: ${proposalData.abstainVotes}%`}
                  ></div>
                  <div
                    className="progress-bar-oppose"
                    style={{
                      width: `${proposalData.againstVotes}%`,
                      left: `${
                        parseFloat(proposalData.forVotes) +
                        parseFloat(proposalData.abstainVotes)
                      }%`, // 确保 oppose 部分紧接在 abstain 后
                      position: "absolute", // 确保 oppose 部分位于正确位置
                    }}
                    title={`Oppose: ${proposalData.againstVotes}%`}
                  ></div>
                </div>

                <div className="support-statistics">
                  <p className="support-statistics-text">
                    Support {proposalData.forVotes}%
                  </p>
                  <p className="support-statistics-text">
                    Abstain {proposalData.abstainVotes}%
                  </p>
                  <p className="support-statistics-text">
                    Oppose {proposalData.againstVotes}%
                  </p>
                </div>
                <p className="transaction-targets">
                  {/* Transaction Hash:{" "}
                  {proposalData.transactionHash
                    ? proposalData.transactionHash.slice(0, 5) + "..."
                    : ""} */}
                  <a
                    href={`https://sepolia.etherscan.io/address/${proposalData.targets}`}
                  >
                    Targets: {proposalData.targets}
                  </a>
                </p>
              </div>
            );
          })}
        </div>
        <div className="refresh_moveblock">
          <button className="refresh-btn" onClick={refreshOnclick}>
            Refresh
          </button>

          {/* <button className="refresh-btn" onClick={moveBlocksOnclick}></button> */}
        </div>
      </div>
    </div>
  );
};

export default ProposalData; // 导出 ProposalData 组件

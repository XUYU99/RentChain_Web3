// Koko.js
import "./kokodao.css";
import React, { useState, useEffect } from "react";
import {
  ChakraBaseProvider,
  div,
  Text,
  Input,
  Button,
  Flex,
  Spacer,
} from "../component"; // 导入 Chakra UI 组件
import { ethers } from "ethers";
import { RPC_URL, PRIVATE_KEY0 } from "../accountSetting";
import kokoToken from "../../artifacts/contracts/kokoDao/kokoToken.sol/kokoToken.json";
import TimeLock from "../../artifacts/contracts/kokoDao/TimeLock.sol/TimeLock.json";
import xytGovernor from "../../artifacts/contracts/kokoDao/xytGovernor.sol/xytGovernor.json";
import Navigation from "../Navigation";
import deploy from "../../scripts/kokoDao/01-deploy";
import propose from "../../scripts/kokoDao/02-propose";
import vote from "../../scripts/kokoDao/03-vote";
import execute from "../../scripts/kokoDao/04-execute";
import ProposalData from "./proposalData";

import mintRole from "../../scripts/kokoDao/01-mintDelegate";
/**
 * kokoWorld DAO 页面
 */
function Kokoworld({ account, setAccount }) {
  // 弹窗显示加载
  const [loading, setloading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState(
    "Loading, please wait..."
  );
  const [errorLoading, setErrorLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("error");
  const [refreshFlag, setRefreshFlag] = useState(false); // 定义刷新状态
  // 定义状态变量，用于存储输入框的值
  const [xytGovernorAddress, setxytGovernorAddress] = useState(
    "0xC9a43158891282A2B1475592D5719c001986Aaec"
  );
  const [xytGovernorContract, setxytGovernorContract] = useState();
  const [kokoTokenContract, setkokoTokenContract] = useState();
  const [account2Input, setaccount2Input] = useState(""); // 提案的执行地址
  const [amountInput, setamountInput] = useState("10"); // 提案的值
  const [inputValue1, setInputValue1] = useState(""); // 提案的执行地址
  const [inputValue2, setInputValue2] = useState("0"); // 提案的值
  const [inputValue3, setInputValue3] = useState("set proposal description"); // 提案描述

  const [proposalidInput, setproposalidInput] = useState(""); // 提案 ID 输入框值
  const [supportInput, setsupportInput] = useState("1"); // 投票支持选项
  const [accountNumberInput, setaccountNumberInput] = useState("0"); // 投票账户编号

  const [executeProposalIdInput, setexecuteProposalIdInput] = useState(""); // 执行提案 ID 输入框值

  async function setContract() {
    console.log("setContract");
    const provider = new ethers.providers.JsonRpcProvider(RPC_URL);
    const xytGovernorContract = new ethers.Contract(
      xytGovernorAddress,
      xytGovernor.abi,
      provider
    );
    setxytGovernorContract(xytGovernorContract);
    const kokoTokenAddress = await xytGovernorContract.token();
    const kokoTokenContract = new ethers.Contract(
      kokoTokenAddress,
      kokoToken.abi,
      provider
    );
    setkokoTokenContract(kokoTokenContract);
  }
  async function setSigner() {
    await window.ethereum.request({ method: "eth_requestAccounts" });
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    const signerAddress = await signer.getAddress();
    return signerAddress;
  }
  async function checkMetaMask() {
    // 检查是否安装了 MetaMask
    if (typeof window.ethereum === "undefined") {
      alert("MetaMask 插件未安装，请先安装 MetaMask！");
      return false;
    }
    try {
      // 请求账户连接
      const accounts = await window.ethereum.request({
        method: "eth_accounts",
      });
      if (accounts.length === 0) {
        // 未连接账户
        alert("尚未连接账户，请先连接账户！");
        return false;
      } else {
        // 已连接账户
        console.log("MetaMask 已连接账户：", accounts[0]);
        return true;
      }
    } catch (error) {
      console.error("检查 MetaMask 状态时出错：", error);
      alert("无法获取账户，请检查 MetaMask 设置！");
      return false;
    }
  }
  // 部署合约 的按钮点击事件
  async function deployOnclick() {
    const connectSuccess = await checkMetaMask();
    if (connectSuccess == false) return;
    try {
      setloading(true);
      const governorAddress = await deploy(); // 调用部署函数
      setxytGovernorAddress(governorAddress);
      console.log("kokoworld-governorAddress:", governorAddress);
      // const success = await kokoDaotest();
      setloading(false);
      alert(governorAddress ? "部署成功~~~" : "部署失败!!!");
      // alert("部署成功！"); // 部署成功提示
    } catch (error) {
      setloading(false);
      console.error("部署失败：", error);
      alert("部署失败，请检查控制台日志！");
    }
  }

  async function mint_delegate_Onclick() {
    // 检查 MetaMask 是否已连接
    if (!(await checkMetaMask())) return;

    try {
      setloading(true); // 设置加载状态

      setContract();
      const signerAddress = setSigner();
      // 检查是否拥有 MINTER_ROLE 权限
      const MINTER_ROLE = ethers.utils.keccak256(
        ethers.utils.toUtf8Bytes("MINTER_ROLE")
      );

      const hasRole = await kokoTokenContract.hasRole(
        MINTER_ROLE,
        signerAddress
      );
      if (!hasRole) {
        alert("抱歉，您没有权限进行此操作。");
        return;
      }

      const success = await mintRole(
        xytGovernorAddress,
        account2Input,
        amountInput
      );

      alert(success ? "mint 和授权成功~~~" : "mint 和授权失败!!!");
    } catch (error) {
      console.error("操作失败：", error);
      alert("操作失败，请检查控制台日志！");
    } finally {
      setloading(false); // 确保加载状态复位
    }
  }

  async function hasVote() {
    try {
      const signerAddress = setSigner();

      const [votesThreshold, proposerVotes] = await Promise.all([
        xytGovernorContract.proposalThreshold(),
        xytGovernorContract.getLatestVotes(signerAddress),
      ]);

      if (proposerVotes.lt(votesThreshold)) {
        alert(
          `您的投票权为 ${proposerVotes.toString()}，未达阈值 ${votesThreshold.toString()}，请联系 koko`
        );
        return false;
      }

      return true;
    } catch (error) {
      console.error("检查投票权时出错：", error);
      alert("无法检查您的投票权，请稍后重试！");
      return false;
    }
  }

  async function proposeOnclick() {
    if (!(await checkMetaMask())) return; // 检查 MetaMask 是否连接
    if (!inputValue1 || !inputValue3) {
      alert("提案的目标地址和描述不能为空！");
      return;
    }

    try {
      setloading(true);

      if (!(await hasVote())) {
        setloading(false);
        return;
      }

      const success = await propose(
        xytGovernorAddress,
        inputValue1,
        inputValue2,
        inputValue3
      );

      if (success) {
        setRefreshFlag((refreshFlag) => !refreshFlag); // 触发刷新标志
        alert("提案成功~~~");
      } else {
        alert("提案未成功，请检查参数或重试！");
      }
    } catch (error) {
      console.error("提案失败：", error);
      alert("提案失败，请检查控制台日志！");
    } finally {
      setloading(false); // 确保加载状态无论如何都会复位
    }
  }

  // 投票按钮点击事件
  async function voteOnclick() {
    // 检查 MetaMask 是否已连接
    if (!(await checkMetaMask())) return;

    // 检查输入是否完整
    if (!proposalidInput || !supportInput || !accountNumberInput) {
      alert("提案 ID、支持选项和账户编号不能为空！");
      return;
    }
    try {
      setloading(true); // 设置加载状态
      // 检查 提案是否激活
      // console.log("kokoworld-voteOnclick()-proposalidInput:", proposalidInput);
      const proposalState = await xytGovernorContract.state(proposalidInput);
      // console.log("proposalState:", proposalState);
      switch (proposalState) {
        case 0:
          alert("提案未激活 (Pending)");
          return;
        case 2:
          alert("提案已取消 (Canceled)");
          return;
        case 3:
          alert("提案未通过 (Defeated)");
          return;
        case 4:
          alert("提案已成功 (Succeeded)");
          return;
        case 5:
          alert("提案已排队 (Queued)");
          return;
        case 6:
          alert("提案已过期 (Expired)");
          return;
        case 7:
          alert("提案已执行 (Executed)");
          return;
      }
      // 检查是否有足够的投票权
      if (!(await hasVote())) return; //我真的服了你个傻逼徐雨婷
      // 检查是否已经投票
      const signerAddress = setSigner();
      const hasVoted01 = await xytGovernorContract.hasVoted(
        proposalidInput,
        signerAddress
      );

      if (hasVoted01) {
        alert(`已投过票，请勿重复操作`);
        return;
      }

      // 调用投票函数
      const success = await vote(
        xytGovernorAddress,
        proposalidInput,
        supportInput,
        accountNumberInput
      );

      // 根据结果更新状态并提示用户
      if (success) {
        setRefreshFlag((refreshFlag) => !refreshFlag);
        alert("投票成功~~~");
      } else {
        alert("投票失败，请重试！");
      }
    } catch (error) {
      console.error("投票失败：", error);
      alert("投票失败，请检查控制台日志！");
    } finally {
      setloading(false); // 确保加载状态复位
    }
  }

  // 执行提案的按钮点击事件
  async function executeOnclick() {
    const connectSuccess = await checkMetaMask();
    if (!connectSuccess) return;

    if (!executeProposalIdInput) {
      alert("执行提案 ID 不能为空！");
      return;
    }

    try {
      setloading(true);

      // 检查提案状态
      const proposalState = await xytGovernorContract.state(
        executeProposalIdInput
      );
      console.log("提案状态:", proposalState);

      // 定义提案状态对应的消息
      const proposalStateMessages = {
        0: "提案未激活 (Pending)",
        1: "提案已激活 (Active)，正在投票阶段",
        2: "提案已取消 (Canceled)",
        3: "很抱歉，提案未通过 (Defeated)",
        5: "提案在排队中 (Queued)",
        6: "提案已过期 (Expired)",
        7: "提案已执行 (Executed)",
      };

      // 如果提案状态不允许执行，则弹出对应的消息
      if (proposalStateMessages[proposalState]) {
        alert(proposalStateMessages[proposalState]);
        setloading(false);
        return;
      }

      // 调用执行函数
      const success = await execute(xytGovernorAddress, executeProposalIdInput);
      setloading(false);

      // 根据执行结果刷新状态并弹出提示
      if (success) {
        setRefreshFlag((prev) => !prev);
        alert("执行成功！");
      } else {
        alert("执行失败，请重试！");
      }
    } catch (error) {
      setloading(false);
      console.error("提案执行失败：", error);

      // 提供更加用户友好的错误信息
      if (error.errorName === "GovernorNonexistentProposal") {
        alert("提案不存在，请检查提案 ID！");
      } else if (error.errorName === "AccessControlUnauthorizedAccount") {
        alert("您没有权限执行此提案！");
      } else {
        alert("提案执行失败，请检查控制台日志！");
      }
    }
  }

  // test 按钮
  async function testOnclick() {
    // const xytGovernorContract = new ethers.Contract(
    //   xytGovernorAddress,
    //   xytGovernor.abi,
    //   provider
    // );
    // const proposalId = inputValue1;
    // let proposalState = await xytGovernorContract.state(proposalId);
    // console.log(`提案状态: ${proposalState}`);
    setRefreshFlag((prevFlag) => !prevFlag);
    console.log("test");
  }

  // 根据刷新标志更新提案数据列表;
  useEffect(() => {
    // console.log("kokoWorld Page useEffect()");
    setContract();
  }, []); // 每次刷新标志变化时触发

  return (
    <div className="overlay">
      <div style={{ height: "100vh", overflowY: "auto" }}>
        <div className="kokoDao">
          {/* 导航栏组件 */}
          <Navigation account={account} setAccount={setAccount} />
          {/* 弹窗显示加载 */}
          <div>
            {loading && (
              <div className="loading-overlay">
                <div className="loading-spinner">{loadingMessage}</div>
              </div>
            )}
          </div>
          <ChakraBaseProvider>
            <div className="kokoDao_container">
              <div className="kokoDao_proposallist">
                {/* 提案数据展示组件 */}
                <ProposalData
                  xytGovernorAddress={xytGovernorAddress}
                  refreshFlag={refreshFlag} // 传递刷新状态
                />
              </div>
              <div className="kokoDao_operate_container">
                <div className="kokoDao_operate">
                  <div className="DAO_title">Welcome to DAO world !</div>
                  <div className="kokoDao_deploy">
                    {" "}
                    {/* deploy 按钮 */}
                    <button onClick={deployOnclick}>deploy</button>
                    <div className="propose-input">
                      <input
                        type="text"
                        value={account2Input}
                        onChange={(e) => setaccount2Input(e.target.value)}
                        placeholder={"To address"}
                      ></input>
                      <input
                        type="text"
                        value={amountInput}
                        onChange={(e) => setamountInput(e.target.value)}
                        placeholder={"amount"}
                      ></input>
                    </div>
                    {/* <button onClick={testOnclick}>test</button> */}
                    <button onClick={mint_delegate_Onclick}>Mint</button>
                  </div>
                  {/* 提案部分 */}
                  <div className="kokoDao_propose">
                    <div className="propose-input">
                      <input
                        type="text"
                        value={inputValue1}
                        onChange={(e) => setInputValue1(e.target.value)}
                        placeholder={"proposal exe"}
                      ></input>
                      <Input
                        type="text"
                        value={inputValue2}
                        onChange={(e) => setInputValue2(e.target.value)}
                        placeholder={"proposal value"}
                      ></Input>
                      <input
                        type="text"
                        defaultValue={inputValue3}
                        onChange={(e) => setInputValue3(e.target.value)}
                      ></input>
                    </div>
                    <button id="propose-button" onClick={proposeOnclick}>
                      propose
                    </button>
                  </div>
                  {/* 投票部分 */}
                  <div className="kokoDao_vote">
                    <div className="propose-input">
                      <input
                        type="text"
                        defaultValue={proposalidInput}
                        onChange={(e) => setproposalidInput(e.target.value)}
                        placeholder={"proposal Id"}
                      ></input>
                      <input
                        type="number"
                        defaultValue={supportInput}
                        onChange={(e) => setsupportInput(e.target.value)}
                        placeholder={"0:反对 1:支持 2:弃权"}
                      ></input>
                      <input
                        type="number"
                        defaultValue={accountNumberInput}
                        onChange={(e) => setaccountNumberInput(e.target.value)}
                        placeholder={"0"}
                      ></input>
                    </div>
                    <button id="vote-button" onClick={voteOnclick}>
                      vote
                    </button>
                  </div>
                  {/* 执行部分 */}
                  <div className="kokoDao_execute">
                    <div className="execute-input">
                      <input
                        type="text"
                        defaultValue={executeProposalIdInput}
                        onChange={(e) =>
                          setexecuteProposalIdInput(e.target.value)
                        }
                        placeholder={"execute ProposalId"}
                      ></input>
                    </div>
                    {/* 执行按钮 */}
                    <button className="execute-button" onClick={executeOnclick}>
                      execute
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </ChakraBaseProvider>
        </div>
      </div>
    </div>
  );
}

export default Kokoworld;

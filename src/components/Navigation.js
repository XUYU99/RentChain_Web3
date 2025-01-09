import { ethers } from "ethers";
import logo from "../assets/RentChainLogo.png";
import { useNavigate } from "react-router-dom";

const Navigation = ({ account, setAccount }) => {
  const navigate = useNavigate();
  const aboutOnclick = () => {
    navigate("/Kokoworld");
  };
  const homeOnclick = () => {
    navigate("/Home");
  };
  const myOrdersOnclick = () => {
    navigate("/MyOrders");
  };
  const connectOnclick = async () => {
    // 检查窗口对象是否包含 ethereum 对象（MetaMask 注入的对象）
    if (typeof window.ethereum !== "undefined") {
      // 请求连接 MetaMask 钱包
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });
      const account = ethers.utils.getAddress(accounts[0]);
      setAccount(account);
      console.log("Connected address:", account);
    } else {
      alert("MetaMask is not installed. Please install MetaMask !!!!");
      console.log("MetaMask is not installed.");
    }
  };

  return (
    <nav>
      <ul className="nav__links">
        <li>
          <a href="DAO" onClick={aboutOnclick}>
            DAO
          </a>
        </li>
        <li>
          <a href="Home" onClick={homeOnclick}>
            Home
          </a>
        </li>
        <li>
          <a href="#">List Property</a>
        </li>
      </ul>

      <div className="nav__brand">
        {/* <img src={logo} alt="Logo" /> */}
        <div className="nav__logo"> </div>
        <h1>RentChain</h1> {/* 更改为您的项目名称 */}
      </div>
      <div className="nav_address">
        {account ? (
          <div className="nav__account">
            <button
              type="button"
              className="nav__connect"
              onClick={myOrdersOnclick}
            >
              {account.slice(0, 6) + "..." + account.slice(38, 42)}
            </button>
          </div>
        ) : (
          <button
            type="button"
            className="nav__connect"
            onClick={connectOnclick}
          >
            Connect Wallet
          </button>
        )}
        {/* <button onClick={myOrdersOnclick}>myOrders</button> */}
      </div>
    </nav>
  );
};

export default Navigation;

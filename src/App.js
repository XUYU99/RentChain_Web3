import { useEffect, useState } from "react";
import { ethers } from "ethers";

// Components
import Navigation from "./components/Navigation";
import Search from "./components/Search";
import Home from "./components/Home";

// ABIs
import RentalProperty from "./artifacts/contracts/RentalProperty.sol/RentalProperty.json";
import RentalEscrow from "./artifacts/contracts/RentalEscrow.sol/RentalEscrow.json";
import { RentalPropertyArray } from "./scripts/deploy";
import { RentalEscrowArray } from "./scripts/deploy";
// Config
import config from "./config.json";
import deploy from "./scripts/deploy";
function App() {
  const [provider, setProvider] = useState(null);
  const [rentalProperty, setRentalProperty] = useState(null);
  const [rentalEscrow, setRentalEscrow] = useState(null);
  const [account, setAccount] = useState(null);
  const [properties, setProperties] = useState([]);
  const [property, setSelectedProperty] = useState({});
  const [toggle, setToggle] = useState(false);
  const [fleshDetail, setfleshDetail] = useState(null);

  async function deployOnclick() {
    await deploy(); // 调用部署函数
    // 刷新页面信息
    loadBlockchainData();
  }

  const loadBlockchainData = async () => {
    try {
      // 初始化以太坊提供者（Web3Provider）
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      setProvider(provider);

      // 定义一个数组来存储所有房产信息
      const properties = [];

      // 遍历加载房产信息
      for (let i = 0; i < 3; i++) {
        // 获取房产合约实例
        const rentalProperty = new ethers.Contract(
          RentalPropertyArray[i],
          RentalProperty.abi,
          provider
        );
        setRentalProperty(rentalProperty); // 设置当前房产实例

        // 获取租赁托管合约实例
        const rentalEscrow = new ethers.Contract(
          RentalEscrowArray[i],
          RentalEscrow.abi,
          provider
        );
        setRentalEscrow(rentalEscrow); // 设置当前租赁托管合约实例
        // 从 RentalProperty 合约中获取房产的 Token URI
        const uri = await rentalProperty.tokenURI(1);
        const response = await fetch(uri); // 请求 URI 获取房产元数据
        const metadata = await response.json(); // 解析返回的 JSON 数据

        // 从 RentalEscrow 合约中获取房产租赁信息
        // propertyInfo -> [landlord, isAvailable, rentPrice, securityDeposit, tenant]
        const [landlord, isAvailable, rentPrice, securityDeposit, tenant] =
          await rentalEscrow.getPropertyInfo(1);
        // console.log("租客地址: ", tenant);
        const isRented = await rentalProperty.isRented(1);

        // 将房产信息存入 properties 数组中
        properties.push({
          landlord: landlord, //房东地址
          isAvailable: isAvailable, // 是否可租
          rentPrice: ethers.utils.formatEther(rentPrice), // 租金
          securityDeposit: ethers.utils.formatEther(securityDeposit), // 押金
          id: 1, // 房产编号
          rentalPropertyAddress: rentalProperty.address, // 房产合约地址
          rentalEscrowAddress: rentalEscrow.address, // 房产托管合约地址
          isRented: isRented,
          name: metadata.name, // 房产名称
          tenant: tenant, // 租客地址
          description: metadata.description, // 房产描述
          image: metadata.image, // 房产图片链接
          attributes: metadata.attributes, //其他属性
        });
        // fleshDetail.push({
        //   isRented: isRented,
        //   isAvailable: isAvailable, // 是否可租
        //   rentPrice: ethers.utils.formatEther(rentPrice), // 租金
        //   securityDeposit: ethers.utils.formatEther(securityDeposit), // 押金
        //   rentalPropertyAddress: rentalProperty.address, // 房产合约地址
        //   rentalEscrowAddress: rentalEscrow.address, // 房产托管合约地址
        // });
        // console.log(`第 ${i + 1} 个房产获取成功`);
      }

      // 将获取的房产列表设置到状态
      setProperties(properties);
      console.log("全部房产信息获取完成");

      // 获取用户钱包账户地址
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts", // 请求用户钱包地址
      });
      const account = ethers.utils.getAddress(accounts[0]); // 格式化地址
      setAccount(account); // 将用户地址存储到状态

      // 监听账户变化事件
      window.ethereum.on("accountsChanged", async () => {
        const accounts = await window.ethereum.request({
          method: "eth_requestAccounts", // 请求新的用户钱包地址
        });
        const account = ethers.utils.getAddress(accounts[0]); // 格式化新地址
        setAccount(account); // 更新状态中的用户地址
      });
    } catch (error) {
      // 捕获并打印错误
      console.error("Error loading blockchain data:", error);
    }
  };

  // 切换弹出框的状态，并设置当前选中的房产信息
  const togglePop = (property) => {
    setSelectedProperty(property); // 设置选中的房产信息
    setToggle(!toggle); // 切换弹出框状态（显示/隐藏）
  };

  // 点击按钮时手动调用加载区块链数据函数
  function loadBlockchainDataOnclick() {
    loadBlockchainData(); // 调用主加载函数
  }

  return (
    <div>
      <Navigation account={account} setAccount={setAccount} />
      <Search />

      <div className="cards__section">
        <h3>
          <button onClick={deployOnclick}>deploy</button>{" "}
          <button onClick={loadBlockchainDataOnclick}>reflesh</button>{" "}
          Properties For Rent
        </h3>
        <hr />
        <div className="cards">
          {properties.map((property, index) => (
            <div
              className="card"
              key={index}
              onClick={() => togglePop(property)}
            >
              <div className="card__image">
                <img src={property.image} alt="Property" />
              </div>
              <div className="card__info">
                <h4>{property.name}</h4>
                <p>
                  <strong>{property.rentPrice}</strong> ETH/month |
                  <strong>{property.securityDeposit}</strong> ETH deposit
                </p>
                {property.attributes && (
                  <p>
                    <strong>{property.attributes[6]?.value}</strong> bds |
                    <strong>{property.attributes[7]?.value}</strong> ba |
                    <strong>{property.attributes[4]?.value}</strong> sqft
                  </p>
                )}
                <p className="availability">
                  {property.isRented ? "🔴 Rented" : "🟢 Available"}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {toggle && (
        <Home
          property={property}
          provider={provider}
          account={account}
          rentalEscrow={rentalEscrow}
          togglePop={togglePop}
          loadBlockchainData={loadBlockchainData}
        />
      )}
    </div>
  );
}

export default App;

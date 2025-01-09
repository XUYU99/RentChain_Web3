import "./MyOrder.css";
import { useEffect, useState, useRef } from "react";
import { ethers } from "ethers";
import Navigation from "../components/Navigation";
import {
  PRIVATE_KEY0,
  PRIVATE_KEY1,
  PRIVATE_KEY2,
  RPC_URL,
} from "../components/accountSetting";
import deploy, {
  RentalPropertyArray,
  RentalEscrowArray,
  metadataArrary,
  tokenId,
} from "../scripts/deploy";
function MyOrders1({ account, setAccount }) {
  const [properties, setProperties] = useState([]);
  const [property, setSelectedProperty] = useState({});
  const [toggle, setToggle] = useState(false); // rentProperty detail 窗口
  const [refreshFlag, setrefreshFlag] = useState(false);
  const tokenId = 173;
  // 跟踪是否已经注册过事件监听器
  async function getPropertiesOnclick() {
    await getProperties();
  }
  async function getAccount() {
    if (!window.ethereum) {
      alert("请安装 MetaMask 以继续操作！");
      return null;
    }

    const accounts = await window.ethereum.request({
      method: "eth_requestAccounts",
    });
    const account = ethers.utils.getAddress(accounts[0]);
    setAccount(account);
    console.log("当前账户地址:", account);

    // 确保只注册一次事件监听器

    window.ethereum.on("accountsChanged", async (newAccounts) => {
      if (newAccounts.length === 0) {
        console.warn("钱包已断开连接，请重新连接！");
        setAccount(null);
      } else {
        const newAccount = ethers.utils.getAddress(newAccounts[0]);
        if (newAccount != account) {
          setAccount(newAccount);
          console.log("账户已更改为:", newAccount);
          await getProperties();
          //   setrefreshFlag((prevFlag) => !prevFlag);
        }
      }
    });

    return account;
  }
  // 获取资产信息
  const getProperties = async () => {
    try {
      const account = await getAccount();
      console.log("myorder-account:", account);
      // 定义一个数组来存储所有房产信息
      const properties = [];

      // 遍历加载房产信息
      for (let i = 0; i < RentalPropertyArray.length; i++) {
        try {
          // 获取房产合约和租赁托管合约实例
          const rentalProperty = RentalPropertyArray[i];
          const rentalEscrow = RentalEscrowArray[i];

          const uri = await rentalProperty.tokenURI(tokenId);

          // 请求 URI 获取房产元数据
          const response = await fetch(uri);
          if (!response.ok) {
            console.error(`第 ${i + 1} 个房产的元数据 URI 获取失败`);
            continue;
          }
          const metadata = await response.json();

          // propertyInfo -> [landlord, isAvailable, rentPrice, securityDeposit, tenant]
          const [landlord, isAvailable, rentPrice, securityDeposit, tenant] =
            await rentalEscrow.getPropertyInfo(tokenId);

          // 检查租赁状态
          const isRented = await rentalProperty.isRented(tokenId);

          // 检查是否是当前用户的租赁房产
          if (tenant.toLowerCase() === account.toLowerCase()) {
            properties.push({
              landlord, // 房东地址
              isAvailable, // 是否可租
              rentPrice: ethers.utils.formatEther(rentPrice), // 租金
              securityDeposit: ethers.utils.formatEther(securityDeposit), // 押金
              id: tokenId, // 房产编号
              rentalProperty, // 房产合约实例
              rentalEscrow, // 房产托管合约实例
              rentalPropertyAddress: rentalProperty.address, // 房产合约地址
              rentalEscrowAddress: rentalEscrow.address, // 房产托管合约地址
              isRented, // 是否已租
              name: metadata.name, // 房产名称
              tenant, // 租客地址
              description: metadata.description, // 房产描述
              image: metadata.image, // 房产图片链接
              attributes: metadata.attributes, // 其他属性
            });
            console.log(`第 ${i + 1} 个房产信息已加载`);
          }
        } catch (error) {
          console.error(`第 ${i + 1} 个房产加载失败`, error);
        }
      }

      // 更新状态或提示无数据
      if (properties.length === 0) {
        console.log("没有找到属于您的房产信息");
      } else {
        setProperties(properties);
        console.log("全部房产信息已加载:", properties);
      }
    } catch (error) {
      console.error("获取资产信息时发生错误:", error);
    }
  };
  // 页面刷新
  useEffect(() => {
    console.log("MyOrders-Page-useEffect()-getProperties");
    getPropertiesOnclick(); // 每次刷新标志变化或 account 变化时触发
  }, [account]); // 监听 refreshFlag 和 account 的变化

  return (
    <div>
      <Navigation account={account} setAccount={setAccount} />
      MyOrders Page
      <button onClick={getProperties}>getProperties</button>
      <div className="myOrders_rentalProperty">
        <div className="myOrders_list">
          {properties.length > 0 ? (
            properties.map((property, index) => (
              <div className="myOrders_list_module" key={index}>
                <div className="myOrders_card">
                  <div className="myOrders_card__image">
                    <img src={property.image} alt="Property" />
                  </div>
                  <div className="myOrders_card__info">
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
                {/* 租房信息 */}
                <div className="myOrders_info">
                  <h3>Rental Property Information</h3>
                  <div className="property-details">
                    <p>
                      <strong>Rental Start Date:</strong>
                      <span>{property.rentalStartDate || "Not Available"}</span>
                    </p>
                    <p>
                      <strong>Rental End Date:</strong>
                      <span>{property.rentalEndDate || "Not Available"}</span>
                    </p>
                    <p>
                      <strong>Rent Price:</strong>
                      <span>{property.rentPrice} ETH</span>
                      &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;{/* 空格*/}
                      <strong>Security Deposit:</strong>
                      <span>{property.securityDeposit} ETH</span>
                    </p>
                    <p>
                      <strong>Property Address:</strong>
                      <span>{property.rentalPropertyAddress}</span>
                    </p>
                    <p>
                      <strong>Tenant Address:</strong>
                      <span>{property.tenant || "Not Assigned"}</span>
                    </p>
                    <p>
                      <strong>Landlord Address:</strong>
                      <span>{property.landlord}</span>
                    </p>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p>没有可用的房产信息</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default MyOrders1;

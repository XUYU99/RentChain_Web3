import "./MyOrder.css";
import { useEffect, useState } from "react";
import { ethers } from "ethers";
import { useNavigate } from "react-router-dom";
// Components
import Navigation from "../components/Navigation";
import Search from "../components/Search";
import Detail from "../components/Detail";
import RentalProperty from "../../src/artifacts/contracts/RentalProperty.sol/RentalProperty.json"; // 导入 RentalProperty 合约的 ABI 和 bytecode
import RentalEscrow from "../../src/artifacts/contracts/RentalEscrow.sol/RentalEscrow.json"; // 导入 RentalEscrow 合约的 ABI 和 bytecode

// ABIs
import deploy, {
  RentalPropertyArray,
  RentalEscrowArray,
  metadataArrary,
  tokenId,
} from "../scripts/deploy";
import {
  PRIVATE_KEY0,
  PRIVATE_KEY1,
  PRIVATE_KEY2,
  RPC_URL,
} from "../components/accountSetting";
function MyOrders({ account, setAccount }) {
  const [sourceloading, setsourceloading] = useState(true);
  const [loading, setloading] = useState(false);

  const [provider, setProvider] = useState(null);
  const [properties, setProperties] = useState([]);
  const [property, setSelectedProperty] = useState({});
  const [toggle, setToggle] = useState(false); // rentProperty detail 窗口
  const tokenId = 173;
  const navigate = useNavigate();
  const homeOnclick = () => {
    navigate("/Home");
  };
  const getOrderData = async () => {
    setsourceloading(false);
    try {
      // 获取用户钱包账户地址
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts", // 请求用户钱包地址
      });
      const account = ethers.utils.getAddress(accounts[0]); // 格式化地址
      setAccount(account); // 将用户地址存储到状态
      // try {
      // 初始化以太坊提供者（Web3Provider）
      const provider = new ethers.providers.JsonRpcProvider(RPC_URL);
      setProvider(provider);

      // 定义一个数组来存储所有房产信息
      const properties = [];
      // 遍历加载房产信息
      for (let i = 0; i < 3; i++) {
        // 获取 房产和租赁托管 合约实例
        const rentalProperty = RentalPropertyArray[i];

        const rentalEscrow = RentalEscrowArray[i];
        // 请求 URI 获取房产元数据
        const uri = await rentalProperty.tokenURI(tokenId);
        const response = await fetch(uri);
        const metadata = await response.json();
        // 从 RentalEscrow 合约中获取房产租赁信息

        // propertyInfo -> [landlord, isAvailable, rentPrice, securityDeposit, tenant]
        const rental = await rentalEscrow.getRentalEscrowInfo(tokenId);
        // console.log("租客地址: ", tenant);
        let isRented = await rentalProperty.isRented(tokenId);
        if (rental.tenant == account) {
          // 将房产信息存入 properties 数组中
          properties.push({
            landlord: rental.landlord, //房东地址
            isAvailable: rental.isAvailable, // 是否激活
            rentPrice: ethers.utils.formatEther(rental.rentPrice), // 租金
            securityDeposit: ethers.utils.formatEther(rental.securityDeposit), // 押金
            tenant: rental.tenant, // 租客地址
            startTime: new Date(rental.startTime * 1000).toLocaleDateString(), // 租赁开始时间（年月日格式）
            endTime: new Date(rental.endTime * 1000).toLocaleDateString(), // 租赁结束时间（年月日格式）
            depositReturned: rental.depositReturned.toString(), // 押金是否已退回

            // 其他相关属性
            id: tokenId, // 房产编号
            isRented: rental.isRented, // 是否已租
            rentalProperty: rentalProperty, // 房产合约实例
            rentalEscrow: rentalEscrow, // 房产托管合约实例
            rentalPropertyAddress: rentalProperty.address, // 房产合约地址
            rentalEscrowAddress: rentalEscrow.address, // 房产托管合约地址

            // 元数据相关
            name: metadata.name, // 房产名称
            description: metadata.description, // 房产描述
            image: metadata.image, // 房产图片链接
            attributes: metadata.attributes, //其他属性
          });
        }
        console.log(`第 ${i + 1} 个房产获取成功`);
      }

      // 将获取的房产列表设置到状态
      setProperties(properties);
      console.log("全部房产信息获取完成");

      // 监听账户变化事件
      window.ethereum.on("accountsChanged", async () => {
        const accounts = await window.ethereum.request({
          method: "eth_requestAccounts", // 请求新的用户钱包地址
        });
        const newAccount = ethers.utils.getAddress(accounts[0]); // 格式化新地址
        console.log("newAccount:", newAccount, "account:", account);
        if (newAccount != account) {
          setAccount(account); // 更新状态中的用户地址
          await getOrderOnclick();
        }
      });
    } finally {
      setsourceloading(true);
    }
  };

  // 点击按钮时手动调用加载区块链数据函数
  async function getOrderOnclick() {
    await getOrderData(); // 调用主加载函数
  }
  // 页面刷新
  useEffect(() => {
    getOrderOnclick();
  }, []);

  return (
    <div>
      <Navigation account={account} setAccount={setAccount} />
      {sourceloading ? (
        <div className="myOrders_rentalProperty">
          <div className="myOrders_title">My Rental Orders</div>
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
                  {/* 租房信息 Info */}
                  <div className="myOrders_info">
                    <div className="myOrders_info_title">{property.name}</div>

                    <div className="myOrders_info_details">
                      <div className="myOrders_info_date">
                        <p>
                          <strong className="detail-label">
                            Rental Start Date:
                          </strong>
                          <div className="detail-value">
                            {property.startTime || "Not Available"}
                          </div>
                          &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;{/* 空格 */}
                          <strong className="detail-label">End Date:</strong>
                          <div className="detail-value">
                            {property.endTime || "Not Available"}
                          </div>
                        </p>
                      </div>{" "}
                      <div className="myOrders_info_price">
                        <p>
                          <strong className="detail-label">Rent Price:</strong>
                          <div className="detail-value highlight">
                            {property.rentPrice} ETH
                          </div>
                          &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;{/* 空格 */}
                          <strong className="detail-label">
                            Security Deposit:
                          </strong>
                          <div className="detail-value highlight">
                            {property.securityDeposit} ETH
                          </div>
                          <strong className="detail-label">Refunded:</strong>
                          <div className="detail-value highlight">
                            {property.depositReturned}
                          </div>
                        </p>
                      </div>
                      {/* address部分 */}
                      <div className="myOrders_info_address">
                        <p>
                          <strong className="detail-label">
                            Property Address:
                          </strong>
                          <span className="detail-value">
                            {property.rentalPropertyAddress}
                          </span>
                        </p>
                        <p>
                          <strong className="detail-label">
                            Tenant Address:
                          </strong>
                          <span className="detail-value">
                            {property.tenant || "Not Assigned"}
                          </span>
                        </p>
                        <p>
                          <strong className="detail-label">
                            Landlord Address:
                          </strong>
                          <span className="detail-value">
                            {property.landlord}
                          </span>
                        </p>
                      </div>
                    </div>
                    <div className="myOrders_info_button">
                      <button>payRent</button>
                      <button>endRental</button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="myOrders_list_null">
                <p>You currently have no orders. </p>
                <p>
                  Head to the
                  <a href="Home" onClick={homeOnclick}>
                    &nbsp;&nbsp;Home&nbsp;&nbsp;
                  </a>
                  page now to find your ideal rental!
                </p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="loading-overlay">
          <div className="loading-spinner">
            Processing, please wait a moment...
          </div>
        </div>
      )}
    </div>
  );
}

export default MyOrders;

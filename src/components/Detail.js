import { ethers } from "ethers";
import { useEffect, useState } from "react";
import close from "../assets/close.svg";
import {
  PRIVATE_KEY0,
  PRIVATE_KEY1,
  PRIVATE_KEY2,
  HARDHAT_RPC_URL,
  SEPOLIA_PRIVATE_KEY0,
  SEPOLIA_PRIVATE_KEY1,
  SEPOLIA_PRIVATE_KEY2,
  SEPOLIA_RPC_URL,
} from "../components/accountSetting";

const Detail = ({ property, togglePop, loadBlockchainData, tokenId }) => {
  // 状态变量
  const [isRented, setIsRented] = useState(false); // 当前用户是否租了
  const [currentTenant, setCurrentTenant] = useState(null); // 当前租客地址
  const [currentLandlord, setCurrentLandlord] = useState(null); // 房东地址
  const [loading, setLoading] = useState(true); // 加载状态
  const [error, setError] = useState(null); // 错误状态
  const [rentLoading, setrentLoading] = useState(false);
  const [rentSuccess, setrentSuccess] = useState(false);

  // 获取房产、租赁托管 合约实例
  const rentalProperty = property.rentalProperty;

  const rentalEscrow = property.rentalEscrow;

  // 获取详细信息
  const fetchDetails = async () => {
    try {
      setLoading(true);
      setError(null);

      // console.log("property: ", property);
      // 获取租客地址和租赁状态
      const [landlord, isAvailable, rentPrice, securityDeposit, tenant] =
        await rentalEscrow.getPropertyInfo(tokenId);
      console.log("当前房屋获取租客地址为：", tenant);
      if (tenant !== "0x0000000000000000000000000000000000000000") {
        setIsRented(true); // 或者设置为其他默认地址
      }
      setCurrentTenant(tenant);
    } catch (error) {
      console.error("Error fetching details:", error);
      setError("Error fetching property details");
    } finally {
      setLoading(false);
    }
  };

  const rentOnclick = async () => {
    if (typeof window.ethereum !== "undefined") {
      try {
        // 获取当前连接的账户
        const accounts = await window.ethereum.request({
          method: "eth_accounts",
        });

        if (accounts.length === 0) {
          // 如果没有连接账户，弹出提示
          alert("请先连接钱包");
          return;
        }
        console.log("出租处理");

        console.log("房产信息：", rentalProperty.address);
        // 获取账户信息
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const tenant1 = provider.getSigner();
        setrentLoading(true); // 开始处理时显示弹窗
        // 从 RentalEscrow 合约中获取房产租赁信息 propertyInfo -> [landlord, isAvailable, rentPrice, securityDeposit, tenant]
        const propertyInfo = await rentalEscrow.getPropertyInfo(tokenId);
        // 获取租金和押金信息
        const rentPrice = propertyInfo[2];
        const securityDeposit = propertyInfo[3];
        const totalAmount = rentPrice.add(securityDeposit);

        // 获取房东地址的余额
        const landlordAddress = propertyInfo[0];
        let landlordBalance = await provider.getBalance(landlordAddress);
        let landlordBalanceInEth = ethers.utils.formatEther(landlordBalance);
        console.log("房东余额: ", landlordBalanceInEth, "ETH");

        // 开始租房
        const transaction = await rentalEscrow
          .connect(tenant1)
          .createRental(property.id, 1, {
            value: totalAmount,
            gasLimit: 5000000,
          });
        const receipt = await transaction.wait();

        // 更新租房信息
        const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
        let i;
        for (i = 0; i < 20; i++) {
          const isRented1 = await rentalProperty.isRented(tokenId);
          if (isRented1 === false) {
            console.log(`更新租房信息中... `);
            await delay(3000); // 等待 3 秒
          } else {
            setIsRented(true);
            console.log("租房已完成");
            break;
          }
        }
        if (i == 20) {
          console.log("租房失败！！");
        } else {
          landlordBalance = await provider.getBalance(landlordAddress);
          landlordBalanceInEth = ethers.utils.formatEther(landlordBalance);
          console.log("租房后，房东余额: ", landlordBalanceInEth, "ETH");

          const [, , , , tenant] = await rentalEscrow.getPropertyInfo(tokenId);
          setCurrentTenant(tenant);
          console.log("租房后，当前房屋租客地址为：", currentTenant);
        }
        await loadBlockchainData();

        setrentLoading(false); // 完成后隐藏弹窗
        setrentSuccess(true); // 租房成功弹窗
      } catch (error) {
        console.error("Error in tenant handling:", error);
        setError("Error processing rental request");
      }
    } else {
      alert("MetaMask 未连接，请先连接 MetaMask！");
    }
  };
  // 点击确认关闭租房成功弹窗
  const successMessageOnclick = () => {
    setrentSuccess(false); // 关闭弹窗
    setIsRented(true); // 更新租赁状态
  };
  // 加载数据
  useEffect(() => {
    fetchDetails();
  }, []);

  return (
    <div className="home">
      <div className="home__details">
        {rentLoading && (
          <div className="loading-overlay">
            <div className="loading-spinner">正在处理中...</div>
          </div>
        )}
        {/* 租房成功的弹窗 */}
        {rentSuccess && (
          <div className="loading-overlay">
            <div className="loading-spinner">
              <div className="loading-successmessage">
                <h2>租房已完成</h2>
                <p>
                  已扣除房租
                  <strong> {property.rentPrice} ETH </strong>
                  和押金<strong> {property.securityDeposit} ETH</strong>
                  ，租期为<strong> 1 个月 </strong>
                  <br />
                </p>
                <p>
                  租客地址为：{currentTenant} <br />
                </p>
                <p>房东地址为：{property.landlord}</p>
                <br />
                请核对信息，并点击确认
              </div>
              <div className="loading-successmessage-button">
                <button
                  type="button"
                  className="successmessage-button"
                  onClick={successMessageOnclick}
                >
                  确认
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="home__image">
          <img src={property.image} alt="Home" />
        </div>
        <div className="home__overview">
          <h1>{property.name}</h1>
          <p>
            <strong>{property.attributes[6].value}</strong> bds |
            <strong>{property.attributes[7].value}</strong> ba |
            <strong>{property.attributes[4].value}</strong> sqft
          </p>
          <p>
            <a
              href={`https://sepolia.etherscan.io/address/${property.rentalPropertyAddress}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              {property.rentalPropertyAddress}
            </a>
          </p>
          <h2>{property.attributes[0].value} ETH</h2>

          {isRented ? (
            <div>
              <div className="home__owned">rented</div>
              <div>tenant:{currentTenant}</div>
            </div>
          ) : (
            <div>
              <button className="home__contact" onClick={rentOnclick}>
                Rent
              </button>
            </div>
          )}

          <hr />

          <h2>Overview</h2>

          <p>{property.description}</p>

          <hr />

          <h2>Facts and features</h2>

          <ul>
            {property.attributes.map((attribute, index) => (
              <li key={index}>
                <strong>{attribute.trait_type}</strong> : {attribute.value}
              </li>
            ))}
          </ul>
        </div>

        <button onClick={togglePop} className="home__close">
          <img src={close} alt="Close" />
        </button>
      </div>
    </div>
  );
};

export default Detail;

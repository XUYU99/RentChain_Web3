import { ethers } from "ethers";
import { useEffect, useState } from "react";
import close from "../assets/close.svg";
import { getAddress } from "ethers/lib/utils";
import {
  PRIVATE_KEY0,
  PRIVATE_KEY1,
  PRIVATE_KEY2,
  HARDHAT_RPC_URL,
} from "../components/accountSetting";
import RentalProperty from "../../src/artifacts/contracts/RentalProperty.sol/RentalProperty.json";
import RentalEscrow from "../../src/artifacts/contracts/RentalEscrow.sol/RentalEscrow.json";

const Home = ({
  property,
  provider,
  account,
  togglePop,
  loadBlockchainData,
}) => {
  // 状态变量
  const [isRented, setIsRented] = useState(false); // 当前用户是否租了
  const [isPropertyRented, setIsPropertyRented] = useState(false); // 房产是否被租出结束
  const [currentTenant, setCurrentTenant] = useState(null); // 当前租客地址
  const [currentLandlord, setCurrentLandlord] = useState(null); // 房东地址
  const [owner, setOwner] = useState(null);
  const [showContactModal, setShowContactModal] = useState(false); // 控制联系模态框
  const [loading, setLoading] = useState(true); // 加载状态
  const [error, setError] = useState(null); // 错误状态
  const [loading2, setLoading2] = useState(false);
  const [loading3, setLoading3] = useState(false);
  const [successMessage, setSuccessMessage] = useState(""); // 显示成功消息
  const [currentMetaMaskAddress, setCurrentMetaMaskAddress] = useState(null);
  // 检查角色
  const isCurrentUserTenant =
    currentTenant &&
    account &&
    currentTenant.toLowerCase() === account.toLowerCase();
  const isCurrentUserLandlord =
    currentLandlord &&
    account &&
    currentLandlord.toLowerCase() === account.toLowerCase();
  // 获取房产、租赁托管 合约实例
  const rentalProperty = new ethers.Contract(
    property.rentalPropertyAddress,
    RentalProperty.abi,
    provider
  );

  const rentalEscrow = new ethers.Contract(
    property.rentalEscrowAddress,
    RentalEscrow.abi,
    provider
  );

  // 获取详细信息
  const fetchDetails = async () => {
    try {
      setLoading(true);
      setError(null);

      // console.log("property: ", property);
      // 获取租客地址和租赁状态
      const [landlord, isAvailable, rentPrice, securityDeposit, tenant] =
        await rentalEscrow.getPropertyInfo(1);
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
    try {
      console.log("出租处理");

      console.log("房产信息：", rentalProperty.address);
      // 从配置文件获取账户信息
      const provider = new ethers.providers.JsonRpcProvider(HARDHAT_RPC_URL);
      const owner = new ethers.Wallet(PRIVATE_KEY0, provider);
      const landlord1 = new ethers.Wallet(PRIVATE_KEY1, provider);
      const tenant1 = new ethers.Wallet(PRIVATE_KEY2, provider);
      // 从 RentalEscrow 合约中获取房产租赁信息 propertyInfo -> [landlord, isAvailable, rentPrice, securityDeposit, tenant]
      const propertyInfo = await rentalEscrow.getPropertyInfo(1);
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
          gasLimit: 300000,
        });
      const receipt = await transaction.wait();
      console.log("交易已完成:", receipt);

      // 更新租房信息
      setLoading2(true); // 开始处理时显示弹窗
      const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
      let i;
      for (i = 0; i < 20; i++) {
        const isRented1 = await rentalProperty.isRented(1);
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

        const [, , , , tenant] = await rentalEscrow.getPropertyInfo(1);
        setCurrentTenant(tenant);
        console.log("租房后，当前房屋租客地址为：", tenant);
      }
      await loadBlockchainData();

      setLoading2(false); // 完成后隐藏弹窗
      setLoading3(true); // 租房成功弹窗
    } catch (error) {
      console.error("Error in tenant handling:", error);
      setError("Error processing rental request");
    }
  };
  // 点击确认关闭租房成功弹窗
  const successMessageOnclick = () => {
    setLoading3(false); // 关闭弹窗
    setIsRented(true); // 更新租赁状态
  };
  // 加载数据
  useEffect(() => {
    fetchDetails();
    // fetchOwner();
  }, []);
  // // 加载数据
  // useEffect(() => {
  //   fetchDetails();
  //   // fetchOwner();
  // }, [account, property.id, isPropertyRented]);

  if (loading) return <div className="home__loading">Loading...</div>;
  if (error) return <div className="home__error">Error: {error}</div>;

  return (
    <div className="home">
      <div className="home__details">
        {loading2 && (
          <div className="loading-overlay">
            <div className="loading-spinner">正在处理中...</div>
          </div>
        )}
        {/* 租房成功的弹窗 */}
        {loading3 && (
          <div className="loading-overlay">
            <div className="loading-successmessage">
              <div>租房成功～</div>
              <div>
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
            <a href="https://sepolia.etherscan.io/address/0x97c6d26d7e0d316850a967b46845e15a32666d25">
              {property.rentalEscrowAddress}
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

export default Home;

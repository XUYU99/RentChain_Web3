import { ethers } from "ethers";
import { useEffect, useState } from "react";
import {
  PRIVATE_KEY0,
  PRIVATE_KEY1,
  PRIVATE_KEY2,
  HARDHAT_RPC_URL,
} from "../components/accountSetting";
async function Rent({
  property,
  rentalProperty,
  rentalEscrow,
  loadBlockchainData,
  tokenId,
  setLoading2,
  setIsRented,
  currentTenant,
  setCurrentTenant,
  setLoading3,
  setError,
}) {
  try {
    console.log("出租处理");

    console.log("房产信息：", rentalProperty.address);
    // 从配置文件获取账户信息
    const provider = new ethers.providers.JsonRpcProvider(HARDHAT_RPC_URL);
    const owner = new ethers.Wallet(PRIVATE_KEY0, provider);
    const landlord1 = new ethers.Wallet(PRIVATE_KEY1, provider);
    const tenant1 = new ethers.Wallet(PRIVATE_KEY2, provider);
    setLoading2(true); // 开始处理时显示弹窗
    // const provider = new ethers.providers.JsonRpcProvider(SEPOLIA_RPC_URL);
    // const owner = new ethers.Wallet(SEPOLIA_PRIVATE_KEY0, provider);
    // const landlord1 = new ethers.Wallet(SEPOLIA_PRIVATE_KEY1, provider);
    // const tenant1 = new ethers.Wallet(SEPOLIA_PRIVATE_KEY2, provider);
    // 从 RentalEscrow 合约中获取房产租赁信息 propertyInfo -> [landlord, isAvailable, rentPrice, securityDeposit, tenant]
    const rental = await rentalEscrow.getRentalEscrowInfo(tokenId);
    // 获取租金和押金信息
    const rentPrice = rental.rentPrice;
    const securityDeposit = rental.securityDeposit;
    const totalAmount = rentPrice.add(securityDeposit);

    // 获取房东地址的余额
    const landlordAddress = rental.landlord.toString();
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

    setLoading2(false); // 完成后隐藏弹窗
    setLoading3(true); // 租房成功弹窗
  } catch (error) {
    console.error("Error in tenant handling:", error);
    setError("Error processing rental request");
  }
}
export default Rent;

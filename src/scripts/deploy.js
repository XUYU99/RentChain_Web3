import { ethers } from "ethers";
import RentalProperty from "../../src/artifacts/contracts/RentalProperty.sol/RentalProperty.json"; // 导入 RentalProperty 合约的 ABI 和 bytecode
import RentalEscrow from "../../src/artifacts/contracts/RentalEscrow.sol/RentalEscrow.json"; // 导入 RentalEscrow 合约的 ABI 和 bytecode
import {
  PRIVATE_KEY0,
  PRIVATE_KEY1,
  PRIVATE_KEY2,
  RPC_URL,
  SEPOLIA_PRIVATE_KEY0,
  SEPOLIA_PRIVATE_KEY1,
  SEPOLIA_PRIVATE_KEY2,
  SEPOLIA_RPC_URL,
} from "../components/accountSetting";

// 函数：将 ETH 转换为 wei 单位
const tokenETHtoWei = (n) => {
  return ethers.utils.parseEther(n.toString());
};

export var RentalPropertyArray, RentalEscrowArray, metadataArrary, tokenId;

async function deploy() {
  console.log("Starting deployment...");

  // 从配置文件获取账户信息
  const provider = new ethers.providers.JsonRpcProvider(RPC_URL);
  // const owner = new ethers.Wallet(PRIVATE_KEY0, provider);
  // const landlord = new ethers.Wallet(PRIVATE_KEY1, provider);
  // const tenant = new ethers.Wallet(PRIVATE_KEY2, provider);
  const owner = new ethers.Wallet(SEPOLIA_PRIVATE_KEY0, provider);
  const landlord = new ethers.Wallet(SEPOLIA_PRIVATE_KEY1, provider);
  const tenant = new ethers.Wallet(SEPOLIA_PRIVATE_KEY2, provider);

  console.log("landlord 房东 Address:", landlord.address);

  // 创建 RentalProperty 合约的工厂对象
  const rentalFactory = new ethers.ContractFactory(
    RentalProperty.abi,
    RentalProperty.bytecode,
    owner
  );
  // 创建 RentalEscrow 合约的工厂对象
  const escrowFactory = new ethers.ContractFactory(
    RentalEscrow.abi,
    RentalEscrow.bytecode,
    owner
  );

  RentalPropertyArray = [];
  RentalEscrowArray = [];
  metadataArrary = [];
  // 部署多个房产合约并处理相关逻辑
  for (let i = 1; i <= 3; i++) {
    console.log(`-----部署第 ${i} 个房产-----`);

    // 部署房产合约
    const rentalProperty = await rentalFactory.deploy();
    await rentalProperty.deployed();
    console.log(`房产实体 rentalProperty 地址: `, rentalProperty.address); // 输出房产合约的地址

    // 获取 NFT 的元数据（metadata）
    const tokenUrljson = `https://indigo-tiny-aardvark-637.mypinata.cloud/ipfs/QmbbwEY16WqZoLxP4mCpYrqg3YY3oeZBKYrAvQ5H7Lbtzq/${i}.json`;
    const response = await fetch(tokenUrljson);
    const metadata = await response.json();
    metadataArrary.push(metadata);
    console.log("metadata: ", metadata);
    // 从 metadata 中提取租金和押金信息
    const rentPrice = metadata.attributes.find(
      (attr) => attr.trait_type === "Monthly Rent"
    ).value;
    const securityDeposit = metadata.attributes.find(
      (attr) => attr.trait_type === "Security Deposit"
    ).value;
    const rentPriceInWei = ethers.utils.parseUnits(rentPrice.toString(), 18);
    const securityDepositInWei = ethers.utils.parseUnits(
      securityDeposit.toString(),
      18
    );
    console.log("rentPrice: ", rentPrice);

    // 为房产创建一个 NFT
    const transaction = await rentalProperty
      .connect(landlord) // 使用 landlord 账户调用 mint 函数
      .mint(tokenUrljson, rentPriceInWei, securityDepositInWei, {
        gasLimit: 5000000, // 设定足够的 gas limit
      });
    const transactionawaitTx = await transaction.wait(); // 等待交易确认
    console.log("交易结果:", transactionawaitTx);

    // 获取 tokenId
    tokenId = await rentalProperty.getnewTokenId();
    console.log("tokenId:", tokenId.toString());

    // 创建托管合约，并将 NFT 授权给托管合约
    const rentalEscrow = await escrowFactory.deploy(
      rentalProperty.address // 传入房产合约地址
    );
    await rentalEscrow.deployed();
    console.log(`托管合约地址 rentalEscrow : `, rentalEscrow.address);

    // 授权租赁合约托管该 NFT
    const approveTx = await rentalProperty
      .connect(landlord)
      .approve(rentalEscrow.address, tokenId, {
        gasLimit: 5000000, // 设定足够的 gas limit
      });
    await approveTx.wait();

    // 给房产合约设置托管合约地址
    const setRentalEscrowAddressTx = await rentalProperty
      .connect(landlord)
      .setRentalEscrowAddress(rentalEscrow.address, {
        gasLimit: 5000000, // 设定足够的 gas limit
      });
    await setRentalEscrowAddressTx.wait();
    console.log(`Approving NFT ${i} for escrow successful`);

    // 将合约地址存入数组
    RentalPropertyArray.push(rentalProperty);
    RentalEscrowArray.push(rentalEscrow);
  }
  console.log("metadataArray: ", metadataArrary);
  console.log("rentalPropertyArray", RentalPropertyArray);
  console.log("rentalEscrowArray", RentalEscrowArray);
  console.log("deployment successful ");
}

export default deploy;

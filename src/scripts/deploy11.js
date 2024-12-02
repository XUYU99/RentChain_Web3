import { ethers } from "ethers";
import RentalProperty from "../../src/artifacts/contracts/RentalProperty.sol/RentalProperty.json"; // 导入 RentalProperty 合约的 ABI 和 bytecode
import RentalEscrow from "../../src/artifacts/contracts/RentalEscrow.sol/RentalEscrow.json"; // 导入 RentalEscrow 合约的 ABI 和 bytecode
// const fs = require("fs");
import {
  PRIVATE_KEY0,
  PRIVATE_KEY1,
  PRIVATE_KEY2,
  HARDHAT_RPC_URL,
} from "../components/accountSetting";
// 函数： 将 ETH 转换为 wei 单位
const tokenETHtoWei = (n) => {
  return ethers.utils.parseEther(n.toString());
};

export var RentalPropertyArray, RentalEscrowArray;
async function deploy() {
  console.log("Starting deployment...");

  // 设置账户，获取 Hardhat 环境中的签名账户
  // const [owner, landlord, tenant] = await ethers.getSigners(); // 获取三个账户：owner、landlord 和 tenant
  // console.log("\nDeploying with landlord account:", landlord.address);
  // 从配置文件获取账户信息
  const provider = new ethers.providers.JsonRpcProvider(HARDHAT_RPC_URL);
  const owner = new ethers.Wallet(PRIVATE_KEY0, provider);
  const landlord = new ethers.Wallet(PRIVATE_KEY1, provider);
  const tenant = new ethers.Wallet(PRIVATE_KEY2, provider);

  console.log("landlord房东 Address", landlord.address);
  // 创建 RentalProperty 合约的工厂对象
  const abi = RentalProperty.abi; // 获取 RentalProperty 合约的 ABI
  const bytecode = RentalProperty.bytecode; // 获取 RentalProperty 合约的 bytecode
  const rentalFactory = new ethers.ContractFactory(abi, bytecode, owner); // 使用 owner 账户来部署合约

  // 创建 RentalEscrow 合约的工厂对象
  const abi2 = RentalEscrow.abi; // 获取 RentalEscrow 合约的 ABI
  const bytecode2 = RentalEscrow.bytecode; // 获取 RentalEscrow 合约的 bytecode
  const escrowFactory = new ethers.ContractFactory(abi2, bytecode2, owner); // 使用 owner 账户来部署合约
  RentalPropertyArray = new Array(3);
  RentalEscrowArray = new Array(3);
  // 部署多个房产合约并处理相关逻辑
  for (let i = 1; i <= 3; i++) {
    console.log(`-----部署第 ${i} 个房产-----`);
    // 部署房产合约
    const rentalProperty = await rentalFactory.deploy();
    console.log(`房产实体 rentalProperty 地址: `, rentalProperty.address); // 输出房产合约的地址

    // 执行 mint 操作，为房产创建一个 NFT
    const transaction = await rentalProperty
      .connect(landlord) // 使用 landlord 账户调用 mint 函数
      .mint(
        `https://indigo-tiny-aardvark-637.mypinata.cloud/ipfs/QmWDh7VU9rE3AD54PnmJCZBVCsBxNqZsELMhDU9rAHexMP/${i}.json`
      ); // mint 操作使用 JSON 文件的 IPFS 地址
    await transaction.wait();
    // 获取 tokenId
    const newItemId = await rentalProperty.getnewItemId();
    // console.log("newItemId:", newItemId.toString());

    // 获取 NFT 的元数据（metadata）
    const response = await fetch(
      `https://indigo-tiny-aardvark-637.mypinata.cloud/ipfs/QmWDh7VU9rE3AD54PnmJCZBVCsBxNqZsELMhDU9rAHexMP/${i}.json`
    );
    const metadata = await response.json();

    // 从 metadata 中提取租金和押金信息
    const rentPrice = metadata.attributes.find(
      (attr) => attr.trait_type === "Monthly Rent"
    ).value;
    const securityDeposit = metadata.attributes.find(
      (attr) => attr.trait_type === "Security Deposit"
    ).value;

    // 创建托管合约，并将 NFT 授权给托管合约
    const rentalEscrow = await escrowFactory.deploy(
      rentalProperty.address, // 传入房产合约地址
      landlord.address // 传入房东地址
    );
    await rentalEscrow.deployed();
    console.log(`托管合约地址 rentalEscrow : `, rentalEscrow.address);
    const approveTx = await rentalProperty
      .connect(landlord) // 使用 landlord 账户进行 approve 操作
      .approve(rentalEscrow.address, newItemId); // 授权租赁合约托管该 NFT
    await approveTx.wait(); // 等待授权操作完成
    // console.log(`Approving NFT ${i} for escrow successful`);
    // 将房产列表到托管合约
    const listTx = await rentalEscrow
      .connect(landlord) // 使用 landlord 账户调用 listForRent 函数
      .listForRent(
        newItemId,
        tokenETHtoWei(rentPrice),
        tokenETHtoWei(securityDeposit)
      ); // 将房产列出出租，使用租金和押金的值
    await listTx.wait(); // 等待房产出租操作完成
    console.log(`NFT ${i} for escrow successful`);

    RentalPropertyArray[i - 1] = rentalProperty.address;
    RentalEscrowArray[i - 1] = rentalEscrow.address;
  }

  console.log("deployment successful ！！！！");
  // console.log("RentalPropertyArray: ", RentalPropertyArray);
  // console.log("RentalEscrowArray: ", RentalEscrowArray);
  // 创建配置对象（包含房产和托管合约的地址）
  // const config = {
  //   31337: {
  //     rentalProperty: {
  //       address: rentalProperty.address, // 房产合约地址
  //     },
  //     rentalEscrow: {
  //       address: rentalEscrow.address, // 托管合约地址
  //     },
  //   },
  // };

  // 将配置写入文件
  // const configPath = "./src/config.json"; // 配置文件路径
  // fs.writeFileSync(configPath, JSON.stringify(config, null, 2)); // 写入 JSON 配置文件
  // console.log(`\nConfig written to ${configPath}`); // 输出配置文件写入成功的信息
}

export default deploy;

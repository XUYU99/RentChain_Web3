# Web3 Rental For Trust

本项目是一个基于区块链的租赁系统，使用 Hardhat 作为开发框架，利用 Ethereum 本地网络进行智能合约的部署和测试。

1.  安装依赖 `npm install`

2.  合约测试 `npx hardhat test `

3.  一个终端页面启动测试 node；另一个终端部署合约。

合约部署成功后，要更新 abi 配置文件 ➕ config 文件中的合约地址）

```bash
npx hardhat node
npx hardhat run scripts/deploy.js --network localhost
```

4. 渲染前端页面 `npm run start`
5. 用测试节点的私钥，连接 MetaMask 测试网（根据端口情况新建测试链）

## yarn 版本

1. **克隆项目**

   首先将代码库克隆到本地：

   ```
   git clone git@github.com:Shuning0312/Web3_Rental_For_Trust.git
   ```

2. **安装依赖**

   进入项目目录并安装所有依赖：

   ```
   cd Web3_Rental_For_Trust
   yarn install
   ```

3. **安装 Hardhat**

   ```
   yarn add hardhat
   ```

4. **编译合约**

   ```
   yarn hardhat compile
   ```

5. **启动 Hardhat 本地节点**

   打开一个新的终端窗口，启动 Hardhat 本地节点：

   ```
   yarn hardhat node
   ```

6. **在另一个终端部署智能合约**

   在另一个终端窗口中，运行部署脚本将智能合约部署到刚启动的 Hardhat 本地节点：

   ```
   yarn hardhat run scripts/deploy.js --network localhost
   ```

7. **检查合约是否部署成功**

   在终端 1（即 Hardhat 本地节点所在终端）中检查合约是否已成功上链。如果部署成功，终端 1 会显示相关的交易信息和区块链状态。

8. **启动前端页面**

   部署完成后，启动前端页面以查看项目的 UI：

   ```
   yarn start
   ```

   打开浏览器访问 `http://localhost:3000`，即可看到项目的启动页面并开始与智能合约交互。
# test

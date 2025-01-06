// require("@nomicfoundation/hardhat-toolbox");

// const { artifacts } = require("hardhat");

// /** @type import('hardhat/config').HardhatUserConfig */
// module.exports = {
//   solidity: "0.8.17",
// };

// require("@nomicfoundation/hardhat-toolbox");

// module.exports = {
//   solidity: {
//     version: "0.8.20", // 使用 0.8.20 版本
//     settings: {
//       optimizer: {
//         enabled: true,
//         runs: 200,
//       },
//     },
//   },
//   paths: {
//     artifacts: "./src/artifacts", // 默认 artifacts 路径
//   },
// };

// 2025-1-6
/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.28",
  solidity: {
    version: "0.8.27",
    settings: {
      optimizer: {
        enabled: true,
        runs: 1000,
      },
    },
  },
  allowUnlimitedContractSize: true,
  paths: {
    artifacts: "./src/artifacts", // 默认 artifacts 路径
  },
};

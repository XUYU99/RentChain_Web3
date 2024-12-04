// require("@nomicfoundation/hardhat-toolbox");

// const { artifacts } = require("hardhat");

// /** @type import('hardhat/config').HardhatUserConfig */
// module.exports = {
//   solidity: "0.8.17",
// };

require("@nomicfoundation/hardhat-toolbox");

module.exports = {
  solidity: {
    version: "0.8.20", // 使用 0.8.20 版本
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  paths: {
    artifacts: "./src/artifacts", // 默认 artifacts 路径
  },
};

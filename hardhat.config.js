require("@nomicfoundation/hardhat-toolbox");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.28",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  
  networks: {
    // Réseau local single-node (pour dev)
    localhost: {
      url: "http://127.0.0.1:8545"
    },
    
    // 🌐 RÉSEAU MULTI-NŒUDS - Configuration corrigée
    multinode: {
      url: "http://127.0.0.1:8546", // Nœud principal
      chainId: 31337,  // ✅ CORRECTION: Utiliser le vrai Chain ID de Hardhat
      accounts: [
        "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80", // Account #0
        "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d", // Account #1  
        "0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a", // Account #2
        "0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6", // Account #3
        "0x47e179ec197488593b187f80a00eb0da91f1b9d0b13f8733639f19c30a34926a", // Account #4
        "0x8b3a350cf5c34c9194ca85829a2df0ec3153be0318b5e2d3348e872092edffba", // Account #5
      ]
    }
  },

  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts"
  },

  mocha: {
    timeout: 40000
  }
};

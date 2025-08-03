const hre = require("hardhat");

async function main() {
  console.log("🏦 Deploying Vault contract...");

  // Déployer le contrat Vault
  const Vault = await hre.ethers.getContractFactory("Vault");
  const vault = await Vault.deploy();
  await vault.waitForDeployment();

  const vaultAddress = await vault.getAddress();
  console.log("✅ Vault deployed to:", vaultAddress);

  // Récupérer les adresses des tokens existants
  const contractAddresses = {
    TRG: "0x5FbDB2315678afecb367f032d93F642f64180aa3",
    CLV: "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512", 
    ROO: "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0",
    GOV: "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9"
  };

  console.log("🔧 Authorizing assets in Vault...");

  // Autoriser les tokens ERC20
  await vault.authorizeToken(contractAddresses.TRG);
  await vault.authorizeToken(contractAddresses.CLV);
  await vault.authorizeToken(contractAddresses.ROO);
  console.log("✅ ERC20 tokens authorized");

  // Autoriser le NFT
  await vault.authorizeNFT(contractAddresses.GOV);
  console.log("✅ NFT authorized");

  // Sauvegarder la configuration
  const deployment = {
    vault: vaultAddress,
    authorizedTokens: [
      contractAddresses.TRG,
      contractAddresses.CLV,
      contractAddresses.ROO
    ],
    authorizedNFTs: [
      contractAddresses.GOV
    ],
    timestamp: new Date().toISOString()
  };

  const fs = require('fs');
  fs.writeFileSync('vault-deployment.json', JSON.stringify(deployment, null, 2));
  console.log("💾 Vault deployment saved to vault-deployment.json");

  console.log("\n🎯 VAULT DEPLOYMENT SUMMARY:");
  console.log("Vault Address:", vaultAddress);
  console.log("Authorized Tokens:", contractAddresses.TRG, contractAddresses.CLV, contractAddresses.ROO);
  console.log("Authorized NFTs:", contractAddresses.GOV);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

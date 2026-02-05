// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/EmailServiceV2.sol";
import "@openzeppelin/contracts/mocks/token/ERC20Mock.sol";

/**
 * @title DeployV2
 * @notice Monad Hackathon - EmailServiceV2 部署脚本
 * @dev 部署 V2 增强版智能合約到 Monad 測試網/主網
 */
contract DeployV2 is Script {
    function run() external {
        // 從環境變量讀取私鑰
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");

        // 開始廣播交易
        vm.startBroadcast(deployerPrivateKey);

        console.log("Deploying EmailServiceV2...");
        console.log("Deployer:", vm.addr(deployerPrivateKey));

        // 1. 部署 Mock USDC（測試網用）
        console.log("\n1. Deploying Mock USDC...");
        ERC20Mock usdc = new ERC20Mock();
        console.log("  USDC deployed at:", address(usdc));

        // 2. 部署 EmailServiceV2
        console.log("\n2. Deploying EmailServiceV2...");

        uint256 pricePerHourUSDC = 100_000; // 0.1 USDC (6 decimals)
        uint256 pricePerHourMON = 0.001 ether; // 0.001 MON

        EmailServiceV2 emailService = new EmailServiceV2(
            address(usdc),
            pricePerHourUSDC,
            pricePerHourMON
        );

        console.log("  EmailServiceV2 deployed at:", address(emailService));

        // 3. 打印配置信息
        console.log("\n=== Deployment Summary ===");
        console.log("Network: Monad");
        console.log("USDC Address:", address(usdc));
        console.log("EmailServiceV2 Address:", address(emailService));
        console.log("Price per hour (USDC):", pricePerHourUSDC);
        console.log("Price per hour (MON):", pricePerHourMON);
        console.log("Owner:", emailService.owner());

        console.log("\n=== V2 New Features ===");
        console.log("1. Mailbox Renewal");
        console.log("2. Referral Rewards (10%)");
        console.log("3. Bulk Purchase Discount (10% for 5+)");
        console.log("4. Emergency Pause");
        console.log("5. Gas Optimizations");

        console.log("\n=== Next Steps ===");
        console.log("1. Update .env with new contract addresses");
        console.log("2. Update backend to listen to new events");
        console.log("3. Update frontend to support new features");
        console.log("4. Test on testnet before mainnet deployment");

        vm.stopBroadcast();

        // 4. 保存部署信息到 JSON
        string memory deploymentInfo = string(
            abi.encodePacked(
                '{\n',
                '  "emailServiceV2": "', vm.toString(address(emailService)), '",\n',
                '  "usdc": "', vm.toString(address(usdc)), '",\n',
                '  "network": "monad-testnet",\n',
                '  "chainId": 10143,\n',
                '  "version": "2.0.0",\n',
                '  "features": [\n',
                '    "Mailbox Renewal",\n',
                '    "Referral Rewards",\n',
                '    "Bulk Purchase Discount",\n',
                '    "Emergency Pause",\n',
                '    "Gas Optimizations"\n',
                '  ]\n',
                '}'
            )
        );

        vm.writeFile("deployment-v2.json", deploymentInfo);
        console.log("\nDeployment info saved to deployment-v2.json");
    }
}

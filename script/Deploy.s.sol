// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/EmailService.sol";

/**
 * @title Deploy Script for EmailService
 * @dev 部署腳本：將 EmailService 合約部署到 Monad 測試網
 *
 * 使用方法：
 *
 * 1. 設置環境變量：
 *    export PRIVATE_KEY="your-private-key"
 *    export MONAD_RPC_URL="https://testnet-rpc.monad.xyz"
 *    export USDC_ADDRESS="0x..." // Monad 測試網 USDC 地址
 *
 * 2. 本地模擬部署（無需實際上鏈）：
 *    forge script script/Deploy.s.sol
 *
 * 3. 部署到 Monad 測試網：
 *    forge script script/Deploy.s.sol \
 *      --rpc-url $MONAD_RPC_URL \
 *      --private-key $PRIVATE_KEY \
 *      --broadcast \
 *      --verify
 *
 * 4. 使用 .env 文件：
 *    forge script script/Deploy.s.sol \
 *      --rpc-url $MONAD_RPC_URL \
 *      --broadcast \
 *      --verify
 *
 * @author @piggyxbot
 * @custom:version 1.0.0
 * @custom:date 2026-02-05
 */
contract DeployEmailService is Script {

    // ============ 配置參數 ============

    /// @notice 初始價格：每小時 0.001 USDC（USDC 是 6 位小數）
    uint256 constant INITIAL_PRICE_USDC = 1000; // 0.001 USDC = 1000 (6 decimals)

    /// @notice 初始價格：每小時 0.001 MON（MON 是 18 位小數）
    uint256 constant INITIAL_PRICE_MON = 1e15; // 0.001 MON = 1e15 wei

    /// @notice Monad 測試網 USDC 地址（需要根據實際情況更新）
    /// @dev 如果測試網沒有 USDC，可以先部署一個 Mock USDC
    address public usdcAddress;

    // ============ 部署合約 ============

    function run() external {
        // 1. 獲取環境變量
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");

        // 2. 獲取 USDC 地址（優先使用環境變量，否則使用默認值）
        try vm.envAddress("USDC_ADDRESS") returns (address _usdcAddress) {
            usdcAddress = _usdcAddress;
            console.log("Using USDC from environment:", usdcAddress);
        } catch {
            // 如果沒有設置 USDC_ADDRESS，部署一個 Mock USDC
            console.log("USDC_ADDRESS not set, will deploy Mock USDC...");
            usdcAddress = address(0); // 稍後部署
        }

        // 3. 開始廣播交易
        vm.startBroadcast(deployerPrivateKey);

        // 4. 如果需要，先部署 Mock USDC（僅用於測試）
        if (usdcAddress == address(0)) {
            MockERC20 mockUSDC = new MockERC20("USD Coin", "USDC", 6);
            usdcAddress = address(mockUSDC);
            console.log("Deployed Mock USDC at:", usdcAddress);

            // 給部署者一些測試 USDC
            mockUSDC.mint(msg.sender, 10000 * 1e6); // 10,000 USDC
            console.log("Minted 10,000 USDC to deployer");
        }

        // 5. 部署 EmailService 主合約
        EmailService emailService = new EmailService(
            usdcAddress,
            INITIAL_PRICE_USDC,
            INITIAL_PRICE_MON
        );

        // 6. 停止廣播
        vm.stopBroadcast();

        // 7. 輸出部署信息
        console.log("\n========================================");
        console.log("EmailService Deployed Successfully!");
        console.log("========================================");
        console.log("Contract Address:      ", address(emailService));
        console.log("USDC Address:          ", usdcAddress);
        console.log("Price per Hour (USDC): ", INITIAL_PRICE_USDC, "(0.001 USDC)");
        console.log("Price per Hour (MON):  ", INITIAL_PRICE_MON, "(0.001 MON)");
        console.log("Owner:                 ", emailService.owner());
        console.log("========================================");
        console.log("\nNext Steps:");
        console.log("1. Update backend/.env with CONTRACT_ADDRESS");
        console.log("2. Update backend/.env with USDC_ADDRESS");
        console.log("3. Start backend service to listen for events");
        console.log("4. Test with: cast send <address> 'purchaseMailbox(uint256,address)' 1 0x0000000000000000000000000000000000000000 --value 0.001ether");
        console.log("========================================\n");

        // 8. 保存部署信息到文件（方便後端讀取）
        // Note: vm.writeFile is disabled in broadcast mode, manually create deployment.json
        // _saveDeploymentInfo(address(emailService), usdcAddress);
    }

    // ============ 輔助函數 ============

    /**
     * @notice 保存部署信息到 JSON 文件
     * @dev 後端可以讀取這個文件獲取合約地址
     */
    function _saveDeploymentInfo(address emailServiceAddress, address _usdcAddress) private {
        string memory json = string(abi.encodePacked(
            "{\n",
            '  "emailService": "', vm.toString(emailServiceAddress), '",\n',
            '  "usdc": "', vm.toString(_usdcAddress), '",\n',
            '  "network": "monad-testnet",\n',
            '  "deployedAt": "', vm.toString(block.timestamp), '"\n',
            "}"
        ));

        vm.writeFile("deployment.json", json);
        console.log("Deployment info saved to: deployment.json");
    }
}

// ============ Mock ERC20 (僅用於測試) ============

/**
 * @title MockERC20
 * @dev 簡單的 ERC20 實現，僅用於測試環境
 * @notice 生產環境請使用真實的 USDC 合約
 */
contract MockERC20 {
    string public name;
    string public symbol;
    uint8 public decimals;
    uint256 public totalSupply;

    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);

    constructor(string memory _name, string memory _symbol, uint8 _decimals) {
        name = _name;
        symbol = _symbol;
        decimals = _decimals;
    }

    function mint(address to, uint256 amount) external {
        balanceOf[to] += amount;
        totalSupply += amount;
        emit Transfer(address(0), to, amount);
    }

    function transfer(address to, uint256 amount) external returns (bool) {
        balanceOf[msg.sender] -= amount;
        balanceOf[to] += amount;
        emit Transfer(msg.sender, to, amount);
        return true;
    }

    function transferFrom(address from, address to, uint256 amount) external returns (bool) {
        allowance[from][msg.sender] -= amount;
        balanceOf[from] -= amount;
        balanceOf[to] += amount;
        emit Transfer(from, to, amount);
        return true;
    }

    function approve(address spender, uint256 amount) external returns (bool) {
        allowance[msg.sender][spender] = amount;
        emit Approval(msg.sender, spender, amount);
        return true;
    }
}

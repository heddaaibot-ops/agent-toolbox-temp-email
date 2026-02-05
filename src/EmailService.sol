// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title EmailService
 * @dev Agent's Toolbox - 臨時郵箱服務智能合約
 * @notice 為 AI Agent 提供去中心化的臨時郵箱購買服務
 *
 * 核心功能：
 * 1. 支援 USDC + MON 雙幣種支付
 * 2. Agent 購買臨時郵箱（1-24 小時）
 * 3. 發出 EmailPurchased 事件讓後端監聽
 * 4. 查詢 Agent 擁有的所有郵箱
 *
 * @author @piggyxbot
 * @custom:version 1.0.0
 * @custom:date 2026-02-05
 */
contract EmailService is Ownable, ReentrancyGuard {

    // ============ 狀態變量 ============

    /// @notice USDC 代幣合約地址（穩定幣）
    IERC20 public immutable usdc;

    /// @notice 每小時價格（USDC，6 位小數）
    /// @dev 0.001 USDC = 1000 (因為 USDC 是 6 位小數)
    uint256 public pricePerHourUSDC;

    /// @notice 每小時價格（MON，18 位小數）
    /// @dev 預設為 0.001 MON = 1e15 wei
    uint256 public pricePerHourMON;

    /// @notice 郵箱計數器（用於生成唯一 ID）
    uint256 private _mailboxCounter;

    /// @notice 郵箱結構
    struct Mailbox {
        address owner;          // 擁有者錢包地址
        string mailboxId;       // 唯一郵箱 ID
        uint256 createdAt;      // 創建時間（區塊時間戳）
        uint256 expiresAt;      // 過期時間（區塊時間戳）
        uint256 duration;       // 持續時間（小時）
        string paymentMethod;   // 支付方式（"USDC" 或 "MON"）
        bool active;            // 是否活躍
    }

    /// @notice 所有郵箱記錄：mailboxId => Mailbox
    mapping(string => Mailbox) public mailboxes;

    /// @notice 用戶擁有的郵箱列表：owner => mailboxId[]
    mapping(address => string[]) public ownerMailboxes;

    // ============ 事件 ============

    /**
     * @notice 郵箱購買成功事件
     * @dev 後端監聽此事件，自動創建實際郵箱
     * @param buyer 購買者地址
     * @param mailboxId 郵箱唯一 ID
     * @param email 郵箱地址（預留，後端生成）
     * @param expiresAt 過期時間戳
     * @param paymentMethod 支付方式（"USDC" 或 "MON"）
     */
    event EmailPurchased(
        address indexed buyer,
        string mailboxId,
        string email,
        uint256 expiresAt,
        string paymentMethod
    );

    /**
     * @notice 價格更新事件
     * @param pricePerHourUSDC 新的 USDC 價格
     * @param pricePerHourMON 新的 MON 價格
     */
    event PriceUpdated(uint256 pricePerHourUSDC, uint256 pricePerHourMON);

    /**
     * @notice 提款事件
     * @param token 提取的代幣地址（address(0) 表示 MON）
     * @param amount 提取數量
     * @param to 接收地址
     */
    event Withdrawal(address indexed token, uint256 amount, address indexed to);

    // ============ 錯誤定義 ============

    /// @notice 無效的持續時間（必須 1-24 小時）
    error InvalidDuration();

    /// @notice MON 支付金額不足
    error InsufficientMON();

    /// @notice USDC 轉賬失敗
    error USDCTransferFailed();

    /// @notice 郵箱不存在
    error MailboxNotFound();

    /// @notice 無餘額可提取
    error NoBalanceToWithdraw();

    // ============ 構造函數 ============

    /**
     * @notice 初始化合約
     * @param _usdcAddress USDC 代幣合約地址
     * @param _pricePerHourUSDC 每小時價格（USDC，6 位小數）
     * @param _pricePerHourMON 每小時價格（MON，18 位小數）
     */
    constructor(
        address _usdcAddress,
        uint256 _pricePerHourUSDC,
        uint256 _pricePerHourMON
    ) Ownable(msg.sender) {
        usdc = IERC20(_usdcAddress);
        pricePerHourUSDC = _pricePerHourUSDC;
        pricePerHourMON = _pricePerHourMON;
        _mailboxCounter = 0;
    }

    // ============ 外部函數 ============

    /**
     * @notice 購買臨時郵箱
     * @dev 支援 USDC 和 MON 雙幣種支付
     *
     * @param duration 郵箱持續時間（1-24 小時）
     * @param paymentToken 支付代幣地址
     *        - address(0)：使用 MON 支付（需要 msg.value）
     *        - USDC 地址：使用 USDC 支付（需要先 approve）
     *
     * @return mailboxId 生成的唯一郵箱 ID
     *
     * 使用示例：
     * 1. MON 支付：
     *    purchaseMailbox(1, address(0), { value: 0.001 ether })
     *
     * 2. USDC 支付：
     *    - 先 approve：usdc.approve(contractAddress, 1000) // 0.001 USDC
     *    - 再購買：purchaseMailbox(1, usdcAddress)
     */
    function purchaseMailbox(
        uint256 duration,
        address paymentToken
    ) external payable nonReentrant returns (string memory mailboxId) {
        // 1. 驗證持續時間（1-24 小時）
        if (duration < 1 || duration > 24) {
            revert InvalidDuration();
        }

        // 2. 處理支付
        string memory paymentMethod;
        if (paymentToken == address(0)) {
            // 使用 MON 支付
            uint256 totalPrice = pricePerHourMON * duration;
            if (msg.value < totalPrice) {
                revert InsufficientMON();
            }

            // 如果支付過多，退還差額
            if (msg.value > totalPrice) {
                (bool success, ) = msg.sender.call{value: msg.value - totalPrice}("");
                require(success, "Refund failed");
            }

            paymentMethod = "MON";
        } else {
            // 使用 USDC 支付
            uint256 totalPrice = pricePerHourUSDC * duration;
            bool success = usdc.transferFrom(msg.sender, address(this), totalPrice);
            if (!success) {
                revert USDCTransferFailed();
            }

            paymentMethod = "USDC";
        }

        // 3. 生成唯一 mailboxId
        _mailboxCounter++;
        mailboxId = _generateMailboxId(msg.sender, _mailboxCounter);

        // 4. 計算過期時間
        uint256 createdAt = block.timestamp;
        uint256 expiresAt = createdAt + (duration * 1 hours);

        // 5. 創建郵箱記錄
        mailboxes[mailboxId] = Mailbox({
            owner: msg.sender,
            mailboxId: mailboxId,
            createdAt: createdAt,
            expiresAt: expiresAt,
            duration: duration,
            paymentMethod: paymentMethod,
            active: true
        });

        // 6. 添加到用戶郵箱列表
        ownerMailboxes[msg.sender].push(mailboxId);

        // 7. 發出事件（後端監聽）
        // 注意：email 參數預留，後端會根據 mailboxId 生成實際郵箱地址
        emit EmailPurchased(
            msg.sender,
            mailboxId,
            "", // email 由後端生成（如：agent-abc123@mail.tm）
            expiresAt,
            paymentMethod
        );

        return mailboxId;
    }

    /**
     * @notice 查詢我的所有郵箱
     * @dev 返回調用者擁有的所有郵箱詳情
     * @return 郵箱結構數組
     */
    function getMyMailboxes() external view returns (Mailbox[] memory) {
        string[] memory ids = ownerMailboxes[msg.sender];
        Mailbox[] memory result = new Mailbox[](ids.length);

        for (uint256 i = 0; i < ids.length; i++) {
            result[i] = mailboxes[ids[i]];
        }

        return result;
    }

    /**
     * @notice 查詢指定郵箱詳情
     * @param mailboxId 郵箱 ID
     * @return 郵箱結構
     */
    function getMailbox(string memory mailboxId) external view returns (Mailbox memory) {
        Mailbox memory mailbox = mailboxes[mailboxId];
        if (mailbox.owner == address(0)) {
            revert MailboxNotFound();
        }
        return mailbox;
    }

    /**
     * @notice 檢查郵箱是否活躍
     * @param mailboxId 郵箱 ID
     * @return 是否活躍（未過期）
     */
    function isMailboxActive(string memory mailboxId) external view returns (bool) {
        Mailbox memory mailbox = mailboxes[mailboxId];
        if (mailbox.owner == address(0)) {
            return false;
        }
        return mailbox.active && block.timestamp < mailbox.expiresAt;
    }

    // ============ 管理員函數 ============

    /**
     * @notice 更新價格（僅限 owner）
     * @param _pricePerHourUSDC 新的 USDC 價格
     * @param _pricePerHourMON 新的 MON 價格
     */
    function updatePrice(
        uint256 _pricePerHourUSDC,
        uint256 _pricePerHourMON
    ) external onlyOwner {
        pricePerHourUSDC = _pricePerHourUSDC;
        pricePerHourMON = _pricePerHourMON;

        emit PriceUpdated(_pricePerHourUSDC, _pricePerHourMON);
    }

    /**
     * @notice 提取 USDC（僅限 owner）
     * @param to 接收地址
     */
    function withdrawUSDC(address to) external onlyOwner {
        uint256 balance = usdc.balanceOf(address(this));
        if (balance == 0) {
            revert NoBalanceToWithdraw();
        }

        bool success = usdc.transfer(to, balance);
        require(success, "USDC transfer failed");

        emit Withdrawal(address(usdc), balance, to);
    }

    /**
     * @notice 提取 MON（僅限 owner）
     * @param to 接收地址
     */
    function withdrawMON(address to) external onlyOwner {
        uint256 balance = address(this).balance;
        if (balance == 0) {
            revert NoBalanceToWithdraw();
        }

        (bool success, ) = to.call{value: balance}("");
        require(success, "MON transfer failed");

        emit Withdrawal(address(0), balance, to);
    }

    // ============ 內部函數 ============

    /**
     * @notice 生成唯一的 mailboxId
     * @dev 使用 keccak256 哈希確保唯一性
     * @param buyer 購買者地址
     * @param counter 計數器
     * @return 十六進制格式的 mailboxId
     */
    function _generateMailboxId(
        address buyer,
        uint256 counter
    ) private view returns (string memory) {
        bytes32 hash = keccak256(
            abi.encodePacked(
                buyer,
                counter,
                block.timestamp,
                block.prevrandao
            )
        );

        return _bytes32ToHexString(hash);
    }

    /**
     * @notice 將 bytes32 轉換為十六進制字符串
     * @param data bytes32 數據
     * @return 十六進制字符串（帶 0x 前綴）
     */
    function _bytes32ToHexString(bytes32 data) private pure returns (string memory) {
        bytes memory hexChars = "0123456789abcdef";
        bytes memory result = new bytes(66); // "0x" + 64 hex chars

        result[0] = "0";
        result[1] = "x";

        for (uint256 i = 0; i < 32; i++) {
            result[2 + i * 2] = hexChars[uint8(data[i] >> 4)];
            result[3 + i * 2] = hexChars[uint8(data[i] & 0x0f)];
        }

        return string(result);
    }

    // ============ 接收 ETH ============

    /**
     * @notice 接收 MON 支付
     */
    receive() external payable {}
}

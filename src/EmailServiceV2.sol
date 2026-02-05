// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title EmailServiceV2
 * @dev Agent's Toolbox - 臨時郵箱服務智能合約 V2
 * @notice 為 AI Agent 提供去中心化的臨時郵箱購買服務
 *
 * V2 新功能：
 * 1. ✅ 郵箱續費功能
 * 2. ✅ 推薦獎勵系統
 * 3. ✅ 批量購買折扣
 * 4. ✅ 緊急暫停機制
 * 5. ✅ Gas 優化
 *
 * @author @piggyxbot
 * @custom:version 2.0.0
 * @custom:date 2026-02-05
 */
contract EmailServiceV2 is Ownable, ReentrancyGuard, Pausable {

    // ============ 常量 ============

    /// @notice 推薦獎勵比例（10% = 1000 / 10000）
    uint256 public constant REFERRAL_REWARD_RATE = 1000;

    /// @notice 批量購買折扣門檻
    uint256 public constant BULK_DISCOUNT_THRESHOLD = 5;

    /// @notice 批量購買折扣比例（10% = 1000 / 10000）
    uint256 public constant BULK_DISCOUNT_RATE = 1000;

    /// @notice 最大持續時間（24 小時）
    uint256 public constant MAX_DURATION = 24;

    /// @notice 分母（用於百分比計算）
    uint256 private constant BASIS_POINTS = 10000;

    // ============ 狀態變量 ============

    /// @notice USDC 代幣合約地址（穩定幣）
    IERC20 public immutable usdc;

    /// @notice 每小時價格（USDC，6 位小數）
    uint256 public pricePerHourUSDC;

    /// @notice 每小時價格（MON，18 位小數）
    uint256 public pricePerHourMON;

    /// @notice 郵箱計數器（用於生成唯一 ID）
    uint256 private _mailboxCounter;

    /// @notice 累積推薦獎勵：referrer => amount
    mapping(address => uint256) public referralRewards;

    /// @notice 郵箱結構（優化 storage 布局以節省 Gas）
    struct Mailbox {
        address owner;          // 20 bytes
        uint96 createdAt;      // 12 bytes
        uint96 expiresAt;      // 12 bytes
        uint24 duration;       // 3 bytes
        uint8 paymentMethod;   // 1 byte - 0: MON, 1: USDC
        bool active;           // 1 byte
        string mailboxId;      // 動態大小
    }

    /// @notice 所有郵箱記錄：mailboxId => Mailbox
    mapping(string => Mailbox) public mailboxes;

    /// @notice 用戶擁有的郵箱列表：owner => mailboxId[]
    mapping(address => string[]) public ownerMailboxes;

    // ============ 事件 ============

    event EmailPurchased(
        address indexed buyer,
        string mailboxId,
        string email,
        uint256 expiresAt,
        string paymentMethod,
        address indexed referrer
    );

    event MailboxRenewed(
        string indexed mailboxId,
        address indexed owner,
        uint256 newExpiresAt,
        uint256 additionalHours,
        string paymentMethod,
        uint256 pricePaid
    );

    event ReferralReward(
        address indexed referrer,
        address indexed referee,
        string mailboxId,
        uint256 rewardAmount
    );

    event BulkPurchase(
        address indexed buyer,
        uint256 quantity,
        uint256 totalPrice,
        uint256 discountAmount,
        string paymentMethod
    );

    event PriceUpdated(uint256 pricePerHourUSDC, uint256 pricePerHourMON);

    event Withdrawal(address indexed token, uint256 amount, address indexed to);

    event ReferralRewardClaimed(address indexed referrer, uint256 amount);

    // ============ 錯誤定義 ============

    error InvalidDuration();
    error InsufficientMON();
    error USDCTransferFailed();
    error MailboxNotFound();
    error NoBalanceToWithdraw();
    error MailboxExpired();
    error NotMailboxOwner();
    error InvalidReferrer();
    error NoReferralReward();
    error InvalidQuantity();

    // ============ 構造函數 ============

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

    // ============ 核心功能 ============

    /**
     * @notice 購買臨時郵箱（支持推薦）
     */
    function purchaseMailbox(
        uint256 duration,
        address paymentToken,
        address referrer
    ) external payable whenNotPaused nonReentrant returns (string memory mailboxId) {
        // 驗證
        if (duration < 1 || duration > MAX_DURATION) revert InvalidDuration();
        if (referrer != address(0) && referrer == msg.sender) revert InvalidReferrer();

        // 處理支付
        (string memory paymentMethod, uint256 totalPrice) = _processPayment(duration, paymentToken);

        // 創建郵箱
        mailboxId = _createMailbox(duration, paymentToken);

        // 處理推薦獎勵
        if (referrer != address(0)) {
            _handleReferralReward(referrer, totalPrice, mailboxId);
        }

        // 發出購買事件
        emit EmailPurchased(
            msg.sender,
            mailboxId,
            "",
            uint256(mailboxes[mailboxId].expiresAt),
            paymentMethod,
            referrer
        );

        return mailboxId;
    }

    /**
     * @notice 續費郵箱
     */
    function renewMailbox(
        string memory mailboxId,
        uint256 additionalHours,
        address paymentToken
    ) external payable whenNotPaused nonReentrant {
        Mailbox storage mailbox = mailboxes[mailboxId];

        // 驗證
        if (mailbox.owner == address(0)) revert MailboxNotFound();
        if (mailbox.owner != msg.sender) revert NotMailboxOwner();
        if (additionalHours < 1 || additionalHours > MAX_DURATION) revert InvalidDuration();

        // 處理支付
        (string memory paymentMethod, uint256 pricePaid) = _processPayment(additionalHours, paymentToken);

        // 更新過期時間
        uint256 newExpiresAt = uint256(mailbox.expiresAt) + (additionalHours * 1 hours);
        mailbox.expiresAt = uint96(newExpiresAt);
        mailbox.duration = uint24(uint256(mailbox.duration) + additionalHours);

        if (!mailbox.active) mailbox.active = true;

        emit MailboxRenewed(mailboxId, msg.sender, newExpiresAt, additionalHours, paymentMethod, pricePaid);
    }

    /**
     * @notice 批量購買郵箱（5個以上享受折扣）
     */
    function bulkPurchaseMailboxes(
        uint256[] calldata durations,
        address paymentToken,
        address referrer
    ) external payable whenNotPaused nonReentrant returns (string[] memory) {
        uint256 quantity = durations.length;

        // 驗證
        if (quantity == 0) revert InvalidQuantity();
        if (referrer != address(0) && referrer == msg.sender) revert InvalidReferrer();

        // 計算價格
        (uint256 totalPrice, uint256 discountAmount) = _calculateBulkPrice(durations, paymentToken);

        // 處理支付
        string memory paymentMethod = _processBulkPayment(totalPrice, paymentToken);

        // 創建郵箱
        string[] memory mailboxIds = _createBulkMailboxes(durations, paymentToken, paymentMethod, referrer);

        // 處理推薦獎勵
        if (referrer != address(0)) {
            _handleReferralReward(referrer, totalPrice, mailboxIds[0]);
        }

        emit BulkPurchase(msg.sender, quantity, totalPrice, discountAmount, paymentMethod);

        return mailboxIds;
    }

    /**
     * @notice 領取推薦獎勵
     */
    function claimReferralReward() external nonReentrant {
        uint256 reward = referralRewards[msg.sender];
        if (reward == 0) revert NoReferralReward();

        referralRewards[msg.sender] = 0;

        (bool success, ) = msg.sender.call{value: reward}("");
        require(success, "Reward transfer failed");

        emit ReferralRewardClaimed(msg.sender, reward);
    }

    // ============ 查詢函數 ============

    function getMyMailboxes() external view returns (Mailbox[] memory) {
        string[] memory ids = ownerMailboxes[msg.sender];
        Mailbox[] memory result = new Mailbox[](ids.length);
        for (uint256 i = 0; i < ids.length; i++) {
            result[i] = mailboxes[ids[i]];
        }
        return result;
    }

    function getMailbox(string memory mailboxId) external view returns (Mailbox memory) {
        Mailbox memory mailbox = mailboxes[mailboxId];
        if (mailbox.owner == address(0)) revert MailboxNotFound();
        return mailbox;
    }

    function isMailboxActive(string memory mailboxId) external view returns (bool) {
        Mailbox memory mailbox = mailboxes[mailboxId];
        if (mailbox.owner == address(0)) return false;
        return mailbox.active && block.timestamp < mailbox.expiresAt;
    }

    function getBuyerMailboxes(address buyer) external view returns (string[] memory) {
        return ownerMailboxes[buyer];
    }

    function getMailboxPrice(uint256 duration) public view returns (uint256) {
        return pricePerHourUSDC * duration;
    }

    // ============ 管理員函數 ============

    function updatePrice(uint256 _pricePerHourUSDC, uint256 _pricePerHourMON) external onlyOwner {
        pricePerHourUSDC = _pricePerHourUSDC;
        pricePerHourMON = _pricePerHourMON;
        emit PriceUpdated(_pricePerHourUSDC, _pricePerHourMON);
    }

    function withdrawUSDC(address to) external onlyOwner {
        uint256 balance = usdc.balanceOf(address(this));
        if (balance == 0) revert NoBalanceToWithdraw();
        bool success = usdc.transfer(to, balance);
        require(success, "USDC transfer failed");
        emit Withdrawal(address(usdc), balance, to);
    }

    function withdrawMON(address to) external onlyOwner {
        uint256 balance = address(this).balance;
        if (balance == 0) revert NoBalanceToWithdraw();
        (bool success, ) = to.call{value: balance}("");
        require(success, "MON transfer failed");
        emit Withdrawal(address(0), balance, to);
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    // ============ 內部函數 ============

    function _processPayment(
        uint256 duration,
        address paymentToken
    ) private returns (string memory paymentMethod, uint256 totalPrice) {
        if (paymentToken == address(0)) {
            totalPrice = pricePerHourMON * duration;
            if (msg.value < totalPrice) revert InsufficientMON();
            if (msg.value > totalPrice) {
                (bool success, ) = msg.sender.call{value: msg.value - totalPrice}("");
                require(success, "Refund failed");
            }
            paymentMethod = "MON";
        } else {
            totalPrice = pricePerHourUSDC * duration;
            bool success = usdc.transferFrom(msg.sender, address(this), totalPrice);
            if (!success) revert USDCTransferFailed();
            paymentMethod = "USDC";
        }
    }

    function _createMailbox(
        uint256 duration,
        address paymentToken
    ) private returns (string memory mailboxId) {
        _mailboxCounter++;
        mailboxId = _generateMailboxId(msg.sender, _mailboxCounter);

        uint256 currentTime = block.timestamp;
        uint256 expiresAt = currentTime + (duration * 1 hours);

        mailboxes[mailboxId] = Mailbox({
            owner: msg.sender,
            createdAt: uint96(currentTime),
            expiresAt: uint96(expiresAt),
            duration: uint24(duration),
            paymentMethod: paymentToken == address(0) ? 0 : 1,
            active: true,
            mailboxId: mailboxId
        });

        ownerMailboxes[msg.sender].push(mailboxId);
    }

    function _handleReferralReward(
        address referrer,
        uint256 totalPrice,
        string memory mailboxId
    ) private {
        uint256 reward = (totalPrice * REFERRAL_REWARD_RATE) / BASIS_POINTS;
        referralRewards[referrer] += reward;
        emit ReferralReward(referrer, msg.sender, mailboxId, reward);
    }

    function _calculateBulkPrice(
        uint256[] calldata durations,
        address paymentToken
    ) private view returns (uint256 totalPrice, uint256 discountAmount) {
        uint256 totalHours = 0;
        for (uint256 i = 0; i < durations.length; i++) {
            if (durations[i] < 1 || durations[i] > MAX_DURATION) revert InvalidDuration();
            totalHours += durations[i];
        }

        uint256 basePrice = paymentToken == address(0)
            ? pricePerHourMON * totalHours
            : pricePerHourUSDC * totalHours;

        if (durations.length >= BULK_DISCOUNT_THRESHOLD) {
            discountAmount = (basePrice * BULK_DISCOUNT_RATE) / BASIS_POINTS;
            totalPrice = basePrice - discountAmount;
        } else {
            totalPrice = basePrice;
            discountAmount = 0;
        }
    }

    function _processBulkPayment(
        uint256 amount,
        address paymentToken
    ) private returns (string memory paymentMethod) {
        if (paymentToken == address(0)) {
            if (msg.value < amount) revert InsufficientMON();
            if (msg.value > amount) {
                (bool success, ) = msg.sender.call{value: msg.value - amount}("");
                require(success, "Refund failed");
            }
            paymentMethod = "MON";
        } else {
            bool success = usdc.transferFrom(msg.sender, address(this), amount);
            if (!success) revert USDCTransferFailed();
            paymentMethod = "USDC";
        }
    }

    function _createBulkMailboxes(
        uint256[] calldata durations,
        address paymentToken,
        string memory paymentMethod,
        address referrer
    ) private returns (string[] memory mailboxIds) {
        mailboxIds = new string[](durations.length);
        uint256 currentTime = block.timestamp;

        for (uint256 i = 0; i < durations.length; i++) {
            _mailboxCounter++;
            string memory mailboxId = _generateMailboxId(msg.sender, _mailboxCounter);
            mailboxIds[i] = mailboxId;

            uint256 expiresAt = currentTime + (durations[i] * 1 hours);

            mailboxes[mailboxId] = Mailbox({
                owner: msg.sender,
                createdAt: uint96(currentTime),
                expiresAt: uint96(expiresAt),
                duration: uint24(durations[i]),
                paymentMethod: paymentToken == address(0) ? 0 : 1,
                active: true,
                mailboxId: mailboxId
            });

            ownerMailboxes[msg.sender].push(mailboxId);

            emit EmailPurchased(msg.sender, mailboxId, "", expiresAt, paymentMethod, referrer);
        }
    }

    function _generateMailboxId(
        address buyer,
        uint256 counter
    ) private view returns (string memory) {
        bytes32 hash = keccak256(
            abi.encodePacked(buyer, counter, block.timestamp, block.prevrandao)
        );
        return _bytes32ToHexString(hash);
    }

    function _bytes32ToHexString(bytes32 data) private pure returns (string memory) {
        bytes memory hexChars = "0123456789abcdef";
        bytes memory result = new bytes(66);

        result[0] = "0";
        result[1] = "x";

        for (uint256 i = 0; i < 32; i++) {
            result[2 + i * 2] = hexChars[uint8(data[i] >> 4)];
            result[3 + i * 2] = hexChars[uint8(data[i] & 0x0f)];
        }

        return string(result);
    }

    receive() external payable {}
}

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/EmailServiceV2.sol";
import "@openzeppelin/contracts/mocks/token/ERC20Mock.sol";

contract EmailServiceV2Test is Test {
    EmailServiceV2 public emailService;
    ERC20Mock public usdc;

    address public owner = address(this);
    address public user1 = address(0x1);
    address public user2 = address(0x2);
    address public referrer = address(0x3);

    uint256 public constant PRICE_PER_HOUR_USDC = 100_000; // 0.1 USDC (6 decimals)
    uint256 public constant PRICE_PER_HOUR_MON = 0.001 ether;

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

    function setUp() public {
        // Deploy USDC
        usdc = new ERC20Mock();

        // Deploy EmailServiceV2
        emailService = new EmailServiceV2(
            address(usdc),
            PRICE_PER_HOUR_USDC,
            PRICE_PER_HOUR_MON
        );

        // Fund users
        vm.deal(user1, 10 ether);
        vm.deal(user2, 10 ether);
        vm.deal(referrer, 10 ether);

        // Mint USDC to users
        usdc.mint(user1, 1_000_000 * 1e6); // 1M USDC
        usdc.mint(user2, 1_000_000 * 1e6);
    }

    // ============ 基礎功能測試 ============

    function testPurchaseWithReferrer() public {
        vm.startPrank(user1);

        uint256 duration = 2;
        uint256 price = PRICE_PER_HOUR_MON * duration;

        // 預期推薦獎勵 = 10%
        uint256 expectedReward = (price * 1000) / 10000;

        vm.expectEmit(true, true, false, true);
        emit ReferralReward(referrer, user1, "", expectedReward);

        string memory mailboxId = emailService.purchaseMailbox{value: price}(
            duration,
            address(0), // MON payment
            referrer
        );

        vm.stopPrank();

        // 驗證推薦獎勵
        assertEq(emailService.referralRewards(referrer), expectedReward);

        // 驗證郵箱創建
        EmailServiceV2.Mailbox memory mailbox = emailService.getMailbox(mailboxId);
        assertEq(mailbox.owner, user1);
        assertTrue(mailbox.active);
    }

    function testCannotReferSelf() public {
        vm.startPrank(user1);

        vm.expectRevert(EmailServiceV2.InvalidReferrer.selector);
        emailService.purchaseMailbox{value: PRICE_PER_HOUR_MON}(
            1,
            address(0),
            user1 // 試圖推薦自己
        );

        vm.stopPrank();
    }

    // ============ 續費功能測試 ============

    function testRenewMailboxWithMON() public {
        // 1. 先購買郵箱
        vm.startPrank(user1);

        string memory mailboxId = emailService.purchaseMailbox{value: PRICE_PER_HOUR_MON}(
            1,
            address(0),
            address(0)
        );

        EmailServiceV2.Mailbox memory mailboxBefore = emailService.getMailbox(mailboxId);
        uint256 expiresBefore = mailboxBefore.expiresAt;

        // 2. 續費 2 小時
        uint256 additionalHours = 2;
        uint256 renewPrice = PRICE_PER_HOUR_MON * additionalHours;

        vm.expectEmit(true, true, false, false);
        emit MailboxRenewed(
            mailboxId,
            user1,
            0, // newExpiresAt will be checked separately
            additionalHours,
            "MON",
            renewPrice
        );

        emailService.renewMailbox{value: renewPrice}(
            mailboxId,
            additionalHours,
            address(0)
        );

        vm.stopPrank();

        // 3. 驗證續費結果
        EmailServiceV2.Mailbox memory mailboxAfter = emailService.getMailbox(mailboxId);
        assertEq(
            mailboxAfter.expiresAt,
            expiresBefore + (additionalHours * 1 hours),
            "Expiry time should be extended"
        );
        assertEq(
            mailboxAfter.duration,
            1 + additionalHours,
            "Duration should be updated"
        );
    }

    function testRenewMailboxWithUSDC() public {
        vm.startPrank(user1);

        // 1. 先購買郵箱（USDC）
        usdc.approve(address(emailService), PRICE_PER_HOUR_USDC);
        string memory mailboxId = emailService.purchaseMailbox(
            1,
            address(usdc),
            address(0)
        );

        EmailServiceV2.Mailbox memory mailboxBefore = emailService.getMailbox(mailboxId);

        // 2. 續費（USDC）
        uint256 additionalHours = 3;
        uint256 renewPrice = PRICE_PER_HOUR_USDC * additionalHours;

        usdc.approve(address(emailService), renewPrice);
        emailService.renewMailbox(
            mailboxId,
            additionalHours,
            address(usdc)
        );

        vm.stopPrank();

        // 3. 驗證
        EmailServiceV2.Mailbox memory mailboxAfter = emailService.getMailbox(mailboxId);
        assertEq(
            mailboxAfter.duration,
            1 + additionalHours
        );
    }

    function testCannotRenewOthersMailbox() public {
        // user1 購買郵箱
        vm.prank(user1);
        string memory mailboxId = emailService.purchaseMailbox{value: PRICE_PER_HOUR_MON}(
            1,
            address(0),
            address(0)
        );

        // user2 嘗試續費（應該失敗）
        vm.startPrank(user2);
        vm.expectRevert(EmailServiceV2.NotMailboxOwner.selector);
        emailService.renewMailbox{value: PRICE_PER_HOUR_MON}(
            mailboxId,
            1,
            address(0)
        );
        vm.stopPrank();
    }

    // ============ 批量購買測試 ============

    function testBulkPurchaseWithDiscount() public {
        vm.startPrank(user1);

        // 購買 5 個郵箱（達到折扣門檻）
        uint256[] memory durations = new uint256[](5);
        for (uint256 i = 0; i < 5; i++) {
            durations[i] = 2; // 每個 2 小時
        }

        uint256 totalHours = 10;
        uint256 basePrice = PRICE_PER_HOUR_MON * totalHours;
        uint256 discountAmount = (basePrice * 1000) / 10000; // 10% 折扣
        uint256 expectedPrice = basePrice - discountAmount;

        vm.expectEmit(true, false, false, true);
        emit BulkPurchase(
            user1,
            5,
            expectedPrice,
            discountAmount,
            "MON"
        );

        string[] memory mailboxIds = emailService.bulkPurchaseMailboxes{
            value: expectedPrice
        }(durations, address(0), address(0));

        vm.stopPrank();

        // 驗證
        assertEq(mailboxIds.length, 5, "Should create 5 mailboxes");

        for (uint256 i = 0; i < 5; i++) {
            EmailServiceV2.Mailbox memory mailbox = emailService.getMailbox(mailboxIds[i]);
            assertEq(mailbox.owner, user1);
            assertEq(mailbox.duration, 2);
            assertTrue(mailbox.active);
        }
    }

    function testBulkPurchaseWithReferrer() public {
        vm.startPrank(user1);

        uint256[] memory durations = new uint256[](5);
        for (uint256 i = 0; i < 5; i++) {
            durations[i] = 1;
        }

        uint256 totalHours = 5;
        uint256 basePrice = PRICE_PER_HOUR_MON * totalHours;
        uint256 discountAmount = (basePrice * 1000) / 10000;
        uint256 totalPrice = basePrice - discountAmount;

        uint256 expectedReward = (totalPrice * 1000) / 10000; // 10% 推薦獎勵

        emailService.bulkPurchaseMailboxes{value: totalPrice}(
            durations,
            address(0),
            referrer
        );

        vm.stopPrank();

        // 驗證推薦獎勵
        assertEq(emailService.referralRewards(referrer), expectedReward);
    }

    function testBulkPurchaseNoDiscountUnderThreshold() public {
        vm.startPrank(user1);

        // 購買 4 個（未達折扣門檻）
        uint256[] memory durations = new uint256[](4);
        for (uint256 i = 0; i < 4; i++) {
            durations[i] = 1;
        }

        uint256 totalHours = 4;
        uint256 totalPrice = PRICE_PER_HOUR_MON * totalHours;

        // 應該沒有折扣
        vm.expectEmit(true, false, false, true);
        emit BulkPurchase(
            user1,
            4,
            totalPrice,
            0, // 無折扣
            "MON"
        );

        emailService.bulkPurchaseMailboxes{value: totalPrice}(
            durations,
            address(0),
            address(0)
        );

        vm.stopPrank();
    }

    // ============ 推薦獎勵領取測試 ============

    function testClaimReferralReward() public {
        // 1. user1 通過 referrer 購買，產生獎勵
        vm.prank(user1);
        uint256 price = PRICE_PER_HOUR_MON * 2;
        emailService.purchaseMailbox{value: price}(
            2,
            address(0),
            referrer
        );

        uint256 expectedReward = (price * 1000) / 10000;

        // 2. referrer 領取獎勵
        uint256 balanceBefore = referrer.balance;

        vm.prank(referrer);
        emailService.claimReferralReward();

        uint256 balanceAfter = referrer.balance;

        // 3. 驗證
        assertEq(balanceAfter - balanceBefore, expectedReward);
        assertEq(emailService.referralRewards(referrer), 0); // 已領取，應該清零
    }

    function testCannotClaimZeroReward() public {
        vm.startPrank(user1);

        vm.expectRevert(EmailServiceV2.NoReferralReward.selector);
        emailService.claimReferralReward();

        vm.stopPrank();
    }

    // ============ 暫停功能測試 ============

    function testPauseAndUnpause() public {
        // 暫停
        emailService.pause();

        // 嘗試購買（應該失敗）
        vm.startPrank(user1);
        vm.expectRevert();
        emailService.purchaseMailbox{value: PRICE_PER_HOUR_MON}(
            1,
            address(0),
            address(0)
        );
        vm.stopPrank();

        // 取消暫停
        emailService.unpause();

        // 現在應該可以購買
        vm.prank(user1);
        emailService.purchaseMailbox{value: PRICE_PER_HOUR_MON}(
            1,
            address(0),
            address(0)
        );
    }

    function testOnlyOwnerCanPause() public {
        vm.startPrank(user1);

        vm.expectRevert();
        emailService.pause();

        vm.stopPrank();
    }

    // ============ Gas 優化驗證 ============

    function testGasOptimization() public {
        vm.startPrank(user1);

        uint256 gasBefore = gasleft();
        emailService.purchaseMailbox{value: PRICE_PER_HOUR_MON}(
            1,
            address(0),
            address(0)
        );
        uint256 gasUsed = gasBefore - gasleft();

        console.log("Gas used for purchase:", gasUsed);

        // V2 應該比 V1 節省 Gas（由於優化了 storage 布局）
        // 這裡可以設置一個合理的上限
        assertTrue(gasUsed < 200000, "Gas usage should be optimized");

        vm.stopPrank();
    }
}

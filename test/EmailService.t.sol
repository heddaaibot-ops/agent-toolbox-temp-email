// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/EmailService.sol";

// A mock ERC20 contract for testing purposes
contract MockERC20 is Test {
    string public name;
    string public symbol;
    uint8 public decimals;
    uint256 public totalSupply;

    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    constructor(string memory _name, string memory _symbol, uint8 _decimals) {
        name = _name;
        symbol = _symbol;
        decimals = _decimals;
    }

    function mint(address to, uint256 amount) external {
        balanceOf[to] += amount;
        totalSupply += amount;
    }

    function transfer(address to, uint256 amount) external returns (bool) {
        balanceOf[msg.sender] -= amount;
        balanceOf[to] += amount;
        return true;
    }

    function transferFrom(address from, address to, uint256 amount) external returns (bool) {
        allowance[from][msg.sender] -= amount;
        balanceOf[from] -= amount;
        balanceOf[to] += amount;
        return true;
    }

    function approve(address spender, uint256 amount) external returns (bool) {
        allowance[msg.sender][spender] = amount;
        return true;
    }
}


contract EmailServiceTest is Test {
    EmailService public emailService;
    MockERC20 public usdc;

    address public owner = address(0x1);
    address public user = address(0x2);

    uint256 constant DURATION = 1; // 1 hour (in hours, not seconds)
    uint256 constant PRICE_IN_USDC = 1000; // 0.001 USDC per hour (with 6 decimals: 1000 = 0.001 USDC)
    uint256 constant PRICE_IN_MON = 1e15; // 0.001 MON per hour (with 18 decimals)

    function setUp() public {
        vm.startPrank(owner);
        // Deploy Mock USDC with 6 decimals
        usdc = new MockERC20("USD Coin", "USDC", 6);
        // Deploy EmailService
        emailService = new EmailService(address(usdc), PRICE_IN_USDC, PRICE_IN_MON);
        vm.stopPrank();

        // Give the user some MON and USDC for testing
        vm.deal(user, 1 ether); // Give user 1 MON (ETH)
        usdc.mint(user, 5000 * 1e6); // Give user 5000 USDC
    }

    // Test 1: User can purchase a mailbox using MON
    function testPurchaseWithMON() public {
        vm.startPrank(user);

        // Perform the purchase (mailboxId is auto-generated)
        string memory mailboxId = emailService.purchaseMailbox{value: PRICE_IN_MON}(
            DURATION,
            address(0) // address(0) for MON
        );

        // Check if the mailbox was recorded
        EmailService.Mailbox[] memory mailboxes = emailService.getMyMailboxes();
        assertEq(mailboxes.length, 1);
        assertEq(mailboxes[0].owner, user);
        assertEq(mailboxes[0].mailboxId, mailboxId);
        assertEq(mailboxes[0].duration, DURATION);
        assertEq(mailboxes[0].paymentMethod, "MON");
        assertEq(mailboxes[0].expiresAt, block.timestamp + (DURATION * 1 hours));
        assertTrue(mailboxes[0].active);

        vm.stopPrank();
    }

    // Test 2: User can purchase a mailbox using USDC
    function testPurchaseWithUSDC() public {
        vm.startPrank(user);

        // User must first approve the contract to spend USDC
        usdc.approve(address(emailService), PRICE_IN_USDC * DURATION);

        string memory mailboxId = emailService.purchaseMailbox(
            DURATION,
            address(usdc)
        );

        EmailService.Mailbox[] memory mailboxes = emailService.getMyMailboxes();
        assertEq(mailboxes.length, 1);
        assertEq(mailboxes[0].owner, user);
        assertEq(mailboxes[0].mailboxId, mailboxId);
        assertEq(mailboxes[0].duration, DURATION);
        assertEq(mailboxes[0].paymentMethod, "USDC");
        assertEq(usdc.balanceOf(address(emailService)), PRICE_IN_USDC * DURATION);

        vm.stopPrank();
    }

    // Test 3: User can purchase multiple mailboxes
    function testPurchaseMultipleMailboxes() public {
        vm.startPrank(user);

        // Purchase first mailbox with MON
        string memory mailboxId1 = emailService.purchaseMailbox{value: PRICE_IN_MON}(
            DURATION,
            address(0)
        );

        // Purchase second mailbox with USDC
        usdc.approve(address(emailService), PRICE_IN_USDC * 2);
        string memory mailboxId2 = emailService.purchaseMailbox(
            2,
            address(usdc)
        );

        EmailService.Mailbox[] memory mailboxes = emailService.getMyMailboxes();
        assertEq(mailboxes.length, 2);
        assertEq(mailboxes[0].mailboxId, mailboxId1);
        assertEq(mailboxes[1].mailboxId, mailboxId2);

        vm.stopPrank();
    }

    // Test 4: Refund excess MON payment
    function testRefundExcessMON() public {
        vm.startPrank(user);

        uint256 initialBalance = user.balance;
        uint256 overpayment = PRICE_IN_MON * 2; // Pay 2x the price

        emailService.purchaseMailbox{value: overpayment}(
            DURATION,
            address(0)
        );

        // Check that excess was refunded
        uint256 finalBalance = user.balance;
        assertEq(finalBalance, initialBalance - PRICE_IN_MON);

        vm.stopPrank();
    }

    // Test 5: getMailbox function
    function testGetMailbox() public {
        vm.startPrank(user);

        string memory mailboxId = emailService.purchaseMailbox{value: PRICE_IN_MON}(
            DURATION,
            address(0)
        );

        vm.stopPrank();

        // Anyone can query mailbox details
        EmailService.Mailbox memory mailbox = emailService.getMailbox(mailboxId);
        assertEq(mailbox.owner, user);
        assertEq(mailbox.mailboxId, mailboxId);
        assertTrue(mailbox.active);
    }

    // Test 6: isMailboxActive function
    function testIsMailboxActive() public {
        vm.startPrank(user);

        string memory mailboxId = emailService.purchaseMailbox{value: PRICE_IN_MON}(
            DURATION,
            address(0)
        );

        vm.stopPrank();

        // Should be active now
        assertTrue(emailService.isMailboxActive(mailboxId));

        // Fast forward time to after expiration
        vm.warp(block.timestamp + 2 hours);

        // Should be inactive now
        assertFalse(emailService.isMailboxActive(mailboxId));
    }

    // ============ Failure Cases ============

    // Test 7: Fail with invalid duration (0 hours)
    function testFailInvalidDurationZero() public {
        vm.startPrank(user);

        vm.expectRevert(EmailService.InvalidDuration.selector);
        emailService.purchaseMailbox{value: PRICE_IN_MON}(
            0, // Invalid: 0 hours
            address(0)
        );

        vm.stopPrank();
    }

    // Test 8: Fail with invalid duration (25 hours)
    function testFailInvalidDurationTooLong() public {
        vm.startPrank(user);

        vm.expectRevert(EmailService.InvalidDuration.selector);
        emailService.purchaseMailbox{value: PRICE_IN_MON * 25}(
            25, // Invalid: > 24 hours
            address(0)
        );

        vm.stopPrank();
    }

    // Test 9: Fail with insufficient MON
    function testFailInsufficientMON() public {
        vm.startPrank(user);

        vm.expectRevert(EmailService.InsufficientMON.selector);
        emailService.purchaseMailbox{value: PRICE_IN_MON / 2}( // Not enough MON
            DURATION,
            address(0)
        );

        vm.stopPrank();
    }

    // Test 10: Fail when USDC not approved
    function testFailUSDCNotApproved() public {
        vm.startPrank(user);

        // Don't approve USDC
        vm.expectRevert();
        emailService.purchaseMailbox(
            DURATION,
            address(usdc)
        );

        vm.stopPrank();
    }

    // Test 11: Fail when querying non-existent mailbox
    function testFailGetNonExistentMailbox() public {
        vm.expectRevert(EmailService.MailboxNotFound.selector);
        emailService.getMailbox("non-existent-id");
    }

    // ============ Admin Functions ============

    // Test 12: Owner can update prices
    function testOwnerCanUpdatePrice() public {
        vm.startPrank(owner);

        uint256 newPriceUSDC = 2000;
        uint256 newPriceMON = 2e15;

        emailService.updatePrice(newPriceUSDC, newPriceMON);

        assertEq(emailService.pricePerHourUSDC(), newPriceUSDC);
        assertEq(emailService.pricePerHourMON(), newPriceMON);

        vm.stopPrank();
    }

    // Test 13: Non-owner cannot update prices
    function testFailNonOwnerCannotUpdatePrice() public {
        vm.startPrank(user);

        vm.expectRevert();
        emailService.updatePrice(2000, 2e15);

        vm.stopPrank();
    }

    // Test 14: Owner can withdraw USDC
    function testOwnerCanWithdrawUSDC() public {
        // User purchases with USDC
        vm.startPrank(user);
        usdc.approve(address(emailService), PRICE_IN_USDC * DURATION);
        emailService.purchaseMailbox(DURATION, address(usdc));
        vm.stopPrank();

        // Owner withdraws
        vm.startPrank(owner);
        uint256 contractBalance = usdc.balanceOf(address(emailService));
        uint256 ownerBalanceBefore = usdc.balanceOf(owner);

        emailService.withdrawUSDC(owner);

        assertEq(usdc.balanceOf(address(emailService)), 0);
        assertEq(usdc.balanceOf(owner), ownerBalanceBefore + contractBalance);

        vm.stopPrank();
    }

    // Test 15: Owner can withdraw MON
    function testOwnerCanWithdrawMON() public {
        // User purchases with MON
        vm.startPrank(user);
        emailService.purchaseMailbox{value: PRICE_IN_MON}(DURATION, address(0));
        vm.stopPrank();

        // Owner withdraws
        vm.startPrank(owner);
        uint256 contractBalance = address(emailService).balance;
        uint256 ownerBalanceBefore = owner.balance;

        emailService.withdrawMON(owner);

        assertEq(address(emailService).balance, 0);
        assertEq(owner.balance, ownerBalanceBefore + contractBalance);

        vm.stopPrank();
    }

    // Test 16: Cannot withdraw when balance is zero
    function testFailWithdrawUSDCWhenZeroBalance() public {
        vm.startPrank(owner);

        vm.expectRevert(EmailService.NoBalanceToWithdraw.selector);
        emailService.withdrawUSDC(owner);

        vm.stopPrank();
    }

    // Test 17: Non-owner cannot withdraw
    function testFailNonOwnerCannotWithdraw() public {
        vm.startPrank(user);

        vm.expectRevert();
        emailService.withdrawUSDC(user);

        vm.stopPrank();
    }

    // Test 18: EmailPurchased event is emitted correctly
    function testEmailPurchasedEvent() public {
        vm.startPrank(user);

        // We can't easily predict the mailboxId, so we just check the event was emitted
        vm.recordLogs();

        emailService.purchaseMailbox{value: PRICE_IN_MON}(
            DURATION,
            address(0)
        );

        Vm.Log[] memory entries = vm.getRecordedLogs();

        // EmailPurchased should be the first event
        assertEq(entries.length, 1);
        assertEq(entries[0].topics[0], keccak256("EmailPurchased(address,string,string,uint256,string)"));

        vm.stopPrank();
    }
}

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title SecretGift
 * @dev A contract that allows users to send secret crypto gifts locked by riddles
 */
contract SecretGift is ReentrancyGuard {
    using SafeERC20 for IERC20;

    // Gift structure
    struct Gift {
        address sender;
        address receiver;
        string riddle; // Empty string means direct gift (no riddle)
        bytes32 answerHash; // bytes32(0) means direct gift (no answer required)
        string message; // Personal message from sender (revealed after claim)
        uint256 amount;
        address tokenAddress; // address(0) for ETH, otherwise ERC20 token address
        uint256 createdAt;
        uint256 unlockTime; // Timestamp when gift becomes claimable (0 = immediately)
        uint256 expirationTime; // Timestamp when gift expires (0 = use default 7 days)
        bool claimed;
    }

    // State variables
    Gift[] public gifts;
    IERC20 public usdc;
    uint256 public constant DEFAULT_EXPIRY_DAYS = 7;
    uint256 public constant DEFAULT_EXPIRY_SECONDS = DEFAULT_EXPIRY_DAYS * 24 * 60 * 60;
    uint256 public constant MIN_EXPIRATION_HOURS = 1; // Minimum 1 hour expiration
    uint256 public constant MAX_EXPIRATION_DAYS = 365; // Maximum 1 year expiration
    
    // Security: Maximum string lengths to prevent gas griefing
    uint256 public constant MAX_RIDDLE_LENGTH = 500;
    uint256 public constant MAX_ANSWER_LENGTH = 200;
    uint256 public constant MAX_MESSAGE_LENGTH = 1000;

    // Events
    event GiftCreated(
        uint256 indexed giftId,
        address indexed sender,
        address indexed receiver,
        string riddle,
        uint256 amount,
        address tokenAddress,
        uint256 unlockTime
    );

    event GiftClaimed(
        uint256 indexed giftId,
        address indexed receiver,
        uint256 amount
    );

    event GiftRefunded(
        uint256 indexed giftId,
        address indexed sender,
        uint256 amount
    );

    constructor(address _usdcAddress) {
        usdc = IERC20(_usdcAddress);
    }

    /**
     * @dev Create a new secret gift
     * @param receiver Address of the gift receiver
     * @param riddle The riddle question
     * @param answer The answer to the riddle (will be hashed)
     * @param message Personal message from sender (revealed after claim)
     * @param amount Amount of tokens/ETH to send
     * @param isETH True if sending ETH, false if sending USDC
     * @param unlockTime Timestamp when gift becomes claimable (0 = immediately)
     * @param expirationTime Timestamp when gift expires (0 = use default 7 days from creation)
     */
    function createGift(
        address receiver,
        string memory riddle,
        string memory answer,
        string memory message,
        uint256 amount,
        bool isETH,
        uint256 unlockTime,
        uint256 expirationTime
    ) external payable nonReentrant {
        require(receiver != address(0), "Invalid receiver address");
        require(receiver != msg.sender, "Cannot send gift to yourself");
        require(bytes(riddle).length <= MAX_RIDDLE_LENGTH, "Riddle too long");
        require(bytes(message).length <= MAX_MESSAGE_LENGTH, "Message too long");
        require(amount > 0, "Amount must be greater than 0");
        require(unlockTime == 0 || unlockTime >= block.timestamp, "Unlock time must be in the future");
        
        // Validate expiration time
        uint256 finalExpirationTime;
        if (expirationTime == 0) {
            // Use default 7 days from creation
            finalExpirationTime = block.timestamp + DEFAULT_EXPIRY_SECONDS;
        } else {
            // Custom expiration time
            require(expirationTime > block.timestamp, "Expiration time must be in the future");
            uint256 expirationDuration = expirationTime - block.timestamp;
            uint256 minExpiration = MIN_EXPIRATION_HOURS * 60 * 60; // 1 hour in seconds
            uint256 maxExpiration = MAX_EXPIRATION_DAYS * 24 * 60 * 60; // 1 year in seconds
            require(expirationDuration >= minExpiration, "Expiration must be at least 1 hour");
            require(expirationDuration <= maxExpiration, "Expiration cannot exceed 1 year");
            finalExpirationTime = expirationTime;
        }
        
        // If riddle is provided, answer must also be provided
        bool hasRiddle = bytes(riddle).length > 0;
        if (hasRiddle) {
            require(bytes(answer).length > 0, "Answer required when riddle is provided");
            require(bytes(answer).length <= MAX_ANSWER_LENGTH, "Answer too long");
        }

        address tokenAddress = isETH ? address(0) : address(usdc);
        
        if (isETH) {
            require(msg.value == amount, "ETH amount mismatch");
        } else {
            require(msg.value == 0, "Cannot send ETH with USDC");
            usdc.safeTransferFrom(msg.sender, address(this), amount);
        }

        uint256 giftId = gifts.length;
        bytes32 answerHash;
        
        // If riddle is provided, create salted hash. Otherwise, use bytes32(0) for direct gift
        if (hasRiddle) {
            // Security: Use salted hash to prevent hash collisions
            // Hash includes answer + giftId (will be set) + sender address for uniqueness
            answerHash = keccak256(abi.encodePacked(answer, giftId, msg.sender, receiver));
        } else {
            // Direct gift - no answer required
            answerHash = bytes32(0);
        }
        
        // If unlockTime is 0, set it to current timestamp (immediately available)
        uint256 finalUnlockTime = unlockTime == 0 ? block.timestamp : unlockTime;
        
        gifts.push(Gift({
            sender: msg.sender,
            receiver: receiver,
            riddle: riddle,
            answerHash: answerHash,
            message: message,
            amount: amount,
            tokenAddress: tokenAddress,
            createdAt: block.timestamp,
            unlockTime: finalUnlockTime,
            expirationTime: finalExpirationTime,
            claimed: false
        }));
        
        emit GiftCreated(
            giftId,
            msg.sender,
            receiver,
            riddle,
            amount,
            tokenAddress,
            finalUnlockTime
        );
    }

    /**
     * @dev Claim a gift by providing the correct answer
     * @param giftId The ID of the gift to claim
     * @param guess The guessed answer
     */
    function claimGift(
        uint256 giftId,
        string memory guess
    ) external nonReentrant {
        require(giftId < gifts.length, "Gift does not exist");
        Gift storage gift = gifts[giftId];
        
        require(msg.sender == gift.receiver, "Not the gift receiver");
        require(!gift.claimed, "Gift already claimed");
        require(
            block.timestamp >= gift.unlockTime,
            "Gift is time-locked"
        );
        require(
            block.timestamp < gift.expirationTime,
            "Gift has expired"
        );

        // If answerHash is bytes32(0), it's a direct gift (no riddle)
        if (gift.answerHash == bytes32(0)) {
            // Direct gift - no answer required, just claim
            require(bytes(guess).length == 0, "Direct gift requires empty guess");
        } else {
            // Riddle gift - verify answer
            // Security: Use same salted hash as in createGift
            bytes32 guessHash = keccak256(abi.encodePacked(guess, giftId, gift.sender, gift.receiver));
            require(guessHash == gift.answerHash, "Incorrect answer");
        }

        gift.claimed = true;
        uint256 amount = gift.amount;

        if (gift.tokenAddress == address(0)) {
            // Transfer ETH
            (bool success, ) = payable(msg.sender).call{value: amount}("");
            require(success, "ETH transfer failed");
        } else {
            // Transfer USDC
            usdc.safeTransfer(msg.sender, amount);
        }

        emit GiftClaimed(giftId, msg.sender, amount);
    }

    /**
     * @dev Refund an expired gift to the sender
     * @param giftId The ID of the gift to refund
     */
    function refundGift(uint256 giftId) external nonReentrant {
        require(giftId < gifts.length, "Gift does not exist");
        Gift storage gift = gifts[giftId];
        
        require(!gift.claimed, "Gift already claimed");
        require(
            block.timestamp >= gift.expirationTime,
            "Gift has not expired yet"
        );
        require(msg.sender == gift.sender, "Only sender can refund");

        gift.claimed = true;
        uint256 amount = gift.amount;

        if (gift.tokenAddress == address(0)) {
            // Transfer ETH back
            (bool success, ) = payable(msg.sender).call{value: amount}("");
            require(success, "ETH transfer failed");
        } else {
            // Transfer USDC back
            usdc.safeTransfer(msg.sender, amount);
        }

        emit GiftRefunded(giftId, msg.sender, amount);
    }

    /**
     * @dev Get gift details
     * @param giftId The ID of the gift
     * @return Gift struct
     */
    function getGift(uint256 giftId) external view returns (Gift memory) {
        require(giftId < gifts.length, "Gift does not exist");
        return gifts[giftId];
    }
    
    /**
     * @dev Get expiration time for a gift
     * @param giftId The ID of the gift
     * @return expirationTime Timestamp when gift expires
     */
    function getExpirationTime(uint256 giftId) external view returns (uint256) {
        require(giftId < gifts.length, "Gift does not exist");
        return gifts[giftId].expirationTime;
    }

    /**
     * @dev Get total number of gifts
     * @return Total count
     */
    function getGiftCount() external view returns (uint256) {
        return gifts.length;
    }

    /**
     * @dev Get all gifts for a specific address (sent or received)
     * @param user Address to query
     * @return giftIds Array of gift IDs
     */
    function getGiftsForUser(address user) external view returns (uint256[] memory) {
        uint256 count = 0;
        
        // First pass: count matching gifts
        for (uint256 i = 0; i < gifts.length; i++) {
            if (gifts[i].sender == user || gifts[i].receiver == user) {
                count++;
            }
        }
        
        // Second pass: collect gift IDs
        uint256[] memory giftIds = new uint256[](count);
        uint256 index = 0;
        
        for (uint256 i = 0; i < gifts.length; i++) {
            if (gifts[i].sender == user || gifts[i].receiver == user) {
                giftIds[index] = i;
                index++;
            }
        }
        
        return giftIds;
    }

    /**
     * @dev Check if a gift has expired
     * @param giftId The ID of the gift
     * @return True if expired
     */
    function isExpired(uint256 giftId) external view returns (bool) {
        require(giftId < gifts.length, "Gift does not exist");
        Gift memory gift = gifts[giftId];
        return block.timestamp >= gift.expirationTime;
    }

    /**
     * @dev Create multiple gifts at once (bulk giveaway)
     * @param receivers Array of receiver addresses
     * @param amounts Array of amounts (must match receivers length)
     * @param isETH True if sending ETH, false if sending USDC
     * @param message Personal message for all gifts
     * @param unlockTime Timestamp when gifts become claimable (0 = immediately)
     * @param expirationTime Timestamp when gifts expire (0 = use default 7 days from creation)
     */
    function createBulkGifts(
        address[] memory receivers,
        uint256[] memory amounts,
        bool isETH,
        string memory message,
        uint256 unlockTime,
        uint256 expirationTime
    ) external payable nonReentrant {
        require(receivers.length > 0, "No receivers provided");
        require(receivers.length == amounts.length, "Receivers and amounts length mismatch");
        require(receivers.length <= 100, "Maximum 100 gifts per batch"); // Gas limit protection
        require(bytes(message).length <= MAX_MESSAGE_LENGTH, "Message too long");
        require(unlockTime == 0 || unlockTime >= block.timestamp, "Unlock time must be in the future");
        
        // Validate expiration time
        uint256 finalExpirationTime;
        if (expirationTime == 0) {
            // Use default 7 days from creation
            finalExpirationTime = block.timestamp + DEFAULT_EXPIRY_SECONDS;
        } else {
            // Custom expiration time
            require(expirationTime > block.timestamp, "Expiration time must be in the future");
            uint256 expirationDuration = expirationTime - block.timestamp;
            uint256 minExpiration = MIN_EXPIRATION_HOURS * 60 * 60; // 1 hour in seconds
            uint256 maxExpiration = MAX_EXPIRATION_DAYS * 24 * 60 * 60; // 1 year in seconds
            require(expirationDuration >= minExpiration, "Expiration must be at least 1 hour");
            require(expirationDuration <= maxExpiration, "Expiration cannot exceed 1 year");
            finalExpirationTime = expirationTime;
        }

        uint256 totalAmount = 0;
        address tokenAddress = isETH ? address(0) : address(usdc);
        
        // Calculate total amount needed
        for (uint256 i = 0; i < amounts.length; i++) {
            require(amounts[i] > 0, "Amount must be greater than 0");
            require(receivers[i] != address(0), "Invalid receiver address");
            require(receivers[i] != msg.sender, "Cannot send gift to yourself");
            totalAmount += amounts[i];
        }

        // Handle payment
        if (isETH) {
            require(msg.value == totalAmount, "ETH amount mismatch");
        } else {
            require(msg.value == 0, "Cannot send ETH with USDC");
            usdc.safeTransferFrom(msg.sender, address(this), totalAmount);
        }

        uint256 finalUnlockTime = unlockTime == 0 ? block.timestamp : unlockTime;
        bytes32 directGiftHash = bytes32(0); // Direct gift - no riddle

        // Create all gifts
        for (uint256 i = 0; i < receivers.length; i++) {
            uint256 giftId = gifts.length;
            
            gifts.push(Gift({
                sender: msg.sender,
                receiver: receivers[i],
                riddle: "", // Empty riddle = direct gift
                answerHash: directGiftHash,
                message: message,
                amount: amounts[i],
                tokenAddress: tokenAddress,
                createdAt: block.timestamp,
                unlockTime: finalUnlockTime,
                expirationTime: finalExpirationTime,
                claimed: false
            }));

            emit GiftCreated(
                giftId,
                msg.sender,
                receivers[i],
                "", // Empty riddle
                amounts[i],
                tokenAddress,
                finalUnlockTime
            );
        }
    }

    /**
     * @dev Get total value locked in unclaimed gifts
     * @return totalETH Total ETH locked
     * @return totalUSDC Total USDC locked
     */
    function getTotalValueLocked() external view returns (uint256 totalETH, uint256 totalUSDC) {
        for (uint256 i = 0; i < gifts.length; i++) {
            if (!gifts[i].claimed) {
                if (gifts[i].tokenAddress == address(0)) {
                    totalETH += gifts[i].amount;
                } else {
                    totalUSDC += gifts[i].amount;
                }
            }
        }
    }
}


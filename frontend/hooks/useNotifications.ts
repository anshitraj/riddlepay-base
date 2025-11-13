/**
 * Hook for managing notifications in RiddlePay
 * Integrates with contract events to send timely notifications
 */

import { useEffect, useCallback } from 'react';
import { useWallet } from '@/contexts/WalletContext';
import { useContract } from './useContract';
import {
  sendSmartNotification,
  NotificationType,
  NotificationTemplates,
} from '@/utils/notifications';
import { ethers } from 'ethers';

/**
 * Hook to monitor contract events and send notifications
 */
export function useNotifications() {
  const { address, provider } = useWallet();
  const { contract } = useContract();

  /**
   * Monitor for new airdrops sent to user
   */
  const monitorReceivedAirdrops = useCallback(async () => {
    if (!contract || !address || !provider) return;

    try {
      // Listen for GiftCreated events where receiver is current user
      contract.on('GiftCreated', async (
        giftId: ethers.BigNumberish,
        sender: string,
        receiver: string,
        riddle: string,
        amount: ethers.BigNumberish,
        tokenAddress: string,
        unlockTime: ethers.BigNumberish,
        event: ethers.Log
      ) => {
        // Only notify if this airdrop is for current user
        if (receiver.toLowerCase() === address.toLowerCase()) {
          const amountFormatted = tokenAddress === ethers.ZeroAddress
            ? `${ethers.formatEther(amount)} ETH`
            : `${ethers.formatUnits(amount, 6)} USDC`;

          const hasRiddle = riddle.trim().length > 0;

          await sendSmartNotification(
            NotificationType.AIRDROP_RECEIVED,
            address,
            NotificationTemplates.airdropReceived(sender, amountFormatted, hasRiddle)
          );
        }
      });
    } catch (error) {
      console.error('Error monitoring received airdrops:', error);
    }
  }, [contract, address, provider]);

  /**
   * Monitor for airdrops claimed by user
   */
  const monitorClaimedAirdrops = useCallback(async () => {
    if (!contract || !address || !provider) return;

    try {
      // Listen for GiftClaimed events
      contract.on('GiftClaimed', async (
        giftId: ethers.BigNumberish,
        receiver: string,
        amount: ethers.BigNumberish,
        event: ethers.Log
      ) => {
        // Get gift details to find sender
        try {
          const gift = await contract.getGift(giftId);
          const sender = gift.sender;

          // If current user sent this airdrop, notify them
          if (sender.toLowerCase() === address.toLowerCase()) {
            const amountFormatted = gift.tokenAddress === ethers.ZeroAddress
              ? `${ethers.formatEther(amount)} ETH`
              : `${ethers.formatUnits(amount, 6)} USDC`;

            await sendSmartNotification(
              NotificationType.AIRDROP_CLAIMED,
              address,
              NotificationTemplates.airdropClaimed(receiver, amountFormatted)
            );

            // If it had a riddle, also send riddle solved notification
            if (gift.riddle.trim().length > 0) {
              await sendSmartNotification(
                NotificationType.RIDDLE_SOLVED,
                address,
                NotificationTemplates.riddleSolved(receiver, amountFormatted)
              );
            }
          }
        } catch (error) {
          console.error('Error getting gift details for notification:', error);
        }
      });
    } catch (error) {
      console.error('Error monitoring claimed airdrops:', error);
    }
  }, [contract, address, provider]);

  /**
   * Check for expiring airdrops (24 hours before expiration)
   */
  const checkExpiringAirdrops = useCallback(async () => {
    if (!contract || !address || !provider) return;

    try {
      const userGiftIds = await contract.getGiftsForUser(address);
      const now = Math.floor(Date.now() / 1000);
      const oneDayInSeconds = 24 * 60 * 60;

      for (const giftId of userGiftIds) {
        try {
          const gift = await contract.getGift(giftId);
          
          // Only check unclaimed gifts
          if (gift.claimed) continue;

          const expirationTime = Number(gift.expirationTime);
          if (expirationTime === 0) continue; // No expiration

          const timeUntilExpiration = expirationTime - now;
          
          // If expiring within 24 hours and not yet expired
          if (timeUntilExpiration > 0 && timeUntilExpiration <= oneDayInSeconds) {
            const amountFormatted = gift.tokenAddress === ethers.ZeroAddress
              ? `${ethers.formatEther(gift.amount)} ETH`
              : `${ethers.formatUnits(gift.amount, 6)} USDC`;

            await sendSmartNotification(
              NotificationType.AIRDROP_EXPIRING,
              address,
              NotificationTemplates.airdropExpiring(Number(giftId), amountFormatted)
            );
          }
        } catch (error) {
          console.error(`Error checking gift ${giftId} for expiration:`, error);
        }
      }
    } catch (error) {
      console.error('Error checking expiring airdrops:', error);
    }
  }, [contract, address, provider]);

  // Set up event listeners when contract and address are available
  useEffect(() => {
    if (!contract || !address) return;

    monitorReceivedAirdrops();
    monitorClaimedAirdrops();

    // Check for expiring airdrops every hour
    const expirationCheckInterval = setInterval(() => {
      checkExpiringAirdrops();
    }, 60 * 60 * 1000); // 1 hour

    // Initial check
    checkExpiringAirdrops();

    return () => {
      // Clean up event listeners
      contract.removeAllListeners('GiftCreated');
      contract.removeAllListeners('GiftClaimed');
      clearInterval(expirationCheckInterval);
    };
  }, [contract, address, monitorReceivedAirdrops, monitorClaimedAirdrops, checkExpiringAirdrops]);
}


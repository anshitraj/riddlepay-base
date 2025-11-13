/**
 * Base Mini App Notification Utilities
 * Follows Base Notification Guidelines: https://docs.base.org/mini-apps/featured-guidelines/notification-guidelines
 * 
 * Notifications via Neynar API: https://docs.neynar.com/reference/send-notification
 */

interface NotificationPayload {
  title: string; // Max 32 characters
  body: string; // Max 128 characters
  targetURL: string; // Max 1024 characters, must be on same domain
}

interface NotificationConfig {
  fid?: number; // Farcaster ID
  address?: string; // Wallet address
}

/**
 * Notification types for RiddlePay
 */
export enum NotificationType {
  AIRDROP_RECEIVED = 'airdrop_received',
  AIRDROP_EXPIRING = 'airdrop_expiring',
  AIRDROP_CLAIMED = 'airdrop_claimed',
  RIDDLE_SOLVED = 'riddle_solved',
}

/**
 * Rate limiting: Max 1 notification per 30 seconds, 100 per day
 */
class NotificationRateLimiter {
  private lastNotificationTime: Map<string, number> = new Map();
  private dailyCount: Map<string, number> = new Map();
  private dailyResetTime: Map<string, number> = new Map();

  canSend(userId: string): boolean {
    const now = Date.now();
    const lastTime = this.lastNotificationTime.get(userId) || 0;
    const timeSinceLastNotification = now - lastTime;

    // Check 30-second limit
    if (timeSinceLastNotification < 30000) {
      return false;
    }

    // Check daily limit (100 per day)
    const resetTime = this.dailyResetTime.get(userId) || 0;
    if (now > resetTime) {
      // Reset daily count
      this.dailyCount.set(userId, 0);
      this.dailyResetTime.set(userId, now + 24 * 60 * 60 * 1000); // 24 hours
    }

    const dailyCount = this.dailyCount.get(userId) || 0;
    if (dailyCount >= 100) {
      return false;
    }

    return true;
  }

  recordNotification(userId: string): void {
    const now = Date.now();
    this.lastNotificationTime.set(userId, now);
    const currentCount = this.dailyCount.get(userId) || 0;
    this.dailyCount.set(userId, currentCount + 1);
  }
}

const rateLimiter = new NotificationRateLimiter();

/**
 * Send notification via Neynar API
 * Requires Neynar API key in environment variables
 */
export async function sendNotification(
  type: NotificationType,
  config: NotificationConfig,
  payload: NotificationPayload
): Promise<boolean> {
  // Validate payload lengths per Base guidelines
  if (payload.title.length > 32) {
    console.warn('Notification title exceeds 32 characters:', payload.title);
    return false;
  }

  if (payload.body.length > 128) {
    console.warn('Notification body exceeds 128 characters:', payload.body);
    return false;
  }

  if (payload.targetURL.length > 1024) {
    console.warn('Notification targetURL exceeds 1024 characters:', payload.targetURL);
    return false;
  }

  // Validate targetURL is on same domain
  const appDomain = typeof window !== 'undefined' ? window.location.origin : '';
  if (!payload.targetURL.startsWith(appDomain)) {
    console.warn('Notification targetURL must be on same domain:', payload.targetURL);
    return false;
  }

  // Rate limiting
  const userId = config.fid?.toString() || config.address || 'unknown';
  if (!rateLimiter.canSend(userId)) {
    console.warn('Notification rate limit exceeded for user:', userId);
    return false;
  }

  // Check if Neynar API key is configured
  const neynarApiKey = process.env.NEXT_PUBLIC_NEYNAR_API_KEY;
  if (!neynarApiKey) {
    console.warn('Neynar API key not configured. Notification not sent.');
    return false;
  }

  try {
    // Send notification via Neynar API
    // Documentation: https://docs.neynar.com/reference/send-notification
    const response = await fetch('https://api.neynar.com/v2/farcaster/notification', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api_key': neynarApiKey,
      },
      body: JSON.stringify({
        signer_uuid: config.fid ? undefined : config.address, // Use address if no FID
        fid: config.fid,
        title: payload.title,
        body: payload.body,
        target_url: payload.targetURL,
        type: type,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('Failed to send notification:', error);
      return false;
    }

    // Record notification for rate limiting
    rateLimiter.recordNotification(userId);
    return true;
  } catch (error) {
    console.error('Error sending notification:', error);
    return false;
  }
}

/**
 * Notification templates following Base guidelines
 */
export const NotificationTemplates = {
  /**
   * When user receives a new airdrop
   * Type: Event-driven update
   */
  airdropReceived: (senderAddress: string, amount: string, hasRiddle: boolean): NotificationPayload => ({
    title: hasRiddle ? 'New Riddle Airdrop!' : 'New Airdrop Received',
    body: hasRiddle 
      ? `Solve the riddle to claim ${amount}`
      : `You received ${amount}. Claim now!`,
    targetURL: '/my-gifts',
  }),

  /**
   * When airdrop is about to expire (24 hours before)
   * Type: Alert/warning
   */
  airdropExpiring: (giftId: number, amount: string): NotificationPayload => ({
    title: 'Airdrop Expiring Soon',
    body: `Claim ${amount} before it expires`,
    targetURL: `/claim?giftId=${giftId}`,
  }),

  /**
   * When someone claims your airdrop
   * Type: Event-driven update
   */
  airdropClaimed: (receiverAddress: string, amount: string): NotificationPayload => ({
    title: 'Airdrop Claimed!',
    body: `${receiverAddress.slice(0, 6)}... claimed ${amount}`,
    targetURL: '/my-gifts',
  }),

  /**
   * When someone solves your riddle correctly
   * Type: Event-driven update
   */
  riddleSolved: (receiverAddress: string, amount: string): NotificationPayload => ({
    title: 'Riddle Solved!',
    body: `Someone solved your riddle and claimed ${amount}`,
    targetURL: '/my-gifts',
  }),
};

/**
 * Helper to get user FID from address (if available)
 */
export async function getUserFID(address: string): Promise<number | null> {
  // In Base App, FID might be available from context
  if (typeof window !== 'undefined' && (window as any).farcaster?.user?.fid) {
    return (window as any).farcaster.user.fid;
  }

  // Fallback: Could query Farcaster API by address
  // For now, return null and use address-based notifications
  return null;
}

/**
 * Smart notification sender that follows best practices
 */
export async function sendSmartNotification(
  type: NotificationType,
  address: string,
  template: NotificationPayload
): Promise<boolean> {
  // Get FID if available
  const fid = await getUserFID(address);

  // Send notification
  return await sendNotification(
    type,
    { fid: fid || undefined, address },
    template
  );
}


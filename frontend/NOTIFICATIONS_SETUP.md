# Notification Setup Guide

RiddlePay implements Base Mini App Notification Guidelines for user re-engagement and retention.

## Overview

Notifications are sent for key moments:
- **Airdrop Received**: When user receives a new airdrop (with or without riddle)
- **Airdrop Expiring**: 24 hours before expiration (time-sensitive alert)
- **Airdrop Claimed**: When someone claims your airdrop
- **Riddle Solved**: When someone solves your riddle correctly

## Setup

### 1. Get Neynar API Key

1. Sign up at [Neynar](https://neynar.com)
2. Create an API key
3. Add to `.env.local`:

```env
NEXT_PUBLIC_NEYNAR_API_KEY=your_neynar_api_key_here
```

### 2. Notification Guidelines Compliance

All notifications follow Base guidelines:

- **Title**: Max 32 characters, clear statement
- **Body**: Max 128 characters, supporting detail
- **targetURL**: Max 1024 characters, same domain only
- **Rate Limiting**: Max 1 per 30 seconds, 100 per day
- **Timing**: Sent at relevant moments, not off-hours

### 3. Notification Types

#### Event-Driven Updates
- New airdrop received
- Airdrop claimed by recipient
- Riddle solved successfully

#### Alerts/Warnings
- Airdrop expiring soon (24-hour warning)

### 4. Best Practices

✅ **Do:**
- Send notifications for meaningful events
- Keep messages short and clear
- Use appropriate timing
- Monitor analytics and adjust

❌ **Don't:**
- Send generic nudges ("Open the app today!")
- Send unnecessary confirmations ("You liked a post")
- Exceed rate limits
- Send during off-hours

## Implementation

Notifications are automatically enabled when:
- User is connected via wallet
- Neynar API key is configured
- Rate limits are respected

The `useNotifications` hook monitors contract events and sends notifications accordingly.

## Testing

To test notifications:
1. Ensure `NEXT_PUBLIC_NEYNAR_API_KEY` is set
2. Connect wallet
3. Send/receive airdrops
4. Check Base App for notifications

## Rate Limiting

The system enforces:
- **30-second cooldown**: Between notifications to same user
- **100 per day limit**: Maximum notifications per user per day
- **Automatic reset**: Daily limits reset every 24 hours

## Analytics

Monitor notification effectiveness:
- Click-through rates
- Disabled notification rates
- User engagement metrics

Adjust content, timing, or cadence based on analytics.


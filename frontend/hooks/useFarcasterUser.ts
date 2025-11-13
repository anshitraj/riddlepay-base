'use client';

import { useState, useEffect } from 'react';

interface FarcasterUser {
  username: string | null;
  avatar: string | null;
  displayName: string | null;
}

/**
 * Hook to fetch Farcaster user data by address
 * In Base App, we can access Farcaster context if available
 */
export function useFarcasterUser(address: string | null): FarcasterUser {
  const [userData, setUserData] = useState<FarcasterUser>({
    username: null,
    avatar: null,
    displayName: null,
  });

  useEffect(() => {
    if (!address) {
      setUserData({ username: null, avatar: null, displayName: null });
      return;
    }

    // Check if we're in Base App/Farcaster context
    const farcasterContext = (window as any).farcaster;
    
    if (farcasterContext?.user) {
      // Use Farcaster context if available
      setUserData({
        username: farcasterContext.user.username || null,
        avatar: farcasterContext.user.pfp?.url || null,
        displayName: farcasterContext.user.displayName || null,
      });
      return;
    }

    // Fallback: Try to fetch from Farcaster API (requires API key)
    // For now, we'll use a placeholder approach
    // In production, you'd use Farcaster API: https://docs.farcaster.xyz/reference/api
    const fetchUserData = async () => {
      try {
        // Example: Using Farcaster API (you'll need to set up API key)
        // const response = await fetch(`https://api.farcaster.xyz/v2/user-by-address?address=${address}`);
        // const data = await response.json();
        // if (data.result?.user) {
        //   setUserData({
        //     username: data.result.user.username,
        //     avatar: data.result.user.pfp?.url,
        //     displayName: data.result.user.displayName,
        //   });
        // }
        
        // For now, return null to show address fallback
        setUserData({ username: null, avatar: null, displayName: null });
      } catch (error) {
        console.error('Error fetching Farcaster user:', error);
        setUserData({ username: null, avatar: null, displayName: null });
      }
    };

    fetchUserData();
  }, [address]);

  return userData;
}


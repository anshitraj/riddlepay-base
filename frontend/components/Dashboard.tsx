'use client';

import { useState, useEffect } from 'react';
import { useContract } from '@/hooks/useContract';
import { useWallet } from '@/contexts/WalletContext';
import { motion } from 'framer-motion';
import { Gift, TrendingUp, Users, DollarSign, Clock } from 'lucide-react';
import Link from 'next/link';
import { formatAmount } from '@/utils/formatAmount';

export default function Dashboard() {
  const { address } = useWallet();
  const { getGiftCount, getTotalValueLocked, getGiftsForUser, getGift } = useContract();
  const [stats, setStats] = useState({
    totalGifts: 0,
    totalValueETH: '0',
    totalValueUSDC: '0',
    userGiftsSent: 0,
    userGiftsReceived: 0,
  });
  const [loading, setLoading] = useState(true);
  const [recentGifts, setRecentGifts] = useState<any[]>([]);

  useEffect(() => {
    const loadStats = async () => {
      setLoading(true);
      try {
        const [totalGifts, valueLocked, userGiftIds] = await Promise.all([
          getGiftCount(),
          getTotalValueLocked(),
          address ? getGiftsForUser(address) : Promise.resolve([]),
        ]);

        // Get user's gifts
        let userSent = 0;
        let userReceived = 0;
        const giftPromises = userGiftIds.slice(0, 5).map(async (id) => {
          try {
            const gift = await getGift(id);
            return { gift, id };
          } catch {
            return null;
          }
        });
        const userGifts = await Promise.all(giftPromises);
        
        userGifts.forEach((item) => {
          if (!item) return;
          const { gift } = item;
          if (gift.sender.toLowerCase() === address?.toLowerCase()) {
            userSent++;
          }
          if (gift.receiver.toLowerCase() === address?.toLowerCase()) {
            userReceived++;
          }
        });

        setRecentGifts(userGifts.filter(g => g !== null).slice(0, 5) as Array<{ gift: any; id: number }>);
        setStats({
          totalGifts,
          totalValueETH: parseFloat(valueLocked.totalETH).toFixed(4),
          totalValueUSDC: parseFloat(valueLocked.totalUSDC).toFixed(2),
          userGiftsSent: userSent,
          userGiftsReceived: userReceived,
        });
      } catch (err) {
        console.error('Error loading stats:', err);
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, [address, getGiftCount, getTotalValueLocked, getGiftsForUser, getGift]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-baseLight/50 rounded-2xl p-6 border border-baseBlue/20 animate-pulse">
            <div className="h-8 dark:bg-gray-700 bg-gray-300 rounded w-1/2 mb-4"></div>
            <div className="h-12 dark:bg-gray-700 bg-gray-300 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="mb-12">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <motion.div
          className="bg-baseLight/50 dark:bg-white/90 rounded-2xl p-6 border border-baseBlue/20 dark:border-gray-300/50 shadow-lg"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-blue-500/20 rounded-xl">
              <Gift className="w-6 h-6 text-blue-400" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-white dark:text-gray-900 mb-1">
            {stats.totalGifts}
          </h3>
          <p className="text-sm text-gray-400 dark:text-gray-600">Total Gifts</p>
        </motion.div>

        <motion.div
          className="bg-baseLight/50 dark:bg-white/90 rounded-2xl p-6 border border-baseBlue/20 dark:border-gray-300/50 shadow-lg"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-green-500/20 rounded-xl">
              <DollarSign className="w-6 h-6 text-green-400" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-white dark:text-gray-900 mb-1">
            {stats.totalValueETH} ETH
          </h3>
          <p className="text-sm text-gray-400 dark:text-gray-600">Value Locked (ETH)</p>
        </motion.div>

        <motion.div
          className="bg-baseLight/50 dark:bg-white/90 rounded-2xl p-6 border border-baseBlue/20 dark:border-gray-300/50 shadow-lg"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-purple-500/20 rounded-xl">
              <DollarSign className="w-6 h-6 text-purple-400" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-white dark:text-gray-900 mb-1">
            {stats.totalValueUSDC} USDC
          </h3>
          <p className="text-sm text-gray-400 dark:text-gray-600">Value Locked (USDC)</p>
        </motion.div>

        {address && (
          <motion.div
            className="bg-baseLight/50 dark:bg-white/90 rounded-2xl p-6 border border-baseBlue/20 dark:border-gray-300/50 shadow-lg"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.3 }}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-yellow-500/20 rounded-xl">
                <Users className="w-6 h-6 text-yellow-400" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-white dark:text-gray-900 mb-1">
              {stats.userGiftsSent + stats.userGiftsReceived}
            </h3>
            <p className="text-sm text-gray-400 dark:text-gray-600">Your Gifts</p>
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
              {stats.userGiftsSent} sent • {stats.userGiftsReceived} received
            </p>
          </motion.div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Link href="/">
          <motion.div
            className="bg-baseLight/50 dark:bg-white/90 rounded-2xl p-6 border border-baseBlue/20 dark:border-gray-300/50 shadow-lg hover:border-baseBlue/50 dark:hover:border-blue-400/50 transition-all cursor-pointer"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="flex items-center gap-4">
              <div className="p-4 bg-base-gradient rounded-xl">
                <Gift className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white dark:text-gray-900">Send Gift</h3>
                <p className="text-sm text-gray-400 dark:text-gray-600">Create a new gift</p>
              </div>
            </div>
          </motion.div>
        </Link>

        <Link href="/bulk-giveaway">
          <motion.div
            className="bg-baseLight/50 dark:bg-white/90 rounded-2xl p-6 border border-baseBlue/20 dark:border-gray-300/50 shadow-lg hover:border-baseBlue/50 dark:hover:border-blue-400/50 transition-all cursor-pointer"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="flex items-center gap-4">
              <div className="p-4 bg-purple-500 rounded-xl">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white dark:text-gray-900">Bulk Giveaway</h3>
                <p className="text-sm text-gray-400 dark:text-gray-600">Send to multiple winners</p>
              </div>
            </div>
          </motion.div>
        </Link>

        <Link href="/my-gifts">
          <motion.div
            className="bg-baseLight/50 dark:bg-white/90 rounded-2xl p-6 border border-baseBlue/20 dark:border-gray-300/50 shadow-lg hover:border-baseBlue/50 dark:hover:border-blue-400/50 transition-all cursor-pointer"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="flex items-center gap-4">
              <div className="p-4 bg-green-500 rounded-xl">
                <Clock className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white dark:text-gray-900">My Gifts</h3>
                <p className="text-sm text-gray-400 dark:text-gray-600">View all your gifts</p>
              </div>
            </div>
          </motion.div>
        </Link>
      </div>

      {/* Recent Gifts */}
      {address && recentGifts.length > 0 && (
        <motion.div
          className="bg-baseLight/50 dark:bg-white/90 rounded-2xl p-6 border border-baseBlue/20 dark:border-gray-300/50 shadow-lg"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.4 }}
        >
          <h3 className="text-xl font-bold text-white dark:text-gray-900 mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-400" />
            Recent Gifts
          </h3>
          <div className="space-y-3">
            {recentGifts.map((item, idx) => {
              const { gift, id } = item;
              return (
              <Link key={idx} href={`/claim?giftId=${id}`}>
                <div className="p-4 glass rounded-xl border border-border hover:border-baseBlue/50 transition-all cursor-pointer group">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold dark:text-white text-gray-900 group-hover:dark:text-blue-400 group-hover:text-blue-600 transition-colors">
                        {gift.riddle && gift.riddle.trim() ? (
                          <span className="text-blue-400 dark:text-blue-400">🎯 Riddle Gift</span>
                        ) : (
                          <span className="text-green-500 dark:text-green-400">🎁 Direct Gift</span>
                        )}
                      </p>
                      <p className="text-sm dark:text-gray-400 text-gray-600">
                        {formatAmount(gift.amount, gift.tokenAddress)}
                        {gift.claimed && ' • Claimed'}
                      </p>
                    </div>
                    <span className="text-xs dark:text-gray-500 text-gray-500">
                      {new Date(Number(gift.createdAt) * 1000).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </Link>
            )})}
          </div>
        </motion.div>
      )}
    </div>
  );
}


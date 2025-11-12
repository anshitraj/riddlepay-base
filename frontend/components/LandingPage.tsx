'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Gift, Sparkles, Users, Clock, Zap, ChevronLeft, ChevronRight } from 'lucide-react';
import { useWallet } from '@/contexts/WalletContext';
import WalletConnect from './WalletConnect';
import RiddlePayLogo from './RiddlePayLogo';

interface LandingPageProps {
  onLaunchDApp: () => void;
}

const riddleExamples = [
  {
    title: 'Secret Gift',
    subtitle: 'Solve to Unlock',
    riddle: '"I hold value but no weight. What am I?"',
    icon: Gift,
  },
  {
    title: 'Mystery Reward',
    subtitle: 'Claim with Clues',
    riddle: '"I can be saved but never spent. What am I?"',
    icon: Sparkles,
  },
  {
    title: 'Encrypted Airdrop',
    subtitle: 'Crack the Code',
    riddle: '"The more you share me, the less I become. What am I?"',
    icon: Clock,
  },
];

export default function LandingPage({ onLaunchDApp }: LandingPageProps) {
  const { isConnected, connect } = useWallet();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  const handleLaunchDApp = async () => {
    if (!isConnected) {
      try {
        await connect();
        // Small delay to ensure wallet connection is processed
        setTimeout(() => {
          onLaunchDApp();
        }, 500);
      } catch (error) {
        console.error('Failed to connect wallet:', error);
      }
    } else {
      // Already connected, just show dashboard
      onLaunchDApp();
    }
  };

  // Auto-show dashboard when wallet connects
  React.useEffect(() => {
    if (isConnected) {
      onLaunchDApp();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isConnected]);

  // Auto-play slider
  useEffect(() => {
    if (!isAutoPlaying) return;
    
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % riddleExamples.length);
    }, 4000); // Change slide every 4 seconds

    return () => clearInterval(interval);
  }, [isAutoPlaying]);

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
    setIsAutoPlaying(false); // Stop auto-play when user manually navigates
    // Resume auto-play after 10 seconds
    setTimeout(() => setIsAutoPlaying(true), 10000);
  };

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % riddleExamples.length);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 10000);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + riddleExamples.length) % riddleExamples.length);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 10000);
  };

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden" data-theme="dark">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>
      </div>

      {/* Header */}
      <header className="relative z-10 border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <RiddlePayLogo size={40} showText={true} />
            <div className="flex items-center gap-4">
              <div className="px-4 py-2 bg-gray-900 border border-gray-800 rounded-lg text-sm text-gray-400">
                — RiddlePay Enterprise
              </div>
              <div className="[&_button]:bg-white [&_button]:text-black [&_button]:hover:bg-gray-100">
                <WalletConnect />
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10">
        <div className="max-w-7xl mx-auto px-6 py-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left Side - Hero Text */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="space-y-8"
            >
              <div className="space-y-4">
                <h2 className="text-6xl lg:text-7xl font-bold leading-tight">
                  <span className="text-white">Unlock the Future of</span>
                  <br />
                  <span className="bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent">
                    Crypto Gifting
                  </span>
                </h2>
                <p className="text-xl text-gray-400 leading-relaxed max-w-lg font-medium">
                  With Riddles, Mystery & Rewards.
                </p>
                <p className="text-lg text-gray-400 leading-relaxed max-w-lg">
                  Transform ordinary airdrops into interactive experiences. Recipients must solve a riddle to unlock their crypto reward — making every claim secure, fun, and unforgettable.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <motion.button
                  onClick={handleLaunchDApp}
                  className="px-8 py-4 bg-white text-black font-bold rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-white/20 flex items-center gap-2 group min-h-[52px] touch-manipulation"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <span>Launch App</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </motion.button>
                <motion.button
                  onClick={() => {
                    const element = document.getElementById('how-it-works');
                    element?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="px-8 py-4 bg-gray-900 border border-gray-800 text-white font-bold rounded-xl transition-all duration-300 hover:scale-105 hover:border-gray-700 flex items-center gap-2 group min-h-[52px] touch-manipulation"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <span>How It Works</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </motion.button>
              </div>
            </motion.div>

            {/* Right Side - Visual Element with Slider */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="flex flex-col items-center justify-center space-y-6 relative"
            >
              <div className="text-center space-y-4 w-full max-w-sm">
                <p className="text-sm uppercase tracking-wider text-gray-500">IMAGINE SENDING...</p>
                
                {/* Slider Container */}
                <div className="relative h-80 flex items-center justify-center">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={currentSlide}
                      initial={{ opacity: 0, x: 50, scale: 0.9 }}
                      animate={{ opacity: 1, x: 0, scale: 1 }}
                      exit={{ opacity: 0, x: -50, scale: 0.9 }}
                      transition={{ duration: 0.5 }}
                      className="absolute inset-0 flex flex-col items-center justify-center space-y-4"
                    >
                      {/* Icon */}
                      <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-2xl shadow-blue-500/50">
                        {React.createElement(riddleExamples[currentSlide].icon, {
                          className: 'w-16 h-16 text-white',
                        })}
                      </div>
                      
                      {/* Title and Subtitle */}
                      <div className="space-y-2">
                        <p className="text-xl font-bold text-white">
                          {riddleExamples[currentSlide].title}
                        </p>
                        <p className="text-sm text-gray-400">
                          {riddleExamples[currentSlide].subtitle}
                        </p>
                      </div>
                      
                      {/* Riddle Box */}
                      <div className="mt-6 p-6 bg-gray-900 border border-gray-800 rounded-xl w-full">
                        <p className="text-gray-300 italic text-sm sm:text-base mb-2">
                          {riddleExamples[currentSlide].riddle}
                        </p>
                        <p className="text-xs text-gray-500 mt-3 pt-3 border-t border-gray-800">
                          Interactive, on-chain riddles for real crypto.
                        </p>
                      </div>
                    </motion.div>
                  </AnimatePresence>

                  {/* Navigation Arrows */}
                  <button
                    onClick={prevSlide}
                    className="absolute left-0 p-2 rounded-full bg-gray-900/80 border border-gray-800 hover:bg-gray-800 transition-all duration-200 hover:scale-110 z-10"
                    aria-label="Previous slide"
                  >
                    <ChevronLeft className="w-5 h-5 text-white" />
                  </button>
                  <button
                    onClick={nextSlide}
                    className="absolute right-0 p-2 rounded-full bg-gray-900/80 border border-gray-800 hover:bg-gray-800 transition-all duration-200 hover:scale-110 z-10"
                    aria-label="Next slide"
                  >
                    <ChevronRight className="w-5 h-5 text-white" />
                  </button>
                </div>

                {/* Dots Indicator */}
                <div className="flex gap-2 justify-center items-center pt-4">
                  {riddleExamples.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => goToSlide(index)}
                      className={`transition-all duration-300 rounded-full ${
                        index === currentSlide
                          ? 'w-8 h-2 bg-blue-500'
                          : 'w-2 h-2 bg-gray-700 hover:bg-gray-600'
                      }`}
                      aria-label={`Go to slide ${index + 1}`}
                    />
                  ))}
                </div>
              </div>
            </motion.div>
          </div>

          {/* Features Section */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mt-32 grid grid-cols-1 md:grid-cols-3 gap-8"
          >
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <div className="w-16 h-16 rounded-full bg-gray-900 border border-gray-800 flex items-center justify-center">
                  <Clock className="w-8 h-8 text-blue-500" />
                </div>
              </div>
              <h3 className="text-xl font-bold text-white">Always On</h3>
              <p className="text-gray-400">Available across all time zones, every day.</p>
            </div>

            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <div className="w-16 h-16 rounded-full bg-gray-900 border border-gray-800 flex items-center justify-center">
                  <Sparkles className="w-8 h-8 text-blue-500" />
                </div>
              </div>
              <h3 className="text-xl font-bold text-white">Unlimited Airdrops</h3>
              <p className="text-gray-400">No limits. Send, claim, and engage endlessly.</p>
            </div>

            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <div className="w-16 h-16 rounded-full bg-gray-900 border border-gray-800 flex items-center justify-center">
                  <Zap className="w-8 h-8 text-blue-500" />
                </div>
              </div>
              <h3 className="text-xl font-bold text-white">Smart & Secure</h3>
              <p className="text-gray-400">Built on Base for speed, transparency, and low fees.</p>
            </div>
          </motion.div>

          {/* How It Works Section */}
          <motion.div
            id="how-it-works"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="mt-32 max-w-4xl mx-auto space-y-8"
          >
            <h3 className="text-4xl font-bold text-white text-center mb-8">How It Works</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-6 bg-gray-900/50 border border-gray-800 rounded-xl">
                <div className="flex items-start gap-4">
                  <div className="text-3xl font-bold text-blue-500 flex-shrink-0">1️⃣</div>
                  <div>
                    <h4 className="text-lg font-bold text-white mb-2">Create a Secret Airdrop</h4>
                    <p className="text-gray-400">Enter the recipient's wallet and amount.</p>
                  </div>
                </div>
              </div>
              <div className="p-6 bg-gray-900/50 border border-gray-800 rounded-xl">
                <div className="flex items-start gap-4">
                  <div className="text-3xl font-bold text-blue-500 flex-shrink-0">2️⃣</div>
                  <div>
                    <h4 className="text-lg font-bold text-white mb-2">Add a Riddle or Message</h4>
                    <p className="text-gray-400">Make it fun or meaningful.</p>
                  </div>
                </div>
              </div>
              <div className="p-6 bg-gray-900/50 border border-gray-800 rounded-xl">
                <div className="flex items-start gap-4">
                  <div className="text-3xl font-bold text-blue-500 flex-shrink-0">3️⃣</div>
                  <div>
                    <h4 className="text-lg font-bold text-white mb-2">Send Securely on Base</h4>
                    <p className="text-gray-400">The gift is encrypted and stored on-chain.</p>
                  </div>
                </div>
              </div>
              <div className="p-6 bg-gray-900/50 border border-gray-800 rounded-xl">
                <div className="flex items-start gap-4">
                  <div className="text-3xl font-bold text-blue-500 flex-shrink-0">4️⃣</div>
                  <div>
                    <h4 className="text-lg font-bold text-white mb-2">Claim & Reveal</h4>
                    <p className="text-gray-400">The receiver solves the riddle to unlock their reward.</p>
                  </div>
                </div>
              </div>
            </div>
            <p className="text-center text-gray-400 mt-6">
              Simple, secure, and powered by <span className="text-white font-semibold">Riddle Pay</span>.
            </p>
          </motion.div>

          {/* Final CTA Section */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.8 }}
            className="mt-20 max-w-2xl mx-auto text-center space-y-6"
          >
            <h3 className="text-3xl md:text-4xl font-bold text-white">
              Ready to Send Your First Secret Gift?
            </h3>
            <p className="text-lg text-gray-400">
              Create, encrypt, and share your crypto gifts in seconds.
            </p>
            <motion.button
              onClick={handleLaunchDApp}
              className="px-8 py-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-bold rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-blue-500/50 flex items-center gap-2 group mx-auto min-h-[52px] touch-manipulation"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <span>Launch App</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </motion.button>
          </motion.div>
        </div>
      </main>

      {/* Footer with Base Branding */}
      <footer className="relative z-10 border-t border-gray-800 mt-20">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.8 }}
            className="flex flex-col items-center justify-center gap-3"
          >
            <div className="flex items-center gap-3">
              <span className="text-gray-500 text-sm">Powered by</span>
              {/* Base Logo - Blue square with rounded corners */}
              <div className="w-7 h-7 bg-[#0052FF] rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/30">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect width="20" height="20" rx="4" fill="#0052FF"/>
                </svg>
              </div>
              <span className="text-white font-semibold text-base">Base</span>
            </div>
            <p className="text-xs text-gray-600 text-center max-w-md">
              Built on Base, the secure, low-cost, developer-friendly Ethereum L2 blockchain
            </p>
          </motion.div>
        </div>
      </footer>
    </div>
  );
}


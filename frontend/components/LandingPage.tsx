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
  const { isConnected, connect, isConnecting, isInMiniApp } = useWallet();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [showLoginDialog, setShowLoginDialog] = useState(false);

  const handleLaunchDApp = async () => {
    if (!isConnected) {
      // Show login dialog
      setShowLoginDialog(true);
    } else {
      // Already connected, just show dashboard
      onLaunchDApp();
    }
  };

  const handleLogin = async () => {
    try {
      await connect();
      // Small delay to ensure wallet connection is processed
      setTimeout(() => {
        setShowLoginDialog(false);
        onLaunchDApp();
      }, 500);
    } catch (error) {
      console.error('Failed to connect:', error);
    }
  };

  // Don't auto-show dashboard - let user manually click connect buttons
  // The handleLoginWithFarcaster and handleLoginWithBase functions will handle redirect

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
    <div className="min-h-screen bg-black dark:bg-black bg-gray-50 dark:bg-black text-white dark:text-white text-gray-900 dark:text-white relative overflow-hidden">
      {/* Background Effects - Gradient Background Section */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Hero Gradient Background */}
        <div className="absolute top-[-200px] left-1/2 w-[600px] h-[600px] bg-gradient-to-r from-blue-600/30 to-purple-600/30 dark:from-blue-600/30 dark:to-purple-600/30 rounded-full blur-[160px] -translate-x-1/2"></div>
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>
      </div>

      {/* Header - Improved Navigation Bar */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-black/20 dark:bg-black/20 bg-white/80 dark:bg-black/20 border-b border-white/5 dark:border-white/5 border-gray-200/50 dark:border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center">
              <RiddlePayLogo size={72} showText={false} />
            </div>
            <div className="flex items-center gap-3 sm:gap-4">
              <WalletConnect />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-16 lg:py-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            {/* Left Side - Hero Text */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="space-y-6 sm:space-y-8 text-center lg:text-left"
            >
              <div className="space-y-3 sm:space-y-4 relative">
                {/* Soft glow behind heading */}
                <div className="absolute -inset-4 bg-gradient-to-r from-blue-500/20 to-purple-500/20 dark:from-blue-500/20 dark:to-purple-500/20 blur-2xl -z-10"></div>
                <h2 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold leading-tight tracking-tight relative">
                  <span className="text-white dark:text-white text-gray-900 dark:text-white">Unlock the Future of</span>
                  <br />
                  <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-blue-500 dark:from-blue-400 dark:via-purple-400 dark:to-blue-500 from-blue-600 via-purple-600 to-blue-700 dark:from-blue-400 dark:via-purple-400 dark:to-blue-500 bg-clip-text text-transparent">
                    Crypto Gifting
                  </span>
                </h2>
                <p className="text-lg sm:text-xl text-gray-400 dark:text-gray-400 text-gray-600 dark:text-gray-400 leading-relaxed max-w-lg mx-auto lg:mx-0 font-medium">
                  With Riddles, Mystery & Rewards.
                </p>
                <p className="text-base sm:text-lg text-gray-400 dark:text-gray-400 text-gray-600 dark:text-gray-400 leading-relaxed max-w-lg mx-auto lg:mx-0">
                  Transform ordinary airdrops into interactive experiences. Recipients must solve a riddle to unlock their crypto reward — making every claim secure, fun, and unforgettable.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center lg:justify-start">
                {/* Launch App Button - Glassy with Glow */}
                <motion.button
                  onClick={handleLaunchDApp}
                  className="relative px-6 py-3 bg-white/10 dark:bg-white/10 bg-gray-900/10 dark:bg-white/10 backdrop-blur-md border border-white/10 dark:border-white/10 border-gray-200/20 dark:border-white/10 text-white dark:text-white text-gray-900 dark:text-white font-bold rounded-2xl transition-all duration-200 hover:scale-[1.03] hover:bg-white/20 dark:hover:bg-white/20 shadow-[0_4px_20px_rgba(0,0,0,0.25)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.25)] flex items-center justify-center gap-3 group min-h-[52px] touch-manipulation text-sm sm:text-base"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {/* Light glow behind button */}
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-500/30 to-purple-500/30 dark:from-blue-500/30 dark:to-purple-500/30 blur-xl -z-10"></div>
                  <span>Launch App</span>
                  <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform" />
                </motion.button>
                {/* How It Works Button - Glassy */}
                <motion.button
                  onClick={() => {
                    const element = document.getElementById('how-it-works');
                    element?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="relative px-6 py-3 bg-white/10 dark:bg-white/10 bg-gray-900/10 dark:bg-white/10 backdrop-blur-md border border-white/10 dark:border-white/10 border-gray-200/20 dark:border-white/10 text-white dark:text-white text-gray-900 dark:text-white font-bold rounded-2xl transition-all duration-200 hover:scale-[1.03] hover:bg-white/20 dark:hover:bg-white/20 shadow-lg dark:shadow-lg flex items-center justify-center gap-3 group min-h-[52px] touch-manipulation text-sm sm:text-base"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <span>How It Works</span>
                  <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform" />
                </motion.button>
              </div>
            </motion.div>

            {/* Right Side - Visual Element with Slider */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
              className="flex flex-col items-center justify-center space-y-4 sm:space-y-6 relative mt-8 lg:mt-0"
            >
              <div className="text-center space-y-3 sm:space-y-4 w-full max-w-sm mx-auto">
                <p className="text-xs sm:text-sm uppercase tracking-wider text-gray-500 dark:text-gray-500 text-gray-600 dark:text-gray-500">IMAGINE SENDING...</p>
                
                {/* Slider Container */}
                <div className="relative h-64 sm:h-72 md:h-80 flex items-center justify-center">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={currentSlide}
                      initial={{ opacity: 0, x: 50, scale: 0.9 }}
                      animate={{ opacity: 1, x: 0, scale: 1 }}
                      exit={{ opacity: 0, x: -50, scale: 0.9 }}
                      transition={{ duration: 0.5 }}
                      className="absolute inset-0 flex flex-col items-center justify-center space-y-4"
                    >
                      {/* Icon - Glassy */}
                      <div className="w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 dark:from-blue-500 dark:to-blue-600 flex items-center justify-center shadow-2xl shadow-blue-500/50 dark:shadow-blue-500/50 backdrop-blur-md border border-white/10 dark:border-white/10">
                        {React.createElement(riddleExamples[currentSlide].icon, {
                          className: 'w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 text-white dark:text-white',
                        })}
                      </div>
                      
                      {/* Title and Subtitle */}
                      <div className="space-y-1 sm:space-y-2">
                        <p className="text-lg sm:text-xl font-bold text-white dark:text-white text-gray-900 dark:text-white">
                          {riddleExamples[currentSlide].title}
                        </p>
                        <p className="text-xs sm:text-sm text-gray-400 dark:text-gray-400 text-gray-600 dark:text-gray-400">
                          {riddleExamples[currentSlide].subtitle}
                        </p>
                      </div>
                      
                      {/* Riddle Box */}
                      <div className="mt-4 sm:mt-6 p-4 sm:p-6 bg-gray-900 dark:bg-gray-900 bg-white dark:bg-gray-900 border border-gray-800 dark:border-gray-800 border-gray-200 dark:border-gray-800 rounded-xl w-full">
                        <p className="text-gray-300 dark:text-gray-300 text-gray-700 dark:text-gray-300 italic text-xs sm:text-sm md:text-base mb-2">
                          {riddleExamples[currentSlide].riddle}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-500 text-gray-600 dark:text-gray-500 mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-gray-800 dark:border-gray-800 border-gray-200 dark:border-gray-800">
                          Interactive, on-chain riddles for real crypto.
                        </p>
                      </div>
                    </motion.div>
                  </AnimatePresence>

                  {/* Navigation Arrows - Glassy */}
                  <button
                    onClick={prevSlide}
                    className="absolute left-0 sm:-left-2 p-2 rounded-full bg-white/10 dark:bg-white/10 bg-gray-900/80 dark:bg-gray-900/80 backdrop-blur-md border border-white/10 dark:border-white/10 border-gray-200/20 dark:border-gray-800 hover:bg-white/20 dark:hover:bg-gray-800 transition-all duration-200 hover:scale-110 z-10 min-w-[44px] min-h-[44px] flex items-center justify-center touch-manipulation"
                    aria-label="Previous slide"
                  >
                    <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 text-white dark:text-white text-gray-900 dark:text-white" />
                  </button>
                  <button
                    onClick={nextSlide}
                    className="absolute right-0 sm:-right-2 p-2 rounded-full bg-white/10 dark:bg-white/10 bg-gray-900/80 dark:bg-gray-900/80 backdrop-blur-md border border-white/10 dark:border-white/10 border-gray-200/20 dark:border-gray-800 hover:bg-white/20 dark:hover:bg-gray-800 transition-all duration-200 hover:scale-110 z-10 min-w-[44px] min-h-[44px] flex items-center justify-center touch-manipulation"
                    aria-label="Next slide"
                  >
                    <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-white dark:text-white text-gray-900 dark:text-white" />
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

          {/* Features Section - Better Spacing */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="mt-28 sm:mt-32 md:mt-40 grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8"
          >
            <motion.div 
              className="text-center space-y-4"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
            >
              <div className="flex justify-center">
                <div className="w-16 h-16 rounded-full bg-white/10 dark:bg-white/10 bg-gray-900/50 dark:bg-white/10 backdrop-blur-md border border-white/10 dark:border-white/10 border-gray-200/20 dark:border-white/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Clock className="w-8 h-8 text-blue-500 dark:text-blue-500 group-hover:animate-pulse" />
                </div>
              </div>
              <h3 className="text-xl font-bold text-white dark:text-white text-gray-900 dark:text-white">Always On</h3>
              <p className="text-gray-400 dark:text-gray-400 text-gray-600 dark:text-gray-400">Available across all time zones, every day.</p>
            </motion.div>

            <motion.div 
              className="text-center space-y-4"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
            >
              <div className="flex justify-center">
                <div className="w-16 h-16 rounded-full bg-white/10 dark:bg-white/10 bg-gray-900/50 dark:bg-white/10 backdrop-blur-md border border-white/10 dark:border-white/10 border-gray-200/20 dark:border-white/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Sparkles className="w-8 h-8 text-blue-500 dark:text-blue-500 group-hover:animate-pulse" />
                </div>
              </div>
              <h3 className="text-xl font-bold text-white dark:text-white text-gray-900 dark:text-white">Unlimited Airdrops</h3>
              <p className="text-gray-400 dark:text-gray-400 text-gray-600 dark:text-gray-400">No limits. Send, claim, and engage endlessly.</p>
            </motion.div>

            <motion.div 
              className="text-center space-y-4"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" }}
            >
              <div className="flex justify-center">
                <div className="w-16 h-16 rounded-full bg-white/10 dark:bg-white/10 bg-gray-900/50 dark:bg-white/10 backdrop-blur-md border border-white/10 dark:border-white/10 border-gray-200/20 dark:border-white/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Zap className="w-8 h-8 text-blue-500 dark:text-blue-500 group-hover:animate-pulse" />
                </div>
              </div>
              <h3 className="text-xl font-bold text-white dark:text-white text-gray-900 dark:text-white">Smart & Secure</h3>
              <p className="text-gray-400 dark:text-gray-400 text-gray-600 dark:text-gray-400">Built on Base for speed, transparency, and low fees.</p>
            </motion.div>
          </motion.div>

          {/* How It Works Section - Glassy Cards */}
          <motion.div
            id="how-it-works"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="mt-28 sm:mt-32 md:mt-40 max-w-4xl mx-auto space-y-6 sm:space-y-8 px-4 sm:px-0"
          >
            <h3 className="text-3xl sm:text-4xl font-bold text-white dark:text-white text-gray-900 dark:text-white text-center mb-6 sm:mb-8">How It Works</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              <motion.div 
                className="p-4 sm:p-6 bg-white/10 dark:bg-white/10 bg-gray-900/50 dark:bg-white/10 backdrop-blur-md border border-white/10 dark:border-white/10 border-gray-200/20 dark:border-white/10 rounded-2xl shadow-lg dark:shadow-lg hover:bg-white/20 dark:hover:bg-white/20 transition-all duration-200"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
                whileHover={{ scale: 1.02 }}
              >
                <div className="flex items-start gap-3 sm:gap-4">
                  <div className="text-2xl sm:text-3xl font-bold text-blue-500 dark:text-blue-500 text-blue-600 dark:text-blue-500 flex-shrink-0">1️⃣</div>
                  <div>
                    <h4 className="text-base sm:text-lg font-bold text-white dark:text-white text-gray-900 dark:text-white mb-1 sm:mb-2">Create a Secret Airdrop</h4>
                    <p className="text-sm sm:text-base text-gray-400 dark:text-gray-400 text-gray-600 dark:text-gray-400">Enter the recipient&apos;s wallet and amount.</p>
                  </div>
                </div>
              </motion.div>
              <motion.div 
                className="p-4 sm:p-6 bg-white/10 dark:bg-white/10 bg-gray-900/50 dark:bg-white/10 backdrop-blur-md border border-white/10 dark:border-white/10 border-gray-200/20 dark:border-white/10 rounded-2xl shadow-lg dark:shadow-lg hover:bg-white/20 dark:hover:bg-white/20 transition-all duration-200"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
                whileHover={{ scale: 1.02 }}
              >
                <div className="flex items-start gap-3 sm:gap-4">
                  <div className="text-2xl sm:text-3xl font-bold text-blue-500 dark:text-blue-500 text-blue-600 dark:text-blue-500 flex-shrink-0">2️⃣</div>
                  <div>
                    <h4 className="text-base sm:text-lg font-bold text-white dark:text-white text-gray-900 dark:text-white mb-1 sm:mb-2">Add a Riddle or Message</h4>
                    <p className="text-sm sm:text-base text-gray-400 dark:text-gray-400 text-gray-600 dark:text-gray-400">Make it fun or meaningful.</p>
                  </div>
                </div>
              </motion.div>
              <motion.div 
                className="p-4 sm:p-6 bg-white/10 dark:bg-white/10 bg-gray-900/50 dark:bg-white/10 backdrop-blur-md border border-white/10 dark:border-white/10 border-gray-200/20 dark:border-white/10 rounded-2xl shadow-lg dark:shadow-lg hover:bg-white/20 dark:hover:bg-white/20 transition-all duration-200"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" }}
                whileHover={{ scale: 1.02 }}
              >
                <div className="flex items-start gap-3 sm:gap-4">
                  <div className="text-2xl sm:text-3xl font-bold text-blue-500 dark:text-blue-500 text-blue-600 dark:text-blue-500 flex-shrink-0">3️⃣</div>
                  <div>
                    <h4 className="text-base sm:text-lg font-bold text-white dark:text-white text-gray-900 dark:text-white mb-1 sm:mb-2">Send Securely on Base</h4>
                    <p className="text-sm sm:text-base text-gray-400 dark:text-gray-400 text-gray-600 dark:text-gray-400">The gift is encrypted and stored on-chain.</p>
                  </div>
                </div>
              </motion.div>
              <motion.div 
                className="p-4 sm:p-6 bg-white/10 dark:bg-white/10 bg-gray-900/50 dark:bg-white/10 backdrop-blur-md border border-white/10 dark:border-white/10 border-gray-200/20 dark:border-white/10 rounded-2xl shadow-lg dark:shadow-lg hover:bg-white/20 dark:hover:bg-white/20 transition-all duration-200"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.4, ease: "easeOut" }}
                whileHover={{ scale: 1.02 }}
              >
                <div className="flex items-start gap-3 sm:gap-4">
                  <div className="text-2xl sm:text-3xl font-bold text-blue-500 dark:text-blue-500 text-blue-600 dark:text-blue-500 flex-shrink-0">4️⃣</div>
                  <div>
                    <h4 className="text-base sm:text-lg font-bold text-white dark:text-white text-gray-900 dark:text-white mb-1 sm:mb-2">Claim & Reveal</h4>
                    <p className="text-sm sm:text-base text-gray-400 dark:text-gray-400 text-gray-600 dark:text-gray-400">The receiver solves the riddle to unlock their reward.</p>
                  </div>
                </div>
              </motion.div>
            </div>
            <p className="text-center text-sm sm:text-base text-gray-400 dark:text-gray-400 text-gray-600 dark:text-gray-400 mt-4 sm:mt-6 px-4">
              Simple, secure, and powered by <span className="text-white dark:text-white text-gray-900 dark:text-white font-semibold">Riddle Pay</span>.
            </p>
          </motion.div>

          {/* Final CTA Section - Glassy Button with Glow */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="mt-28 sm:mt-32 md:mt-40 max-w-2xl mx-auto text-center space-y-4 sm:space-y-6 px-4 sm:px-0"
          >
            <h3 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white dark:text-white text-gray-900 dark:text-white">
              Ready to Send Your First Secret Gift?
            </h3>
            <p className="text-base sm:text-lg text-gray-400 dark:text-gray-400 text-gray-600 dark:text-gray-400">
              Create, encrypt, and share your crypto gifts in seconds.
            </p>
            <motion.button
              onClick={handleLaunchDApp}
              className="relative px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-500 dark:from-blue-500 dark:to-indigo-500 text-white font-bold rounded-2xl transition-all duration-300 hover:scale-[1.03] hover:shadow-[0_4px_20px_rgba(0,82,255,0.4)] dark:hover:shadow-[0_4px_20px_rgba(0,82,255,0.4)] flex items-center justify-center gap-3 group mx-auto min-h-[52px] touch-manipulation text-sm sm:text-base backdrop-blur-md"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
            >
              {/* Light glow behind button */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-500/30 to-purple-500/30 dark:from-blue-500/30 dark:to-purple-500/30 blur-xl -z-10"></div>
              <span>Launch App</span>
              <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform" />
            </motion.button>
          </motion.div>

          {/* Trust Markers Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="mt-16 sm:mt-20 max-w-4xl mx-auto px-4 sm:px-0"
          >
            <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-8 text-xs sm:text-sm text-gray-400 dark:text-gray-400 text-gray-600 dark:text-gray-400">
              <div className="flex items-center gap-2">
                <span className="text-green-500 dark:text-green-500">✓</span>
                <span>Audited Smart Contracts</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-blue-500 dark:text-blue-500">🔗</span>
                <span>Open Source on GitHub</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-[#0052FF] rounded"></div>
                <span>Built for Base</span>
              </div>
            </div>
          </motion.div>
        </div>
      </main>

      {/* Login Dialog Modal */}
      <AnimatePresence>
        {showLoginDialog && (
          <>
            {/* Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={() => !isConnecting && setShowLoginDialog(false)}
            >
              {/* Dialog */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-gray-900 dark:bg-gray-900 bg-white dark:bg-gray-900 border border-gray-800 dark:border-gray-800 border-gray-200 dark:border-gray-800 rounded-2xl p-6 sm:p-8 max-w-md w-full shadow-2xl"
              >
                <h2 className="text-2xl sm:text-3xl font-bold text-white dark:text-white text-gray-900 dark:text-white mb-2 text-center">
                  Choose Your Wallet
                </h2>
                <p className="text-gray-400 dark:text-gray-400 text-gray-600 dark:text-gray-400 text-sm sm:text-base mb-6 text-center">
                  Select how you want to connect to Riddle Pay
                </p>

                <button
                  onClick={handleLogin}
                  disabled={isConnecting}
                  className="group relative w-full px-6 py-3 min-h-[60px] sm:min-h-[70px] bg-gradient-to-br from-blue-600 via-blue-500 to-cyan-500 text-white font-bold rounded-2xl transition-all duration-300 active:scale-[0.97] hover:scale-[1.03] hover:shadow-[0_4px_20px_rgba(0,82,255,0.4)] touch-manipulation text-sm sm:text-base flex flex-row items-center justify-center gap-3 shadow-lg shadow-blue-500/30 border border-blue-400/20 hover:border-blue-300/40 backdrop-blur-md disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {/* Light glow behind button */}
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-500/30 to-cyan-500/30 blur-xl -z-10"></div>
                  {/* Shimmer effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                  {isInMiniApp ? (
                    <>
                      <svg
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        xmlns="http://www.w3.org/2000/svg"
                        className="w-5 h-5 sm:w-7 sm:h-7 relative z-10 text-white flex-shrink-0"
                      >
                        <rect x="4" y="9" width="3.5" height="9" />
                        <rect x="16.5" y="9" width="3.5" height="9" />
                        <rect x="4" y="7" width="16" height="2.5" />
                        <path d="M7.5 7 Q12 12 16.5 7" stroke="currentColor" strokeWidth="2.5" fill="none" />
                      </svg>
                      <span className="text-center leading-tight relative z-10 font-semibold tracking-wide whitespace-nowrap text-white">
                        {isConnecting ? 'Connecting...' : 'Login with Farcaster'}
                      </span>
                    </>
                  ) : (
                    <>
                      <svg
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        xmlns="http://www.w3.org/2000/svg"
                        className="w-5 h-5 sm:w-7 sm:h-7 relative z-10 text-white flex-shrink-0"
                      >
                        <rect x="6" y="6" width="12" height="12" rx="2" fill="currentColor" />
                      </svg>
                      <span className="text-center leading-tight relative z-10 font-semibold tracking-wide whitespace-nowrap text-white">
                        {isConnecting ? 'Connecting...' : 'Connect Wallet'}
                      </span>
                    </>
                  )}
                </button>

                <button
                  onClick={() => setShowLoginDialog(false)}
                  disabled={isConnecting}
                  className="mt-4 w-full px-4 py-2 text-gray-400 dark:text-gray-400 text-gray-600 dark:text-gray-400 hover:text-white dark:hover:text-white hover:text-gray-900 dark:hover:text-white transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Footer with Base Branding */}
      <footer className="relative z-10 border-t border-gray-800 mt-12 sm:mt-16 lg:mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.8 }}
            className="flex flex-col items-center justify-center gap-2 sm:gap-3"
          >
            <div className="flex items-center gap-2 sm:gap-3">
              <span className="text-gray-500 dark:text-gray-500 text-gray-600 dark:text-gray-500 text-xs sm:text-sm">Powered by</span>
              {/* Base Logo - Blue square with rounded corners */}
              <div className="w-6 h-6 sm:w-7 sm:h-7 bg-[#0052FF] rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/30">
                <svg width="16" height="16" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" className="sm:w-5 sm:h-5">
                  <rect width="20" height="20" rx="4" fill="#0052FF"/>
                </svg>
              </div>
              <span className="text-white dark:text-white text-gray-900 dark:text-white font-semibold text-sm sm:text-base">Base</span>
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-600 text-gray-700 dark:text-gray-600 text-center max-w-md px-4">
              Built on Base, the secure, low-cost, developer-friendly Ethereum L2 blockchain
            </p>
          </motion.div>
        </div>
      </footer>
    </div>
  );
}




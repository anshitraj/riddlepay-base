'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Gift, Sparkles, ArrowRight } from 'lucide-react';

interface OnboardingModalProps {
  onClose: () => void;
}

export default function OnboardingModal({ onClose }: OnboardingModalProps) {
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    {
      icon: Gift,
      title: 'Welcome to RiddlePay',
      description: 'Send crypto airdrops with riddles! Recipients must solve a riddle to unlock their reward.',
    },
    {
      icon: Sparkles,
      title: 'How It Works',
      description: '1. Create an airdrop with a riddle or direct gift\n2. Send it to any wallet address\n3. Recipient solves the riddle to claim\n4. Funds are securely stored on-chain until claimed',
    },
    {
      icon: ArrowRight,
      title: 'Get Started',
      description: 'Click "Create New Crypto Airdrop" below to send your first airdrop. You can add a riddle, set expiration time, and include a personal message.',
    },
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleSkip();
    }
  };

  const handleSkip = () => {
    localStorage.setItem('onboarding_completed', 'true');
    onClose();
  };

  const handleDontShowAgain = () => {
    localStorage.setItem('onboarding_completed', 'true');
    localStorage.setItem('onboarding_dont_show', 'true');
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="glass-strong rounded-2xl border border-border p-6 sm:p-8 max-w-md w-full shadow-2xl"
        >
          {/* Close Button */}
          <button
            onClick={handleSkip}
            className="absolute top-4 right-4 p-2 rounded-lg hover:bg-baseLight/20 dark:hover:bg-white/10 transition-all min-w-[44px] min-h-[44px] flex items-center justify-center touch-manipulation"
            aria-label="Close"
          >
            <X className="w-5 h-5 text-gray-400 dark:text-gray-600" />
          </button>

          {/* Content */}
          <div className="space-y-6">
            {/* Icon */}
            <div className="flex justify-center">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                {React.createElement(steps[currentStep].icon, {
                  className: 'w-8 h-8 text-white',
                })}
              </div>
            </div>

            {/* Title */}
            <h2 className="text-2xl font-bold text-center text-white dark:text-gray-900">
              {steps[currentStep].title}
            </h2>

            {/* Description */}
            <p className="text-gray-400 dark:text-gray-600 text-center whitespace-pre-line leading-relaxed">
              {steps[currentStep].description}
            </p>

            {/* Progress Dots */}
            <div className="flex justify-center gap-2">
              {steps.map((_, index) => (
                <div
                  key={index}
                  className={`h-2 rounded-full transition-all ${
                    index === currentStep
                      ? 'w-8 bg-blue-500'
                      : 'w-2 bg-gray-600 dark:bg-gray-400'
                  }`}
                />
              ))}
            </div>

            {/* Buttons */}
            <div className="flex flex-col gap-3">
              <button
                onClick={handleNext}
                className="w-full px-6 py-3 min-h-[52px] bg-gradient-to-r from-blue-500 to-blue-600 text-white font-bold rounded-xl transition-all hover:scale-105 hover:shadow-lg hover:shadow-blue-500/50 touch-manipulation"
              >
                {currentStep < steps.length - 1 ? 'Next' : 'Get Started'}
              </button>
              <div className="flex gap-2">
                <button
                  onClick={handleSkip}
                  className="flex-1 px-4 py-2 min-h-[44px] glass rounded-xl text-gray-400 dark:text-gray-600 hover:bg-baseLight/20 dark:hover:bg-white/10 transition-all touch-manipulation"
                >
                  Skip
                </button>
                <button
                  onClick={handleDontShowAgain}
                  className="flex-1 px-4 py-2 min-h-[44px] glass rounded-xl text-gray-400 dark:text-gray-600 hover:bg-baseLight/20 dark:hover:bg-white/10 transition-all touch-manipulation text-sm"
                >
                  Don't show again
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}


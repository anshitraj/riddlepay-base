'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Gift, Sparkles, ArrowRight } from 'lucide-react';
import RiddlePayLogo from './RiddlePayLogo';

interface OnboardingModalProps {
  onClose: () => void;
}

export default function OnboardingModal({ onClose }: OnboardingModalProps) {
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    {
      title: 'Welcome',
      description: 'A simple way to send crypto airdrops with interactive riddles.',
      showLogo: true,
    },
    {
      title: 'How it works',
      items: [
        {
          number: 1,
          title: 'Create an airdrop',
          description: 'Send crypto with an optional riddle challenge to any wallet address',
        },
        {
          number: 2,
          title: 'Recipient solves the riddle',
          description: 'The receiver must answer correctly to unlock their crypto reward',
        },
        {
          number: 3,
          title: 'Secure and on-chain',
          description: 'All airdrops are stored securely on Base blockchain until claimed',
        },
      ],
    },
    {
      title: 'Get started',
      description: 'Click "Create New Crypto Airdrop" to send your first airdrop. Add a riddle, set expiration time, and include a personal message.',
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

  const currentStepData = steps[currentStep];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-baseLight/95 dark:bg-white/95 backdrop-blur-xl rounded-2xl border border-border p-6 sm:p-8 max-w-md w-full shadow-2xl"
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
            {/* Logo for Welcome Screen */}
            {currentStep === 0 && currentStepData.showLogo && (
              <div className="flex justify-center mb-4">
                <RiddlePayLogo size={64} showText={false} />
              </div>
            )}

            {/* Title */}
            <h2 className="text-2xl sm:text-3xl font-bold text-center text-white dark:text-gray-900 capitalize">
              {currentStepData.title}
            </h2>

            {/* Description or Steps */}
            {currentStepData.description ? (
              <p className="text-gray-400 dark:text-gray-600 text-center leading-relaxed">
                {currentStepData.description}
              </p>
            ) : currentStepData.items ? (
              <div className="space-y-4 mt-4">
                {currentStepData.items.map((item) => (
                  <div
                    key={item.number}
                    className="p-4 bg-baseLight/30 dark:bg-white/10 rounded-xl border border-border"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-sm">
                        {item.number}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-white dark:text-gray-900 mb-1">
                          {item.title}
                        </h3>
                        <p className="text-sm text-gray-400 dark:text-gray-600">
                          {item.description}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : null}

            {/* Progress Dots */}
            <div className="flex justify-center gap-2 pt-2">
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
            <div className="flex flex-col gap-3 pt-2">
              <button
                onClick={handleNext}
                className="w-full px-6 py-3 min-h-[52px] bg-gradient-to-r from-blue-500 to-blue-600 text-white font-bold rounded-xl transition-all hover:scale-105 hover:shadow-lg hover:shadow-blue-500/50 touch-manipulation flex items-center justify-center gap-2"
              >
                <span>{currentStep < steps.length - 1 ? 'Next' : 'Get Started'}</span>
                {currentStep < steps.length - 1 && (
                  <ArrowRight className="w-5 h-5" />
                )}
              </button>
              <button
                onClick={handleSkip}
                className="w-full px-4 py-2 min-h-[44px] glass rounded-xl text-gray-400 dark:text-gray-600 hover:bg-baseLight/20 dark:hover:bg-white/10 transition-all touch-manipulation flex items-center justify-center gap-2"
              >
                <span>Skip</span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

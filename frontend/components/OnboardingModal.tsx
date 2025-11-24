'use client';

import React, { useState } from 'react';
import { X, Gift, Sparkles, ArrowRight, Package, Trophy, Info } from 'lucide-react';
import Link from 'next/link';
import RiddlePayLogo from './RiddlePayLogo';

interface OnboardingModalProps {
  onClose: () => void;
}

export default function OnboardingModal({ onClose }: OnboardingModalProps) {
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    {
      title: 'Welcome to RiddlePay',
      description: 'Send fun, secure, secret airdrops on Base. Add an optional riddle that the receiver must solve to unlock the tokens.',
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
      description: 'Ready to send your first secret airdrop? Choose an action below to get started.',
      showActions: true,
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
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
        <div className="relative bg-baseLight/95 backdrop-blur-xl rounded-2xl border border-border p-6 sm:p-8 max-w-md w-full shadow-2xl">
          {/* Close Button */}
          <button
            onClick={handleSkip}
            className="absolute top-4 right-4 p-2 rounded-lg hover:bg-baseLight/20 transition-all min-w-[44px] min-h-[44px] flex items-center justify-center touch-manipulation z-10"
            aria-label="Close"
          >
            <X className="w-5 h-5 text-white" />
          </button>

          {/* Content */}
          <div className="space-y-6">
            {/* Logo for Welcome Screen */}
            {currentStep === 0 && currentStepData.showLogo && (
              <div className="flex justify-center mb-4">
                <RiddlePayLogo size={120} showText={false} />
              </div>
            )}

            {/* Title */}
            <h2 className="text-2xl sm:text-3xl font-bold text-center text-white capitalize">
              {currentStepData.title}
            </h2>

            {/* Description or Steps */}
            {currentStepData.description && !currentStepData.showActions ? (
              <p className="text-gray-400 text-center leading-relaxed">
                {currentStepData.description}
              </p>
            ) : currentStepData.showActions ? (
              <div className="space-y-3 mt-4">
                <Link href="/" prefetch={true} onClick={handleSkip}>
                  <button
                    className="w-full p-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold rounded-xl transition-all hover:shadow-lg hover:shadow-blue-500/50 touch-manipulation flex items-center justify-center gap-3 min-h-[52px]"
                  >
                    <Gift className="w-5 h-5" />
                    <span>Create Airdrop</span>
                  </button>
                </Link>
                <Link href="/my-gifts" prefetch={true} onClick={handleSkip}>
                  <button
                    className="w-full p-4 glass border border-border text-white font-semibold rounded-xl transition-all hover:bg-baseLight/20 touch-manipulation flex items-center justify-center gap-3 min-h-[52px]"
                  >
                    <Package className="w-5 h-5" />
                    <span>View My Airdrops</span>
                  </button>
                </Link>
                <button
                  onClick={() => setCurrentStep(1)}
                  className="w-full p-4 glass border border-border text-gray-400 font-semibold rounded-xl transition-all hover:bg-baseLight/20 touch-manipulation flex items-center justify-center gap-3 min-h-[52px]"
                >
                  <Info className="w-5 h-5" />
                  <span>How it works</span>
                </button>
              </div>
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
                        <h3 className="font-semibold text-white mb-1">
                          {item.title}
                        </h3>
                        <p className="text-sm text-gray-400">
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
                      : 'w-2 bg-gray-600'
                  }`}
                />
              ))}
            </div>

            {/* Buttons */}
            <div className="flex flex-col gap-3 pt-2">
              {/* Next/Get Started Button - Always visible */}
              {currentStep < steps.length - 1 && (
                <button
                  onClick={handleNext}
                  className="w-full px-6 py-3 min-h-[52px] bg-gradient-to-r from-blue-500 to-blue-600 text-white font-bold rounded-xl transition-all hover:scale-105 hover:shadow-lg hover:shadow-blue-500/50 touch-manipulation flex items-center justify-center gap-2"
                >
                  <span>Next</span>
                  <ArrowRight className="w-5 h-5" />
                </button>
              )}
              {currentStep === steps.length - 1 && (
                <button
                  onClick={handleSkip}
                  className="w-full px-6 py-3 min-h-[52px] bg-gradient-to-r from-blue-500 to-blue-600 text-white font-bold rounded-xl transition-all hover:scale-105 hover:shadow-lg hover:shadow-blue-500/50 touch-manipulation flex items-center justify-center gap-2"
                >
                  <span>Get Started</span>
                </button>
              )}
              {/* Skip Button - Always visible */}
              <button
                onClick={handleSkip}
                className="w-full px-4 py-2 min-h-[44px] glass rounded-xl text-gray-400 hover:bg-baseLight/20 transition-all touch-manipulation flex items-center justify-center gap-2"
              >
                <span>Skip</span>
              </button>
            </div>
          </div>
        </div>
      </div>
  );
}

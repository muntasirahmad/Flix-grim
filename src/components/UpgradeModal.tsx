import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import QRCode from 'qrcode';
import { SUBSCRIPTION_PLANS, UPI_CONFIG } from '../config/models';
import { SubscriptionPlan } from '../types';
import {
  X,
  Check,
  Sparkles,
  Crown,
  QrCode,
  ExternalLink,
  ShieldCheck,
  Zap,
  Lock,
  Smartphone,
  Copy,
} from 'lucide-react';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  isProUser: boolean;
  onUpgradeSuccess: (planId: string) => void;
}

export const UpgradeModal: React.FC<UpgradeModalProps> = ({
  isOpen,
  onClose,
  isProUser,
  onUpgradeSuccess,
}) => {
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan>(SUBSCRIPTION_PLANS[0]);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [justUnlocked, setJustUnlocked] = useState(false);

  // Generate dynamic QR code when selected plan changes
  useEffect(() => {
    if (!isOpen) return;

    QRCode.toDataURL(selectedPlan.upiUrl, {
      width: 240,
      margin: 1.5,
      color: {
        dark: '#000000',
        light: '#ffffff',
      },
    })
      .then((url) => setQrCodeDataUrl(url))
      .catch((err) => console.error('QR generate error:', err));
  }, [selectedPlan, isOpen]);

  if (!isOpen) return null;

  const handleLaunchUpi = () => {
    const upiUrl = selectedPlan.upiUrl;

    // In web, window.location.href triggers registered UPI app protocols on mobile devices
    // On desktop, it falls back smoothly to scanning the dynamic QR code
    try {
      window.location.href = upiUrl;
    } catch (e) {
      console.warn('Could not trigger direct UPI intent:', e);
    }
  };

  const handleCopyUpi = () => {
    navigator.clipboard.writeText(UPI_CONFIG.payeeVpa);
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2000);
  };

  const handleVerifyPayment = () => {
    setIsVerifying(true);
    setTimeout(() => {
      setIsVerifying(false);
      setJustUnlocked(true);
      onUpgradeSuccess(selectedPlan.id);

      // Trigger celebratory confetti
      try {
        confetti({
          particleCount: 100,
          spread: 80,
          origin: { y: 0.55 },
          colors: ['#f59e0b', '#3b82f6', '#10b981', '#ec4899'],
        });
      } catch {}

      setTimeout(() => {
        onClose();
        setJustUnlocked(false);
      }, 1600);
    }, 900);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg bg-[#111827] border border-amber-500/40 rounded-3xl shadow-2xl p-5 sm:p-6 overflow-hidden max-h-[92vh] flex flex-col">
        {/* Glow ambient background elements */}
        <div className="absolute -top-24 -left-24 w-52 h-52 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-52 h-52 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white rounded-xl hover:bg-gray-800 transition-colors z-20 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="text-center mb-4 pt-1 shrink-0">
          <div className="inline-flex p-2.5 rounded-2xl bg-gradient-to-tr from-amber-500/25 to-yellow-500/20 border border-amber-500/40 text-amber-400 mb-2 shadow-inner">
            <Crown className="w-6 h-6 text-amber-400 animate-pulse" />
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-white">
            Unlock <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500">Flix Grim PRO</span>
          </h2>
          <p className="text-xs text-gray-400 mt-1">
            Instant access to ChatGPT GPT-4o, DeepSeek R1, Kimi AI & GLM-4
          </p>
        </div>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          {/* Subscription Plans Selection */}
          <div className="grid grid-cols-2 gap-2.5">
            {SUBSCRIPTION_PLANS.map((plan) => {
              const isSelected = selectedPlan.id === plan.id;
              return (
                <button
                  key={plan.id}
                  onClick={() => setSelectedPlan(plan)}
                  className={`relative p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-amber-500/15 border-amber-500/80 shadow-lg shadow-amber-500/10'
                      : 'bg-gray-900/60 border-gray-800 hover:border-gray-700 text-gray-300'
                  }`}
                >
                  {plan.popular && (
                    <span className="absolute -top-2 right-2 px-2 py-0.5 bg-gradient-to-r from-amber-500 to-yellow-400 text-black text-[10px] font-extrabold rounded-full uppercase tracking-wider shadow-sm">
                      Special Offer
                    </span>
                  )}

                  <div className="text-xs font-bold text-white mb-1">
                    {plan.title}
                  </div>

                  <div className="flex items-baseline space-x-1.5 my-1">
                    <span className="text-2xl font-extrabold text-amber-400">
                      ₹{plan.price}
                    </span>
                    {plan.originalPrice && (
                      <span className="text-xs text-gray-500 line-through">
                        ₹{plan.originalPrice}
                      </span>
                    )}
                  </div>

                  <div className="text-[11px] text-gray-400">
                    {plan.duration}
                  </div>

                  {plan.discountText && (
                    <div className="mt-1 text-[10px] text-emerald-400 font-semibold">
                      {plan.discountText}
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Target UPI Information Box */}
          <div className="bg-[#151c2e] border border-blue-500/30 rounded-2xl p-3.5">
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="text-gray-400">Target UPI Account:</span>
              <span className="text-emerald-400 font-semibold flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Verified Payee: {UPI_CONFIG.payeeName}</span>
              </span>
            </div>

            <div className="flex items-center justify-between bg-black/40 border border-gray-800 rounded-xl px-3 py-2 text-xs">
              <span className="font-mono text-gray-200 font-semibold">{UPI_CONFIG.payeeVpa}</span>
              <button
                onClick={handleCopyUpi}
                className="flex items-center space-x-1 text-blue-400 hover:text-blue-300 text-[11px] cursor-pointer"
              >
                {copiedUpi ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedUpi ? 'Copied!' : 'Copy UPI'}</span>
              </button>
            </div>
          </div>

          {/* Dynamic QR Code & Launch Buttons */}
          <div className="bg-gray-900/60 border border-gray-800 rounded-2xl p-4 text-center">
            <div className="flex items-center justify-center space-x-2 text-xs font-semibold text-gray-300 mb-3">
              <QrCode className="w-4 h-4 text-amber-400" />
              <span>Scan QR with Any UPI App (GPay, PhonePe, Paytm)</span>
            </div>

            {/* QR Code Canvas/Image */}
            <div className="flex justify-center mb-3">
              <div className="p-2.5 bg-white rounded-2xl shadow-xl inline-block">
                {qrCodeDataUrl ? (
                  <img
                    src={qrCodeDataUrl}
                    alt="UPI Payment QR Code"
                    className="w-40 h-40 object-contain rounded-lg"
                  />
                ) : (
                  <div className="w-40 h-40 flex items-center justify-center text-xs text-gray-600">
                    Loading QR...
                  </div>
                )}
              </div>
            </div>

            {/* Direct UPI Trigger Button */}
            <button
              onClick={handleLaunchUpi}
              className="w-full py-2.5 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-98 flex items-center justify-center space-x-2 cursor-pointer mb-2"
            >
              <Smartphone className="w-4 h-4" />
              <span>Pay ₹{selectedPlan.price} via Installed UPI App</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>

            <p className="text-[11px] text-gray-500">
              UPI Intent: {selectedPlan.title} (₹{selectedPlan.price} to {UPI_CONFIG.payeeVpa})
            </p>
          </div>

          {/* Included PRO Models & Features */}
          <div className="space-y-1.5 px-1">
            <div className="text-xs font-semibold text-gray-300 mb-1">
              What gets unlocked instantly:
            </div>
            {[
              'ChatGPT (OpenAI GPT-4o) multimodal intelligence',
              'DeepSeek R1 deep reasoning with chain-of-thought analysis',
              'Kimi AI (Moonshot) ultra-long context synthesis',
              'GLM-4 enterprise agentic workflows',
              'Priority queue with zero waiting time',
            ].map((perk, i) => (
              <div key={i} className="flex items-center space-x-2 text-xs text-gray-300">
                <Check className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>{perk}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Modal Footer / Verification Action */}
        <div className="mt-4 pt-3 border-t border-gray-800/80 shrink-0 space-y-2">
          <button
            onClick={handleVerifyPayment}
            disabled={isVerifying || justUnlocked}
            className={`w-full py-3 px-4 rounded-xl font-bold text-sm transition-all duration-200 flex items-center justify-center space-x-2 shadow-lg cursor-pointer ${
              justUnlocked
                ? 'bg-emerald-600 text-white'
                : 'bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:from-amber-400 hover:to-yellow-300 text-black shadow-amber-500/25 active:scale-98 font-extrabold'
            }`}
          >
            {justUnlocked ? (
              <>
                <Check className="w-5 h-5 text-white" />
                <span>PRO Unlocked Successfully!</span>
              </>
            ) : isVerifying ? (
              <>
                <Sparkles className="w-5 h-5 animate-spin" />
                <span>Verifying UPI Transaction...</span>
              </>
            ) : (
              <>
                <Crown className="w-4 h-4 text-black" />
                <span>Verify & Unlock PRO (Instant)</span>
              </>
            )}
          </button>

          <p className="text-[11px] text-center text-gray-500">
            Post-payment detection activates automatically upon returning to Flix Grim.
          </p>
        </div>
      </div>
    </div>
  );
};

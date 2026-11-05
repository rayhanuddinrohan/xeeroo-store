/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useStore } from '../../context/StoreContext';
import { FacebookConfig } from '../../types';
import { verifyFacebookPage, DEFAULT_FACEBOOK_CONFIG } from '../../utils/facebook';
import {
  X,
  Share2,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Loader2,
  Eye,
  EyeOff,
  Sparkles,
  Send,
  HelpCircle,
  RefreshCw,
} from 'lucide-react';

interface FacebookSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FacebookSettingsModal: React.FC<FacebookSettingsModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { facebookConfig, updateFacebookConfig, addToast } = useStore();

  const [config, setConfig] = useState<FacebookConfig>(() => ({
    ...DEFAULT_FACEBOOK_CONFIG,
    ...facebookConfig,
  }));

  const [showToken, setShowToken] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyMessage, setVerifyMessage] = useState<{ success: boolean; text: string } | null>(null);

  useEffect(() => {
    if (isOpen) {
      setConfig({
        ...DEFAULT_FACEBOOK_CONFIG,
        ...facebookConfig,
      });
      setVerifyMessage(null);
    }
  }, [isOpen, facebookConfig]);

  if (!isOpen) return null;

  const handleVerify = async () => {
    if (!config.pageId.trim() || !config.accessToken.trim()) {
      addToast('Please enter both Page ID and Access Token.', 'warning');
      return;
    }
    setIsVerifying(true);
    setVerifyMessage(null);
    try {
      const res = await verifyFacebookPage(config.pageId, config.accessToken);
      if (res.success) {
        setVerifyMessage({
          success: true,
          text: `Verified & Connected with Facebook Page "${res.name}"!`,
        });
        addToast(`Facebook Page "${res.name}" verified!`, 'success');
        if (res.name) {
          setConfig(prev => ({ ...prev, pageName: res.name, pageLink: res.link }));
        }
      } else {
        setVerifyMessage({
          success: false,
          text: res.error || 'Failed to verify Facebook Page credentials.',
        });
      }
    } finally {
      setIsVerifying(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateFacebookConfig(config);
    addToast(
      config.enabled && config.autoPostOnAdd
        ? 'Facebook Auto-Post active! New products will publish to your page automatically.'
        : 'Facebook settings saved successfully.',
      'success'
    );
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
      <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden transform transition-all my-8">
        {/* Header */}
        <div className="relative p-6 text-white bg-gradient-to-br from-blue-800 via-blue-700 to-indigo-900">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-blue-200 hover:text-white p-1.5 rounded-full hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/20 border border-white/25 flex items-center justify-center text-white shadow-inner font-black text-2xl">
              f
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black tracking-tight text-white">Facebook Auto-Post Settings</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/30 border border-emerald-400/40 text-emerald-100">
                  Graph API v19
                </span>
              </div>
              <p className="text-xs text-blue-200 mt-0.5">
                Automatically post newly added products with high-res photos and order link to Facebook.
              </p>
            </div>
          </div>
        </div>

        {/* Body */}
        <form onSubmit={handleSave} className="p-6 space-y-4 text-xs">
          {/* Enable Toggle Switch */}
          <div className="flex items-center justify-between p-4 bg-blue-50/60 border border-blue-100 rounded-2xl">
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  config.enabled && config.autoPostOnAdd
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-500'
                }`}
              >
                <Share2 className="w-5 h-5" />
              </div>
              <div>
                <label htmlFor="fb-auto-toggle" className="text-xs font-bold text-gray-900 cursor-pointer">
                  Auto-Post Newly Created Products
                </label>
                <p className="text-[11px] text-gray-500">
                  {config.enabled && config.autoPostOnAdd
                    ? 'Active: Products will publish directly to Page on creation'
                    : 'Inactive'}
                </p>
              </div>
            </div>

            <label className="relative inline-flex items-center cursor-pointer">
              <input
                id="fb-auto-toggle"
                type="checkbox"
                checked={config.enabled && config.autoPostOnAdd}
                onChange={(e) => {
                  const val = e.target.checked;
                  setConfig({ ...config, enabled: val, autoPostOnAdd: val });
                }}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {/* Page ID */}
          <div>
            <label className="block text-xs font-bold text-gray-800 mb-1">
              Facebook Page ID *
            </label>
            <input
              type="text"
              value={config.pageId}
              onChange={(e) => setConfig({ ...config, pageId: e.target.value.trim() })}
              placeholder="103314657990315"
              className="w-full px-3.5 py-2.5 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white focus:outline-none font-mono text-gray-900"
            />
          </div>

          {/* Access Token */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold text-gray-800">
                Page Access Token *
              </label>
              <button
                type="button"
                onClick={() => setShowToken(!showToken)}
                className="text-[11px] text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
              >
                {showToken ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                <span>{showToken ? 'Hide token' : 'Show token'}</span>
              </button>
            </div>
            <textarea
              rows={showToken ? 4 : 2}
              value={config.accessToken}
              onChange={(e) => setConfig({ ...config, accessToken: e.target.value.trim() })}
              placeholder="EAAUOWYLTVWEBSx..."
              className="w-full px-3.5 py-2.5 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white focus:outline-none font-mono text-gray-900 resize-y"
            />
          </div>

          {/* Headline & Hashtags */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-800 mb-1">
                Post Headline / Prefix
              </label>
              <input
                type="text"
                value={config.customPrefix || ''}
                onChange={(e) => setConfig({ ...config, customPrefix: e.target.value })}
                placeholder="🔥 NEW ARRIVAL AT XEEROO!"
                className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white focus:outline-none text-gray-900"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-800 mb-1">
                Hashtags
              </label>
              <input
                type="text"
                value={config.customHashtags || ''}
                onChange={(e) => setConfig({ ...config, customHashtags: e.target.value })}
                placeholder="#XEEROO #OnlineShopping #Tech"
                className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white focus:outline-none text-blue-700 font-mono"
              />
            </div>
          </div>

          {/* Verification feedback */}
          {verifyMessage && (
            <div
              className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
                verifyMessage.success
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : 'bg-rose-50 border-rose-200 text-rose-800'
              }`}
            >
              {verifyMessage.success ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              )}
              <span className="font-medium">{verifyMessage.text}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
            <button
              type="button"
              disabled={isVerifying || !config.pageId || !config.accessToken}
              onClick={handleVerify}
              className="w-full sm:w-auto px-4 py-2.5 bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-200 rounded-xl text-xs font-bold transition-all disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
            >
              {isVerifying ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Testing...</span>
                </>
              ) : (
                <>
                  <RefreshCw className="w-3.5 h-3.5 text-sky-600" />
                  <span>Verify Page Connection</span>
                </>
              )}
            </button>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 sm:flex-none px-4 py-2.5 text-xs font-semibold text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 sm:flex-none px-5 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>Save Settings</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

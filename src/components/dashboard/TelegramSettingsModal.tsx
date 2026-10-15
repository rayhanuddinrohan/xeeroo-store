/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  X,
  Send,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Loader2,
  HelpCircle,
  Eye,
  EyeOff,
  BellRing,
  Bot,
  Sparkles,
} from 'lucide-react';
import {
  getStoredTelegramConfig,
  saveStoredTelegramConfig,
  sendTelegramMessage,
  TelegramConfig,
} from '../../utils/telegram';
import { useStore } from '../../context/StoreContext';

interface TelegramSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TelegramSettingsModal: React.FC<TelegramSettingsModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { addToast, telegramConfig, updateTelegramConfig } = useStore();

  const [config, setConfig] = useState<TelegramConfig>({
    botToken: '',
    chatId: '',
    enabled: false,
  });

  const [showToken, setShowToken] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [showInstructions, setShowInstructions] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (telegramConfig.botToken || telegramConfig.chatId) {
        setConfig(telegramConfig);
      } else {
        setConfig(getStoredTelegramConfig());
      }
      setTestResult(null);
    }
  }, [isOpen, telegramConfig]);

  if (!isOpen) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateTelegramConfig(config);
    addToast(
      config.enabled
        ? 'Telegram order alerts enabled! Synchronized with database for all customers & devices.'
        : 'Telegram settings saved.',
      'success'
    );
    onClose();
  };

  const handleTestNotification = async () => {
    if (!config.botToken.trim() || !config.chatId.trim()) {
      addToast('Please enter both Bot Token and Chat ID to send a test message.', 'warning');
      return;
    }

    setIsTesting(true);
    setTestResult(null);

    const testMsg =
      `🔔 <b>XEEROO STORE — TELEGRAM BOT TEST</b>\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `✅ <b>Status:</b> Connected & Configured Successfully!\n` +
      `🕒 <b>Time:</b> ${new Date().toLocaleTimeString()}\n` +
      `🏪 <b>Store:</b> XEEROO E-Commerce Bangladesh\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `🎉 When a customer places an order, you will receive full order details instantly here!`;

    try {
      const res = await sendTelegramMessage(config.botToken, config.chatId, testMsg);
      setTestResult(res);
      if (res.success) {
        addToast('Test message sent to Telegram! Check your Telegram app.', 'success');
      } else {
        addToast(res.message, 'error');
      }
    } catch (err: unknown) {
      const error = err as { message?: string };
      setTestResult({
        success: false,
        message: error.message || 'Failed to send test message to Telegram.',
      });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
      <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden transform transition-all my-8">
        {/* Modal Header */}
        <div className="relative p-6 text-white bg-gradient-to-br from-blue-900 via-sky-800 to-indigo-900">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-sky-200 hover:text-white p-1.5 rounded-full hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center text-sky-200 shadow-inner">
              <Bot className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black tracking-tight text-white">Telegram Order Alerts</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-500/30 border border-sky-400/40 text-sky-100">
                  Instant Bot
                </span>
              </div>
              <p className="text-xs text-sky-200 mt-0.5">
                Receive real-time notification on Telegram whenever any customer orders.
              </p>
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSave} className="p-6 space-y-5">
          {/* Enable Toggle Switch */}
          <div className="flex items-center justify-between p-4 bg-gray-50 border border-gray-200 rounded-2xl">
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  config.enabled ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-200 text-gray-500'
                }`}
              >
                <BellRing className="w-5 h-5" />
              </div>
              <div>
                <label htmlFor="telegram-toggle" className="text-xs font-bold text-gray-900 cursor-pointer">
                  Enable Telegram Order Notifications
                </label>
                <p className="text-[11px] text-gray-500">
                  {config.enabled ? 'Active: Alerts will be dispatched on every order' : 'Inactive'}
                </p>
              </div>
            </div>

            <label className="relative inline-flex items-center cursor-pointer">
              <input
                id="telegram-toggle"
                type="checkbox"
                checked={config.enabled}
                onChange={(e) => setConfig({ ...config, enabled: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
            </label>
          </div>

          {/* Bot Token Input */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-gray-800">
                Telegram Bot Token *
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
            <div className="relative">
              <input
                type={showToken ? 'text' : 'password'}
                value={config.botToken}
                onChange={(e) => setConfig({ ...config, botToken: e.target.value.trim() })}
                placeholder="e.g. 7123456789:AAHk..."
                className="w-full px-3.5 py-2.5 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white focus:outline-none font-mono text-gray-900 transition-all"
              />
            </div>
            <p className="text-[11px] text-gray-500 mt-1">
              Obtain this token by messaging <span className="font-semibold text-gray-700">@BotFather</span> on Telegram and sending <code className="bg-gray-100 px-1 py-0.5 rounded text-blue-700">/newbot</code>.
            </p>
          </div>

          {/* Chat ID Input */}
          <div>
            <label className="block text-xs font-bold text-gray-800 mb-1.5">
              Telegram Chat ID or Group ID *
            </label>
            <input
              type="text"
              value={config.chatId}
              onChange={(e) => setConfig({ ...config, chatId: e.target.value.trim() })}
              placeholder="e.g. 123456789 or -1001234567890"
              className="w-full px-3.5 py-2.5 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white focus:outline-none font-mono text-gray-900 transition-all"
            />
            <p className="text-[11px] text-gray-500 mt-1">
              Your numeric Telegram account ID (message <span className="font-semibold text-gray-700">@userinfobot</span> to find yours) or group chat ID.
            </p>
          </div>

          {/* Test Result Message */}
          {testResult && (
            <div
              className={`p-3.5 rounded-xl border text-xs flex items-start gap-2.5 ${
                testResult.success
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : 'bg-rose-50 border-rose-200 text-rose-800'
              }`}
            >
              {testResult.success ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              )}
              <div className="flex-1 font-medium leading-relaxed">{testResult.message}</div>
            </div>
          )}

          {/* Instructions Accordion */}
          <div className="border border-sky-100 bg-sky-50/50 rounded-2xl p-4">
            <button
              type="button"
              onClick={() => setShowInstructions(!showInstructions)}
              className="w-full flex items-center justify-between text-xs font-bold text-sky-900 hover:text-sky-950 cursor-pointer"
            >
              <span className="flex items-center gap-1.5">
                <HelpCircle className="w-4 h-4 text-sky-600" />
                <span>How to set up Telegram Bot (Step-by-Step Bangla Guide)</span>
              </span>
              <span className="text-[11px] font-medium text-sky-600">
                {showInstructions ? 'Hide Guide ▲' : 'Show Guide ▼'}
              </span>
            </button>

            {showInstructions && (
              <div className="mt-3 pt-3 border-t border-sky-200/60 text-xs text-gray-700 space-y-2.5">
                <div className="p-2.5 bg-white rounded-xl border border-sky-100 space-y-1.5">
                  <p className="font-bold text-gray-900">
                    ধাপ ১: Telegram Bot তৈরি করুন (Get Bot Token)
                  </p>
                  <ol className="list-decimal list-inside space-y-1 text-[11px] text-gray-600 leading-relaxed">
                    <li>Telegram অ্যাপে গিয়ে সার্চ করুন <strong>@BotFather</strong></li>
                    <li>চ্যাটে <code>/newbot</code> লিখে পাঠান</li>
                    <li>বটের একটি নাম দিন (যেমন: <em>XEEROO Order Bot</em>)</li>
                    <li>বটের একটি ইউজারনেম দিন যার শেষে <code>bot</code> থাকবে (যেমন: <em>xeeroo_store_order_bot</em>)</li>
                    <li>BotFather আপনাকে একটি <strong>HTTP API Token</strong> দেবে। সেটি কপি করে উপরের <strong>Bot Token</strong> ঘরে বসান।</li>
                  </ol>
                </div>

                <div className="p-2.5 bg-white rounded-xl border border-sky-100 space-y-1.5">
                  <p className="font-bold text-gray-900">
                    ধাপ ২: নিজের Chat ID বের করুন (Get Chat ID)
                  </p>
                  <ol className="list-decimal list-inside space-y-1 text-[11px] text-gray-600 leading-relaxed">
                    <li>Telegram-এ সার্চ করুন <strong>@userinfobot</strong></li>
                    <li><code>/start</code> বাটনে চাপ দিলে এটি আপনার <strong>Id:</strong> (যেমন: 123456789) পাঠিয়ে দেবে।</li>
                    <li>সেই নম্বরটি কপি করে উপরের <strong>Telegram Chat ID</strong> ঘরে বসান।</li>
                    <li>⚠️ <strong>গুরুত্বপূর্ণ:</strong> আপনার তৈরি করা নতুন বটে গিয়ে একবার <code>/start</code> দিন, যাতে বট আপনাকে মেসেজ পাঠানোর অনুমতি পায়।</li>
                  </ol>
                </div>

                <div className="p-2.5 bg-white rounded-xl border border-sky-100 space-y-1.5">
                  <p className="font-bold text-gray-900">
                    ধাপ ৩: টেস্ট করুন ও সেভ করুন
                  </p>
                  <p className="text-[11px] text-gray-600">
                    নিচের <strong>"Send Test Message"</strong> বাটনে ক্লিক করুন। টেলিগ্রামে টেস্ট মেসেজ চলে আসলে <strong>"Save Configuration"</strong> বাটনে চাপ দিন। এখন থেকে যেকোনো কাস্টমার অর্ডার করার সাথে সাথে সম্পূর্ণ ডিটেইলস আপনার টেলিগ্রামে চলে আসবে!
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
            <button
              type="button"
              disabled={isTesting || !config.botToken.trim() || !config.chatId.trim()}
              onClick={handleTestNotification}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-200 rounded-xl text-xs font-bold transition-all disabled:opacity-50 cursor-pointer"
            >
              {isTesting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Sending test...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5 text-sky-600" />
                  <span>Send Test Message</span>
                </>
              )}
            </button>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 sm:flex-none px-4 py-2.5 text-xs font-semibold text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 rounded-xl cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 sm:flex-none px-5 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>Save Configuration</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

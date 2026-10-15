/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Order } from '../types';
import { formatBDT } from './currency';

export interface TelegramConfig {
  botToken: string;
  chatId: string;
  enabled: boolean;
}

export const TELEGRAM_CONFIG_STORAGE_KEY = 'xeeroo_telegram_config';

export const getStoredTelegramConfig = (): TelegramConfig => {
  try {
    const raw = localStorage.getItem(TELEGRAM_CONFIG_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        botToken: parsed.botToken || '',
        chatId: parsed.chatId || '',
        enabled: Boolean(parsed.enabled),
      };
    }
  } catch (e) {
    console.warn('Error reading telegram config:', e);
  }
  return { botToken: '', chatId: '', enabled: false };
};

export const saveStoredTelegramConfig = (config: TelegramConfig) => {
  localStorage.setItem(TELEGRAM_CONFIG_STORAGE_KEY, JSON.stringify(config));
};

/**
 * Escape HTML special characters for Telegram HTML mode
 */
const escapeHtml = (str: unknown = ''): string => {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
};

/**
 * Send a formatted message to Telegram Bot Chat/Channel
 * Automatically falls back to plain text if Telegram rejects HTML formatting
 */
export const sendTelegramMessage = async (
  botToken: string,
  chatId: string,
  text: string
): Promise<{ success: boolean; message: string }> => {
  const cleanToken = botToken.trim();
  const cleanChatId = chatId.trim();

  if (!cleanToken || !cleanChatId) {
    return { success: false, message: 'Bot Token and Chat ID are required.' };
  }

  try {
    const url = `https://api.telegram.org/bot${cleanToken}/sendMessage`;
    
    // First attempt: HTML parse mode
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: cleanChatId,
        text,
        parse_mode: 'HTML',
        disable_web_page_preview: true,
      }),
    });

    const data = await response.json();
    if (data.ok) {
      return { success: true, message: 'Telegram notification delivered successfully!' };
    }

    // If HTML parsing failed, strip HTML tags and retry as plain text
    const plainText = text.replace(/<[^>]*>?/gm, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'");
    const fallbackResponse = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: cleanChatId,
        text: plainText,
        disable_web_page_preview: true,
      }),
    });

    const fallbackData = await fallbackResponse.json();
    if (fallbackData.ok) {
      return { success: true, message: 'Telegram notification delivered (plain-text fallback).' };
    }

    return {
      success: false,
      message: fallbackData.description || data.description || `Telegram API error code: ${data.error_code}`,
    };
  } catch (err: unknown) {
    const error = err as { message?: string };
    return {
      success: false,
      message: error.message || 'Network error: could not reach Telegram API.',
    };
  }
};

/**
 * Format new order details into a clean, rich Telegram HTML message
 */
export const formatOrderForTelegram = (order: Order, storeName: string = 'XEEROO Store'): string => {
  const addr = order.shippingAddress || ({} as any);
  const fullAddress = [addr.street, addr.thana || addr.state, addr.district || addr.city, addr.postalCode, addr.country || 'Bangladesh']
    .filter(Boolean)
    .join(', ');

  const items = order.items || [];
  const itemsList = items
    .map(
      (item, idx) =>
        `  ${idx + 1}. <b>${escapeHtml(item.productTitle)}</b>\n     ▫️ Qty: ${item.quantity} | Price: ${formatBDT(item.unitPrice)}`
    )
    .join('\n');

  const paymentDesc =
    order.paymentMethod === 'cod'
      ? 'Cash on Delivery (COD)'
      : order.paymentMethod === 'bkash'
      ? `bKash (${escapeHtml(order.paymentDetails?.bkashNumber || 'N/A')}${order.paymentDetails?.trxId ? ' | TrxID: ' + escapeHtml(order.paymentDetails.trxId) : ''})`
      : escapeHtml(order.paymentMethod || 'COD').toUpperCase();

  const formattedDate = new Date(order.createdAt || Date.now()).toLocaleString('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  const customerName = escapeHtml(addr.fullName || order.userEmail?.split('@')[0] || 'Customer');
  const customerPhone = escapeHtml(addr.phone || 'N/A');
  const customerEmail = escapeHtml(order.userEmail || 'N/A');

  return (
    `🚨 <b>NEW ORDER RECEIVED!</b>\n` +
    `🏪 <i>${escapeHtml(storeName)}</i>\n` +
    `━━━━━━━━━━━━━━━━━━━━\n` +
    `🆔 <b>Order ID:</b> #${escapeHtml(order.id)}\n` +
    `📅 <b>Date:</b> ${formattedDate}\n` +
    `👤 <b>Customer:</b> ${customerName}\n` +
    `📞 <b>Phone:</b> <code>${customerPhone}</code>\n` +
    `✉️ <b>Email:</b> ${customerEmail}\n` +
    `📍 <b>Delivery Address:</b> ${escapeHtml(fullAddress || 'N/A')}\n` +
    `━━━━━━━━━━━━━━━━━━━━\n` +
    `📦 <b>Ordered Items (${items.length}):</b>\n` +
    `${itemsList || '  (No items listed)'}\n` +
    `━━━━━━━━━━━━━━━━━━━━\n` +
    `💳 <b>Payment Method:</b> ${paymentDesc}\n` +
    `💰 <b>Total Bill:</b> <b>${formatBDT(order.totalAmount || 0)}</b>\n` +
    `⚡ <b>Status:</b> 🟡 <i>${escapeHtml((order.status || 'pending').toUpperCase())}</i>\n` +
    `━━━━━━━━━━━━━━━━━━━━\n` +
    `👉 <i>Log in to Admin Dashboard to process this order.</i>`
  );
};


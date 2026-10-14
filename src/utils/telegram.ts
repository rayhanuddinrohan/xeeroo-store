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
 * Send an HTML formatted message to Telegram Bot Chat/Channel
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
    } else {
      return {
        success: false,
        message: data.description || `Telegram API error code: ${data.error_code}`,
      };
    }
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
  const addr = order.shippingAddress;
  const fullAddress = [addr.street, addr.city, addr.state, addr.postalCode, addr.country]
    .filter(Boolean)
    .join(', ');

  const itemsList = order.items
    .map(
      (item, idx) =>
        `  ${idx + 1}. <b>${item.productTitle}</b>\n     ▫️ Qty: ${item.quantity} | Price: ${formatBDT(item.unitPrice)}`
    )
    .join('\n');

  const paymentDesc =
    order.paymentMethod === 'cod'
      ? 'Cash on Delivery (COD)'
      : order.paymentMethod === 'bkash'
      ? `bKash (${order.paymentDetails?.bkashNumber || 'N/A'}${order.paymentDetails?.trxId ? ' | TrxID: ' + order.paymentDetails.trxId : ''})`
      : order.paymentMethod.toUpperCase();

  const formattedDate = new Date(order.createdAt).toLocaleString('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  return (
    `🚨 <b>NEW ORDER RECEIVED!</b>\n` +
    `🏪 <i>${storeName}</i>\n` +
    `━━━━━━━━━━━━━━━━━━━━\n` +
    `🆔 <b>Order ID:</b> #${order.id}\n` +
    `📅 <b>Date:</b> ${formattedDate}\n` +
    `👤 <b>Customer:</b> ${addr.fullName}\n` +
    `📞 <b>Phone:</b> <code>${addr.phone || 'N/A'}</code>\n` +
    `✉️ <b>Email:</b> ${order.userEmail}\n` +
    `📍 <b>Delivery Address:</b> ${fullAddress || 'N/A'}\n` +
    `━━━━━━━━━━━━━━━━━━━━\n` +
    `📦 <b>Ordered Items (${order.items.length}):</b>\n` +
    `${itemsList}\n` +
    `━━━━━━━━━━━━━━━━━━━━\n` +
    `💳 <b>Payment Method:</b> ${paymentDesc}\n` +
    `💰 <b>Total Bill:</b> <b>${formatBDT(order.totalAmount)}</b>\n` +
    `⚡ <b>Status:</b> 🟡 <i>${order.status.toUpperCase()}</i>\n` +
    `━━━━━━━━━━━━━━━━━━━━\n` +
    `👉 <i>Log in to Admin Dashboard to process this order.</i>`
  );
};

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { XEEROO_CONTACT } from '../data/mockData';
import {
  X,
  Phone,
  Mail,
  ShieldCheck,
  MessageCircle,
  Clock,
  ExternalLink,
} from 'lucide-react';

interface ContactModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ContactModal: React.FC<ContactModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const whatsappUrl = `https://wa.me/8801570243005?text=${encodeURIComponent(
    'Hello XEEROO! I would like to make an inquiry and place an order.'
  )}`;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-gray-100 overflow-hidden animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="px-6 py-5 bg-slate-950 text-white flex items-center justify-between border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <h3 className="text-lg font-bold tracking-tight">Contact XEEROO</h3>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Customer Support & Direct WhatsApp Order Desk
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* WhatsApp Direct Order Card (Highlighted) */}
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-between p-4 rounded-xl border-2 border-emerald-500 bg-emerald-50/60 hover:bg-emerald-100/70 transition-all group cursor-pointer shadow-xs"
          >
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-lg shadow-sm group-hover:scale-105 transition-transform">
                <MessageCircle className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider block">
                  Instant WhatsApp Order & Chat
                </span>
                <span className="text-sm font-black text-emerald-950 font-mono">
                  {XEEROO_CONTACT.phone}
                </span>
                <span className="text-[11px] text-emerald-700 block mt-0.5">
                  Talk directly with XEEROO team & place orders
                </span>
              </div>
            </div>
            <span className="text-xs font-bold text-white bg-emerald-600 px-3 py-1.5 rounded-lg group-hover:bg-emerald-700 transition-colors shadow-xs shrink-0">
              Chat & Order
            </span>
          </a>

          {/* Phone and Email */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500">
              Direct Communication
            </h4>

            {/* Phone */}
            <a
              href={`tel:${XEEROO_CONTACT.phone}`}
              className="flex items-center justify-between p-3 rounded-xl border border-gray-200 hover:border-blue-500 hover:bg-blue-50/40 transition-all group cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
                  <Phone className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs text-gray-500 block font-medium">Customer Service Helpline</span>
                  <span className="text-xs font-bold text-gray-900 font-mono">
                    {XEEROO_CONTACT.phone}
                  </span>
                </div>
              </div>
              <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-md border border-blue-200 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                Call Now
              </span>
            </a>

            {/* Email */}
            <a
              href={`mailto:${XEEROO_CONTACT.email}`}
              className="flex items-center justify-between p-3 rounded-xl border border-gray-200 hover:border-purple-500 hover:bg-purple-50/40 transition-all group cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center">
                  <Mail className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs text-gray-500 block font-medium">Official Email Desk</span>
                  <span className="text-xs font-bold text-gray-900 font-mono">
                    {XEEROO_CONTACT.email}
                  </span>
                </div>
              </div>
              <span className="text-xs font-semibold text-purple-600 bg-purple-50 px-2.5 py-1 rounded-md border border-purple-200 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                Email Us
              </span>
            </a>
          </div>

          {/* Social Profiles as sleek buttons */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
              Follow XEEROO
            </h4>
            <div className="grid grid-cols-3 gap-2">
              {/* Facebook Button */}
              <a
                href={XEEROO_CONTACT.facebook}
                target="_blank"
                rel="noreferrer"
                className="py-2.5 px-3 rounded-xl border border-gray-200 hover:border-blue-600 hover:bg-blue-50/60 transition-all flex items-center justify-center gap-2 group cursor-pointer bg-white"
                title="Follow on Facebook"
              >
                <div className="w-6 h-6 rounded-md bg-blue-600 text-white font-black text-xs flex items-center justify-center shrink-0">
                  X
                </div>
                <span className="text-xs font-bold text-gray-800 group-hover:text-blue-600">
                  Facebook
                </span>
              </a>

              {/* Instagram Button */}
              <a
                href={XEEROO_CONTACT.instagram}
                target="_blank"
                rel="noreferrer"
                className="py-2.5 px-3 rounded-xl border border-gray-200 hover:border-pink-600 hover:bg-pink-50/60 transition-all flex items-center justify-center gap-2 group cursor-pointer bg-white"
                title="Follow on Instagram"
              >
                <div className="w-6 h-6 rounded-md bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 text-white font-black text-xs flex items-center justify-center shrink-0">
                  X
                </div>
                <span className="text-xs font-bold text-gray-800 group-hover:text-pink-600">
                  Instagram
                </span>
              </a>

              {/* TikTok Button */}
              <a
                href={XEEROO_CONTACT.tiktok}
                target="_blank"
                rel="noreferrer"
                className="py-2.5 px-3 rounded-xl border border-gray-200 hover:border-black hover:bg-gray-100 transition-all flex items-center justify-center gap-2 group cursor-pointer bg-white"
                title="Follow on TikTok"
              >
                <div className="w-6 h-6 rounded-md bg-black text-white font-black text-xs flex items-center justify-center shrink-0">
                  X
                </div>
                <span className="text-xs font-bold text-gray-800 group-hover:text-black">
                  TikTok
                </span>
              </a>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
          <span className="text-[11px] text-gray-500 font-mono">
            Dhaka, Bangladesh • Open 24/7
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-200 bg-gray-100 rounded-lg transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

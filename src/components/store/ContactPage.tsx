/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { XEEROO_CONTACT } from '../../data/mockData';
import {
  Phone,
  Mail,
  MapPin,
  Clock,
  Send,
  CheckCircle2,
  ShieldCheck,
  Truck,
  RotateCcw,
  Sparkles,
  ArrowLeft,
  MessageCircle,
} from 'lucide-react';

export const ContactPage: React.FC = () => {
  const { addToast, setViewMode, navigateToStore } = useStore();

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('general');
  const [orderId, setOrderId] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const whatsappDirectUrl = `https://wa.me/8801570243005?text=${encodeURIComponent(
    'Hello XEEROO! I am contacting you from the XEEROO website support page.'
  )}`;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !phone.trim() || !message.trim()) {
      addToast('Please fill in your name, contact phone, and message.', 'warning');
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSubmitted(true);
      addToast('Thank you! Your message has been received by the XEEROO Support Desk.', 'success');
    }, 600);
  };

  const handleResetForm = () => {
    setFullName('');
    setPhone('');
    setEmail('');
    setOrderId('');
    setMessage('');
    setIsSubmitted(false);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-300 pb-16">
      {/* Navigation Breadcrumb & Back */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => {
            if (navigateToStore) navigateToStore();
            else setViewMode('store');
          }}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-blue-600 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Store Catalog</span>
        </button>

        <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
          <span>Home</span>
          <span>/</span>
          <span className="text-slate-800 font-bold">Contact Us</span>
        </div>
      </div>

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 text-white rounded-3xl p-8 sm:p-10 shadow-xl border border-slate-800 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-bold mb-4">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Customer Support & Order Assistance</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white mb-3">
            Contact XEEROO
          </h1>
          <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
            Have questions about a product, delivery status, or need help placing an order?
            Our support desk in Dhaka is ready to assist you via WhatsApp, phone, or email.
          </p>
        </div>
      </div>

      {/* Quick Contact Action Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. WhatsApp Card */}
        <a
          href={whatsappDirectUrl}
          target="_blank"
          rel="noreferrer"
          className="group p-5 rounded-2xl bg-white border-2 border-emerald-500 shadow-sm hover:shadow-md hover:border-emerald-600 transition-all cursor-pointer flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center p-2 group-hover:scale-105 transition-transform">
                <img src="/whatsapp.png" alt="WhatsApp" className="w-full h-full object-contain" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                Fastest
              </span>
            </div>
            <h3 className="text-sm font-bold text-gray-900 group-hover:text-emerald-700 transition-colors">
              WhatsApp Desk
            </h3>
            <p className="text-xs text-gray-500 mt-1">Direct instant chat & orders</p>
            <p className="text-sm font-mono font-bold text-emerald-800 mt-2">
              {XEEROO_CONTACT.phone}
            </p>
          </div>
          <span className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-emerald-600 group-hover:translate-x-1 transition-transform">
            Chat on WhatsApp →
          </span>
        </a>

        {/* 2. Direct Call Card */}
        <a
          href={`tel:${XEEROO_CONTACT.phone}`}
          className="group p-5 rounded-2xl bg-white border border-gray-200 shadow-xs hover:border-blue-500 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 group-hover:scale-105 transition-transform">
                <Phone className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full">
                9 AM - 10 PM
              </span>
            </div>
            <h3 className="text-sm font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
              Phone Helpline
            </h3>
            <p className="text-xs text-gray-500 mt-1">Speak directly with support</p>
            <p className="text-sm font-mono font-bold text-gray-900 mt-2">
              {XEEROO_CONTACT.phone}
            </p>
          </div>
          <span className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-blue-600 group-hover:translate-x-1 transition-transform">
            Call Now →
          </span>
        </a>

        {/* 3. Email Card */}
        <a
          href={`mailto:${XEEROO_CONTACT.email}`}
          className="group p-5 rounded-2xl bg-white border border-gray-200 shadow-xs hover:border-purple-500 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600 group-hover:scale-105 transition-transform">
                <Mail className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full">
                24/7 Desk
              </span>
            </div>
            <h3 className="text-sm font-bold text-gray-900 group-hover:text-purple-600 transition-colors">
              Email Support
            </h3>
            <p className="text-xs text-gray-500 mt-1">Official inquiries & receipts</p>
            <p className="text-xs font-mono font-bold text-gray-900 mt-2 truncate">
              {XEEROO_CONTACT.email}
            </p>
          </div>
          <span className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-purple-600 group-hover:translate-x-1 transition-transform">
            Send Email →
          </span>
        </a>

        {/* 4. Location Card */}
        <div className="p-5 rounded-2xl bg-white border border-gray-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600">
                <MapPin className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
                Dhaka, BD
              </span>
            </div>
            <h3 className="text-sm font-bold text-gray-900">
              Distribution Hub
            </h3>
            <p className="text-xs text-gray-500 mt-1">Shipping nationwide to all 64 districts</p>
            <p className="text-xs font-semibold text-gray-800 mt-2">
              Dhaka Division, Bangladesh
            </p>
          </div>
          <span className="mt-4 text-xs font-semibold text-amber-700">
            Express Home Delivery
          </span>
        </div>
      </div>

      {/* Main Grid: Form & Info Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Interactive Contact Form */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 sm:p-8 border border-gray-200 shadow-xs">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-gray-950">Send Us an Inquiry</h2>
            <p className="text-xs text-gray-500 mt-1">
              Fill out the form below and our team will get back to you promptly.
            </p>
          </div>

          {isSubmitted ? (
            <div className="p-8 text-center bg-emerald-50 rounded-2xl border border-emerald-200 space-y-4 animate-in fade-in">
              <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-xs">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-black text-emerald-950">Message Sent Successfully!</h3>
              <p className="text-xs text-emerald-800 max-w-md mx-auto leading-relaxed">
                Thank you, <strong>{fullName}</strong>. Your message regarding{' '}
                <strong>{subject}</strong> has been logged. Our customer service agent will contact you shortly via <strong>{phone}</strong>.
              </p>
              <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
                <a
                  href={whatsappDirectUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2 bg-[#25D366] hover:bg-[#20ba59] text-white text-xs font-bold rounded-xl transition-all inline-flex items-center gap-2"
                >
                  <img src="/whatsapp.png" alt="WhatsApp" className="w-4 h-4 object-contain" />
                  <span>Chat on WhatsApp Directly</span>
                </a>
                <button
                  type="button"
                  onClick={handleResetForm}
                  className="px-4 py-2 bg-white border border-emerald-300 text-emerald-900 text-xs font-semibold rounded-xl hover:bg-emerald-100 transition-colors cursor-pointer"
                >
                  Send Another Inquiry
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Full Name */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">
                    Your Full Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Tanvir Ahmed"
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-gray-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>

                {/* Phone Number */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">
                    Phone / WhatsApp Number <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. 017XXXXXXXX"
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-gray-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Email Address */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">
                    Email Address <span className="text-gray-400 font-normal">(Optional)</span>
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. tanvir@gmail.com"
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-gray-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>

                {/* Subject / Purpose */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">
                    Inquiry Topic
                  </label>
                  <select
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-gray-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white transition-all cursor-pointer"
                  >
                    <option value="general">General Store Inquiry</option>
                    <option value="order-status">Order Status & Tracking</option>
                    <option value="product-detail">Product Specifications & Stock</option>
                    <option value="warranty-return">Warranty / Exchange / Return</option>
                    <option value="wholesale">Bulk / Wholesale Purchase</option>
                  </select>
                </div>
              </div>

              {/* Order ID */}
              {subject === 'order-status' && (
                <div className="animate-in fade-in">
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">
                    Order ID <span className="text-gray-400 font-normal">(if available)</span>
                  </label>
                  <input
                    type="text"
                    value={orderId}
                    onChange={(e) => setOrderId(e.target.value)}
                    placeholder="e.g. ord-1729000000"
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-gray-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono"
                  />
                </div>
              )}

              {/* Message */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  Your Message <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Tell us what you need help with..."
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-gray-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y transition-all"
                ></textarea>
              </div>

              {/* Submit Buttons */}
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full sm:w-auto px-6 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-98 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isSubmitting ? 'Sending Message...' : 'Submit Message'}</span>
                </button>

                <a
                  href={whatsappDirectUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full sm:w-auto px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <img src="/whatsapp.png" alt="WhatsApp" className="w-4 h-4 object-contain" />
                  <span>Prefer Instant WhatsApp? Click Here</span>
                </a>
              </div>
            </form>
          )}
        </div>

        {/* Right 1 Col: Customer Policy & Direct Social Links */}
        <div className="space-y-6">
          {/* Policy Overview Card */}
          <div className="bg-slate-900 text-white rounded-3xl p-6 border border-slate-800 space-y-4">
            <h3 className="text-sm font-bold tracking-tight text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span>XEEROO Guarantee</span>
            </h3>

            <div className="space-y-3 text-xs text-slate-300">
              <div className="flex items-start gap-2.5">
                <div className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                  <ShieldCheck className="w-3.5 h-3.5" />
                </div>
                <div>
                  <span className="font-bold text-white block">100% Genuine Tech</span>
                  <span className="text-[11px] text-slate-400">Authentic gadgets, accessories & hardware directly imported.</span>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <div className="w-6 h-6 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0 mt-0.5">
                  <Truck className="w-3.5 h-3.5" />
                </div>
                <div>
                  <span className="font-bold text-white block">Standard Shipping</span>
                  <span className="text-[11px] text-slate-400">Inside Dhaka: ৳70 | Outside Dhaka: ৳130. Cash on delivery available.</span>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <div className="w-6 h-6 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center shrink-0 mt-0.5">
                  <RotateCcw className="w-3.5 h-3.5" />
                </div>
                <div>
                  <span className="font-bold text-white block">7-Day Return Policy</span>
                  <span className="text-[11px] text-slate-400">Hassle-free replacement for defective items within 7 days.</span>
                </div>
              </div>
            </div>
          </div>

          {/* Social Channels */}
          <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-xs space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500">
              Official Social Profiles
            </h3>

            <div className="grid grid-cols-2 gap-2">
              <a
                href={XEEROO_CONTACT.facebook}
                target="_blank"
                rel="noreferrer"
                className="p-3 rounded-xl border border-gray-200 hover:border-blue-600 hover:bg-blue-50/50 flex items-center gap-2.5 transition-all group"
              >
                <img src="/facebook.png" alt="Facebook" className="w-5 h-5 object-contain" />
                <span className="text-xs font-bold text-gray-800 group-hover:text-blue-600">Facebook</span>
              </a>

              <a
                href={XEEROO_CONTACT.instagram}
                target="_blank"
                rel="noreferrer"
                className="p-3 rounded-xl border border-gray-200 hover:border-pink-600 hover:bg-pink-50/50 flex items-center gap-2.5 transition-all group"
              >
                <img src="/instagram.png" alt="Instagram" className="w-5 h-5 object-contain" />
                <span className="text-xs font-bold text-gray-800 group-hover:text-pink-600">Instagram</span>
              </a>

              <a
                href={XEEROO_CONTACT.messenger || 'https://m.me/xeeroo.0'}
                target="_blank"
                rel="noreferrer"
                className="p-3 rounded-xl border border-gray-200 hover:border-blue-500 hover:bg-blue-50/50 flex items-center gap-2.5 transition-all group"
              >
                <img src="/messenger.png" alt="Messenger" className="w-5 h-5 object-contain" />
                <span className="text-xs font-bold text-gray-800 group-hover:text-blue-500">Messenger</span>
              </a>

              <a
                href={XEEROO_CONTACT.whatsapp}
                target="_blank"
                rel="noreferrer"
                className="p-3 rounded-xl border border-gray-200 hover:border-emerald-600 hover:bg-emerald-50/50 flex items-center gap-2.5 transition-all group"
              >
                <img src="/whatsapp.png" alt="WhatsApp" className="w-5 h-5 object-contain" />
                <span className="text-xs font-bold text-gray-800 group-hover:text-emerald-600">WhatsApp</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useStore } from '../context/StoreContext';
import {
  X,
  User as UserIcon,
  Phone,
  Mail,
  Lock,
  MapPin,
  Save,
  CheckCircle2,
  Eye,
  EyeOff,
  Shield,
  Clock,
  UserCheck,
} from 'lucide-react';

export const CustomerSettingsModal: React.FC = () => {
  const {
    currentUser,
    isSettingsModalOpen,
    setIsSettingsModalOpen,
    updateUserProfile,
  } = useStore();

  const [activeTab, setActiveTab] = useState<'profile' | 'address' | 'security'>('profile');

  // Form states
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Address states
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [stateDistrict, setStateDistrict] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [country, setCountry] = useState('Bangladesh');

  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Populate from currentUser
  useEffect(() => {
    if (currentUser) {
      setFullName(currentUser.fullName || '');
      setEmail(currentUser.email || '');
      setPhone(currentUser.phone || '');
      setNewPassword('');
      setConfirmPassword('');
      setErrorMsg('');
      setSuccessMsg('');

      if (currentUser.address) {
        setStreet(currentUser.address.street || '');
        setCity(currentUser.address.city || '');
        setStateDistrict(currentUser.address.state || '');
        setPostalCode(currentUser.address.postalCode || '');
        setCountry(currentUser.address.country || 'Bangladesh');
      } else {
        setStreet('House 12, Road 4, Sector 7, Uttara');
        setCity('Dhaka');
        setStateDistrict('Dhaka');
        setPostalCode('1230');
        setCountry('Bangladesh');
      }
    }
  }, [currentUser, isSettingsModalOpen]);

  if (!isSettingsModalOpen || !currentUser) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!fullName.trim()) {
      setErrorMsg('Full Name cannot be empty.');
      return;
    }

    if (!email.trim() || !email.includes('@')) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }

    if (!phone.trim()) {
      setErrorMsg('Please enter a valid contact phone number.');
      return;
    }

    if (newPassword) {
      if (newPassword.length < 6) {
        setErrorMsg('New password must be at least 6 characters.');
        return;
      }
      if (newPassword !== confirmPassword) {
        setErrorMsg('New password and confirmation do not match.');
        return;
      }
    }

    const updatedAddress = {
      fullName: fullName.trim(),
      street: street.trim(),
      city: city.trim(),
      state: stateDistrict.trim(),
      postalCode: postalCode.trim(),
      country: country.trim() || 'Bangladesh',
      phone: phone.trim(),
    };

    const success = updateUserProfile({
      fullName: fullName.trim(),
      email: email.trim(),
      phone: phone.trim(),
      ...(newPassword ? { password: newPassword } : {}),
      address: updatedAddress,
    });

    if (success) {
      setSuccessMsg('Account details and shipping address updated successfully!');
      setTimeout(() => {
        setSuccessMsg('');
      }, 3000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-gray-200 overflow-hidden animate-in fade-in zoom-in-95 my-8">
        {/* Header */}
        <div className="px-6 py-5 bg-slate-950 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold">
              <UserIcon className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold tracking-tight">Account Settings & Profile</h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded uppercase font-bold bg-slate-800 text-slate-300">
                  {currentUser.role}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Manage your phone number, email, password, and delivery address
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsSettingsModalOpen(false)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status indicator bar */}
        <div className="px-6 py-2.5 bg-slate-50 border-b border-gray-100 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="text-gray-500">Account status:</span>
            {currentUser.approvalStatus === 'approved' ? (
              <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold">
                <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Verified / Approved for Orders</span>
              </span>
            ) : currentUser.approvalStatus === 'rejected' ? (
              <span className="inline-flex items-center gap-1 text-rose-700 font-semibold">
                <X className="w-3.5 h-3.5 text-rose-600" />
                <span>Rejected</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-amber-700 font-semibold">
                <Clock className="w-3.5 h-3.5 text-amber-600" />
                <span>Pending Admin Approval</span>
              </span>
            )}
          </div>
          <span className="font-mono text-[11px] text-gray-400">ID: {currentUser.id}</span>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-gray-200 px-6 pt-3 bg-white gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className={`pb-3 px-3 text-xs font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'profile'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            <UserIcon className="w-3.5 h-3.5" />
            <span>Profile & Contact</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('address')}
            className={`pb-3 px-3 text-xs font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'address'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>Shipping Address</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('security')}
            className={`pb-3 px-3 text-xs font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'security'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Password & Security</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg font-medium flex items-center gap-2">
              <X className="w-4 h-4 text-rose-500 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-lg font-medium flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* TAB 1: Profile & Contact */}
          {activeTab === 'profile' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Full Name
                </label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white focus:outline-none transition-all"
                    placeholder="e.g. Tanvir Hossain"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Contact Phone Number
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-emerald-500 absolute left-3 top-3" />
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white focus:outline-none transition-all font-mono"
                    placeholder="e.g. +880 1711-223344"
                  />
                </div>
                <p className="text-[11px] text-gray-500 mt-1">
                  Used by our delivery agents and order confirmation team.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-blue-500 absolute left-3 top-3" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white focus:outline-none transition-all font-mono"
                    placeholder="e.g. customer@xeeroo.com"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Shipping Address */}
          {activeTab === 'address' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <p className="text-xs text-gray-500">
                This address will be automatically pre-filled whenever you checkout orders on XEEROO.
              </p>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Street / House & Road Address
                </label>
                <textarea
                  rows={2}
                  required
                  value={street}
                  onChange={e => setStreet(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white focus:outline-none transition-all"
                  placeholder="House number, Flat/Apartment, Road, Area"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    City / Town
                  </label>
                  <input
                    type="text"
                    required
                    value={city}
                    onChange={e => setCity(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white focus:outline-none"
                    placeholder="e.g. Dhaka"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    District / Division
                  </label>
                  <input
                    type="text"
                    required
                    value={stateDistrict}
                    onChange={e => setStateDistrict(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white focus:outline-none"
                    placeholder="e.g. Dhaka Division"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Postal / Zip Code
                  </label>
                  <input
                    type="text"
                    required
                    value={postalCode}
                    onChange={e => setPostalCode(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white focus:outline-none font-mono"
                    placeholder="e.g. 1230"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Country
                  </label>
                  <input
                    type="text"
                    required
                    value={country}
                    onChange={e => setCountry(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white focus:outline-none"
                    placeholder="Bangladesh"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Security & Password */}
          {activeTab === 'security' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl text-xs text-blue-800">
                Leave the password fields blank if you do not wish to change your current password.
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  New Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    className="w-full pl-9 pr-10 py-2.5 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white focus:outline-none transition-all font-mono"
                    placeholder="Enter new password (min. 6 characters)"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Confirm New Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white focus:outline-none transition-all font-mono"
                    placeholder="Repeat new password"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-4 border-t border-gray-200 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setIsSettingsModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Save Changes</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useStore } from '../context/StoreContext';
import { BANGLADESH_DISTRICTS } from '../data/bangladeshDistricts';
import { UserGender } from '../types';
import { UserAvatar } from './common/UserAvatar';
import { isValidBDPhone } from '../utils/shipping';
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
  Clock,
  UserCheck,
  ChevronDown,
  ShieldCheck,
} from 'lucide-react';

export const CustomerSettingsModal: React.FC = () => {
  const {
    currentUser,
    isSettingsModalOpen,
    setIsSettingsModalOpen,
    settingsModalInitialTab,
    updateUserProfile,
  } = useStore();

  const addressSectionRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Form states
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [gender, setGender] = useState<UserGender>('male');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Address states (District, Thana dropdowns)
  const [street, setStreet] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('Dhaka');
  const [selectedThana, setSelectedThana] = useState('Uttara East');
  const [country, setCountry] = useState('Bangladesh');

  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Sorted districts list
  const districtList = useMemo(() => {
    return [...BANGLADESH_DISTRICTS].sort((a, b) => a.name.localeCompare(b.name));
  }, []);

  // Available thanas for selected district
  const availableThanas = useMemo(() => {
    const matched = BANGLADESH_DISTRICTS.find(d => d.name.toLowerCase() === selectedDistrict.toLowerCase());
    return matched ? matched.thanas : [];
  }, [selectedDistrict]);

  const handleDistrictChange = (districtName: string) => {
    setSelectedDistrict(districtName);
    const matched = BANGLADESH_DISTRICTS.find(d => d.name.toLowerCase() === districtName.toLowerCase());
    if (matched && matched.thanas.length > 0) {
      setSelectedThana(matched.thanas[0]);
    } else {
      setSelectedThana('');
    }
  };

  // Populate from currentUser
  useEffect(() => {
    if (currentUser) {
      setFullName(currentUser.fullName || '');
      setEmail(currentUser.email || '');
      setPhone(currentUser.phone || '');
      setGender(currentUser.gender || 'male');
      setNewPassword('');
      setConfirmPassword('');
      setErrorMsg('');
      setSuccessMsg('');

      if (currentUser.address) {
        setStreet(currentUser.address.street || '');
        const currentDist = currentUser.address.district || currentUser.address.city || 'Dhaka';
        const matched = BANGLADESH_DISTRICTS.find(d => d.name.toLowerCase() === currentDist.toLowerCase());
        if (matched) {
          setSelectedDistrict(matched.name);
          const currentThana = currentUser.address.thana || currentUser.address.state || '';
          if (currentThana && matched.thanas.includes(currentThana)) {
            setSelectedThana(currentThana);
          } else if (matched.thanas.length > 0) {
            setSelectedThana(matched.thanas[0]);
          }
        }
        setCountry(currentUser.address.country || 'Bangladesh');
      } else {
        setStreet('');
        setSelectedDistrict('Dhaka');
        setSelectedThana('Uttara East');
        setCountry('Bangladesh');
      }
    }
  }, [currentUser, isSettingsModalOpen]);

  // Smooth scroll if target was address
  useEffect(() => {
    if (isSettingsModalOpen && settingsModalInitialTab === 'address') {
      setTimeout(() => {
        addressSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 150);
    }
  }, [isSettingsModalOpen, settingsModalInitialTab]);

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

    if (!isValidBDPhone(phone)) {
      setErrorMsg('Please enter a valid 11-digit Bangladeshi mobile number starting with 013-019 (e.g. 017XXXXXXXX).');
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

    setIsSaving(true);
    try {
      const updatedAddress = {
        fullName: fullName.trim(),
        street: street.trim(),
        city: selectedDistrict,
        state: selectedThana,
        district: selectedDistrict,
        thana: selectedThana,
        country: country.trim() || 'Bangladesh',
        phone: phone.trim(),
      };

      const success = updateUserProfile({
        fullName: fullName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        gender,
        ...(newPassword ? { password: newPassword } : {}),
        address: updatedAddress,
      });

      if (success) {
        setSuccessMsg('All account details and delivery address updated successfully!');
        setNewPassword('');
        setConfirmPassword('');
        setTimeout(() => {
          setSuccessMsg('');
        }, 3500);
      }
    } catch (err: unknown) {
      const error = err as { message?: string };
      setErrorMsg(error.message || 'Failed to update profile.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-gray-200 overflow-hidden animate-in fade-in zoom-in-95 my-6 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-950 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold shadow-xs">
              <UserIcon className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold tracking-tight">Account Settings</h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded uppercase font-bold bg-slate-800 text-slate-300">
                  {currentUser.role}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Update personal details, delivery address, and security in one single form
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
        <div className="px-6 py-2 bg-slate-50 border-b border-gray-100 flex items-center justify-between text-xs shrink-0">
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

        {/* Form Body - Single Unified Tab / View */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div
            ref={scrollContainerRef}
            className="p-6 overflow-y-auto space-y-6 flex-1 min-h-0"
          >
            {errorMsg && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl font-medium flex items-center gap-2 animate-in fade-in">
                <X className="w-4 h-4 text-rose-500 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-xl font-medium flex items-center gap-2 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* SECTION 1: Personal Profile & Gender Sign */}
            <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                <UserIcon className="w-4 h-4 text-blue-600" />
                <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
                  Personal Information & Profile Sign
                </h4>
              </div>

              {/* Avatar Preview */}
              <div className="flex items-center gap-4 p-3 bg-slate-50 rounded-xl border border-slate-200">
                <UserAvatar
                  user={{ ...currentUser, fullName, gender }}
                  gender={gender}
                  role={currentUser.role}
                  size="lg"
                  showSignBadge={true}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-gray-900 truncate">{fullName || 'Your Name'}</h4>
                    <span
                      className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded uppercase ${
                        gender === 'female'
                          ? 'bg-pink-100 text-pink-700'
                          : gender === 'male'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {gender === 'female' ? 'Female (♀)' : gender === 'male' ? 'Male (♂)' : 'Other'}
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-500 mt-0.5">
                    Select your gender sign below. It displays on your avatar across the store.
                  </p>
                </div>
              </div>

              {/* Gender Selection Dropdown */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Account Gender & Sign <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <select
                    value={gender}
                    onChange={e => setGender(e.target.value as UserGender)}
                    className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white focus:outline-none appearance-none pr-8 cursor-pointer font-medium text-gray-900"
                  >
                    <option value="male">Male (♂) - Male Sign Avatar</option>
                    <option value="female">Female (♀) - Female Sign Avatar</option>
                    <option value="other">Other (👤) - Neutral Avatar</option>
                  </select>
                  <ChevronDown className="w-4 h-4 text-gray-400 absolute right-2.5 top-2.5 pointer-events-none" />
                </div>
              </div>

              {/* Name & Phone in grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Full Name <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <UserIcon className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={e => setFullName(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white focus:outline-none transition-all font-medium text-gray-900"
                      placeholder="e.g. Tanvir Hossain"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Contact Phone Number <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-emerald-500 absolute left-3 top-3" />
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white focus:outline-none transition-all font-mono font-medium text-gray-900"
                      placeholder="017XXXXXXXX"
                    />
                  </div>
                  <p className="text-[10px] text-gray-500 mt-1">
                    Used for order delivery calls and status confirmation.
                  </p>
                </div>
              </div>

              {/* Email Address */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Email Address <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-blue-500 absolute left-3 top-3" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white focus:outline-none transition-all font-mono font-medium text-gray-900"
                    placeholder="e.g. user@xeeroo.com"
                  />
                </div>
              </div>
            </div>

            {/* SECTION 2: Default Shipping / Delivery Address */}
            <div
              ref={addressSectionRef}
              id="shipping-address-section"
              className="bg-white rounded-xl border border-gray-200 p-4 space-y-4"
            >
              <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-emerald-600" />
                  <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
                    Shipping & Delivery Address
                  </h4>
                </div>
                <span className="text-[11px] text-gray-500 font-medium">Pre-filled at checkout</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Street / House & Road Address
                </label>
                <textarea
                  rows={2}
                  value={street}
                  onChange={e => setStreet(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white focus:outline-none transition-all font-medium text-gray-900"
                  placeholder="House number, Flat/Apartment, Road, Area"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    District <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <select
                      value={selectedDistrict}
                      onChange={e => handleDistrictChange(e.target.value)}
                      required
                      className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white focus:outline-none appearance-none pr-8 cursor-pointer font-medium text-gray-900"
                    >
                      {districtList.map(dist => (
                        <option key={dist.name} value={dist.name}>
                          {dist.name}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="w-4 h-4 text-gray-400 absolute right-2.5 top-2.5 pointer-events-none" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Thana / Upazila <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <select
                      value={selectedThana}
                      onChange={e => setSelectedThana(e.target.value)}
                      required
                      className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white focus:outline-none appearance-none pr-8 cursor-pointer font-medium text-gray-900"
                    >
                      {availableThanas.map(th => (
                        <option key={th} value={th}>
                          {th}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="w-4 h-4 text-gray-400 absolute right-2.5 top-2.5 pointer-events-none" />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Country
                </label>
                <input
                  type="text"
                  required
                  readOnly
                  value={country}
                  className="w-full px-3 py-2 text-xs bg-gray-100 border border-gray-200 rounded-xl text-gray-600 cursor-not-allowed font-medium"
                />
              </div>
            </div>

            {/* SECTION 3: Security & Password */}
            <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-purple-600" />
                  <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
                    Password & Security (Optional)
                  </h4>
                </div>
                <span className="text-[11px] text-gray-500">Leave blank to keep existing password</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                      className="w-full pl-9 pr-10 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white focus:outline-none transition-all font-mono text-gray-900"
                      placeholder="Min. 6 characters"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 cursor-pointer"
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
                      className="w-full pl-9 pr-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white focus:outline-none transition-all font-mono text-gray-900"
                      placeholder="Repeat new password"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons - Sticky Footer */}
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between gap-3 shrink-0">
            <button
              type="button"
              onClick={() => setIsSettingsModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-200/80 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Saving...' : 'Save All Changes'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

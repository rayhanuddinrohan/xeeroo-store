/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useStore } from '../../context/StoreContext';
import { BANGLADESH_DISTRICTS } from '../../data/bangladeshDistricts';
import { UserGender } from '../../types';
import { UserAvatar } from '../common/UserAvatar';
import { isValidBDPhone } from '../../utils/shipping';
import {
  User as UserIcon,
  Phone,
  Mail,
  Lock,
  MapPin,
  Save,
  CheckCircle2,
  Eye,
  EyeOff,
  ShieldCheck,
  ChevronDown,
} from 'lucide-react';

export const AccountSettingsTab: React.FC = () => {
  const { currentUser, updateUserProfile, addToast } = useStore();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [gender, setGender] = useState<UserGender>('male');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Address states
  const [street, setStreet] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('Dhaka');
  const [selectedThana, setSelectedThana] = useState('Uttara East');
  const [country, setCountry] = useState('Bangladesh');

  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const districtList = useMemo(() => {
    return [...BANGLADESH_DISTRICTS].sort((a, b) => a.name.localeCompare(b.name));
  }, []);

  const availableThanas = useMemo(() => {
    const matched = BANGLADESH_DISTRICTS.find(
      d => d.name.toLowerCase() === selectedDistrict.toLowerCase()
    );
    return matched ? matched.thanas : [];
  }, [selectedDistrict]);

  const handleDistrictChange = (districtName: string) => {
    setSelectedDistrict(districtName);
    const matched = BANGLADESH_DISTRICTS.find(
      d => d.name.toLowerCase() === districtName.toLowerCase()
    );
    if (matched && matched.thanas.length > 0) {
      setSelectedThana(matched.thanas[0]);
    } else {
      setSelectedThana('');
    }
  };

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
        const currentDist =
          currentUser.address.district || currentUser.address.city || 'Dhaka';
        const matched = BANGLADESH_DISTRICTS.find(
          d => d.name.toLowerCase() === currentDist.toLowerCase()
        );
        if (matched) {
          setSelectedDistrict(matched.name);
          const currentThana =
            currentUser.address.thana || currentUser.address.state || '';
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
  }, [currentUser]);

  if (!currentUser) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border border-gray-200">
        <p className="text-sm text-gray-500">Please sign in to view account settings.</p>
      </div>
    );
  }

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
      setErrorMsg(
        'Please enter a valid 11-digit Bangladeshi mobile number starting with 013-019 (e.g. 017XXXXXXXX).'
      );
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
        setSuccessMsg('Account details and delivery address updated successfully!');
        addToast('Account details and delivery address updated successfully!', 'success');
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (err: unknown) {
      const error = err as { message?: string };
      setErrorMsg(error.message || 'Failed to update profile.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Account Overview Card */}
      <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <UserAvatar
            user={currentUser}
            gender={gender}
            role={currentUser.role}
            size="lg"
            showSignBadge={true}
          />
          <div>
            <h2 className="text-lg font-bold text-gray-900">{currentUser.fullName}</h2>
            <p className="text-xs text-gray-500 font-mono">{currentUser.email || currentUser.phone}</p>
            <div className="flex items-center gap-2 mt-1.5">
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                  currentUser.role === 'admin'
                    ? 'bg-purple-100 text-purple-700 border border-purple-200'
                    : currentUser.role === 'moderator'
                    ? 'bg-amber-100 text-amber-800 border border-amber-200'
                    : 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                }`}
              >
                {currentUser.role === 'admin'
                  ? 'Administrator'
                  : currentUser.role === 'moderator'
                  ? 'Operations Staff'
                  : 'Verified Customer'}
              </span>
              <span className="text-[10px] text-gray-400">
                Joined: {currentUser.createdAt ? new Date(currentUser.createdAt).toLocaleDateString() : 'Active Member'}
              </span>
            </div>
          </div>
        </div>

        <div className="text-right sm:text-right w-full sm:w-auto">
          <span className="text-xs text-gray-500 block">Personal Profile & Address</span>
          <span className="text-xs font-bold text-blue-600">Syncs Across All Devices</span>
        </div>
      </div>

      {/* Main Settings Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-200 shadow-xs p-6 space-y-6">
        {errorMsg && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium">
            {errorMsg}
          </div>
        )}

        {successMsg && (
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-700 font-medium flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* SECTION 1: Personal Details */}
        <div>
          <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
            <UserIcon className="w-4 h-4 text-blue-600" />
            <span>Personal Information</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Full Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                placeholder="Your legal full name"
                className="w-full px-3.5 py-2.5 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Gender Selection
              </label>
              <select
                value={gender}
                onChange={e => setGender(e.target.value as UserGender)}
                className="w-full px-3.5 py-2.5 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer"
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Email Address <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full pl-9 pr-3.5 py-2.5 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  required
                />
                <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Phone Number (Bangladesh 11 Digits) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="tel"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="017XXXXXXXX"
                  maxLength={11}
                  className="w-full pl-9 pr-3.5 py-2.5 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono"
                  required
                />
                <Phone className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 2: Default Delivery Address */}
        <div className="pt-4 border-t border-gray-100">
          <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-blue-600" />
            <span>Default Delivery Address (Bangladesh)</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                District <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <select
                  value={selectedDistrict}
                  onChange={e => handleDistrictChange(e.target.value)}
                  className="w-full appearance-none px-3.5 py-2.5 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer pr-8"
                >
                  {districtList.map(dist => (
                    <option key={dist.name} value={dist.name}>
                      {dist.name} ({dist.division})
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-3 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Thana / Police Station <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <select
                  value={selectedThana}
                  onChange={e => setSelectedThana(e.target.value)}
                  className="w-full appearance-none px-3.5 py-2.5 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer pr-8"
                >
                  {availableThanas.map((thana, idx) => (
                    <option key={idx} value={thana}>
                      {thana}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-3 pointer-events-none" />
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Detailed Street Address, House & Road <span className="text-rose-500">*</span>
              </label>
              <textarea
                value={street}
                onChange={e => setStreet(e.target.value)}
                placeholder="e.g. House #14, Road #04, Sector #11, Uttara"
                rows={2}
                className="w-full px-3.5 py-2.5 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none"
              />
            </div>
          </div>
        </div>

        {/* SECTION 3: Change Password */}
        <div className="pt-4 border-t border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <Lock className="w-4 h-4 text-blue-600" />
              <span>Change Account Password</span>
            </h3>
            <span className="text-[11px] text-gray-400 font-normal">Leave blank if no change</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                New Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  className="w-full pl-9 pr-9 py-2.5 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
                <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Confirm New Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="Repeat new password"
                  className="w-full pl-9 pr-9 py-2.5 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
                <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
              </div>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="pt-4 border-t border-gray-100 flex items-center justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Saving Changes...' : 'Save Changes'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { BrandLogo } from './common/BrandLogo';
import { isValidBDPhone } from '../utils/shipping';
import {
  X,
  Lock,
  Mail,
  AlertCircle,
  Eye,
  EyeOff,
  Loader2,
  ArrowRight,
  User,
  Phone,
  CheckCircle2,
  Sparkles,
  KeyRound,
  ShoppingBag,
} from 'lucide-react';

export const AuthModal: React.FC = () => {
  const {
    isAuthModalOpen,
    setIsAuthModalOpen,
    authModalTab,
    setAuthModalTab,
    login,
    register,
    loginWithGoogle,
    loginWithGooglePopup,
    resetPassword,
    setViewMode,
  } = useStore();

  // Common Form States
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Login Form State
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Registration Form State
  const [regFullName, setRegFullName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(true);

  // Forgot Password State
  const [forgotIdentifier, setForgotIdentifier] = useState('');
  const [forgotSent, setForgotSent] = useState(false);
  const [directResetMode, setDirectResetMode] = useState(false);
  const [newDirectPassword, setNewDirectPassword] = useState('');
  const [confirmDirectPassword, setConfirmDirectPassword] = useState('');
  const [showDirectPassword, setShowDirectPassword] = useState(false);
  const [forgotEmailSentMsg, setForgotEmailSentMsg] = useState('');

  // Password strength helper
  const getPasswordStrength = (pwd: string) => {
    if (!pwd) return null;
    if (pwd.length < 6) return { label: 'Weak (at least 6 characters required)', score: 1, color: 'bg-rose-500', text: 'text-rose-600' };
    const hasNum = /\d/.test(pwd);
    const hasSpecialOrUpper = /[A-Z!@#$%^&*(),.?":{}|<>]/.test(pwd);
    if (pwd.length >= 8 && hasNum && hasSpecialOrUpper) {
      return { label: 'Strong', score: 3, color: 'bg-emerald-500', text: 'text-emerald-600' };
    }
    if (hasNum || hasSpecialOrUpper || pwd.length >= 8) {
      return { label: 'Good', score: 2, color: 'bg-amber-500', text: 'text-amber-600' };
    }
    return { label: 'Weak', score: 1, color: 'bg-rose-500', text: 'text-rose-600' };
  };

  const pwdStrength = getPasswordStrength(regPassword);
  const passwordsMatch = regPassword.length >= 6 && regConfirmPassword.length >= 6 && regPassword === regConfirmPassword;

  if (!isAuthModalOpen) return null;

  const handleClose = () => {
    setIsAuthModalOpen(false);
    setErrorMsg('');
    setSuccessMsg('');
    setForgotSent(false);
    setDirectResetMode(false);
    setNewDirectPassword('');
    setConfirmDirectPassword('');
  };

  const switchTab = (tab: 'login' | 'register' | 'forgot-password') => {
    setAuthModalTab(tab);
    setErrorMsg('');
    setSuccessMsg('');
    setForgotSent(false);
    setDirectResetMode(false);
    setNewDirectPassword('');
    setConfirmDirectPassword('');
  };

  // Unified Login Handler (Admin & Customer)
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginIdentifier.trim() || !loginPassword.trim()) {
      setErrorMsg('Please enter your email or phone number and password.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');
    try {
      const res = await login(loginIdentifier.trim(), loginPassword);
      if (res.success && res.user) {
        setIsAuthModalOpen(false);
        setLoginIdentifier('');
        setLoginPassword('');
        if (res.user.role === 'admin' || res.user.role === 'moderator') {
          setViewMode('dashboard');
        }
      } else {
        setErrorMsg(res.message || 'Invalid email/phone or password.');
      }
    } catch (err: unknown) {
      const error = err as { message?: string };
      setErrorMsg(error.message || 'Error signing in. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Customer Registration Handler
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!regFullName.trim()) {
      setErrorMsg('Please enter your full name.');
      return;
    }
    if (!isValidBDPhone(regPhone)) {
      setErrorMsg('Please enter a valid 11-digit Bangladeshi mobile number starting with 013-019 (e.g. 017XXXXXXXX).');
      return;
    }
    if (!regEmail.trim() || !regEmail.includes('@')) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }
    if (regPassword.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      return;
    }
    if (regPassword !== regConfirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }
    if (!agreeTerms) {
      setErrorMsg('Please agree to the Terms of Service and Privacy Policy.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await register({
        fullName: regFullName.trim(),
        email: regEmail.trim(),
        phone: regPhone.trim(),
        password: regPassword,
      });

      if (res.success) {
        setSuccessMsg('Congratulations! Your account has been created successfully.');
        setTimeout(() => {
          setIsAuthModalOpen(false);
          setRegFullName('');
          setRegEmail('');
          setRegPhone('');
          setRegPassword('');
          setRegConfirmPassword('');
        }, 800);
      } else {
        setErrorMsg(res.message || 'Registration failed.');
      }
    } catch (err: unknown) {
      const error = err as { message?: string };
      setErrorMsg(error.message || 'Registration failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Google Sign-In Handler
  const handleGoogleSignIn = async () => {
    setIsSubmitting(true);
    setErrorMsg('');
    try {
      const res = await loginWithGooglePopup();
      if (res.success && res.user) {
        setIsAuthModalOpen(false);
        if (res.user.role === 'admin' || res.user.role === 'moderator') {
          setViewMode('dashboard');
        }
      } else {
        setErrorMsg(res.message || 'Google sign-in could not be completed. Please try again.');
      }
    } catch (err: unknown) {
      const error = err as { message?: string };
      setErrorMsg(error.message || 'Google sign-in failed. Please try again or sign in with email.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Forgot Password Handler
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotIdentifier.trim()) {
      setErrorMsg('Please enter your registered email address or phone number.');
      return;
    }

    if (directResetMode) {
      if (!newDirectPassword || newDirectPassword.length < 6) {
        setErrorMsg('New password must be at least 6 characters long.');
        return;
      }
      if (newDirectPassword !== confirmDirectPassword) {
        setErrorMsg('Passwords do not match. Please verify both inputs.');
        return;
      }
    }

    setIsSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const res = await resetPassword(
        forgotIdentifier.trim(),
        directResetMode ? newDirectPassword.trim() : undefined
      );

      if (res.success) {
        setForgotSent(true);
        if (directResetMode) {
          setSuccessMsg('Your password has been updated successfully! You can now sign in.');
        } else {
          setForgotEmailSentMsg(res.message);
          setSuccessMsg(res.message);
        }
      } else {
        if (res.canDirectReset) {
          setDirectResetMode(true);
          setErrorMsg(res.message);
        } else {
          setErrorMsg(res.message || 'No account found with this identifier.');
        }
      }
    } catch (err: unknown) {
      const error = err as { message?: string };
      setErrorMsg(error.message || 'Failed to send recovery request.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden transform transition-all my-8">
        
        {/* Header */}
        <div className="relative p-6 text-white text-center transition-all duration-300 bg-gradient-to-br from-slate-950 via-blue-950 to-indigo-950">
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 text-slate-400 hover:text-white p-1.5 rounded-full hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex justify-center mb-2">
            <BrandLogo size="lg" showText={true} textColor="text-white" />
          </div>
          <p className="text-xs text-slate-300 mt-1">
            {authModalTab === 'login' && 'Sign in to your account for faster checkout & tracking'}
            {authModalTab === 'register' && 'Create your account to start ordering online'}
            {authModalTab === 'forgot-password' && 'Enter your details to reset your password'}
          </p>

          {/* Top Switcher Tabs (Login / Register) */}
          {authModalTab !== 'forgot-password' && (
            <div className="flex bg-slate-900/60 p-1 rounded-2xl mt-4 border border-white/10">
              <button
                type="button"
                onClick={() => switchTab('login')}
                className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                  authModalTab === 'login'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                Login
              </button>
              <button
                type="button"
                onClick={() => switchTab('register')}
                className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                  authModalTab === 'register'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                Sign Up
              </button>
            </div>
          )}
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Error Message Alert */}
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-start gap-2.5 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
              <span className="font-medium">{errorMsg}</span>
            </div>
          )}

          {/* Success Message Alert */}
          {successMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-start gap-2.5 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
              <span className="font-semibold">{successMsg}</span>
            </div>
          )}

          {/* TAB 1: LOGIN */}
          {authModalTab === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Email or Phone Number *
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    value={loginIdentifier}
                    onChange={(e) => setLoginIdentifier(e.target.value)}
                    placeholder="example@mail.com or 017XXXXXXXX"
                    className="w-full pl-10 pr-3 py-2.5 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white focus:outline-none transition-all font-medium text-gray-900"
                    required
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-gray-700">
                    Password *
                  </label>
                  <button
                    type="button"
                    onClick={() => switchTab('forgot-password')}
                    className="text-[11px] font-semibold text-blue-600 hover:text-blue-800 cursor-pointer"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
                  <input
                    type={showLoginPassword ? 'text' : 'password'}
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-10 py-2.5 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white focus:outline-none transition-all font-mono text-gray-900"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPassword(!showLoginPassword)}
                    className="absolute right-3.5 top-2.5 text-gray-400 hover:text-gray-600 p-0.5 cursor-pointer"
                  >
                    {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-gray-600 pt-1">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                  />
                  <span>Remember me</span>
                </label>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-lg shadow-blue-600/20 transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 hover:scale-[1.01] active:scale-98"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              {/* Google Sign-in Alternative */}
              <div className="relative flex py-1 items-center">
                <div className="flex-grow border-t border-gray-200"></div>
                <span className="flex-shrink mx-3 text-[11px] text-gray-400 font-medium">OR</span>
                <div className="flex-grow border-t border-gray-200"></div>
              </div>

              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleGoogleSignIn}
                className="w-full py-2.5 px-4 rounded-xl border border-gray-200 hover:border-gray-300 bg-white hover:bg-gray-50 text-gray-700 font-semibold text-xs shadow-xs transition-all cursor-pointer flex items-center justify-center gap-2.5 disabled:opacity-50"
              >
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <span>Continue with Google</span>
              </button>
              {/* Switch to Registration */}
              <div className="text-center pt-2">
                <p className="text-xs text-gray-500">
                  Don't have an account yet?{' '}
                  <button
                    type="button"
                    onClick={() => switchTab('register')}
                    className="font-bold text-blue-600 hover:text-blue-800 cursor-pointer underline underline-offset-2"
                  >
                    Create Account
                  </button>
                </p>
              </div>
            </form>
          )}

          {/* TAB 2: REGISTRATION */}
          {authModalTab === 'register' && (
            <form onSubmit={handleRegister} className="space-y-3.5">
              {/* Full Name */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Full Name *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    value={regFullName}
                    onChange={(e) => setRegFullName(e.target.value)}
                    placeholder="e.g. Tanvir Ahmed"
                    className="w-full pl-10 pr-3 py-2.5 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white focus:outline-none transition-all font-medium text-gray-900"
                    required
                  />
                </div>
              </div>

              {/* Phone Number */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Mobile Phone Number *
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
                  <input
                    type="tel"
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
                    placeholder="017XXXXXXXX"
                    className="w-full pl-10 pr-3 py-2.5 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white focus:outline-none transition-all font-mono text-gray-900"
                    required
                  />
                </div>
              </div>

              {/* Email Address */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Email Address *
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
                  <input
                    type="email"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="customer@example.com"
                    className="w-full pl-10 pr-3 py-2.5 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white focus:outline-none transition-all font-medium text-gray-900"
                    required
                  />
                </div>
              </div>

              {/* Password */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Password *
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
                    <input
                      type={showRegPassword ? 'text' : 'password'}
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      placeholder="At least 6 chars"
                      className="w-full pl-10 pr-3 py-2.5 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white focus:outline-none transition-all font-mono text-gray-900"
                      required
                      minLength={6}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Confirm Password *
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
                    <input
                      type={showRegPassword ? 'text' : 'password'}
                      value={regConfirmPassword}
                      onChange={(e) => setRegConfirmPassword(e.target.value)}
                      placeholder="Repeat password"
                      className="w-full pl-10 pr-3 py-2.5 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white focus:outline-none transition-all font-mono text-gray-900"
                      required
                      minLength={6}
                    />
                  </div>
                </div>
              </div>

              {/* Password Strength & Match Feedback */}
              {regPassword.length > 0 && (
                <div className="space-y-1.5 p-2 bg-gray-50 rounded-xl border border-gray-100 text-[11px]">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Password strength:</span>
                    {pwdStrength && (
                      <span className={`font-bold ${pwdStrength.text}`}>{pwdStrength.label}</span>
                    )}
                  </div>
                  <div className="flex gap-1.5 h-1.5 w-full">
                    <div
                      className={`h-full flex-1 rounded-full transition-colors ${
                        (pwdStrength?.score || 0) >= 1
                          ? pwdStrength?.score === 1
                            ? 'bg-rose-500'
                            : pwdStrength?.score === 2
                            ? 'bg-amber-500'
                            : 'bg-emerald-500'
                          : 'bg-gray-200'
                      }`}
                    ></div>
                    <div
                      className={`h-full flex-1 rounded-full transition-colors ${
                        (pwdStrength?.score || 0) >= 2
                          ? pwdStrength?.score === 2
                            ? 'bg-amber-500'
                            : 'bg-emerald-500'
                          : 'bg-gray-200'
                      }`}
                    ></div>
                    <div
                      className={`h-full flex-1 rounded-full transition-colors ${
                        (pwdStrength?.score || 0) >= 3 ? 'bg-emerald-500' : 'bg-gray-200'
                      }`}
                    ></div>
                  </div>

                  {regConfirmPassword.length > 0 && (
                    <div className="pt-1">
                      {passwordsMatch ? (
                        <span className="text-emerald-700 font-semibold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Passwords match correctly</span>
                        </span>
                      ) : (
                        <span className="text-rose-600 font-semibold flex items-center gap-1">
                          <AlertCircle className="w-3.5 h-3.5 text-rose-500" />
                          <span>Passwords do not match</span>
                        </span>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Show Password Toggle */}
              <div className="flex items-center justify-between text-[11px] text-gray-500">
                <button
                  type="button"
                  onClick={() => setShowRegPassword(!showRegPassword)}
                  className="flex items-center gap-1.5 hover:text-gray-700 cursor-pointer"
                >
                  {showRegPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  <span>{showRegPassword ? 'Hide password' : 'Show password'}</span>
                </button>
              </div>

              {/* Terms Checkbox */}
              <label className="flex items-start gap-2 text-[11px] text-gray-600 cursor-pointer select-none pt-1">
                <input
                  type="checkbox"
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                  className="w-4 h-4 mt-0.5 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                  required
                />
                <span>
                  I agree to the XEEROO Terms of Service and Privacy Policy.
                </span>
              </label>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-lg shadow-blue-600/20 transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 hover:scale-[1.01] active:scale-98"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Creating account...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-amber-300" />
                    <span>Create Account</span>
                  </>
                )}
              </button>

              {/* Google Sign-Up Alternative */}
              <div className="relative flex py-1 items-center">
                <div className="flex-grow border-t border-gray-200"></div>
                <span className="flex-shrink mx-3 text-[11px] text-gray-400 font-medium">OR</span>
                <div className="flex-grow border-t border-gray-200"></div>
              </div>

              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleGoogleSignIn}
                className="w-full py-2.5 px-4 rounded-xl border border-gray-200 hover:border-gray-300 bg-white hover:bg-gray-50 text-gray-700 font-semibold text-xs shadow-xs transition-all cursor-pointer flex items-center justify-center gap-2.5 disabled:opacity-50"
              >
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <span>Sign up with Google</span>
              </button>
              {/* Switch to Login */}

              <div className="text-center pt-2">
                <p className="text-xs text-gray-500">
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => switchTab('login')}
                    className="font-bold text-blue-600 hover:text-blue-800 cursor-pointer underline underline-offset-2"
                  >
                    Sign in here
                  </button>
                </p>
              </div>
            </form>
          )}

          {/* TAB 3: FORGOT PASSWORD */}
          {authModalTab === 'forgot-password' && (
            <div className="space-y-4">
              {!forgotSent ? (
                <form onSubmit={handleForgotPassword} className="space-y-4">
                  {/* Mode Toggle Button */}
                  <div className="flex items-center justify-between pb-1 border-b border-gray-100">
                    <span className="text-[11px] font-bold text-gray-700">
                      {directResetMode ? 'Direct Password Reset' : 'Email Reset Link'}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setDirectResetMode(!directResetMode);
                        setErrorMsg('');
                      }}
                      className="text-[11px] font-bold text-blue-600 hover:text-blue-800 underline underline-offset-2 cursor-pointer"
                    >
                      {directResetMode ? '← Send email link instead' : '⚡ Set new password directly'}
                    </button>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Registered Email or Phone Number *
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
                      <input
                        type="text"
                        value={forgotIdentifier}
                        onChange={(e) => setForgotIdentifier(e.target.value)}
                        placeholder="your-email@example.com or 017XXXXXXXX"
                        className="w-full pl-10 pr-3 py-2.5 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white focus:outline-none transition-all font-medium text-gray-900"
                        required
                      />
                    </div>
                  </div>

                  {/* Direct Password Reset Fields */}
                  {directResetMode ? (
                    <div className="space-y-3 p-3 bg-blue-50/70 border border-blue-200 rounded-2xl animate-in fade-in">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="block text-xs font-bold text-blue-950">
                            New Password *
                          </label>
                          <button
                            type="button"
                            onClick={() => setShowDirectPassword(!showDirectPassword)}
                            className="text-[10px] text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
                          >
                            {showDirectPassword ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                            <span>{showDirectPassword ? 'Hide' : 'Show'}</span>
                          </button>
                        </div>
                        <div className="relative">
                          <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
                          <input
                            type={showDirectPassword ? 'text' : 'password'}
                            value={newDirectPassword}
                            onChange={(e) => setNewDirectPassword(e.target.value)}
                            placeholder="At least 6 characters"
                            className="w-full pl-10 pr-3 py-2 text-xs bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none font-medium text-gray-900"
                            required
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-blue-950 mb-1">
                          Confirm New Password *
                        </label>
                        <div className="relative">
                          <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
                          <input
                            type={showDirectPassword ? 'text' : 'password'}
                            value={confirmDirectPassword}
                            onChange={(e) => setConfirmDirectPassword(e.target.value)}
                            placeholder="Repeat new password"
                            className="w-full pl-10 pr-3 py-2 text-xs bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none font-medium text-gray-900"
                            required
                          />
                        </div>
                        {confirmDirectPassword && (
                          <p className="text-[10px] mt-1 font-semibold flex items-center gap-1">
                            {newDirectPassword === confirmDirectPassword ? (
                              <span className="text-emerald-700 flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                Passwords match
                              </span>
                            ) : (
                              <span className="text-rose-600 flex items-center gap-1">
                                <AlertCircle className="w-3 h-3 text-rose-500" />
                                Passwords do not match
                              </span>
                            )}
                          </p>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-xl text-[11px] text-amber-900 space-y-1">
                      <div className="font-bold flex items-center gap-1 text-amber-950">
                        <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                        <span>How reset email works:</span>
                      </div>
                      <p className="leading-relaxed text-amber-800">
                        Firebase will dispatch a reset link from <code className="font-mono bg-white/80 px-1 py-0.5 rounded text-amber-950 font-bold">noreply@...firebaseapp.com</code>.
                      </p>
                      <p className="text-amber-800">
                        ⚠️ <strong>Important:</strong> Check your <strong>Spam / Junk</strong> folder if not in primary Inbox.
                      </p>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Processing request...</span>
                      </>
                    ) : directResetMode ? (
                      <>
                        <KeyRound className="w-4 h-4" />
                        <span>Update Password Now</span>
                      </>
                    ) : (
                      <>
                        <Mail className="w-4 h-4" />
                        <span>Send Firebase Reset Link</span>
                      </>
                    )}
                  </button>
                </form>
              ) : (
                <div className="text-center p-5 bg-emerald-50 rounded-2xl border border-emerald-200 space-y-3 animate-in fade-in">
                  <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto text-emerald-600">
                    <CheckCircle2 className="w-7 h-7" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-emerald-950">
                      {directResetMode ? 'Password Updated Successfully!' : 'Password Reset Link Dispatched!'}
                    </h4>
                    <p className="text-xs text-emerald-800 mt-1 leading-relaxed">
                      {directResetMode
                        ? 'Your account password has been updated in the database. You can now log in.'
                        : (forgotEmailSentMsg || `A password reset link was sent to ${forgotIdentifier}.`)}
                    </p>
                  </div>

                  {!directResetMode && (
                    <div className="p-3 bg-white/80 rounded-xl border border-emerald-300/50 text-[11px] text-gray-700 text-left space-y-1">
                      <p className="font-bold text-gray-900">Didn't find the email in your inbox?</p>
                      <ul className="list-disc list-inside space-y-0.5 text-gray-600">
                        <li>Please check your <strong>Spam / Junk / Promotions</strong> folder.</li>
                        <li>Look for sender: <code>noreply@...firebaseapp.com</code>.</li>
                      </ul>
                      <div className="pt-2 text-center">
                        <button
                          type="button"
                          onClick={() => {
                            setForgotSent(false);
                            setDirectResetMode(true);
                          }}
                          className="font-bold text-blue-600 hover:text-blue-800 underline cursor-pointer text-xs"
                        >
                          ⚡ Set new password directly instead
                        </button>
                      </div>
                    </div>
                  )}

                  {directResetMode && (
                    <button
                      type="button"
                      onClick={() => switchTab('login')}
                      className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer"
                    >
                      Proceed to Login →
                    </button>
                  )}
                </div>
              )}

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => switchTab('login')}
                  className="text-xs font-bold text-blue-600 hover:text-blue-800 cursor-pointer"
                >
                  ← Back to Login
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

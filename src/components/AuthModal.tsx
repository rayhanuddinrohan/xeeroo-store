/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../context/StoreContext';
import { auth, googleProvider } from '../lib/firebase';
import { BrandLogo } from './common/BrandLogo';
import { signInWithPopup } from 'firebase/auth';
import {
  X,
  Lock,
  Mail,
  User as UserIcon,
  Phone,
  Shield,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Loader2,
  ArrowRight,
  KeyRound,
  RotateCcw,
  ArrowLeft,
} from 'lucide-react';

export const AuthModal: React.FC = () => {
  const {
    isAuthModalOpen,
    setIsAuthModalOpen,
    authModalTab,
    setAuthModalTab,
    login,
    loginWithGoogle,
    initiateRegistration,
    verifyOtpAndComplete,
    resendOtp,
    resetPassword,
    pendingRegistration,
    sendPasswordResetOtp,
    verifyPasswordResetOtpAndSetPassword,
  } = useStore();

  // Login form state
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register form state
  const [regFullName, setRegFullName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');

  // OTP form state
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [resendTimer, setResendTimer] = useState(60);
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Password recovery form state
  const [recoveryIdentifier, setRecoveryIdentifier] = useState('');
  const [recoveryMethod, setRecoveryMethod] = useState<'otp' | 'link'>('otp');
  const [recoveryOtpCode, setRecoveryOtpCode] = useState('');
  const [recoveryEmailTarget, setRecoveryEmailTarget] = useState('');
  const [recoveryNewPassword, setRecoveryNewPassword] = useState('');
  const [recoveryConfirmPassword, setRecoveryConfirmPassword] = useState('');
  const [recoveryStep, setRecoveryStep] = useState<'request' | 'verify-otp' | 'success'>('request');
  const [recoverySuccessMsg, setRecoverySuccessMsg] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  // Timer for OTP resend
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (authModalTab === 'verify-otp' && resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [authModalTab, resendTimer]);

  if (!isAuthModalOpen) return null;

  const handleClose = () => {
    setIsAuthModalOpen(false);
    setErrorMsg('');
    setRecoveryStep('request');
  };

  // Google Sign-In & Registration handler via Firebase
  const handleGoogleAuth = async () => {
    setErrorMsg('');
    setIsGoogleLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      if (user) {
        loginWithGoogle({
          email: user.email || '',
          fullName: user.displayName || 'Google User',
          avatarUrl: user.photoURL || undefined,
          phone: user.phoneNumber || '',
          uid: user.uid,
        });
      }
    } catch (err: unknown) {
      const firebaseError = err as { code?: string; message?: string };
      console.warn('Google Auth Error:', firebaseError);
      if (firebaseError.code === 'auth/popup-closed-by-user') {
        setErrorMsg('Sign-in was closed before completion. Please try again.');
      } else if (firebaseError.code === 'auth/popup-blocked') {
        setErrorMsg('Browser popup was blocked. Please allow popups for this site.');
      } else if (firebaseError.code === 'auth/unauthorized-domain') {
        setErrorMsg('Domain not authorized in Firebase Console. Add your custom domain in Firebase Authentication > Settings > Authorized domains.');
      } else {
        setErrorMsg(firebaseError.message || 'Google authentication failed. Please sign in with Email or Phone.');
      }
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!loginIdentifier.trim()) {
      setErrorMsg('Please enter your email address or phone number');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await login(loginIdentifier, loginPassword);
      if (!res.success) {
        setErrorMsg(res.message);
      }
    } catch (err) {
      setErrorMsg('An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Step 1 of Registration: Initiates OTP verification
  const handleRegisterInitiate = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!regFullName.trim()) {
      setErrorMsg('Full name is required');
      return;
    }
    if (!regEmail.trim()) {
      setErrorMsg('Email address is required');
      return;
    }
    if (!regPhone.trim()) {
      setErrorMsg('Valid phone number is required');
      return;
    }
    if (regPassword.length < 6) {
      setErrorMsg('Password must be at least 6 characters long');
      return;
    }
    if (regPassword !== regConfirmPassword) {
      setErrorMsg('Passwords do not match');
      return;
    }

    const res = initiateRegistration({
      fullName: regFullName,
      email: regEmail,
      phone: regPhone,
      password: regPassword,
    });

    if (res.success) {
      setOtpDigits(['', '', '', '', '', '']);
      setResendTimer(60);
    } else {
      setErrorMsg(res.message);
    }
  };

  // Step 2 of Registration: Verifies OTP code
  const handleOtpInput = (index: number, value: string) => {
    if (value.length > 1) {
      // Handle paste
      const pasted = value.slice(0, 6).split('');
      const newDigits = [...otpDigits];
      pasted.forEach((char, i) => {
        if (i < 6) newDigits[i] = char;
      });
      setOtpDigits(newDigits);
      const nextIdx = Math.min(pasted.length, 5);
      otpInputRefs.current[nextIdx]?.focus();
      return;
    }

    const newDigits = [...otpDigits];
    newDigits[index] = value;
    setOtpDigits(newDigits);

    if (value && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    const fullOtp = otpDigits.join('');
    if (fullOtp.length < 6) {
      setErrorMsg('Please enter the complete 6-digit OTP verification code');
      return;
    }

    const res = verifyOtpAndComplete(fullOtp);
    if (!res.success) {
      setErrorMsg(res.message);
    }
  };

  const handleResendOtp = () => {
    setErrorMsg('');
    const newOtp = resendOtp();
    if (newOtp) {
      setResendTimer(60);
      setOtpDigits(['', '', '', '', '', '']);
    }
  };

  // Password Recovery Submit (Step 1)
  const handlePasswordRecoverySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!recoveryIdentifier.trim()) {
      setErrorMsg('Please enter your email or phone number');
      return;
    }

    setIsSubmitting(true);
    try {
      if (recoveryMethod === 'link') {
        // Direct Firebase Password Reset Email Link
        const res = await resetPassword(recoveryIdentifier.trim());
        if (res.success) {
          setRecoveryStep('success');
          setRecoverySuccessMsg(res.message);
        } else {
          setErrorMsg(res.message);
        }
      } else {
        // Send 6-Digit Verification Code to Email
        const res = await sendPasswordResetOtp(recoveryIdentifier.trim());
        if (res.success) {
          setRecoveryEmailTarget(res.email || recoveryIdentifier.trim());
          setRecoveryStep('verify-otp');
        } else {
          setErrorMsg(res.message);
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Password Recovery Verification (Step 2: Enter OTP & Set New Password)
  const handleVerifyResetOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const cleanOtp = recoveryOtpCode.trim();
    if (cleanOtp.length < 6) {
      setErrorMsg('Please enter the complete 6-digit OTP code received in your email.');
      return;
    }
    if (recoveryNewPassword.length < 6) {
      setErrorMsg('New password must be at least 6 characters long.');
      return;
    }
    if (recoveryNewPassword !== recoveryConfirmPassword) {
      setErrorMsg('New passwords do not match.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await verifyPasswordResetOtpAndSetPassword(cleanOtp, recoveryNewPassword);
      if (res.success) {
        setRecoveryStep('success');
        setRecoverySuccessMsg('Your password has been successfully reset! You can now sign in with your new password.');
      } else {
        setErrorMsg(res.message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6">
      <div
        className="relative bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-gray-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        {/* Header with XEEROO brand accents */}
        <div className="bg-slate-950 text-white p-6 sm:p-8 relative">
          <button
            onClick={handleClose}
            className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3 mb-2">
            <BrandLogo size="md" />
            <div>
              <span className="text-2xl font-black tracking-wider block leading-none">
                XEEROO
              </span>
              <span className="text-[11px] text-blue-400 font-medium tracking-wide">
                AUTHENTICATION PORTAL
              </span>
            </div>
          </div>

          <p className="text-xs text-slate-300 mt-2 max-w-md">
            {authModalTab === 'login' && 'Sign in to your customer account or administrator portal'}
            {authModalTab === 'register' && 'Register a new XEEROO account with Phone, Email, or Google'}
            {authModalTab === 'verify-otp' && 'Verify your mobile number & email with a 6-digit OTP code'}
            {authModalTab === 'forgot-password' && 'Password recovery and account access assistance'}
          </p>

          {/* Tab Selector (only visible when not in sub-flows) */}
          {(authModalTab === 'login' || authModalTab === 'register') && (
            <div className="flex rounded-xl bg-slate-900/90 p-1.5 mt-5 border border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setAuthModalTab('login');
                  setErrorMsg('');
                }}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  authModalTab === 'login'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setAuthModalTab('register');
                  setErrorMsg('');
                }}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  authModalTab === 'register'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Register New Account
              </button>
            </div>
          )}
        </div>

        {/* Modal Body */}
        <div className="p-6 sm:p-8">
          {errorMsg && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span className="leading-relaxed">{errorMsg}</span>
            </div>
          )}

          {/* TAB 1: SIGN IN */}
          {authModalTab === 'login' && (
            <div>
              {/* Google Sign-in */}
              <div className="mb-5">
                <button
                  type="button"
                  onClick={handleGoogleAuth}
                  disabled={isGoogleLoading}
                  className="w-full py-2.5 px-4 rounded-xl border border-gray-300 hover:border-gray-400 bg-white hover:bg-gray-50 text-gray-800 font-semibold text-xs flex items-center justify-center gap-3 transition-all shadow-xs cursor-pointer disabled:opacity-60"
                >
                  {isGoogleLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                  ) : (
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      />
                    </svg>
                  )}
                  <span>Sign In with Google</span>
                </button>

                <div className="relative my-5">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200"></div>
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="bg-white px-3 text-gray-500 font-medium">
                      Or sign in with Email or Phone
                    </span>
                  </div>
                </div>
              </div>

              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">
                    Email Address or Phone Number
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      required
                      value={loginIdentifier}
                      onChange={e => setLoginIdentifier(e.target.value)}
                      placeholder="e.g. admin@xeeroo.com or 017XXXXXXXX"
                      className="w-full pl-10 pr-3.5 py-2.5 text-xs rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-gray-900 bg-white"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold text-gray-700">
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-[11px] text-gray-500 hover:text-gray-800 flex items-center gap-1 cursor-pointer font-medium"
                    >
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      <span>{showPassword ? 'Hide' : 'Show'}</span>
                    </button>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={loginPassword}
                      onChange={e => setLoginPassword(e.target.value)}
                      placeholder="Enter account password"
                      className="w-full pl-10 pr-3.5 py-2.5 text-xs rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-gray-900 bg-white"
                    />
                  </div>
                  <div className="text-right mt-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        setAuthModalTab('forgot-password');
                        setErrorMsg('');
                        setRecoveryStep('request');
                      }}
                      className="text-[11px] text-blue-600 hover:text-blue-700 font-semibold cursor-pointer"
                    >
                      Forgot password?
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-sm hover:shadow transition-all cursor-pointer mt-2 flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <span>Sign In to XEEROO</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                <div className="text-center pt-3 border-t border-gray-100">
                  <p className="text-xs text-gray-500">
                    Don't have an account yet?{' '}
                    <button
                      type="button"
                      onClick={() => {
                        setAuthModalTab('register');
                        setErrorMsg('');
                      }}
                      className="text-blue-600 hover:text-blue-700 font-bold cursor-pointer underline"
                    >
                      Register with OTP
                    </button>
                  </p>
                </div>
              </form>
            </div>
          )}

          {/* TAB 2: REGISTER (INITIATE WITH OTP) */}
          {authModalTab === 'register' && (
            <div>
              {/* Google 1-Click Signup */}
              <div className="mb-5">
                <button
                  type="button"
                  onClick={handleGoogleAuth}
                  disabled={isGoogleLoading}
                  className="w-full py-2.5 px-4 rounded-xl border border-gray-300 hover:border-gray-400 bg-white hover:bg-gray-50 text-gray-800 font-semibold text-xs flex items-center justify-center gap-3 transition-all shadow-xs cursor-pointer disabled:opacity-60"
                >
                  {isGoogleLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                  ) : (
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      />
                    </svg>
                  )}
                  <span>Sign Up with Google (1-Click Instant)</span>
                </button>

                <div className="relative my-5">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200"></div>
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="bg-white px-3 text-gray-500 font-medium">
                      Or register with Phone & Email (OTP Verified)
                    </span>
                  </div>
                </div>
              </div>

              <form onSubmit={handleRegisterInitiate} className="space-y-4">
                <div className="p-3 bg-blue-50 rounded-xl border border-blue-200/80 text-[11px] text-blue-900 flex items-start gap-2.5">
                  <Shield className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  <p className="leading-relaxed">
                    <strong>OTP Verification:</strong> A 6-digit verification code will be sent to confirm your mobile number and email before account activation.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">
                    Full Name *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                      <UserIcon className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      required
                      value={regFullName}
                      onChange={e => setRegFullName(e.target.value)}
                      placeholder="e.g. Tanvir Ahmed"
                      className="w-full pl-10 pr-3.5 py-2.5 text-xs rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-gray-900 bg-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5">
                      Email Address *
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                        <Mail className="w-4 h-4" />
                      </div>
                      <input
                        type="email"
                        required
                        value={regEmail}
                        onChange={e => setRegEmail(e.target.value)}
                        placeholder="yourname@gmail.com"
                        className="w-full pl-10 pr-3.5 py-2.5 text-xs rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-gray-900 bg-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5">
                      Phone Number (Bangladesh) *
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                        <Phone className="w-4 h-4" />
                      </div>
                      <input
                        type="tel"
                        required
                        value={regPhone}
                        onChange={e => setRegPhone(e.target.value)}
                        placeholder="+880 17XXXXXXXX"
                        className="w-full pl-10 pr-3.5 py-2.5 text-xs rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-gray-900 bg-white font-mono"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5">
                      Password *
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                        <Lock className="w-4 h-4" />
                      </div>
                      <input
                        type="password"
                        required
                        value={regPassword}
                        onChange={e => setRegPassword(e.target.value)}
                        placeholder="Min 6 characters"
                        className="w-full pl-10 pr-3.5 py-2.5 text-xs rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-gray-900 bg-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5">
                      Confirm Password *
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                        <Lock className="w-4 h-4" />
                      </div>
                      <input
                        type="password"
                        required
                        value={regConfirmPassword}
                        onChange={e => setRegConfirmPassword(e.target.value)}
                        placeholder="Repeat password"
                        className="w-full pl-10 pr-3.5 py-2.5 text-xs rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-gray-900 bg-white"
                      />
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-sm hover:shadow transition-all cursor-pointer mt-4 flex items-center justify-center gap-2"
                >
                  <span>Continue to OTP Verification</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <div className="text-center pt-2">
                  <p className="text-xs text-gray-500">
                    Already registered with XEEROO?{' '}
                    <button
                      type="button"
                      onClick={() => {
                        setAuthModalTab('login');
                        setErrorMsg('');
                      }}
                      className="text-blue-600 hover:text-blue-700 font-bold cursor-pointer underline"
                    >
                      Sign In
                    </button>
                  </p>
                </div>
              </form>
            </div>
          )}

          {/* TAB 3: OTP VERIFICATION SCREEN */}
          {authModalTab === 'verify-otp' && (
            <div className="space-y-5">
              <div className="text-center">
                <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center mx-auto mb-3">
                  <KeyRound className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-black text-gray-900">
                  Verify Your Account
                </h3>
                <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
                  We have sent a 6-digit verification OTP code to{' '}
                  <strong className="text-gray-800 font-mono">
                    {pendingRegistration?.phone || pendingRegistration?.email}
                  </strong>
                </p>
              </div>

              {/* Secure Email Delivery Notice (No plain text OTP leak) */}
              <div className="p-3.5 bg-blue-50/90 border border-blue-200 rounded-2xl text-center">
                <span className="text-xs text-blue-900 font-bold block mb-1">
                  ✉️ Verification Code Dispatched
                </span>
                <p className="text-[11px] text-blue-700 leading-relaxed max-w-sm mx-auto">
                  A secure 6-digit verification code has been dispatched to your email address. Please check your inbox (and spam/junk folder), then enter the code below.
                </p>
              </div>

              <form onSubmit={handleOtpSubmit} className="space-y-5">
                {/* 6-digit OTP Inputs */}
                <div className="flex justify-center items-center gap-2 sm:gap-3">
                  {otpDigits.map((digit, index) => (
                    <input
                      key={index}
                      ref={el => {
                        otpInputRefs.current[index] = el;
                      }}
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={1}
                      value={digit}
                      onChange={e => handleOtpInput(index, e.target.value)}
                      onKeyDown={e => handleOtpKeyDown(index, e)}
                      className="w-11 h-12 sm:w-12 sm:h-14 text-center text-xl font-mono font-black border-2 border-gray-200 focus:border-blue-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-gray-50/50 text-gray-900"
                    />
                  ))}
                </div>

                <div className="flex items-center justify-between text-xs text-gray-500 px-1">
                  <span>Didn't receive code?</span>
                  {resendTimer > 0 ? (
                    <span className="font-mono text-gray-400">
                      Resend in {resendTimer}s
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={handleResendOtp}
                      className="text-blue-600 hover:text-blue-700 font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Resend OTP</span>
                    </button>
                  )}
                </div>

                <button
                  type="submit"
                  className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-sm hover:shadow transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Verify & Create Account</span>
                </button>

                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => {
                      setAuthModalTab('register');
                      setErrorMsg('');
                    }}
                    className="text-xs text-gray-500 hover:text-gray-800 flex items-center justify-center gap-1 mx-auto cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Change phone or email</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 4: PASSWORD RECOVERY */}
          {authModalTab === 'forgot-password' && (
            <div>
              {recoveryStep === 'request' && (
                <form onSubmit={handlePasswordRecoverySubmit} className="space-y-4">
                  <div className="text-center mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center mx-auto mb-2.5">
                      <KeyRound className="w-6 h-6" />
                    </div>
                    <h3 className="text-lg font-black text-gray-900">
                      Password Recovery
                    </h3>
                    <p className="text-xs text-gray-500 mt-1">
                      Choose your preferred recovery method below.
                    </p>
                  </div>

                  {/* Recovery Mode Selector */}
                  <div className="grid grid-cols-2 gap-2 p-1 bg-gray-100 rounded-xl text-xs font-semibold">
                    <button
                      type="button"
                      onClick={() => setRecoveryMethod('otp')}
                      className={`py-2 px-3 rounded-lg transition-all cursor-pointer ${
                        recoveryMethod === 'otp'
                          ? 'bg-white text-blue-600 shadow-xs'
                          : 'text-gray-500 hover:text-gray-800'
                      }`}
                    >
                      <span>✉️ 6-Digit Email OTP</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setRecoveryMethod('link')}
                      className={`py-2 px-3 rounded-lg transition-all cursor-pointer ${
                        recoveryMethod === 'link'
                          ? 'bg-white text-blue-600 shadow-xs'
                          : 'text-gray-500 hover:text-gray-800'
                      }`}
                    >
                      <span>🔗 Email Reset Link</span>
                    </button>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5">
                      Registered Email or Phone Number *
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                        <Mail className="w-4 h-4" />
                      </div>
                      <input
                        type="text"
                        required
                        value={recoveryIdentifier}
                        onChange={e => setRecoveryIdentifier(e.target.value)}
                        placeholder="e.g. user@gmail.com or 017XXXXXXXX"
                        className="w-full pl-10 pr-3.5 py-2.5 text-xs rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-gray-900 bg-white"
                      />
                    </div>
                    <p className="text-[11px] text-gray-400 mt-1">
                      {recoveryMethod === 'otp'
                        ? 'We will send a 6-digit recovery code directly to the associated email inbox.'
                        : 'We will send an official Firebase password reset link to this email.'}
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-sm hover:shadow transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60"
                  >
                    {isSubmitting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <span>
                          {recoveryMethod === 'otp'
                            ? 'Send 6-Digit Code to Email'
                            : 'Send Reset Link to Email'}
                        </span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>

                  <div className="text-center pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setAuthModalTab('login');
                        setErrorMsg('');
                      }}
                      className="text-xs text-gray-500 hover:text-gray-800 flex items-center justify-center gap-1 mx-auto cursor-pointer font-medium"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Back to Sign In</span>
                    </button>
                  </div>
                </form>
              )}

              {/* Step 2: Verify OTP & Enter New Password */}
              {recoveryStep === 'verify-otp' && (
                <form onSubmit={handleVerifyResetOtpSubmit} className="space-y-4">
                  <div className="text-center mb-3">
                    <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center mx-auto mb-2">
                      <KeyRound className="w-6 h-6" />
                    </div>
                    <h3 className="text-lg font-black text-gray-900">
                      Enter Verification Code
                    </h3>
                    <p className="text-xs text-gray-500 mt-1">
                      A 6-digit recovery OTP code has been sent to{' '}
                      <strong className="text-gray-800 font-mono">{recoveryEmailTarget}</strong>.
                    </p>
                  </div>

                  <div className="p-3 bg-blue-50/80 border border-blue-200 rounded-xl text-center">
                    <span className="text-[11px] text-blue-800 font-medium">
                      📬 Please check your email inbox and spam folder for your 6-digit code.
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5">
                      6-Digit Recovery Code *
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={6}
                      value={recoveryOtpCode}
                      onChange={e => setRecoveryOtpCode(e.target.value.replace(/[^0-9]/g, ''))}
                      placeholder="e.g. 583921"
                      className="w-full text-center text-xl font-mono font-bold tracking-widest py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:border-blue-600 bg-white text-gray-900"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1.5">
                        New Password *
                      </label>
                      <input
                        type="password"
                        required
                        value={recoveryNewPassword}
                        onChange={e => setRecoveryNewPassword(e.target.value)}
                        placeholder="Min 6 characters"
                        className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-gray-300 focus:outline-none focus:border-blue-600 bg-white text-gray-900"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1.5">
                        Confirm New Password *
                      </label>
                      <input
                        type="password"
                        required
                        value={recoveryConfirmPassword}
                        onChange={e => setRecoveryConfirmPassword(e.target.value)}
                        placeholder="Repeat new password"
                        className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-gray-300 focus:outline-none focus:border-blue-600 bg-white text-gray-900"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-sm hover:shadow transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60"
                  >
                    {isSubmitting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Verify Code & Reset Password</span>
                      </>
                    )}
                  </button>

                  <div className="flex items-center justify-between text-xs pt-1 px-1">
                    <button
                      type="button"
                      onClick={() => setRecoveryStep('request')}
                      className="text-gray-500 hover:text-gray-700 cursor-pointer"
                    >
                      ← Change email
                    </button>
                    <button
                      type="button"
                      onClick={handlePasswordRecoverySubmit}
                      disabled={isSubmitting}
                      className="text-blue-600 hover:text-blue-800 font-semibold cursor-pointer"
                    >
                      Resend code
                    </button>
                  </div>
                </form>
              )}

              {/* Step 3: Recovery Success State */}
              {recoveryStep === 'success' && (
                <div className="text-center py-4 space-y-4">
                  <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <h3 className="text-lg font-black text-gray-900">
                    Request Completed!
                  </h3>
                  <p className="text-xs text-gray-600 max-w-sm mx-auto leading-relaxed">
                    {recoverySuccessMsg}
                  </p>

                  <button
                    type="button"
                    onClick={() => {
                      setAuthModalTab('login');
                      setErrorMsg('');
                      setRecoveryStep('request');
                      setRecoveryOtpCode('');
                      setRecoveryNewPassword('');
                      setRecoveryConfirmPassword('');
                    }}
                    className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs cursor-pointer shadow-sm"
                  >
                    Proceed to Sign In
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

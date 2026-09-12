import React, { useState, useMemo } from 'react';
import {
  Satellite,
  Lock,
  Mail,
  User as UserIcon,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  Database,
  ArrowRight,
  ShieldAlert,
  Loader2,
  Check,
  X,
  KeyRound,
} from 'lucide-react';
import { User, AuthBackendStatus } from '../types/auth';
import { loginUser, registerUser, requestPasswordReset } from '../services/authService';

interface AuthViewProps {
  backendStatus: AuthBackendStatus | null;
  onAuthenticated: (user: User, token: string, backendStatus: AuthBackendStatus) => void;
  sessionExpiredMessage?: string | null;
}

type AuthMode = 'signin' | 'signup' | 'forgot';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const AuthView: React.FC<AuthViewProps> = ({
  backendStatus,
  onAuthenticated,
  sessionExpiredMessage,
}) => {
  const [mode, setMode] = useState<AuthMode>('signin');

  // Sign In fields & touched state
  const [signInEmail, setSignInEmail] = useState('');
  const [signInEmailTouched, setSignInEmailTouched] = useState(false);
  const [signInPassword, setSignInPassword] = useState('');
  const [signInPasswordTouched, setSignInPasswordTouched] = useState(false);
  const [showSignInPassword, setShowSignInPassword] = useState(false);

  // Sign Up fields & touched state
  const [signUpName, setSignUpName] = useState('');
  const [signUpNameTouched, setSignUpNameTouched] = useState(false);
  const [signUpEmail, setSignUpEmail] = useState('');
  const [signUpEmailTouched, setSignUpEmailTouched] = useState(false);
  const [signUpPassword, setSignUpPassword] = useState('');
  const [signUpPasswordTouched, setSignUpPasswordTouched] = useState(false);
  const [signUpConfirmPassword, setSignUpConfirmPassword] = useState('');
  const [signUpConfirmPasswordTouched, setSignUpConfirmPasswordTouched] = useState(false);
  const [showSignUpPassword, setShowSignUpPassword] = useState(false);
  const [showSignUpConfirmPassword, setShowSignUpConfirmPassword] = useState(false);

  // Forgot Password fields & touched state
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotEmailTouched, setForgotEmailTouched] = useState(false);
  const [forgotSuccessMessage, setForgotSuccessMessage] = useState<string | null>(null);

  // Status & Feedback
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittingPhase, setSubmittingPhase] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(sessionExpiredMessage || null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Switch modes cleanly and reset touched states
  const handleSwitchMode = (newMode: AuthMode) => {
    setMode(newMode);
    setErrorMessage(null);
    setSuccessMessage(null);
    setForgotSuccessMessage(null);
    setSignInEmailTouched(false);
    setSignInPasswordTouched(false);
    setSignUpNameTouched(false);
    setSignUpEmailTouched(false);
    setSignUpPasswordTouched(false);
    setSignUpConfirmPasswordTouched(false);
    setForgotEmailTouched(false);
  };

  // --- Real-time Validation Computations ---

  // Sign In Validations
  const isSignInEmailValid = useMemo(() => {
    return EMAIL_REGEX.test(signInEmail.trim());
  }, [signInEmail]);

  const signInEmailError = useMemo(() => {
    if (!signInEmailTouched) return null;
    const trimmed = signInEmail.trim();
    if (!trimmed) return 'Email address is required.';
    if (!isSignInEmailValid) return 'Please enter a valid email format (e.g., analyst@domain.com).';
    return null;
  }, [signInEmail, signInEmailTouched, isSignInEmailValid]);

  const isSignInPasswordValid = useMemo(() => {
    return signInPassword.length > 0;
  }, [signInPassword]);

  const signInPasswordError = useMemo(() => {
    if (!signInPasswordTouched) return null;
    if (!signInPassword) return 'Password is required.';
    return null;
  }, [signInPassword, signInPasswordTouched]);

  // Sign Up Validations
  const isSignUpNameValid = useMemo(() => {
    return signUpName.trim().length >= 2;
  }, [signUpName]);

  const signUpNameError = useMemo(() => {
    if (!signUpNameTouched) return null;
    const trimmed = signUpName.trim();
    if (!trimmed) return 'Full name is required.';
    if (trimmed.length < 2) return 'Full name must be at least 2 characters.';
    return null;
  }, [signUpName, signUpNameTouched]);

  const isSignUpEmailValid = useMemo(() => {
    return EMAIL_REGEX.test(signUpEmail.trim());
  }, [signUpEmail]);

  const signUpEmailError = useMemo(() => {
    if (!signUpEmailTouched) return null;
    const trimmed = signUpEmail.trim();
    if (!trimmed) return 'Email address is required.';
    if (!isSignUpEmailValid) return 'Please enter a valid email format.';
    return null;
  }, [signUpEmail, signUpEmailTouched, isSignUpEmailValid]);

  // Password criteria
  const passwordCriteria = useMemo(() => {
    return {
      hasMinLength: signUpPassword.length >= 8,
      hasLetter: /[a-zA-Z]/.test(signUpPassword),
      hasNumberOrSymbol: /[0-9!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(signUpPassword),
    };
  }, [signUpPassword]);

  const passwordStrength = useMemo(() => {
    if (!signUpPassword) return { score: 0, label: 'Empty', color: 'bg-slate-700', text: 'text-slate-500' };
    let score = 0;
    if (passwordCriteria.hasMinLength) score += 1;
    if (passwordCriteria.hasLetter) score += 1;
    if (passwordCriteria.hasNumberOrSymbol) score += 1;
    if (signUpPassword.length >= 12 && score === 3) score = 4;

    if (score <= 1) return { score: 1, label: 'Weak', color: 'bg-rose-500', text: 'text-rose-400' };
    if (score === 2) return { score: 2, label: 'Fair', color: 'bg-amber-500', text: 'text-amber-400' };
    if (score === 3) return { score: 3, label: 'Good', color: 'bg-cyan-500', text: 'text-cyan-400' };
    return { score: 4, label: 'Strong', color: 'bg-emerald-500', text: 'text-emerald-400' };
  }, [signUpPassword, passwordCriteria]);

  const signUpPasswordError = useMemo(() => {
    if (!signUpPasswordTouched) return null;
    if (!signUpPassword) return 'Password is required.';
    if (signUpPassword.length < 8) return 'Password must be at least 8 characters.';
    return null;
  }, [signUpPassword, signUpPasswordTouched]);

  const isSignUpConfirmValid = useMemo(() => {
    return signUpConfirmPassword.length > 0 && signUpConfirmPassword === signUpPassword;
  }, [signUpConfirmPassword, signUpPassword]);

  const signUpConfirmError = useMemo(() => {
    if (!signUpConfirmPasswordTouched) return null;
    if (!signUpConfirmPassword) return 'Please confirm your password.';
    if (signUpConfirmPassword !== signUpPassword) return 'Passwords do not match.';
    return null;
  }, [signUpConfirmPassword, signUpPassword, signUpConfirmPasswordTouched]);

  // Forgot Password Validation
  const isForgotEmailValid = useMemo(() => {
    return EMAIL_REGEX.test(forgotEmail.trim());
  }, [forgotEmail]);

  const forgotEmailError = useMemo(() => {
    if (!forgotEmailTouched) return null;
    const trimmed = forgotEmail.trim();
    if (!trimmed) return 'Email address is required.';
    if (!isForgotEmailValid) return 'Please enter a valid email address.';
    return null;
  }, [forgotEmail, forgotEmailTouched, isForgotEmailValid]);

  // Sign In Handler
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignInEmailTouched(true);
    setSignInPasswordTouched(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    const emailTrimmed = signInEmail.trim();
    if (!emailTrimmed || !isSignInEmailValid) {
      setErrorMessage('Please provide a valid email address.');
      return;
    }
    if (!signInPassword) {
      setErrorMessage('Please enter your password.');
      return;
    }

    setIsSubmitting(true);
    setSubmittingPhase('Verifying credentials & session...');
    try {
      const result = await loginUser(emailTrimmed, signInPassword);
      setSubmittingPhase('Access granted. Initializing workspace...');
      onAuthenticated(result.user, result.token, result.backendStatus);
    } catch (err: any) {
      setErrorMessage(err.message || 'Invalid email or password. Please verify your credentials and try again.');
    } finally {
      setIsSubmitting(false);
      setSubmittingPhase('');
    }
  };

  // Sign Up Handler
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignUpNameTouched(true);
    setSignUpEmailTouched(true);
    setSignUpPasswordTouched(true);
    setSignUpConfirmPasswordTouched(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    const nameTrimmed = signUpName.trim();
    const emailTrimmed = signUpEmail.trim();

    if (!nameTrimmed || nameTrimmed.length < 2) {
      setErrorMessage('Please enter your full name (minimum 2 characters).');
      return;
    }
    if (!emailTrimmed || !isSignUpEmailValid) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }
    if (!signUpPassword || signUpPassword.length < 8) {
      setErrorMessage('Password must be at least 8 characters in length.');
      return;
    }
    if (signUpPassword !== signUpConfirmPassword) {
      setErrorMessage('Passwords do not match. Please re-enter your confirm password.');
      return;
    }

    setIsSubmitting(true);
    setSubmittingPhase('Hashing credentials & creating account...');
    try {
      const result = await registerUser(nameTrimmed, emailTrimmed, signUpPassword);
      setSubmittingPhase('Profile created. Launching SatQuery AI...');
      onAuthenticated(result.user, result.token, result.backendStatus);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to create account. Please check your details and try again.');
    } finally {
      setIsSubmitting(false);
      setSubmittingPhase('');
    }
  };

  // Forgot Password Handler
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotEmailTouched(true);
    setErrorMessage(null);
    setForgotSuccessMessage(null);

    const emailTrimmed = forgotEmail.trim();
    if (!emailTrimmed || !isForgotEmailValid) {
      setErrorMessage('Please enter a valid email address to receive reset instructions.');
      return;
    }

    setIsSubmitting(true);
    setSubmittingPhase('Dispatching recovery instructions...');
    try {
      const res = await requestPasswordReset(emailTrimmed);
      setForgotSuccessMessage(res.message);
    } catch (err: any) {
      setErrorMessage(err.message || 'Could not process password reset request.');
    } finally {
      setIsSubmitting(false);
      setSubmittingPhase('');
    }
  };

  const isDbConnected = backendStatus?.status === 'CONNECTED';

  return (
    <div className="min-h-screen w-screen flex flex-col justify-between bg-[#050811] text-slate-100 font-sans relative overflow-x-hidden selection:bg-cyan-500 selection:text-black">
      {/* Dynamic atmospheric background */}
      <div className="absolute inset-0 tech-grid-bg opacity-25 pointer-events-none" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-20 -left-20 w-[450px] h-[450px] bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Brand Bar */}
      <header className="relative z-10 w-full max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 ring-1 ring-cyan-400/30">
            <Satellite className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg tracking-wider text-white">SatQuery</span>
              <span className="text-xs px-2 py-0.5 rounded font-mono font-semibold bg-cyan-950 text-cyan-400 border border-cyan-800/60">
                AI
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-mono tracking-tight">Earth Observation & Remote Sensing Intelligence</p>
          </div>
        </div>

        {/* Real Backend Connection Badge */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-mono backdrop-blur-sm bg-slate-900/60 border-slate-800">
          <div className={`w-2 h-2 rounded-full ${isDbConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
          {isDbConnected ? (
            <span className="text-emerald-400 font-semibold">✓ Authentication Backend Connected</span>
          ) : (
            <span className="text-amber-400 font-semibold">Authentication Backend: NOT CONNECTED / CONFIGURATION REQUIRED</span>
          )}
        </div>
      </header>

      {/* Main Authentication Card Center */}
      <main className="relative z-10 flex-1 flex items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-md">
          {/* Status Banner when Database is NOT Connected */}
          {!isDbConnected && (
            <div
              id="auth-db-status-banner"
              className="mb-5 p-3.5 rounded-xl bg-amber-950/40 border border-amber-500/40 text-amber-200 text-xs backdrop-blur-md shadow-lg flex items-start gap-3"
            >
              <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <div className="font-semibold text-amber-300 flex items-center gap-1.5">
                  <span>Authentication Backend:</span>
                  <span className="font-mono text-[11px] px-1.5 py-0.5 rounded bg-amber-900/60 text-amber-300 border border-amber-600/40">
                    NOT CONNECTED / CONFIGURATION REQUIRED
                  </span>
                </div>
                <p className="text-[11px] text-amber-200/90 leading-relaxed">
                  {backendStatus?.message ||
                    'PostgreSQL database connection is not configured. Configure DATABASE_URL in your environment secrets to connect persistent PostgreSQL storage for user accounts and sessions.'}
                </p>
                {backendStatus?.missingConfig && backendStatus.missingConfig.length > 0 && (
                  <div className="mt-1.5 pt-1.5 border-t border-amber-500/20 text-[10px] text-amber-300/80 font-mono">
                    Required configuration: {backendStatus.missingConfig.join(', ')}
                  </div>
                )}
              </div>
            </div>
          )}

          {isDbConnected && (
            <div
              id="auth-db-status-banner-connected"
              className="mb-5 p-3 rounded-xl bg-emerald-950/30 border border-emerald-500/30 text-emerald-200 text-xs backdrop-blur-md flex items-center gap-2.5"
            >
              <Database className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="text-xs font-semibold text-emerald-300">
                ✓ Authentication Backend Connected
              </span>
            </div>
          )}

          {/* Card Container */}
          <div className="bg-[#0b1120]/90 border border-slate-800/80 rounded-2xl p-6 sm:p-8 backdrop-blur-xl shadow-2xl shadow-black/60 relative overflow-hidden">
            {/* Top decorative gradient / loading shimmer edge */}
            <div
              className={`absolute top-0 left-0 right-0 h-[2px] transition-all duration-300 ${
                isSubmitting
                  ? 'bg-gradient-to-r from-cyan-400 via-blue-500 to-cyan-400 animate-pulse'
                  : 'bg-gradient-to-r from-transparent via-cyan-500 to-transparent'
              }`}
            />

            {/* Error Message Banner */}
            {errorMessage && (
              <div
                id="auth-error-alert"
                className="mb-5 p-3.5 rounded-xl bg-rose-950/60 border border-rose-500/50 text-rose-200 text-xs flex items-start gap-2.5 animate-fadeIn"
              >
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <div className="flex-1 leading-relaxed">{errorMessage}</div>
              </div>
            )}

            {/* Success Message Banner */}
            {successMessage && (
              <div
                id="auth-success-alert"
                className="mb-5 p-3.5 rounded-xl bg-emerald-950/60 border border-emerald-500/50 text-emerald-200 text-xs flex items-start gap-2.5 animate-fadeIn"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div className="flex-1 leading-relaxed">{successMessage}</div>
              </div>
            )}

            {/* 1. SIGN IN MODE */}
            {mode === 'signin' && (
              <div>
                <div className="text-center mb-6">
                  <h1 className="text-2xl font-bold tracking-tight text-white flex items-center justify-center gap-2">
                    SatQuery AI
                  </h1>
                  <p className="text-slate-300 text-sm mt-2 leading-relaxed">
                    “Sign in to analyze and manage your satellite imagery.”
                  </p>
                </div>

                <form onSubmit={handleSignIn} className="space-y-4" noValidate>
                  {/* Email Field */}
                  <div>
                    <label
                      htmlFor="signin-email"
                      className="block text-xs font-semibold text-slate-300 mb-1.5"
                    >
                      Email
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                        <Mail className="w-4 h-4" />
                      </div>
                      <input
                        id="signin-email"
                        type="email"
                        autoComplete="email"
                        disabled={isSubmitting}
                        value={signInEmail}
                        onChange={(e) => {
                          setSignInEmail(e.target.value);
                          if (!signInEmailTouched) setSignInEmailTouched(true);
                        }}
                        onBlur={() => setSignInEmailTouched(true)}
                        placeholder="analyst@geospatial.org"
                        className={`w-full pl-10 pr-10 py-2.5 bg-slate-900/90 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none transition disabled:opacity-60 disabled:cursor-not-allowed ${
                          signInEmailError
                            ? 'border border-rose-500/80 focus:ring-2 focus:ring-rose-500 focus:border-rose-500'
                            : signInEmailTouched && isSignInEmailValid
                            ? 'border border-emerald-500/70 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500'
                            : 'border border-slate-700/80 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500'
                        }`}
                      />
                      {/* Real-time Indicator on Right */}
                      <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none">
                        {signInEmailTouched && isSignInEmailValid && (
                          <Check className="w-4 h-4 text-emerald-400" />
                        )}
                        {signInEmailError && (
                          <AlertCircle className="w-4 h-4 text-rose-400" />
                        )}
                      </div>
                    </div>
                    {/* Real-time error text */}
                    {signInEmailError && (
                      <p className="mt-1 text-[11px] text-rose-400 flex items-center gap-1">
                        <span>{signInEmailError}</span>
                      </p>
                    )}
                  </div>

                  {/* Password Field */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label
                        htmlFor="signin-password"
                        className="block text-xs font-semibold text-slate-300"
                      >
                        Password
                      </label>
                    </div>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                        <Lock className="w-4 h-4" />
                      </div>
                      <input
                        id="signin-password"
                        type={showSignInPassword ? 'text' : 'password'}
                        autoComplete="current-password"
                        disabled={isSubmitting}
                        value={signInPassword}
                        onChange={(e) => {
                          setSignInPassword(e.target.value);
                          if (!signInPasswordTouched) setSignInPasswordTouched(true);
                        }}
                        onBlur={() => setSignInPasswordTouched(true)}
                        placeholder="••••••••••••"
                        className={`w-full pl-10 pr-10 py-2.5 bg-slate-900/90 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none transition disabled:opacity-60 disabled:cursor-not-allowed ${
                          signInPasswordError
                            ? 'border border-rose-500/80 focus:ring-2 focus:ring-rose-500 focus:border-rose-500'
                            : signInPasswordTouched && isSignInPasswordValid
                            ? 'border border-slate-700/80 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500'
                            : 'border border-slate-700/80 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500'
                        }`}
                      />
                      <button
                        type="button"
                        disabled={isSubmitting}
                        onClick={() => setShowSignInPassword(!showSignInPassword)}
                        className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-200 transition cursor-pointer disabled:opacity-50"
                        title={showSignInPassword ? 'Hide password' : 'Show password'}
                      >
                        {showSignInPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {signInPasswordError && (
                      <p className="mt-1 text-[11px] text-rose-400 flex items-center gap-1">
                        <span>{signInPasswordError}</span>
                      </p>
                    )}
                  </div>

                  {/* Primary Sign In Button & Loading State */}
                  <div className="pt-2">
                    <button
                      id="btn-sign-in"
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold text-sm shadow-lg shadow-cyan-500/25 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin text-cyan-200" />
                          <span>{submittingPhase || 'Signing In...'}</span>
                        </>
                      ) : (
                        <>
                          <span>Sign In</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </div>

                  {/* Secondary Buttons: Create Account & Forgot Password */}
                  <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                    <button
                      id="btn-create-account"
                      type="button"
                      disabled={isSubmitting}
                      onClick={() => handleSwitchMode('signup')}
                      className="text-cyan-400 hover:text-cyan-300 font-medium transition cursor-pointer hover:underline disabled:opacity-50"
                    >
                      Create Account
                    </button>
                    <button
                      id="btn-forgot-password"
                      type="button"
                      disabled={isSubmitting}
                      onClick={() => handleSwitchMode('forgot')}
                      className="text-slate-400 hover:text-slate-200 transition cursor-pointer hover:underline disabled:opacity-50"
                    >
                      Forgot Password?
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* 2. SIGN UP / CREATE ACCOUNT MODE */}
            {mode === 'signup' && (
              <div>
                <div className="text-center mb-6">
                  <h1 className="text-xl font-bold tracking-tight text-white">
                    Create SatQuery AI Account
                  </h1>
                  <p className="text-slate-400 text-xs mt-1.5">
                    Enter your details to register and access satellite analysis tools.
                  </p>
                </div>

                <form onSubmit={handleSignUp} className="space-y-3.5" noValidate>
                  {/* Name Field */}
                  <div>
                    <label
                      htmlFor="signup-name"
                      className="block text-xs font-semibold text-slate-300 mb-1.5"
                    >
                      Full Name
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                        <UserIcon className="w-4 h-4" />
                      </div>
                      <input
                        id="signup-name"
                        type="text"
                        autoComplete="name"
                        disabled={isSubmitting}
                        value={signUpName}
                        onChange={(e) => {
                          setSignUpName(e.target.value);
                          if (!signUpNameTouched) setSignUpNameTouched(true);
                        }}
                        onBlur={() => setSignUpNameTouched(true)}
                        placeholder="Dr. Maya Rao"
                        className={`w-full pl-10 pr-10 py-2.5 bg-slate-900/90 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none transition disabled:opacity-60 disabled:cursor-not-allowed ${
                          signUpNameError
                            ? 'border border-rose-500/80 focus:ring-2 focus:ring-rose-500 focus:border-rose-500'
                            : signUpNameTouched && isSignUpNameValid
                            ? 'border border-emerald-500/70 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500'
                            : 'border border-slate-700/80 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500'
                        }`}
                      />
                      <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none">
                        {signUpNameTouched && isSignUpNameValid && (
                          <Check className="w-4 h-4 text-emerald-400" />
                        )}
                        {signUpNameError && (
                          <AlertCircle className="w-4 h-4 text-rose-400" />
                        )}
                      </div>
                    </div>
                    {signUpNameError && (
                      <p className="mt-1 text-[11px] text-rose-400 flex items-center gap-1">
                        <span>{signUpNameError}</span>
                      </p>
                    )}
                  </div>

                  {/* Email Field */}
                  <div>
                    <label
                      htmlFor="signup-email"
                      className="block text-xs font-semibold text-slate-300 mb-1.5"
                    >
                      Email Address
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                        <Mail className="w-4 h-4" />
                      </div>
                      <input
                        id="signup-email"
                        type="email"
                        autoComplete="email"
                        disabled={isSubmitting}
                        value={signUpEmail}
                        onChange={(e) => {
                          setSignUpEmail(e.target.value);
                          if (!signUpEmailTouched) setSignUpEmailTouched(true);
                        }}
                        onBlur={() => setSignUpEmailTouched(true)}
                        placeholder="analyst@geospatial.org"
                        className={`w-full pl-10 pr-10 py-2.5 bg-slate-900/90 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none transition disabled:opacity-60 disabled:cursor-not-allowed ${
                          signUpEmailError
                            ? 'border border-rose-500/80 focus:ring-2 focus:ring-rose-500 focus:border-rose-500'
                            : signUpEmailTouched && isSignUpEmailValid
                            ? 'border border-emerald-500/70 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500'
                            : 'border border-slate-700/80 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500'
                        }`}
                      />
                      <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none">
                        {signUpEmailTouched && isSignUpEmailValid && (
                          <Check className="w-4 h-4 text-emerald-400" />
                        )}
                        {signUpEmailError && (
                          <AlertCircle className="w-4 h-4 text-rose-400" />
                        )}
                      </div>
                    </div>
                    {signUpEmailError && (
                      <p className="mt-1 text-[11px] text-rose-400 flex items-center gap-1">
                        <span>{signUpEmailError}</span>
                      </p>
                    )}
                  </div>

                  {/* Password Field */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label
                        htmlFor="signup-password"
                        className="block text-xs font-semibold text-slate-300"
                      >
                        Password
                      </label>
                      {signUpPassword && (
                        <span className={`text-[11px] font-mono font-medium ${passwordStrength.text}`}>
                          {passwordStrength.label}
                        </span>
                      )}
                    </div>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                        <Lock className="w-4 h-4" />
                      </div>
                      <input
                        id="signup-password"
                        type={showSignUpPassword ? 'text' : 'password'}
                        autoComplete="new-password"
                        disabled={isSubmitting}
                        value={signUpPassword}
                        onChange={(e) => {
                          setSignUpPassword(e.target.value);
                          if (!signUpPasswordTouched) setSignUpPasswordTouched(true);
                        }}
                        onBlur={() => setSignUpPasswordTouched(true)}
                        placeholder="Minimum 8 characters"
                        className={`w-full pl-10 pr-10 py-2.5 bg-slate-900/90 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none transition disabled:opacity-60 disabled:cursor-not-allowed ${
                          signUpPasswordError
                            ? 'border border-rose-500/80 focus:ring-2 focus:ring-rose-500 focus:border-rose-500'
                            : signUpPasswordTouched && passwordCriteria.hasMinLength
                            ? 'border border-emerald-500/70 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500'
                            : 'border border-slate-700/80 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500'
                        }`}
                      />
                      <button
                        type="button"
                        disabled={isSubmitting}
                        onClick={() => setShowSignUpPassword(!showSignUpPassword)}
                        className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-200 transition cursor-pointer disabled:opacity-50"
                        title={showSignUpPassword ? 'Hide password' : 'Show password'}
                      >
                        {showSignUpPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>

                    {/* Dynamic Password Strength Progress Bar */}
                    {signUpPassword.length > 0 && (
                      <div className="mt-2 space-y-1.5">
                        <div className="grid grid-cols-4 gap-1.5 h-1">
                          <div className={`h-full rounded-full transition-colors duration-300 ${passwordStrength.score >= 1 ? passwordStrength.color : 'bg-slate-800'}`} />
                          <div className={`h-full rounded-full transition-colors duration-300 ${passwordStrength.score >= 2 ? passwordStrength.color : 'bg-slate-800'}`} />
                          <div className={`h-full rounded-full transition-colors duration-300 ${passwordStrength.score >= 3 ? passwordStrength.color : 'bg-slate-800'}`} />
                          <div className={`h-full rounded-full transition-colors duration-300 ${passwordStrength.score >= 4 ? passwordStrength.color : 'bg-slate-800'}`} />
                        </div>

                        {/* Checklist items */}
                        <div className="grid grid-cols-2 gap-x-2 gap-y-1 pt-1 text-[11px] text-slate-400">
                          <div className="flex items-center gap-1.5">
                            {passwordCriteria.hasMinLength ? (
                              <Check className="w-3 h-3 text-emerald-400 shrink-0" />
                            ) : (
                              <span className="w-1.5 h-1.5 rounded-full bg-slate-600 ml-0.5 mr-1" />
                            )}
                            <span className={passwordCriteria.hasMinLength ? 'text-emerald-300' : 'text-slate-500'}>
                              8+ characters
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            {passwordCriteria.hasNumberOrSymbol ? (
                              <Check className="w-3 h-3 text-emerald-400 shrink-0" />
                            ) : (
                              <span className="w-1.5 h-1.5 rounded-full bg-slate-600 ml-0.5 mr-1" />
                            )}
                            <span className={passwordCriteria.hasNumberOrSymbol ? 'text-emerald-300' : 'text-slate-500'}>
                              Number / symbol
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {signUpPasswordError && (
                      <p className="mt-1 text-[11px] text-rose-400 flex items-center gap-1">
                        <span>{signUpPasswordError}</span>
                      </p>
                    )}
                  </div>

                  {/* Confirm Password Field */}
                  <div>
                    <label
                      htmlFor="signup-confirm-password"
                      className="block text-xs font-semibold text-slate-300 mb-1.5"
                    >
                      Confirm Password
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                        <KeyRound className="w-4 h-4" />
                      </div>
                      <input
                        id="signup-confirm-password"
                        type={showSignUpConfirmPassword ? 'text' : 'password'}
                        autoComplete="new-password"
                        disabled={isSubmitting}
                        value={signUpConfirmPassword}
                        onChange={(e) => {
                          setSignUpConfirmPassword(e.target.value);
                          if (!signUpConfirmPasswordTouched) setSignUpConfirmPasswordTouched(true);
                        }}
                        onBlur={() => setSignUpConfirmPasswordTouched(true)}
                        placeholder="Confirm your password"
                        className={`w-full pl-10 pr-10 py-2.5 bg-slate-900/90 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none transition disabled:opacity-60 disabled:cursor-not-allowed ${
                          signUpConfirmError
                            ? 'border border-rose-500/80 focus:ring-2 focus:ring-rose-500 focus:border-rose-500'
                            : signUpConfirmPasswordTouched && isSignUpConfirmValid
                            ? 'border border-emerald-500/70 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500'
                            : 'border border-slate-700/80 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500'
                        }`}
                      />
                      <button
                        type="button"
                        disabled={isSubmitting}
                        onClick={() => setShowSignUpConfirmPassword(!showSignUpConfirmPassword)}
                        className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-200 transition cursor-pointer disabled:opacity-50"
                        title={showSignUpConfirmPassword ? 'Hide password' : 'Show password'}
                      >
                        {showSignUpConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {/* Live Match feedback */}
                    {signUpConfirmPasswordTouched && isSignUpConfirmValid && (
                      <p className="mt-1 text-[11px] text-emerald-400 flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" />
                        <span>Passwords match.</span>
                      </p>
                    )}
                    {signUpConfirmError && (
                      <p className="mt-1 text-[11px] text-rose-400 flex items-center gap-1">
                        <span>{signUpConfirmError}</span>
                      </p>
                    )}
                  </div>

                  {/* Submit Button */}
                  <div className="pt-2">
                    <button
                      id="btn-submit-signup"
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold text-sm shadow-lg shadow-cyan-500/25 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin text-cyan-200" />
                          <span>{submittingPhase || 'Creating Account...'}</span>
                        </>
                      ) : (
                        <>
                          <span>Create Account</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </div>

                  {/* Back to Sign In */}
                  <div className="pt-3 border-t border-slate-800/80 text-center">
                    <p className="text-xs text-slate-400">
                      Already have an account?{' '}
                      <button
                        id="btn-back-to-signin"
                        type="button"
                        disabled={isSubmitting}
                        onClick={() => handleSwitchMode('signin')}
                        className="text-cyan-400 hover:text-cyan-300 font-semibold cursor-pointer transition hover:underline disabled:opacity-50"
                      >
                        Sign In
                      </button>
                    </p>
                  </div>
                </form>
              </div>
            )}

            {/* 3. FORGOT PASSWORD MODE */}
            {mode === 'forgot' && (
              <div>
                <div className="text-center mb-6">
                  <h1 className="text-xl font-bold tracking-tight text-white">
                    Forgot Password
                  </h1>
                  <p className="text-slate-400 text-xs mt-1.5 leading-relaxed">
                    Enter your registered email address to receive password recovery instructions.
                  </p>
                </div>

                {forgotSuccessMessage ? (
                  <div className="space-y-4">
                    <div className="p-4 rounded-xl bg-emerald-950/60 border border-emerald-500/50 text-emerald-200 text-xs leading-relaxed flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                      <div>
                        <div className="font-semibold text-emerald-300 mb-1">Request Dispatched</div>
                        <p>{forgotSuccessMessage}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleSwitchMode('signin')}
                      className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs transition cursor-pointer"
                    >
                      Return to Sign In
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleForgotPassword} className="space-y-4" noValidate>
                    <div>
                      <label
                        htmlFor="forgot-email"
                        className="block text-xs font-semibold text-slate-300 mb-1.5"
                      >
                        Email Address
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                          <Mail className="w-4 h-4" />
                        </div>
                        <input
                          id="forgot-email"
                          type="email"
                          autoComplete="email"
                          disabled={isSubmitting}
                          value={forgotEmail}
                          onChange={(e) => {
                            setForgotEmail(e.target.value);
                            if (!forgotEmailTouched) setForgotEmailTouched(true);
                          }}
                          onBlur={() => setForgotEmailTouched(true)}
                          placeholder="analyst@geospatial.org"
                          className={`w-full pl-10 pr-10 py-2.5 bg-slate-900/90 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none transition disabled:opacity-60 disabled:cursor-not-allowed ${
                            forgotEmailError
                              ? 'border border-rose-500/80 focus:ring-2 focus:ring-rose-500 focus:border-rose-500'
                              : forgotEmailTouched && isForgotEmailValid
                              ? 'border border-emerald-500/70 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500'
                              : 'border border-slate-700/80 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500'
                          }`}
                        />
                        <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none">
                          {forgotEmailTouched && isForgotEmailValid && (
                            <Check className="w-4 h-4 text-emerald-400" />
                          )}
                          {forgotEmailError && (
                            <AlertCircle className="w-4 h-4 text-rose-400" />
                          )}
                        </div>
                      </div>
                      {forgotEmailError && (
                        <p className="mt-1 text-[11px] text-rose-400 flex items-center gap-1">
                          <span>{forgotEmailError}</span>
                        </p>
                      )}
                    </div>

                    <div className="pt-2">
                      <button
                        id="btn-submit-forgot"
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold text-sm shadow-lg shadow-cyan-500/25 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed"
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin text-cyan-200" />
                            <span>{submittingPhase || 'Sending Instructions...'}</span>
                          </>
                        ) : (
                          <span>Send Reset Link</span>
                        )}
                      </button>
                    </div>

                    <div className="pt-3 border-t border-slate-800/80 text-center">
                      <button
                        type="button"
                        disabled={isSubmitting}
                        onClick={() => handleSwitchMode('signin')}
                        className="text-xs text-slate-400 hover:text-slate-200 font-medium cursor-pointer transition hover:underline disabled:opacity-50"
                      >
                        Back to Sign In
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 w-full max-w-7xl mx-auto px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-slate-500 border-t border-slate-900">
        <div>SatQuery AI &copy; 2026. Secure Remote Sensing Intelligence Platform.</div>
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
            PBKDF2 SHA-512 Hash Salted
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
            Bearer Token Sessions
          </span>
        </div>
      </footer>
    </div>
  );
};

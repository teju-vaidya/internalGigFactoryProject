import React, { useState, useEffect } from 'react';
import { Mail, KeyRound, ArrowRight, ArrowLeft, Send } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { api } from '../../utils/api';
import { useAuthStore } from '../../store/useAuthStore';
import './ForgotPassword.css';
import gigfactoryLogo from '../../assets/logo.png';
import AuthStatusModal from '../Login/AuthStatusModal';
import { useMetaTags } from '../../hooks/useMetaTags';

const ForgotPassword = () => {
  const [option, setOption] = useState('reset_link'); // 'reset_link' or 'otp_login'
  const [email, setEmail] = useState('');
  
  // OTP Flow States
  const [otp, setOtp] = useState('');
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [timer, setTimer] = useState(0);

  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);

  useMetaTags({
    title: "Forgot Password | GigFactory",
    description: "Request a password reset link or login via OTP code.",
    robots: "noindex, follow"
  });

  // Modal states for registration status error handling
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [statusModalData, setStatusModalData] = useState(null);

  // Handle countdown for OTP timer
  useEffect(() => {
    let interval = null;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else if (timer === 0 && isOtpSent) {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [timer, isOtpSent]);

  // ── Query: Request Password Reset Link ─────────────────────────────────────
  const [forgotEmail, setForgotEmail] = useState(null);
  const forgotPasswordQuery = useQuery({
    queryKey: ['auth-forgot-password', forgotEmail],
    queryFn: () => api.post('/auth/forgot-password', { email: forgotEmail }),
    enabled: !!forgotEmail,
    retry: false,
    staleTime: 0,
    gcTime: 0,
  });

  useEffect(() => {
    if (forgotPasswordQuery.data) {
      toast.success(forgotPasswordQuery.data.message || 'Password reset link sent successfully!');
      setForgotEmail(null);
    }
  }, [forgotPasswordQuery.data]);

  useEffect(() => {
    if (forgotPasswordQuery.error) {
      const error = forgotPasswordQuery.error;
      if (error.data && error.data.status) {
        setStatusModalData(error.data);
        setIsStatusModalOpen(true);
      } else {
        toast.error(error.message || 'Failed to request reset link.');
      }
      setForgotEmail(null);
    }
  }, [forgotPasswordQuery.error]);

  // ── Query: Request OTP Code ────────────────────────────────────────────────
  const [otpEmail, setOtpEmail] = useState(null);
  const sendOtpQuery = useQuery({
    queryKey: ['forgot-send-otp', otpEmail],
    queryFn: () => api.post('/auth/request-otp', { email: otpEmail, purpose: 'login_verification' }),
    enabled: !!otpEmail,
    retry: false,
    staleTime: 0,
    gcTime: 0,
  });

  useEffect(() => {
    if (sendOtpQuery.data) {
      let msg = sendOtpQuery.data.message || 'OTP sent to your email.';
      if (sendOtpQuery.data.otp) {
        msg += ` (Development OTP: ${sendOtpQuery.data.otp})`;
      }
      toast.success(msg);
      setIsOtpSent(true);
      setTimer(30);
      setOtpEmail(null);
    }
  }, [sendOtpQuery.data]);

  useEffect(() => {
    if (sendOtpQuery.error) {
      const error = sendOtpQuery.error;
      if (error.data && error.data.status) {
        setStatusModalData(error.data);
        setIsStatusModalOpen(true);
      } else {
        toast.error(error.message || 'Failed to send OTP.');
      }
      setOtpEmail(null);
    }
  }, [sendOtpQuery.error]);

  // ── Query: Verify OTP & Login ──────────────────────────────────────────────
  const [verifyOtpParams, setVerifyOtpParams] = useState(null);
  const verifyOtpQuery = useQuery({
    queryKey: ['forgot-verify-otp', verifyOtpParams],
    queryFn: () => api.post('/auth/verify-otp', { email: verifyOtpParams.emailVal, otp: verifyOtpParams.otpVal }),
    enabled: !!verifyOtpParams,
    retry: false,
    staleTime: 0,
    gcTime: 0,
  });

  useEffect(() => {
    if (verifyOtpQuery.data) {
      toast.success('OTP verified & login successful!');
      setAuth(verifyOtpQuery.data.token, verifyOtpQuery.data.refreshToken, verifyOtpQuery.data.user);
      navigate('/dashboard');
      setVerifyOtpParams(null);
    }
  }, [verifyOtpQuery.data, navigate, setAuth]);

  useEffect(() => {
    if (verifyOtpQuery.error) {
      const error = verifyOtpQuery.error;
      if (error.data && error.data.status) {
        setStatusModalData(error.data);
        setIsStatusModalOpen(true);
      } else {
        toast.error(error.message || 'OTP verification failed.');
      }
      setVerifyOtpParams(null);
    }
  }, [verifyOtpQuery.error]);


  const handleRequestResetLink = (e) => {
    e.preventDefault();
    if (!email) {
      toast.warning('Please enter your email address first.');
      return;
    }
    setForgotEmail(email);
  };

  const handleSendOtp = (e) => {
    e?.preventDefault();
    if (!email) {
      toast.warning('Please enter your email address first.');
      return;
    }
    setOtpEmail(email);
  };

  const handleOtpSubmit = (e) => {
    e.preventDefault();
    if (!otp) {
      toast.warning('Please enter the 6-digit OTP code.');
      return;
    }
    setVerifyOtpParams({ emailVal: email, otpVal: otp });
  };

  const handleToggleOption = (opt) => {
    setOption(opt);
    setIsOtpSent(false);
    setOtp('');
    setTimer(0);
  };

  return (
    <div className="forgot-password-container">
      <div className="forgot-password-card">
        {/* Branding Logo */}
        <div className="forgot-password-logo-box">
          <img src={gigfactoryLogo} alt="Gigfactory Logo" className="forgot-password-logo-img" />
        </div>

        {/* Header */}
        <h1 className="forgot-password-title">FORGOT PASSWORD</h1>
        <p className="forgot-password-subtitle">Recover or log in to your account</p>

        <hr className="forgot-divider-line" />

        {/* Options Selection Tabs */}
        <div className="forgot-tabs-container">
          <button
            type="button"
            className={`forgot-tab-btn ${option === 'reset_link' ? 'active' : ''}`}
            onClick={() => handleToggleOption('reset_link')}
          >
            Get Reset Link
          </button>
          <button
            type="button"
            className={`forgot-tab-btn ${option === 'otp_login' ? 'active' : ''}`}
            onClick={() => handleToggleOption('otp_login')}
          >
            Login via OTP
          </button>
        </div>

        {/* FORMS */}
        {option === 'reset_link' ? (
          // RESET LINK OPTION FORM
          <form onSubmit={handleRequestResetLink} className="forgot-form">
            <div className="input-group">
              <label htmlFor="email">Email Address</label>
              <div className="input-wrapper">
                <span className="input-icon">
                  <Mail size={18} />
                </span>
                <input
                  type="email"
                  id="email"
                  value={email}
                  placeholder="Enter email address"
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="forgot-submit-btn"
              disabled={forgotPasswordQuery.isFetching}
            >
              {forgotPasswordQuery.isFetching ? 'Sending Link...' : 'Send Reset Link'}
              {!forgotPasswordQuery.isFetching && <Send className="arrow" size={16} />}
            </button>
          </form>
        ) : (
          // OTP LOGIN OPTION FORM
          <form onSubmit={isOtpSent ? handleOtpSubmit : handleSendOtp} className="forgot-form">
            {/* Step 1: Input Email */}
            <div className="input-group">
              <div className="label-row">
                <label htmlFor="email">Email Address</label>
                {isOtpSent && (
                  <button
                    type="button"
                    onClick={() => setIsOtpSent(false)}
                    className="change-email-btn"
                  >
                    <ArrowLeft size={12} /> Change Email
                  </button>
                )}
              </div>
              <div className="input-wrapper">
                <span className="input-icon">
                  <Mail size={18} />
                </span>
                <input
                  type="email"
                  id="email"
                  value={email}
                  placeholder="Enter email address"
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isOtpSent}
                  required
                />
              </div>
            </div>

            {/* Step 2: Verification Input (Conditional) */}
            {isOtpSent && (
              <div className="input-group animate-fade-in">
                <div className="label-row">
                  <label htmlFor="otp">Enter Verification Code (OTP)</label>
                  {timer > 0 ? (
                    <span className="otp-timer">Resend in {timer}s</span>
                  ) : (
                    <button
                      type="button"
                      onClick={handleSendOtp}
                      className="resend-otp-btn"
                      disabled={sendOtpQuery.isFetching}
                    >
                      {sendOtpQuery.isFetching ? 'Sending...' : 'Resend OTP'}
                    </button>
                  )}
                </div>
                <div className="input-wrapper">
                  <span className="input-icon">
                    <KeyRound size={18} />
                  </span>
                  <input
                    type="text"
                    id="otp"
                    placeholder="Enter 6-digit OTP"
                    value={otp}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^0-9]/g, '').slice(0, 6);
                      setOtp(val);
                    }}
                    required
                  />
                </div>
              </div>
            )}

            {!isOtpSent ? (
              <button
                type="submit"
                className="forgot-submit-btn"
                disabled={sendOtpQuery.isFetching}
              >
                {sendOtpQuery.isFetching ? 'Requesting OTP...' : 'Send OTP'}
                {!sendOtpQuery.isFetching && <ArrowRight className="arrow" size={16} />}
              </button>
            ) : (
              <button
                type="submit"
                className="forgot-submit-btn"
                disabled={verifyOtpQuery.isFetching}
              >
                {verifyOtpQuery.isFetching ? 'Verifying...' : 'Verify & Login'}
                {!verifyOtpQuery.isFetching && <ArrowRight className="arrow" size={16} />}
              </button>
            )}
          </form>
        )}

        {/* Back to Login Link */}
        <p className="back-to-login-text">
          Remember your password?{' '}
          <span onClick={() => navigate('/')} className="login-nav-link">
            Login Here
          </span>
        </p>
      </div>
      <AuthStatusModal 
        isOpen={isStatusModalOpen}
        onClose={() => setIsStatusModalOpen(false)}
        statusData={statusModalData}
        email={email}
      />
    </div>
  );
};

export default ForgotPassword;

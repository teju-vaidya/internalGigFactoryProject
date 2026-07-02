import React, { useState, useEffect } from 'react';
import { Mail, Lock, KeyRound, ArrowRight, ArrowLeft } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../../utils/api';
import { useAuthStore } from '../../store/useAuthStore';
import './Login.css';
import gigfactoryLogo from '../../assets/logo.png'; 
import AuthStatusModal from './AuthStatusModal';
import RegisterModal from '../Register/RegisterModal';
import { useMetaTags } from '../../hooks/useMetaTags';

const Login = () => {
  const [authMethod, setAuthMethod] = useState('otp'); // 'password' or 'otp'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // OTP Flow States
  const [otp, setOtp] = useState('');
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [timer, setTimer] = useState(0);

  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const redirectUrl = searchParams.get('redirect');
  const setAuth = useAuthStore((state) => state.setAuth);
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);

  const orgSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "GigFactory",
    "url": window.location.origin,
    "logo": `${window.location.origin}/favicon.png`,
    "description": "Premium internal collaboration and freelance client services marketplace. Connecting Gig Experts and Agencies to projects."
  };

  useMetaTags({
    title: "Login & Collaboration Portal | GigFactory",
    description: "Welcome to GigFactory. Log in to your workspace, bid on open project specifications, submit milestone deliverables, and collaborate with client partners.",
    keywords: "GigFactory login, freelance portal, collaborate, project management, client billing, gig expert portal",
    jsonLd: orgSchema
  });

  const [geoInfo, setGeoInfo] = useState({ ip: '', location: '' });

  // Handle SSO redirect query parameters
  useEffect(() => {
    const tokenParam = searchParams.get('token');
    const refreshTokenParam = searchParams.get('refreshToken');
    const userParam = searchParams.get('user');

    if (tokenParam && refreshTokenParam && userParam) {
      try {
        const decodedUser = JSON.parse(decodeURIComponent(userParam));
        setAuth(tokenParam, refreshTokenParam, decodedUser);
        
        // Remove token/user query parameters from the address bar
        const cleanParams = new URLSearchParams(searchParams);
        cleanParams.delete('token');
        cleanParams.delete('refreshToken');
        cleanParams.delete('user');
        setSearchParams(cleanParams, { replace: true });
        
        toast.success('SSO Login successful!');
      } catch (err) {
        console.error('Failed to parse SSO login payload:', err);
        toast.error('SSO Login failed: Invalid user payload');
      }
    }
  }, [searchParams, setSearchParams, setAuth]);

  useEffect(() => {
    const fetchGeo = async () => {
      // 1. IP-based lookup using ipapi.co
      try {
        const res = await fetch('https://ipapi.co/json/');
        if (!res.ok) throw new Error('API response error');
        const data = await res.json();
        let city = data.city || '';
        if (city.toLowerCase() === 'nanded') {
          city = 'Nagpur';
        }
        const locStr = [city, data.region, data.country_name].filter(Boolean).join(', ');
        setGeoInfo({
          ip: data.ip || '',
          location: locStr || ''
        });
      } catch (err) {
        // 2. Fallback to ipwho.is if ipapi.co fails
        try {
          const res2 = await fetch('https://ipwho.is/');
          const data2 = await res2.json();
          if (data2 && data2.success) {
            let city2 = data2.city || '';
            if (city2.toLowerCase() === 'nanded') {
              city2 = 'Nagpur';
            }
            const locStr2 = [city2, data2.region, data2.country].filter(Boolean).join(', ');
            setGeoInfo({
              ip: data2.ip || '',
              location: locStr2 || ''
            });
          }
        } catch (err2) {
          console.warn('All GeoIP services failed:', err2);
        }
      }
    };
    fetchGeo();
  }, []);

  useEffect(() => {
    if (token && user) {
      if (redirectUrl) {
        navigate(redirectUrl);
      } else if (user.role === 'admin') {
        navigate('/admin/dashboard');
      } else {
        navigate('/dashboard');
      }
    }
  }, [token, user, navigate, redirectUrl]);

  // Modal states for registration status error handling
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [statusModalData, setStatusModalData] = useState(null);

  // Register Modal states
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [reapplyModalData, setReapplyModalData] = useState(null);


  // Handle countdown for OTP timeout
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

  // ── Query: Send OTP ──────────────────────────────────────────────────────────
  const [otpEmail, setOtpEmail] = useState(null);
  const sendOtpQuery = useQuery({
    queryKey: ['auth-send-otp', otpEmail],
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

  // ── Query: Login (Password) ──────────────────────────────────────────────────
  const [loginParams, setLoginParams] = useState(null);
  const loginQuery = useQuery({
    queryKey: ['auth-login-password', loginParams],
    queryFn: () => api.post('/auth/login', { 
      email: loginParams.emailVal, 
      password: loginParams.passwordVal,
      clientIp: geoInfo.ip,
      clientLocation: geoInfo.location
    }),
    enabled: !!loginParams,
    retry: false,
    staleTime: 0,
    gcTime: 0,
  });

  useEffect(() => {
    if (loginQuery.data) {
      toast.success('Login successful!');
      setAuth(loginQuery.data.token, loginQuery.data.refreshToken, loginQuery.data.user);
      
      const userRole = loginQuery.data.user?.role;
      if (redirectUrl) {
        navigate(redirectUrl);
      } else if (userRole === 'admin') {
        navigate('/admin/dashboard');
      } else {
        navigate('/dashboard');
      }
      setLoginParams(null);
    }
  }, [loginQuery.data, navigate, setAuth, redirectUrl]);

  useEffect(() => {
    if (loginQuery.error) {
      const error = loginQuery.error;
      if (error.data && error.data.status) {
        setStatusModalData(error.data);
        setIsStatusModalOpen(true);
      } else {
        toast.error(error.message || 'Login failed.');
      }
      setLoginParams(null);
    }
  }, [loginQuery.error]);

  // ── Query: Verify OTP & Login ──────────────────────────────────────────────
  const [verifyOtpParams, setVerifyOtpParams] = useState(null);
  const verifyOtpQuery = useQuery({
    queryKey: ['auth-verify-otp', verifyOtpParams],
    queryFn: () => api.post('/auth/verify-otp', { 
      email: verifyOtpParams.emailVal, 
      otp: verifyOtpParams.otpVal,
      clientIp: geoInfo.ip,
      clientLocation: geoInfo.location
    }),
    enabled: !!verifyOtpParams,
    retry: false,
    staleTime: 0,
    gcTime: 0,
  });

  useEffect(() => {
    if (verifyOtpQuery.data) {
      toast.success('OTP verified & login successful!');
      setAuth(verifyOtpQuery.data.token, verifyOtpQuery.data.refreshToken, verifyOtpQuery.data.user);
      const userRole = verifyOtpQuery.data.user?.role;
      if (redirectUrl) {
        navigate(redirectUrl);
      } else if (userRole === 'admin') {
        navigate('/admin/dashboard');
      } else {
        navigate('/dashboard');
      }
      setVerifyOtpParams(null);
    }
  }, [verifyOtpQuery.data, navigate, setAuth, redirectUrl]);

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

  const handleSendOtp = (e) => {
    e?.preventDefault();
    if (!email) {
      toast.warning("Please enter your email address first!");
      return;
    }
    setOtpEmail(email);
  };

  const handlePasswordLoginSubmit = (e) => {
    e.preventDefault();
    if (!email || !password) {
      toast.warning("Please enter both email and password.");
      return;
    }
    setLoginParams({ emailVal: email, passwordVal: password });
  };

  const handleOtpLoginSubmit = (e) => {
    e.preventDefault();
    if (!otp) {
      toast.warning("Please enter the 6-digit OTP code.");
      return;
    }
    setVerifyOtpParams({ emailVal: email, otpVal: otp });
  };

  const handleToggleAuthMethod = () => {
    if (authMethod === 'password') {
      setAuthMethod('otp');
      setIsOtpSent(false);
      setOtp('');
    } else {
      setAuthMethod('password');
    }
  };

  const handleBackToEmail = () => {
    setIsOtpSent(false);
    setOtp('');
  };

  return (
    <div className="login-container">
      <div className="login-card">
        
        {/* Branding Logo */}
        <div className="login-branding-logo-box">
          <img src={gigfactoryLogo} alt="Gigfactory Logo" className="login-brand-img" />
        </div>

        {/* Header */}
        <h1 className="login-title">LOGIN TO PORTAL</h1> 
        <p className="login-subtitle">GET BEST GIG OUT THERE</p> 

        <hr className="divider-line" />

        {/* Form Container */}
        {authMethod !== 'password' ?(
          // OTP LOGIN FLOW
          <form onSubmit={isOtpSent ? handleOtpLoginSubmit : handleSendOtp} className="login-form">
            
            {/* Step 1: Request OTP */}
            <div className="input-group">
              <div className="label-row">
                <label htmlFor="email">Email Address</label>
                {isOtpSent && (
                  <button type="button" onClick={handleBackToEmail} className="forgot-link flex items-center gap-1">
                    <ArrowLeft size={12} /> Change Email
                  </button>
                )}
              </div>
              <div className="input-wrapper">
                <span className="input-icon">
                  <Mail size={18} strokeWidth={2} />
                </span>
                <input 
                  type="email" 
                  id="email" 
                  value={email}
                  placeholder="Enter Email"
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isOtpSent}
                  required 
                />
              </div>
            </div>

            {/* Step 2: Verify OTP (Conditional) */}
            {isOtpSent && (
              <div className="input-group animate-fade-in">
                <div className="label-row">
                  <label htmlFor="otp">One Time Password (OTP)</label>
                  {timer > 0 ? (
                    <span className="otp-timer">Resend in {timer}s</span>
                  ) : (
                    <button 
                      type="button" 
                      onClick={handleSendOtp} 
                      className="resend-otp-link-btn"
                      disabled={sendOtpQuery.isFetching}
                    >
                      {sendOtpQuery.isFetching ? 'Sending...' : 'Resend OTP'}
                    </button>
                  )}
                </div>
                <div className="input-wrapper">
                  <span className="input-icon">
                    <KeyRound size={18} strokeWidth={2} />
                  </span>
                  <input 
                    type="text" 
                    id="otp" 
                    placeholder="Enter 6-Digit OTP" 
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
                className="login-submit-btn" 
                disabled={sendOtpQuery.isFetching}
              >
                {sendOtpQuery.isFetching ? 'Sending OTP...' : 'Send OTP'}
                {!sendOtpQuery.isFetching && <ArrowRight className="arrow" size={18} strokeWidth={2.5} />}
              </button>
            ) : (
              <button 
                type="submit" 
                className="login-submit-btn" 
                disabled={verifyOtpQuery.isFetching}
              >
                {verifyOtpQuery.isFetching ? 'Verifying...' : 'Verify & Login'}
                {!verifyOtpQuery.isFetching && <ArrowRight className="arrow" size={18} strokeWidth={2.5} />}
              </button>
            )}

          </form>
        ) : (
          // PASSWORD LOGIN FORM
          <form onSubmit={handlePasswordLoginSubmit} className="login-form">
            
            <div className="input-group">
              <label htmlFor="email">Email Address</label> 
              <div className="input-wrapper">
                <span className="input-icon">
                  <Mail size={18} strokeWidth={2} />
                </span>
                <input 
                  type="email" 
                  id="email" 
                  value={email}
                  placeholder="Enter Email"
                  onChange={(e) => setEmail(e.target.value)}
                  required 
                />
              </div>
            </div>

            <div className="input-group">
              <div className="label-row">
                <label htmlFor="password">Password</label> 
                <span onClick={() => navigate('/forgot-password')} className="forgot-link cursor-pointer">Forgot Password?</span> 
              </div>
              <div className="input-wrapper">
                <span className="input-icon">
                  <Lock size={18} strokeWidth={2} />
                </span>
                <input 
                  type="password" 
                  id="password" 
                  placeholder="Enter Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required 
                />
              </div>
            </div>

            <button 
              type="submit" 
              className="login-submit-btn" 
              disabled={loginQuery.isFetching}
            >
              {loginQuery.isFetching ? 'Logging in...' : 'Login'}
              {!loginQuery.isFetching && <ArrowRight className="arrow" size={18} strokeWidth={2.5} />}
            </button>

          </form>
        ) 
        }

        {/* Dynamic Auth Method Toggle Button */}
        <div className="mt-5">
          <button 
            type="button" 
            onClick={handleToggleAuthMethod} 
            className="resend-otp-link-btn text-[0.9rem] underline"
          >
            {authMethod === 'password' ? 'Login with OTP instead' : 'Login with password instead'}
          </button>
        </div>

        {/* Footer Redirect to Signup */}
        <p className="register-text">
          New Here? <span onClick={() => setIsRegisterModalOpen(true)} className="register-link">Register Now</span> 
        </p>
      </div>
      <AuthStatusModal 
        isOpen={isStatusModalOpen}
        onClose={() => setIsStatusModalOpen(false)}
        statusData={statusModalData}
        email={email}
        onRegisterTrigger={(emailVal) => {
          setIsStatusModalOpen(false);
          setEmail(emailVal);
          setReapplyModalData(null);
          setIsRegisterModalOpen(true);
        }}
        onReapplyTrigger={(reapplyData, role, emailVal, fullName, mobile) => {
          setIsStatusModalOpen(false);
          setReapplyModalData({ reapplyData, role, email: emailVal, fullName, mobile });
          setIsRegisterModalOpen(true);
        }}
      />
      <RegisterModal 
        isOpen={isRegisterModalOpen}
        onClose={() => {
          setIsRegisterModalOpen(false);
          setReapplyModalData(null);
        }}
        reapplyData={reapplyModalData ? reapplyModalData.reapplyData : null}
        email={reapplyModalData ? reapplyModalData.email : email}
        onSubmitSuccess={() => {
          setIsRegisterModalOpen(false);
          setReapplyModalData(null);
        }}
      />
    </div>
  );
};

export default Login;
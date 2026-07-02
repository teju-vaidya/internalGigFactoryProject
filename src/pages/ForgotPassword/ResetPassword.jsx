import React, { useState, useEffect } from 'react';
import { Lock, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../../utils/api';
import './ResetPassword.css';
import gigfactoryLogo from '../../assets/logo.png';
import { useMetaTags } from '../../hooks/useMetaTags';

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const email = searchParams.get('email') || '';

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const navigate = useNavigate();

  useMetaTags({
    title: "Reset Password | GigFactory",
    description: "Enter your new credentials to securely reset your password.",
    robots: "noindex, follow"
  });

  const [resetParams, setResetParams] = useState(null);
  const resetPasswordQuery = useQuery({
    queryKey: ['auth-reset-password', resetParams],
    queryFn: () => api.post('/auth/reset-password', { token: resetParams.resetToken, password: resetParams.newPassword }),
    enabled: !!resetParams,
    retry: false,
    staleTime: 0,
    gcTime: 0,
  });

  useEffect(() => {
    if (resetPasswordQuery.data) {
      toast.success(resetPasswordQuery.data.message || 'Password reset successfully!');
      navigate('/');
      setResetParams(null);
    }
  }, [resetPasswordQuery.data, navigate]);

  useEffect(() => {
    if (resetPasswordQuery.error) {
      toast.error(resetPasswordQuery.error.message || 'Failed to reset password. Link may be expired.');
      setResetParams(null);
    }
  }, [resetPasswordQuery.error]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!token) {
      toast.error('Reset token is missing or invalid.');
      return;
    }
    if (password.length < 6) {
      toast.warning('Password must be at least 6 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      toast.warning('Passwords do not match.');
      return;
    }
    setResetParams({ resetToken: token, newPassword: password });
  };

  return (
    <div className="reset-password-container">
      <div className="reset-password-card">
        {/* Branding Logo */}
        <div className="reset-password-logo-box">
          <img src={gigfactoryLogo} alt="Gigfactory Logo" className="reset-password-logo-img" />
        </div>

        {/* Header */}
        <h1 className="reset-password-title">RESET PASSWORD</h1>
        <p className="reset-password-subtitle">Create a secure new password</p>

        <hr className="reset-divider-line" />

        {!token ? (
          <div className="token-error-message">
            <p>Invalid or missing password reset token. Please request a new link.</p>
            <button type="button" onClick={() => navigate('/forgot-password')} className="reset-submit-btn mt-4">
              Go to Forgot Password
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="reset-form">
            <div className="input-group">
              <label>Email Address</label>
              <input
                type="email"
                value={email}
                disabled
                className="disabled-email-input"
              />
            </div>

            <div className="input-group">
              <label htmlFor="password">New Password</label>
              <div className="input-wrapper">
                <span className="input-icon">
                  <Lock size={18} />
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  value={password}
                  placeholder="At least 6 characters"
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <span className="eye-icon" onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </span>
              </div>
            </div>

            <div className="input-group">
              <label htmlFor="confirmPassword">Confirm New Password</label>
              <div className="input-wrapper">
                <span className="input-icon">
                  <Lock size={18} />
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="confirmPassword"
                  value={confirmPassword}
                  placeholder="Repeat new password"
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="reset-submit-btn"
              disabled={resetPasswordQuery.isFetching}
            >
              {resetPasswordQuery.isFetching ? 'Resetting Password...' : 'Save New Password'}
              {!resetPasswordQuery.isFetching && <ArrowRight className="arrow" size={16} />}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ResetPassword;

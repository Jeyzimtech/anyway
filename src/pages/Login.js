import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Eye, EyeOff } from 'lucide-react';
import { requestPasswordReset, verifyResetCode, completePasswordReset } from '../lib/api';
import bcrypt from 'bcryptjs';
import '../styles/Auth.css';

export default function Login() {
  const navigate = useNavigate();
  const { signIn, signUp } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [currentPage, setCurrentPage] = useState('login'); // login, signup, forgotPassword, resetCode, resetPassword

  // Signup states
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [username, setUsername] = useState('');
  const [role, setRole] = useState('employee');
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [emailError, setEmailError] = useState('');

  // Email validation - accepts all domains and extensions
  const validateEmail = (email) => {
    // Comprehensive email regex that accepts all valid domains and extensions
    const emailRegex = /^[a-zA-Z0-9][a-zA-Z0-9._-]*@[a-zA-Z0-9][a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email);
  };

  const handleEmailChange = (e) => {
    const value = e.target.value;
    setSignupEmail(value);
    
    if (value && !validateEmail(value)) {
      setEmailError('Please enter a valid email address');
    } else {
      setEmailError('');
    }
  };

  // Password strength
  const hasCapital = /[A-Z]/.test(signupPassword);
  const hasNumber = /[0-9]/.test(signupPassword);
  const hasMinLength = signupPassword.length >= 6;
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(signupPassword);
  const passwordStrength = [hasCapital, hasNumber, hasMinLength, hasSpecial].filter(Boolean).length;

  // Forgot password states
  const [forgotEmail, setForgotEmail] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Reset password strength validation (must be after newPassword state declaration)
  const resetHasCapital = /[A-Z]/.test(newPassword);
  const resetHasNumber = /[0-9]/.test(newPassword);
  const resetHasMinLength = newPassword.length >= 6;
  const resetHasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(newPassword);
  const resetPasswordStrength = [resetHasCapital, resetHasNumber, resetHasMinLength, resetHasSpecial].filter(Boolean).length;

  useEffect(() => {
    const savedEmail = localStorage.getItem('rememberedEmail');
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
  }, []);

  // Handle Login
  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      await signIn(email, password);
      if (rememberMe) {
        localStorage.setItem('rememberedEmail', email);
      } else {
        localStorage.removeItem('rememberedEmail');
      }
      alert('Signed in!');
      navigate('/sales');
    } catch (err) {
      alert(err.message || 'Login failed');
    }
  };

  // Handle Signup
  const handleSignup = async (e) => {
    e.preventDefault();
    
    // Validate email format
    if (!validateEmail(signupEmail)) {
      alert('Please enter a valid email address');
      return;
    }
    
    if (passwordStrength < 4) {
      alert('Password does not meet security requirements');
      return;
    }
    if (signupPassword !== confirmPassword) {
      alert('Passwords do not match');
      return;
    }
    try {
      await signUp(signupEmail, signupPassword, username, role);
      alert('Account created! You can sign in now.');
      setCurrentPage('login');
      setSignupPassword('');
      setConfirmPassword('');
    } catch (err) {
      alert(err.message || 'Signup failed');
    }
  };

  // Handle Forgot Password - Request reset code from admin
  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await requestPasswordReset(forgotEmail);
      alert(`Password reset requested! An admin will generate a reset code for you. Code expires in 30 minutes.`);
      setCurrentPage('resetCode');
    } catch (err) {
      alert(err.message || 'Failed to request password reset. Please contact your admin.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Reset Code - Verify code is valid
  const handleResetCode = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await verifyResetCode(resetCode);
      if (response.valid) {
        alert('Code verified! Please set your new password.');
        setCurrentPage('resetPassword');
      }
    } catch (err) {
      alert(err.message || 'Invalid or expired reset code. Please request a new one from your admin.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Reset Password - Complete password reset
  const handleResetPassword = async (e) => {
    e.preventDefault();
    
    // Validate password requirements
    if (resetPasswordStrength < 4) {
      alert('Password does not meet security requirements. Please ensure it has a capital letter, number, special character, and at least 6 characters.');
      return;
    }
    
    if (newPassword !== confirmNewPassword) {
      alert('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      // Hash the password before sending
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await completePasswordReset(resetCode, hashedPassword);
      alert('Password reset successfully! You can now login with your new password.');
      setCurrentPage('login');
      setResetCode('');
      setNewPassword('');
      setConfirmNewPassword('');
      setForgotEmail('');
    } catch (err) {
      alert(err.message || 'Failed to reset password. The code may have expired.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-form-section">
        {/* Logo - Top Center */}
        <div className="logo-container">
          <img 
            src="/logo.svg"
            alt="Anyway Engineering and Mining Supplies" 
            className="aem-logo" 
          />
        </div>

        {/* Login Form */}
        {currentPage === 'login' && (
          <div className="auth-form-wrapper">
            <h1 className="auth-title">Welcome Back</h1>
            <p className="auth-subtitle">Sign in to your account</p>

            <form onSubmit={handleLogin} className="auth-form">
              <div className="form-group">
                <label htmlFor="email">Email Address</label>
                <input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label htmlFor="password">Password</label>
                <div className="password-input-wrapper">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="form-input"
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              <div className="form-options">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="checkbox-input"
                  />
                  <span>Remember me</span>
                </label>
                <button
                  type="button"
                  className="link-button"
                  onClick={() => setCurrentPage('forgotPassword')}
                >
                  Forgot password?
                </button>
              </div>

              <button type="submit" className="btn-primary">
                Sign In
              </button>
            </form>

            <p className="auth-footer">
              Don't have an account?{' '}
              <button
                type="button"
                className="link-button"
                onClick={() => setCurrentPage('signup')}
              >
                Sign up
              </button>
            </p>
          </div>
        )}

        {/* Signup Form */}
        {currentPage === 'signup' && (
          <div className="auth-form-wrapper">
            <h1 className="auth-title">Create Account</h1>
            <p className="auth-subtitle">Join our retail management system</p>

            <form onSubmit={handleSignup} className="auth-form">
              <div className="form-group">
                <label htmlFor="signup-email">Email Address</label>
                <input
                  id="signup-email"
                  type="text"
                  placeholder="your@email.com"
                  value={signupEmail}
                  onChange={handleEmailChange}
                  required
                  className={`form-input ${emailError ? 'input-error' : ''}`}
                />
                {emailError && (
                  <p className="error-message" style={{ color: '#E53E3E', fontSize: '12px', marginTop: '4px' }}>
                    {emailError}
                  </p>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="username">Username</label>
                <input
                  id="username"
                  type="text"
                  placeholder="Your name"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label htmlFor="signup-password">Password</label>
                <div className="password-input-wrapper">
                  <input
                    id="signup-password"
                    type={showSignupPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={signupPassword}
                    onChange={(e) => setSignupPassword(e.target.value)}
                    required
                    className="form-input"
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowSignupPassword(!showSignupPassword)}
                  >
                    {showSignupPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>

                {/* Password Strength Indicator */}
                <div className="password-strength">
                  <div className={`strength-item ${hasCapital ? 'active' : ''}`}>
                    <span>✓ Capital letter</span>
                  </div>
                  <div className={`strength-item ${hasNumber ? 'active' : ''}`}>
                    <span>✓ At least 1 number</span>
                  </div>
                  <div className={`strength-item ${hasMinLength ? 'active' : ''}`}>
                    <span>✓ At least 6 characters</span>
                  </div>
                  <div className={`strength-item ${hasSpecial ? 'active' : ''}`}>
                    <span>✓ Special character</span>
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="confirm-password">Confirm Password</label>
                <div className="password-input-wrapper">
                  <input
                    id="confirm-password"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className="form-input"
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="role">Role</label>
                <select
                  id="role"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="form-input"
                >
                  <option value="employee">Employee</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <button type="submit" className="btn-primary">
                Sign Up
              </button>
            </form>

            <p className="auth-footer">
              Already have an account?{' '}
              <button
                type="button"
                className="link-button"
                onClick={() => setCurrentPage('login')}
              >
                Login
              </button>
            </p>
          </div>
        )}

        {/* Forgot Password Form */}
        {currentPage === 'forgotPassword' && (
          <div className="auth-form-wrapper">
            <h1 className="auth-title">Reset Password</h1>
            <p className="auth-subtitle">Enter your email to receive a reset code</p>

            <form onSubmit={handleForgotPassword} className="auth-form">
              <div className="form-group">
                <label htmlFor="forgot-email">Email Address</label>
                <input
                  id="forgot-email"
                  type="email"
                  placeholder="your@email.com"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  required
                  className="form-input"
                />
              </div>

              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? 'Requesting...' : 'Request Reset Code'}
              </button>
            </form>

            <p className="auth-footer">
              <button
                type="button"
                className="link-button"
                onClick={() => setCurrentPage('login')}
              >
                Back to Login
              </button>
            </p>
          </div>
        )}

        {/* Reset Code Form */}
        {currentPage === 'resetCode' && (
          <div className="auth-form-wrapper">
            <h1 className="auth-title">Enter Reset Code</h1>
            <p className="auth-subtitle">Check your email for the reset code</p>

            <form onSubmit={handleResetCode} className="auth-form">
              <div className="form-group">
                <label htmlFor="reset-code">Reset Code</label>
                <input
                  id="reset-code"
                  type="text"
                  placeholder="Enter 6-digit code"
                  value={resetCode}
                  onChange={(e) => setResetCode(e.target.value)}
                  required
                  className="form-input"
                />
              </div>

              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? 'Verifying...' : 'Verify Code'}
              </button>
            </form>

            <p className="auth-footer">
              <button
                type="button"
                className="link-button"
                onClick={() => setCurrentPage('forgotPassword')}
              >
                Back
              </button>
            </p>
          </div>
        )}

        {/* Reset Password Form */}
        {currentPage === 'resetPassword' && (
          <div className="auth-form-wrapper">
            <h1 className="auth-title">Set New Password</h1>
            <p className="auth-subtitle">Create a strong new password</p>

            <form onSubmit={handleResetPassword} className="auth-form">
              <div className="form-group">
                <label htmlFor="new-password">Password</label>
                <div className="password-input-wrapper">
                  <input
                    id="new-password"
                    type={showNewPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    className="form-input"
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                  >
                    {showNewPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>

                {/* Password Strength Indicator */}
                <div className="password-strength">
                  <div className={`strength-item ${resetHasCapital ? 'active' : ''}`}>
                    <span>✓ Capital letter</span>
                  </div>
                  <div className={`strength-item ${resetHasNumber ? 'active' : ''}`}>
                    <span>✓ At least 1 number</span>
                  </div>
                  <div className={`strength-item ${resetHasMinLength ? 'active' : ''}`}>
                    <span>✓ At least 6 characters</span>
                  </div>
                  <div className={`strength-item ${resetHasSpecial ? 'active' : ''}`}>
                    <span>✓ Special character</span>
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="confirm-new-password">Confirm Password</label>
                <div className="password-input-wrapper">
                  <input
                    id="confirm-new-password"
                    type={showConfirmNewPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    required
                    className="form-input"
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowConfirmNewPassword(!showConfirmNewPassword)}
                  >
                    {showConfirmNewPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? 'Resetting...' : 'Reset Password'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

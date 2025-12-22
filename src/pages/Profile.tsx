import React, { useState, useEffect } from 'react';
import { Button } from 'components/ui/button';
import { Input } from 'components/ui/input';
import { Label } from 'components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from 'components/ui/card';
import { useAuth } from '../contexts/AuthContext';
import { updateUser, changePassword } from '../lib/api';
import { ChevronDown, ChevronUp, Eye, EyeOff } from 'lucide-react';

export default function Profile() {
  const { user, updateUserProfile } = useAuth();
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [memberSince, setMemberSince] = useState('');
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setFullName(user.full_name || '');
      
      // Format member since date
      if (user.created_at) {
        const date = new Date(user.created_at);
        const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long' };
        setMemberSince(date.toLocaleDateString('en-US', options));
      } else {
        setMemberSince('January 2025');
      }
    }
  }, [user]);

  const validatePassword = (password: string) => {
    return {
      hasCapital: /[A-Z]/.test(password),
      hasNumber: /[0-9]/.test(password),
      hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(password),
      hasMinLength: password.length >= 6
    };
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newPassword || !confirmPassword) {
      alert('Please fill in both password fields');
      return;
    }

    if (newPassword !== confirmPassword) {
      alert('Passwords do not match');
      return;
    }

    const validation = validatePassword(newPassword);
    if (!validation.hasCapital || !validation.hasNumber || !validation.hasSpecial || !validation.hasMinLength) {
      alert('Password does not meet the requirements');
      return;
    }

    setPasswordLoading(true);

    try {
      await changePassword(user.id, newPassword);
      alert('Password changed successfully');
      setNewPassword('');
      setConfirmPassword('');
      setShowPasswordSection(false);
    } catch (error: any) {
      console.error('Password change error:', error);
      alert(error.message || 'Failed to change password');
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!fullName.trim()) {
      alert('Please enter your full name');
      return;
    }

    setLoading(true);

    try {
      await updateUser(user.id, { 
        full_name: fullName.trim(),
        role: user.role 
      });
      
      // Update user context and localStorage
      updateUserProfile({ full_name: fullName.trim() });
      
      alert('Profile updated successfully');
    } catch (error: any) {
      console.error('Profile update error:', error);
      alert(error.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (


    <>
<main className="container mx-auto px-3 sm:px-4 md:px-6 py-3 sm:py-4 md:py-6" style={{ backgroundColor: '#F8FAFC' }}>
        <div className="space-y-4 md:space-y-6">
          {/* Page Header */}
          <div className="mb-6 md:mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold" style={{ color: '#1A202C' }}>Profile Settings</h1>
            <p className="text-xs sm:text-sm md:text-base mt-1 sm:mt-2" style={{ color: '#4A5568' }}>Update your personal information</p>
          </div>

          {/* Profile Form Card */}
          <Card className="max-w-2xl mx-auto bg-white border" style={{ borderColor: '#E2E8F0', borderRadius: '8px' }}>
            <CardHeader style={{ padding: '24px', paddingBottom: '16px' }}>
              <CardTitle className="text-lg font-bold" style={{ color: '#1A202C' }}>
                Account Information
              </CardTitle>
              <CardDescription className="text-sm" style={{ color: '#718096' }}>
                Manage your account details and preferences
              </CardDescription>
            </CardHeader>
            <CardContent style={{ padding: '24px', paddingTop: '16px' }}>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Email Field (Read-only) */}
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-semibold" style={{ color: '#1A202C' }}>
                    Email Address
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={user?.email || ''}
                    disabled
                    className="h-11 border"
                    style={{ 
                      borderColor: '#E2E8F0', 
                      borderRadius: '8px', 
                      backgroundColor: '#F8FAFC',
                      color: '#718096'
                    }}
                  />
                  <p className="text-xs" style={{ color: '#718096' }}>
                    Your email address cannot be changed
                  </p>
                </div>

                {/* Role Field (Read-only) */}
                <div className="space-y-2">
                  <Label htmlFor="role" className="text-sm font-semibold" style={{ color: '#1A202C' }}>
                    Role
                  </Label>
                  <Input
                    id="role"
                    value={user?.role || 'employee'}
                    disabled
                    className="h-11 border capitalize"
                    style={{ 
                      borderColor: '#E2E8F0', 
                      borderRadius: '8px', 
                      backgroundColor: '#F8FAFC',
                      color: '#718096'
                    }}
                  />
                  <p className="text-xs" style={{ color: '#718096' }}>
                    Contact an administrator to change your role
                  </p>
                </div>

                {/* Full Name Field (Editable) */}
                <div className="space-y-2">
                  <Label htmlFor="fullName" className="text-sm font-semibold" style={{ color: '#1A202C' }}>
                    Full Name <span style={{ color: '#E53E3E' }}>*</span>
                  </Label>
                  <Input
                    id="fullName"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Enter your full name"
                    className="h-11 border"
                    style={{ 
                      borderColor: '#E2E8F0', 
                      borderRadius: '8px',
                      backgroundColor: '#FFFFFF'
                    }}
                  />
                  <p className="text-xs" style={{ color: '#718096' }}>
                    This name will be displayed throughout the system
                  </p>
                </div>

                {/* Submit Button */}
                <div className="pt-4">
                  <Button 
                    type="submit" 
                    disabled={loading}
                    className="h-12 font-bold"
                    style={{ 
                      backgroundColor: loading ? '#718096' : '#0883A4', 
                      color: '#FFFFFF', 
                      borderRadius: '8px',
                      opacity: loading ? 0.6 : 1
                    }}
                  >
                    {loading ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Account Details Card */}
          <Card className="max-w-2xl mx-auto bg-white border" style={{ borderColor: '#E2E8F0', borderRadius: '8px' }}>
            <CardHeader style={{ padding: '24px', paddingBottom: '16px' }}>
              <CardTitle className="text-lg font-bold" style={{ color: '#1A202C' }}>
                Account Details
              </CardTitle>
              <CardDescription className="text-sm" style={{ color: '#718096' }}>
                View your account status and security settings
              </CardDescription>
            </CardHeader>
            <CardContent style={{ padding: '24px', paddingTop: '16px' }}>
              <div className="space-y-4">
                {/* Account Status */}
                <div className="flex items-center justify-between py-3 border-b" style={{ borderColor: '#E2E8F0' }}>
                  <div>
                    <p className="text-sm font-semibold" style={{ color: '#718096' }}>Account Status</p>
                    <p className="text-base font-bold" style={{ color: '#1A202C' }}>Active</p>
                  </div>
                  <div 
                    className="px-3 py-1 rounded-full text-xs font-bold"
                    style={{ backgroundColor: '#D1FAE5', color: '#38A169' }}
                  >
                    Verified
                  </div>
                </div>

                {/* Change Password Dropdown */}
                <div className="py-3">
                  <button
                    onClick={() => setShowPasswordSection(!showPasswordSection)}
                    className="w-full flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                    style={{ borderColor: '#E2E8F0' }}
                  >
                    <div>
                      <p className="text-sm font-semibold text-left" style={{ color: '#1A202C' }}>Change Password</p>
                      <p className="text-xs text-left" style={{ color: '#718096' }}>Update your account password</p>
                    </div>
                    {showPasswordSection ? (
                      <ChevronUp className="h-5 w-5" style={{ color: '#718096' }} />
                    ) : (
                      <ChevronDown className="h-5 w-5" style={{ color: '#718096' }} />
                    )}
                  </button>

                  {showPasswordSection && (
                    <form onSubmit={handlePasswordChange} className="mt-4 space-y-4 p-4 border rounded-lg" style={{ borderColor: '#E2E8F0', backgroundColor: '#F8FAFC' }}>
                      {/* New Password */}
                      <div className="space-y-2">
                        <Label htmlFor="newPassword" className="text-sm font-semibold" style={{ color: '#1A202C' }}>
                          New Password <span style={{ color: '#E53E3E' }}>*</span>
                        </Label>
                        <div className="relative">
                          <Input
                            id="newPassword"
                            type={showNewPassword ? 'text' : 'password'}
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="Enter new password"
                            className="h-11 border pr-10"
                            style={{ borderColor: '#E2E8F0', borderRadius: '8px', backgroundColor: '#FFFFFF' }}
                          />
                          <button
                            type="button"
                            onClick={() => setShowNewPassword(!showNewPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2"
                          >
                            {showNewPassword ? (
                              <EyeOff className="h-4 w-4" style={{ color: '#718096' }} />
                            ) : (
                              <Eye className="h-4 w-4" style={{ color: '#718096' }} />
                            )}
                          </button>
                        </div>
                        {newPassword && (
                          <div className="text-xs space-y-1 mt-2">
                            <p style={{ color: validatePassword(newPassword).hasCapital ? '#38A169' : '#E53E3E' }}>
                              {validatePassword(newPassword).hasCapital ? '✓' : '✗'} At least one capital letter
                            </p>
                            <p style={{ color: validatePassword(newPassword).hasNumber ? '#38A169' : '#E53E3E' }}>
                              {validatePassword(newPassword).hasNumber ? '✓' : '✗'} At least one number
                            </p>
                            <p style={{ color: validatePassword(newPassword).hasSpecial ? '#38A169' : '#E53E3E' }}>
                              {validatePassword(newPassword).hasSpecial ? '✓' : '✗'} At least one special character
                            </p>
                            <p style={{ color: validatePassword(newPassword).hasMinLength ? '#38A169' : '#E53E3E' }}>
                              {validatePassword(newPassword).hasMinLength ? '✓' : '✗'} At least 6 characters
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Confirm Password */}
                      <div className="space-y-2">
                        <Label htmlFor="confirmPassword" className="text-sm font-semibold" style={{ color: '#1A202C' }}>
                          Confirm Password <span style={{ color: '#E53E3E' }}>*</span>
                        </Label>
                        <div className="relative">
                          <Input
                            id="confirmPassword"
                            type={showConfirmPassword ? 'text' : 'password'}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Confirm new password"
                            className="h-11 border pr-10"
                            style={{ borderColor: '#E2E8F0', borderRadius: '8px', backgroundColor: '#FFFFFF' }}
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2"
                          >
                            {showConfirmPassword ? (
                              <EyeOff className="h-4 w-4" style={{ color: '#718096' }} />
                            ) : (
                              <Eye className="h-4 w-4" style={{ color: '#718096' }} />
                            )}
                          </button>
                        </div>
                        {confirmPassword && newPassword && (
                          <p className="text-xs" style={{ color: newPassword === confirmPassword ? '#38A169' : '#E53E3E' }}>
                            {newPassword === confirmPassword ? '✓ Passwords match' : '✗ Passwords do not match'}
                          </p>
                        )}
                      </div>

                      {/* Save Button */}
                      <Button
                        type="submit"
                        disabled={passwordLoading || !newPassword || !confirmPassword || newPassword !== confirmPassword}
                        className="w-full h-11 font-bold"
                        style={{
                          backgroundColor: passwordLoading || !newPassword || !confirmPassword || newPassword !== confirmPassword ? '#718096' : '#0883A4',
                          color: '#FFFFFF',
                          borderRadius: '8px',
                          opacity: passwordLoading || !newPassword || !confirmPassword || newPassword !== confirmPassword ? 0.6 : 1
                        }}
                      >
                        {passwordLoading ? 'Saving...' : 'Save New Password'}
                      </Button>
                    </form>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </>
  );
}

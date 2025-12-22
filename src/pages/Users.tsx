import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from 'components/ui/card';
import { Button } from 'components/ui/button';
import { Input } from 'components/ui/input';
import { Badge } from 'components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from 'components/ui/tabs';
import { 
  Users as UsersIcon, 
  UserCheck, 
  UserX, 
  Search,
  Clock,
  CheckCircle,
  Shield,
  Activity,
  LogIn,
  LogOut,
  Copy,
  Key
} from 'lucide-react';
import { 
  listReturns, 
  updateReturn, 
  getUsers, 
  getUserStats, 
  getPendingApprovals, 
  approveUser, 
  rejectUser, 
  getPasswordResets, 
  requestPasswordReset, 
  getUserActivity 
} from '../lib/api';
import { useAuth } from '../contexts/AuthContext';

interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  role: "admin" | "employee";
  approval_status: string | null;
  created_at: string | null;
  is_online?: boolean;
}

interface PendingApproval {
  id: string;
  email: string;
  requested_role: "admin" | "employee";
  status: string;
  created_at: string | null;
}

interface ActivityLog {
  id: string;
  user_id: string;
  user_name: string;
  user_email: string;
  user_role: "admin" | "employee";
  logged_in_at: string;
  logged_out_at: string | null;
  is_active: boolean;
}

export default function Users() {
  const { isAdmin } = useAuth();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [pendingApprovals, setPendingApprovals] = useState<PendingApproval[]>([]);
  const [passwordResets, setPasswordResets] = useState<any[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [stats, setStats] = useState({
    totalUsers: 0,
    pendingApprovals: 0,
    activeNow: 0,
    activeAdmins: 0,
    pendingResets: 0
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [activitySearchTerm, setActivitySearchTerm] = useState("");
  const [pendingReturns, setPendingReturns] = useState<any[]>([]);
  const [loadingReturns, setLoadingReturns] = useState(true);
  const [loadingUsers, setLoadingUsers] = useState(true);

  useEffect(() => {
    // Load all user management data
    fetchAllData();

    // Auto-refresh activity logs every 5 seconds to reflect logouts in real-time
    const activityRefreshInterval = setInterval(() => {
      fetchActivityLogs();
    }, 5000);

    return () => clearInterval(activityRefreshInterval);
  }, []);

  async function fetchAllData() {
    await Promise.all([
      fetchUsers(),
      fetchStats(),
      fetchPendingApprovalsData(),
      fetchPasswordResets(),
      fetchActivityLogs(),
      fetchPendingReturns()
    ]);
  }

  async function fetchUsers() {
    try {
      setLoadingUsers(true);
      const { users } = await getUsers();
      setProfiles(users);
    } catch (e) {
      console.error('Failed to load users', e);
    } finally {
      setLoadingUsers(false);
    }
  }

  async function fetchStats() {
    try {
      const data = await getUserStats();
      setStats(data);
    } catch (e) {
      console.error('Failed to load user stats', e);
    }
  }

  async function fetchPendingApprovalsData() {
    try {
      const { approvals } = await getPendingApprovals();
      setPendingApprovals(approvals);
    } catch (e) {
      console.error('Failed to load pending approvals', e);
    }
  }

  async function fetchPasswordResets() {
    try {
      const { resets } = await getPasswordResets();
      setPasswordResets(resets);
    } catch (e) {
      console.error('Failed to load password resets', e);
    }
  }

  async function fetchActivityLogs() {
    try {
      const { activities } = await getUserActivity();
      setActivityLogs(activities);
    } catch (e) {
      console.error('Failed to load activity logs', e);
    }
  }

  async function fetchPendingReturns() {
    try {
      setLoadingReturns(true);
      const { returns } = await listReturns({ status: 'pending' });
      setPendingReturns(returns);
    } catch (e) {
      console.error('Failed to load pending returns', e);
    } finally {
      setLoadingReturns(false);
    }
  }

  async function handleApproveReturn(ret: any) {
    if (!isAdmin) return alert('Only admins can approve returns');
    try {
      await updateReturn(ret.id, { status: 'approved' });
      fetchPendingReturns();
      alert('Return approved and stock updated');
    } catch (e: any) {
      alert('Failed to approve return: ' + e.message);
    }
  }

  async function handleRejectReturn(ret: any) {
    if (!isAdmin) return alert('Only admins can reject returns');
    try {
      await updateReturn(ret.id, { status: 'rejected' });
      fetchPendingReturns();
      alert('Return rejected');
    } catch (e: any) {
      alert('Failed to reject return: ' + e.message);
    }
  }

  const handleApproveUser = async (approval: PendingApproval) => {
    if (!isAdmin) return alert('Only admins can approve users');
    try {
      await approveUser(approval.id);
      alert(`User ${approval.email} approved successfully`);
      fetchAllData();
    } catch (e: any) {
      alert('Failed to approve user: ' + e.message);
    }
  };

  const handleRejectUser = async (approval: PendingApproval) => {
    if (!isAdmin) return alert('Only admins can reject users');
    try {
      await rejectUser(approval.id);
      alert(`User ${approval.email} rejected`);
      fetchAllData();
    } catch (e: any) {
      alert('Failed to reject user: ' + e.message);
    }
  };

  const handleCopyResetCode = (reset: any) => {
    navigator.clipboard.writeText(reset.reset_code);
    alert('Reset code copied to clipboard!');
  };

  // Edit functionality removed as per requirements

  const filteredProfiles = profiles
    .filter(profile => profile.approval_status === 'approved')
    .filter(profile =>
      profile.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (profile.full_name?.toLowerCase().includes(searchTerm.toLowerCase()))
    );

  // Deduplicate active sessions by user_id to show each user once
  const uniqueActiveSessions = Array.from(
    new Map(
      activityLogs
        .filter(log => log.is_active)
        .map(session => [session.user_id, session])
    ).values()
  );
  const activeSessions = uniqueActiveSessions;
  const inactiveSessions = activityLogs.filter(log => !log.is_active);

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case 'approved':
        return <Badge style={{ backgroundColor: '#D1FAE5', color: '#38A169', borderRadius: '12px', padding: '4px 12px' }}>Approved</Badge>;
      case 'rejected':
        return <Badge style={{ backgroundColor: '#FEE2E2', color: '#E53E3E', borderRadius: '12px', padding: '4px 12px' }}>Rejected</Badge>;
      default:
        return <Badge style={{ backgroundColor: '#E2E8F0', color: '#4A5568', borderRadius: '12px', padding: '4px 12px' }}>Pending</Badge>;
    }
  };

  const formatDateTime = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  };

  return (


    <>
<main className="container mx-auto px-3 sm:px-4 md:px-6 py-3 sm:py-4 md:py-6" style={{ backgroundColor: '#F8FAFC' }}>
        <div className="space-y-4 md:space-y-6">
          {/* Page Header */}
          <div className="mb-6 md:mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold" style={{ color: '#1A202C' }}>User Management</h1>
            <p className="text-xs sm:text-sm md:text-base mt-1 sm:mt-2" style={{ color: '#4A5568' }}>Manage users, approvals, and monitor activity</p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="bg-white border" style={{ borderColor: '#E2E8F0', borderRadius: '8px' }}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2" style={{ padding: '24px', paddingBottom: '8px' }}>
                <CardTitle className="text-sm font-semibold" style={{ color: '#718096' }}>Total Users</CardTitle>
                <UsersIcon className="h-4 w-4" style={{ color: '#718096' }} />
              </CardHeader>
              <CardContent style={{ padding: '24px', paddingTop: '8px' }}>
                <div className="text-2xl font-bold" style={{ color: '#1A202C' }}>{filteredProfiles.length}</div>
              </CardContent>
            </Card>

            <Card className="bg-white border" style={{ borderColor: '#E2E8F0', borderRadius: '8px' }}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2" style={{ padding: '24px', paddingBottom: '8px' }}>
                <CardTitle className="text-sm font-semibold" style={{ color: '#718096' }}>Pending Approvals</CardTitle>
                <Clock className="h-4 w-4" style={{ color: '#F59E0B' }} />
              </CardHeader>
              <CardContent style={{ padding: '24px', paddingTop: '8px' }}>
                <div className="text-2xl font-bold" style={{ color: '#1A202C' }}>{stats.pendingApprovals + pendingReturns.length}</div>
              </CardContent>
            </Card>

            <Card className="bg-white border" style={{ borderColor: '#E2E8F0', borderRadius: '8px' }}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2" style={{ padding: '24px', paddingBottom: '8px' }}>
                <CardTitle className="text-sm font-semibold" style={{ color: '#718096' }}>Active Now</CardTitle>
                <Activity className="h-4 w-4" style={{ color: '#38A169' }} />
              </CardHeader>
              <CardContent style={{ padding: '24px', paddingTop: '8px' }}>
                <div className="text-2xl font-bold" style={{ color: '#38A169' }}>{stats.activeNow}</div>
              </CardContent>
            </Card>

            <Card className="bg-white border" style={{ borderColor: '#E2E8F0', borderRadius: '8px' }}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2" style={{ padding: '24px', paddingBottom: '8px' }}>
                <CardTitle className="text-sm font-semibold" style={{ color: '#718096' }}>Active Admins</CardTitle>
                <Shield className="h-4 w-4" style={{ color: '#0883A4' }} />
              </CardHeader>
              <CardContent style={{ padding: '24px', paddingTop: '8px' }}>
                <div className="text-2xl font-bold" style={{ color: '#1A202C' }}>
                  {stats.activeAdmins}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="users" className="space-y-4">
            <TabsList 
              className="w-full grid grid-cols-4"
              style={{ 
                backgroundColor: '#FFFFFF', 
                borderColor: '#E2E8F0', 
                padding: '4px',
                borderRadius: '8px'
              }}
            >
              <TabsTrigger value="users" style={{ borderRadius: '6px' }}>All Users</TabsTrigger>
              <TabsTrigger value="pending" className="relative" style={{ borderRadius: '6px' }}>
                Pending Approvals
                {(pendingApprovals.length + pendingReturns.length) > 0 && (
                  <span className="ml-2 text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: '#F59E0B', color: '#FFFFFF' }}>
                    {pendingApprovals.length + pendingReturns.length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="password-resets" className="relative" style={{ borderRadius: '6px' }}>
                Password Resets
                {passwordResets.length > 0 && (
                  <span className="ml-2 text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: '#0883A4', color: '#FFFFFF' }}>
                    {passwordResets.length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="activity" style={{ borderRadius: '6px' }}>Session History</TabsTrigger>
            </TabsList>

            {/* All Users Tab */}
            <TabsContent value="users" className="space-y-4">
              <Card className="bg-white border" style={{ borderColor: '#E2E8F0', borderRadius: '8px' }}>
                <CardHeader style={{ padding: '24px', paddingBottom: '16px' }}>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <CardTitle className="text-lg font-bold" style={{ color: '#1A202C' }}>Registered Users</CardTitle>
                    <div className="relative w-full sm:w-64">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: '#718096' }} />
                      <Input
                        placeholder="Search users..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 h-11 border"
                        style={{ borderColor: '#E2E8F0', borderRadius: '8px' }}
                      />
                    </div>
                  </div>
                </CardHeader>
                <CardContent style={{ padding: '24px', paddingTop: '16px' }}>
                  {loadingUsers ? (
                    <p className="text-center py-8" style={{ color: '#718096' }}>Loading users...</p>
                  ) : filteredProfiles.length === 0 ? (
                    <p className="text-center py-8" style={{ color: '#718096' }}>No users found</p>
                  ) : (
                    <div className="space-y-3">
                      {filteredProfiles.map((user) => (
                        <div
                          key={user.id}
                          className="flex items-center justify-between p-4 border transition-colors hover:bg-gray-50"
                          style={{ borderColor: '#E2E8F0', borderRadius: '8px', backgroundColor: '#FFFFFF' }}
                        >
                          <div className="flex items-center gap-4">
                            <div className="relative">
                              <div className="p-2 rounded-full" style={{ backgroundColor: '#DBEAFE' }}>
                                <UsersIcon className="h-5 w-5" style={{ color: '#0883A4' }} />
                              </div>
                              {user.is_online && (
                                <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2" style={{ backgroundColor: '#38A169', borderColor: '#FFFFFF' }} />
                              )}
                            </div>
                            <div>
                              <p className="font-semibold" style={{ color: '#1A202C' }}>{user.full_name || 'No name set'}</p>
                              <p className="text-sm" style={{ color: '#718096' }}>{user.email}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge 
                                  style={{ 
                                    backgroundColor: user.role === 'admin' ? '#0883A4' : '#E2E8F0',
                                    color: user.role === 'admin' ? '#FFFFFF' : '#4A5568',
                                    borderRadius: '12px',
                                    padding: '4px 12px',
                                    textTransform: 'capitalize'
                                  }}
                                >
                                  {user.role}
                                </Badge>
                                {getStatusBadge(user.approval_status)}
                                {user.is_online && (
                                  <Badge style={{ backgroundColor: '#D1FAE5', color: '#38A169', borderRadius: '12px', padding: '4px 12px' }}>
                                    <Activity className="h-3 w-3 mr-1" /> Online
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Pending Approvals Tab */}
            <TabsContent value="pending" className="space-y-4">
              <Card className="bg-white border" style={{ borderColor: '#E2E8F0', borderRadius: '8px' }}>
                <CardHeader style={{ padding: '24px', paddingBottom: '16px' }}>
                  <CardTitle className="text-lg font-bold" style={{ color: '#1A202C' }}>Pending Approval Requests</CardTitle>
                  <CardDescription className="text-sm" style={{ color: '#718096' }}>
                    Review and approve new user registrations
                  </CardDescription>
                </CardHeader>
                <CardContent style={{ padding: '24px', paddingTop: '16px' }}>
                  {pendingApprovals.length === 0 ? (
                    <div className="text-center py-8">
                      <CheckCircle className="h-12 w-12 mx-auto mb-4" style={{ color: '#38A169' }} />
                      <p style={{ color: '#718096' }}>No pending approvals</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {pendingApprovals.map((approval) => (
                        <div
                          key={approval.id}
                          className="flex items-center justify-between p-4 border"
                          style={{ borderColor: '#FED7AA', borderRadius: '8px', backgroundColor: '#FEF3C7' }}
                        >
                          <div className="flex items-center gap-4">
                            <div className="p-2 rounded-full" style={{ backgroundColor: '#FED7AA' }}>
                              <Clock className="h-5 w-5" style={{ color: '#F59E0B' }} />
                            </div>
                            <div>
                              <p className="font-semibold" style={{ color: '#1A202C' }}>{approval.email}</p>
                              <p className="text-sm" style={{ color: '#718096' }}>
                                Requested: {approval.requested_role}
                              </p>
                              <p className="text-xs" style={{ color: '#718096' }}>
                                {formatDateTime(approval.created_at)}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleApproveUser(approval)}
                              className="h-10 font-bold"
                              style={{ backgroundColor: '#38A169', color: '#FFFFFF', borderRadius: '8px' }}
                            >
                              <UserCheck className="h-4 w-4 mr-1" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => handleRejectUser(approval)}
                              className="h-10 font-bold"
                              style={{ backgroundColor: '#E53E3E', color: '#FFFFFF', borderRadius: '8px' }}
                            >
                              <UserX className="h-4 w-4 mr-1" />
                              Reject
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Pending Returns (Admin decisions) */}
              <Card className="bg-white border" style={{ borderColor: '#E2E8F0', borderRadius: '8px' }}>
                <CardHeader style={{ padding: '24px', paddingBottom: '16px' }}>
                  <CardTitle className="text-lg font-bold" style={{ color: '#1A202C' }}>Pending Returns (Admin)</CardTitle>
                  <CardDescription className="text-sm" style={{ color: '#718096' }}>
                    Approve or reject product return requests
                  </CardDescription>
                </CardHeader>
                <CardContent style={{ padding: '24px', paddingTop: '16px' }}>
                  {loadingReturns ? (
                    <p className="text-center py-6" style={{ color: '#718096' }}>Loading pending returns...</p>
                  ) : pendingReturns.length === 0 ? (
                    <div className="text-center py-8">
                      <CheckCircle className="h-12 w-12 mx-auto mb-4" style={{ color: '#38A169' }} />
                      <p style={{ color: '#718096' }}>No pending returns</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {pendingReturns.map((ret) => (
                        <div key={ret.id} className="flex items-center justify-between p-4 border" style={{ borderColor: '#E2E8F0', borderRadius: '8px', backgroundColor: '#FFFFFF' }}>
                          <div>
                            <p className="font-semibold" style={{ color: '#1A202C' }}>{ret.product_name}</p>
                            <p className="text-xs" style={{ color: '#718096' }}>
                              {ret.order_id} • Qty: {ret.quantity} • {new Date(ret.created_at).toLocaleString()}
                            </p>
                            {ret.reason && (
                              <p className="text-xs mt-1" style={{ color: '#718096' }}>Reason: {ret.reason}</p>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <Button size="sm" disabled={!isAdmin} onClick={() => handleApproveReturn(ret)} className="h-10 font-bold" style={{ backgroundColor: isAdmin ? '#38A169' : '#A0AEC0', color: '#FFFFFF', borderRadius: '8px' }}>
                              Approve
                            </Button>
                            <Button size="sm" disabled={!isAdmin} onClick={() => handleRejectReturn(ret)} className="h-10 font-bold" style={{ backgroundColor: isAdmin ? '#E53E3E' : '#A0AEC0', color: '#FFFFFF', borderRadius: '8px' }}>
                              Reject
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Password Resets Tab */}
            <TabsContent value="password-resets" className="space-y-4">
              <Card className="bg-white border" style={{ borderColor: '#E2E8F0', borderRadius: '8px' }}>
                <CardHeader style={{ padding: '24px', paddingBottom: '16px' }}>
                  <CardTitle className="text-lg font-bold" style={{ color: '#1A202C' }}>Password Reset Requests</CardTitle>
                  <CardDescription className="text-sm" style={{ color: '#718096' }}>
                    Copy and provide reset codes to users
                  </CardDescription>
                </CardHeader>
                <CardContent style={{ padding: '24px', paddingTop: '16px' }}>
                  {passwordResets.length === 0 ? (
                    <div className="text-center py-8">
                      <Key className="h-12 w-12 mx-auto mb-4" style={{ color: '#718096' }} />
                      <p style={{ color: '#718096' }}>No password reset requests</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {passwordResets.map((reset) => {
                        const expiresAt = new Date(reset.expires_at);
                        const timeLeft = Math.max(0, Math.floor((expiresAt.getTime() - Date.now()) / 60000));
                        return (
                          <div
                            key={reset.id}
                            className="flex items-center justify-between p-4 border"
                            style={{ borderColor: '#BFDBFE', borderRadius: '8px', backgroundColor: '#DBEAFE' }}
                          >
                            <div className="flex items-center gap-4 flex-1">
                              <div className="p-2 rounded-full" style={{ backgroundColor: '#93C5FD' }}>
                                <Key className="h-5 w-5" style={{ color: '#0883A4' }} />
                              </div>
                              <div className="flex-1">
                                <p className="font-semibold" style={{ color: '#1A202C' }}>{reset.email}</p>
                                <p className="text-xs mb-2" style={{ color: '#718096' }}>
                                  Requested: {formatDateTime(reset.created_at)} • Expires in {timeLeft} minutes
                                </p>
                                <div className="flex items-center gap-2">
                                  <span 
                                    className="font-mono text-lg px-3 py-1 rounded tracking-widest"
                                    style={{ backgroundColor: '#E2E8F0', color: '#1A202C' }}
                                  >
                                    {reset.reset_code}
                                  </span>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleCopyResetCode(reset)}
                                    className="h-9 border"
                                    style={{ borderColor: '#E2E8F0', borderRadius: '8px' }}
                                  >
                                    <Copy className="h-4 w-4 mr-1" />
                                    Copy
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Session History Tab */}
            <TabsContent value="activity" className="space-y-4">
              {/* Recent Activity */}
              <Card className="bg-white border" style={{ borderColor: '#E2E8F0', borderRadius: '8px' }}>
                  <CardHeader style={{ padding: '24px', paddingBottom: '16px' }}>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div>
                        <CardTitle className="text-lg font-bold flex items-center gap-2" style={{ color: '#1A202C' }}>
                          <LogOut className="h-5 w-5" style={{ color: '#718096' }} />
                          Recent Activity
                        </CardTitle>
                        <CardDescription className="text-sm" style={{ color: '#718096' }}>
                          Recent login/logout history
                        </CardDescription>
                      </div>
                      <div className="relative w-full sm:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: '#718096' }} />
                        <Input
                          placeholder="Search by username..."
                          value={activitySearchTerm}
                          onChange={(e) => setActivitySearchTerm(e.target.value)}
                          className="pl-10 h-11 border"
                          style={{ borderColor: '#E2E8F0', borderRadius: '8px' }}
                        />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent style={{ padding: '24px', paddingTop: '16px' }}>
                    {inactiveSessions.filter((session) => 
                      session.user_name.toLowerCase().includes(activitySearchTerm.toLowerCase())
                    ).length === 0 ? (
                      <p className="text-center py-4" style={{ color: '#718096' }}>
                        {activitySearchTerm ? 'No matching users found' : 'No recent activity'}
                      </p>
                    ) : (
                      <div className="space-y-3 max-h-96 overflow-y-auto">
                        {inactiveSessions.filter((session) => 
                          session.user_name.toLowerCase().includes(activitySearchTerm.toLowerCase())
                        ).map((session) => (
                          <div
                            key={session.id}
                            className="flex items-center justify-between p-3 border"
                            style={{ borderColor: '#E2E8F0', borderRadius: '8px', backgroundColor: '#F8FAFC' }}
                          >
                            <div className="flex items-center gap-3">
                              <div className="p-2 rounded-full" style={{ backgroundColor: '#E2E8F0' }}>
                                <LogOut className="h-4 w-4" style={{ color: '#718096' }} />
                              </div>
                              <div>
                                <p className="font-semibold text-sm" style={{ color: '#1A202C' }}>
                                  {session.user_name}
                                </p>
                                <p className="text-xs" style={{ color: '#718096' }}>
                                  {session.user_email}
                                </p>
                                <div className="flex flex-col gap-1 mt-1 text-xs" style={{ color: '#718096' }}>
                                  <span>In: {formatDateTime(session.logged_in_at)}</span>
                                  <span>Out: {formatDateTime(session.logged_out_at)}</span>
                                </div>
                              </div>
                            </div>
                            <Badge 
                              variant="outline" 
                              style={{ 
                                borderColor: '#E2E8F0',
                                color: '#718096',
                                borderRadius: '12px',
                                padding: '2px 8px',
                                fontSize: '11px',
                                textTransform: 'capitalize'
                              }}
                            >
                              {session.user_role}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
            </TabsContent>
          </Tabs>
        </div>


      </main>
    </>
  );
}

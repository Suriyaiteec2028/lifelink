import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Heart,
  Search,
  PlusCircle,
  Clock,
  CheckCircle2,
  Calendar,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  MapPin,
  Loader2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/apiClient';
import { StatusBadge } from '../components/StatusBadge';

export const DashboardPage = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalRequests: 0,
    acceptedRequests: 0,
    pendingRequests: 0,
    invitationsCount: 0
  });
  const [recentRequests, setRecentRequests] = useState([]);
  const [recentInvitations, setRecentInvitations] = useState([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const [reqData, invData] = await Promise.all([
          api.getMyRequests().catch(() => ({ requests: [] })),
          api.getMyInvitations().catch(() => ({ invitations: [] }))
        ]);

        const myRequests = reqData.requests || [];
        const myInvitations = invData.invitations || [];

        const accepted = myRequests.filter((r) => r.status === 'Matched').length;
        const pending = myRequests.filter((r) => ['Searching', 'Invitations Sent'].includes(r.status)).length;

        setStats({
          totalRequests: myRequests.length,
          acceptedRequests: accepted,
          pendingRequests: pending,
          invitationsCount: myInvitations.filter((i) => i.status === 'Sent').length
        });

        setRecentRequests(myRequests.slice(0, 4));
        setRecentInvitations(myInvitations.slice(0, 4));
      } catch (err) {
        console.error('Dashboard load error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const formatDate = (dateStr) => {
    if (!dateStr) return 'None recorded';
    return new Date(dateStr).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-white p-6 rounded-2xl shadow-xs border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900">
              Welcome back, {user?.fullName || 'User'}!
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-red-100 text-red-700">
              {user?.bloodGroup}
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-500 flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-slate-400" />
            <span>{user?.locationAddress || 'Location configured'}</span>
          </p>
        </div>

        {/* Quick actions */}
        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            to="/request-blood"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-xs shadow-red-200 transition"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Request Blood</span>
          </Link>
          <Link
            to="/find-donors"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition"
          >
            <Search className="w-4 h-4" />
            <span>Find Donors</span>
          </Link>
        </div>
      </div>

      {/* Donation Cooldown Alert Banner (if in cooldown) */}
      {user?.donorStatus === 'Donation Cooldown' && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 flex items-start gap-3 text-amber-900">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-xs sm:text-sm">
            <p className="font-bold">6-Month Donation Cooldown Active</p>
            <p className="mt-0.5 text-amber-800">
              Under medical safety guidelines, you are not eligible to donate until{' '}
              <strong>{formatDate(user?.nextEligibleDate)}</strong>. Your availability is automatically locked to protect your wellness.
            </p>
          </div>
        </div>
      )}

      {/* Dashboard Overview Cards (Section 6 Requirements) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* 1. Blood Group */}
        <div className="p-4 sm:p-5 bg-white rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider">My Blood Group</span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-red-50 text-red-600 flex items-center justify-center font-bold text-sm">
              🩸
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-red-600">{user?.bloodGroup}</span>
            <span className="text-[11px] sm:text-xs text-slate-400">RBC Donor</span>
          </div>
        </div>

        {/* 2. Donor Availability Status */}
        <div className="p-4 sm:p-5 bg-white rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider">Availability</span>
            <Link to="/availability" className="text-[11px] font-semibold text-red-600 hover:underline">
              Manage
            </Link>
          </div>
          <div className="mt-3">
            <StatusBadge status={user?.donorStatus || 'Active'} />
          </div>
          <p className="mt-2 text-[10px] sm:text-[11px] text-slate-400">
            {user?.donorStatus === 'Active' ? 'Receiving urgent request alerts' : 'Temporarily paused'}
          </p>
        </div>

        {/* 3. Total Donations */}
        <div className="p-4 sm:p-5 bg-white rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Donations</span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-slate-900">{user?.totalDonations || 0}</span>
            <span className="text-[11px] sm:text-xs text-slate-400">contributions</span>
          </div>
          <p className="mt-1 text-[10px] sm:text-[11px] text-slate-400 truncate">Last: {formatDate(user?.lastDonationDate)}</p>
        </div>

        {/* 4. Next Eligible Date */}
        <div className="p-4 sm:p-5 bg-white rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider">Next Eligible Date</span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-sm sm:text-lg font-bold text-slate-900">
              {user?.nextEligibleDate ? formatDate(user?.nextEligibleDate) : 'Eligible Now'}
            </span>
          </div>
          <p className="mt-1 text-[10px] sm:text-[11px] text-slate-400">
            {user?.nextEligibleDate ? '6-month wait period' : 'Safe to donate'}
          </p>
        </div>

        {/* 5. Total Requests */}
        <div className="p-4 sm:p-5 bg-white rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[11px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Requests</span>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-slate-900">{stats.totalRequests}</span>
            <span className="text-[11px] sm:text-xs text-slate-400">initiated</span>
          </div>
        </div>

        {/* 6. Accepted Requests */}
        <div className="p-4 sm:p-5 bg-white rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[11px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider">Accepted / Matched</span>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-emerald-600">{stats.acceptedRequests}</span>
            <span className="text-[11px] sm:text-xs text-slate-400">fulfilled</span>
          </div>
        </div>

        {/* 7. Pending Requests */}
        <div className="p-4 sm:p-5 bg-white rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[11px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider">Pending Requests</span>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-blue-600">{stats.pendingRequests}</span>
            <span className="text-[11px] sm:text-xs text-slate-400">searching</span>
          </div>
        </div>

        {/* 8. Pending Invitations */}
        <div className="p-4 sm:p-5 bg-white rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[11px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider">Incoming Invitations</span>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-red-600">{stats.invitationsCount}</span>
            <span className="text-[11px] sm:text-xs text-slate-400">awaiting</span>
          </div>
        </div>
      </div>

      {/* Two-Column Grid: Recent Requests & Incoming Invitations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Blood Requests */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-slate-900">My Recent Blood Requests</h2>
            <Link to="/my-requests" className="text-xs font-semibold text-red-600 hover:text-red-700 flex items-center gap-1">
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {loading ? (
            <div className="py-8 text-center text-xs text-slate-400">
              <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-red-600" />
              Loading requests...
            </div>
          ) : recentRequests.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">
              You haven't created any blood requests yet.
            </div>
          ) : (
            <div className="space-y-3">
              {recentRequests.map((req) => (
                <div key={req._id} className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-sm text-red-600">{req.requiredBloodGroup}</span>
                      <span className="text-xs font-medium text-slate-700">&bull; {req.unitsRequired} unit(s)</span>
                      <StatusBadge status={req.status} />
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1 truncate max-w-xs">{req.requestAddress}</p>
                  </div>
                  <Link
                    to="/my-requests"
                    className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 transition"
                  >
                    Details
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Incoming Invitations */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-slate-900">Incoming Donor Invitations</h2>
            <Link to="/invitations" className="text-xs font-semibold text-red-600 hover:text-red-700 flex items-center gap-1">
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {loading ? (
            <div className="py-8 text-center text-xs text-slate-400">
              <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-red-600" />
              Loading invitations...
            </div>
          ) : recentInvitations.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">
              No new blood request invitations at this moment.
            </div>
          ) : (
            <div className="space-y-3">
              {recentInvitations.map((inv) => (
                <div key={inv._id} className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-sm text-red-600">
                        {inv.requestId?.requiredBloodGroup || 'Blood'}
                      </span>
                      <span className="text-xs font-semibold text-slate-800">
                        from {inv.requestId?.requesterNameSnapshot || 'Patient'}
                      </span>
                      <StatusBadge status={inv.status} />
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1 truncate max-w-xs">
                      {inv.requestId?.requestAddress}
                    </p>
                  </div>
                  <Link
                    to="/invitations"
                    className="px-3 py-1.5 text-xs font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700 transition"
                  >
                    Respond
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

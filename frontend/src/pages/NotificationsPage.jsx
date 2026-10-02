import React, { useState } from 'react';
import {
  Bell,
  CheckCheck,
  CheckCircle2,
  Clock,
  Heart,
  AlertTriangle,
  ShieldAlert,
  Loader2,
  ArrowRight
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useNotifications } from '../context/NotificationContext';

export const NotificationsPage = () => {
  const { notifications, unreadCount, loading, markAsRead, markAllAsRead } = useNotifications();
  const [filter, setFilter] = useState('ALL'); // 'ALL' or 'UNREAD'

  const filteredNotifications = notifications.filter((n) => {
    if (filter === 'UNREAD') return !n.isRead;
    return true;
  });

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'NEW_BLOOD_INVITATION':
        return <Heart className="w-4 h-4 text-red-600" />;
      case 'REQUEST_ACCEPTED':
        return <CheckCircle2 className="w-4 h-4 text-emerald-600" />;
      case 'CANCELLATION_REQUESTED':
        return <AlertTriangle className="w-4 h-4 text-amber-600" />;
      case 'REQUEST_CANCELLED':
      case 'REQUEST_CLOSED':
        return <Clock className="w-4 h-4 text-slate-500" />;
      case 'SECURITY_ALERT':
        return <ShieldAlert className="w-4 h-4 text-blue-600" />;
      default:
        return <Bell className="w-4 h-4 text-slate-500" />;
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900">Notifications</h1>
            {unreadCount > 0 && (
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-red-600 text-white">
                {unreadCount} unread
              </span>
            )}
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Real-time in-app alerts for blood invitations, donor matches, and status changes.
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 transition"
          >
            <CheckCheck className="w-4 h-4 text-slate-500" />
            <span>Mark All as Read</span>
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
        <button
          onClick={() => setFilter('ALL')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
            filter === 'ALL'
              ? 'bg-red-600 text-white shadow-2xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          All ({notifications.length})
        </button>
        <button
          onClick={() => setFilter('UNREAD')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
            filter === 'UNREAD'
              ? 'bg-red-600 text-white shadow-2xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Unread ({unreadCount})
        </button>
      </div>

      {/* Notifications List */}
      {loading && notifications.length === 0 ? (
        <div className="py-16 text-center text-xs text-slate-400 bg-white rounded-2xl border border-slate-200">
          <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-red-600" />
          Loading notifications...
        </div>
      ) : filteredNotifications.length === 0 ? (
        <div className="py-16 text-center bg-white rounded-2xl border border-slate-200 p-8">
          <Bell className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-800">No Notifications</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {filter === 'UNREAD'
              ? 'You have caught up with all your notifications!'
              : 'Your inbox is clear. Important updates will appear here.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredNotifications.map((notif) => (
            <div
              key={notif._id}
              onClick={() => {
                if (!notif.isRead) markAsRead(notif._id);
              }}
              className={`p-4 rounded-xl border transition flex items-start gap-3.5 cursor-pointer ${
                !notif.isRead
                  ? 'bg-white border-red-200 shadow-xs'
                  : 'bg-white/70 border-slate-200 opacity-90'
              }`}
            >
              <div className="p-2 rounded-lg bg-slate-100 shrink-0 mt-0.5">
                {getNotificationIcon(notif.notificationType)}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="font-bold text-sm text-slate-900 truncate">
                    {notif.title}
                  </h4>
                  <span className="text-[11px] text-slate-400 shrink-0">
                    {new Date(notif.createdAt).toLocaleDateString([], {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">{notif.message}</p>

                {/* Quick contextual jump link */}
                <div className="mt-2 flex items-center gap-3">
                  {notif.relatedInvitationId && (
                    <Link
                      to="/invitations"
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-red-600 hover:text-red-700"
                    >
                      <span>View Invitation</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  )}
                  {notif.relatedRequestId && !notif.relatedInvitationId && (
                    <Link
                      to="/my-requests"
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-red-600 hover:text-red-700"
                    >
                      <span>View Request</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  )}
                  {!notif.isRead && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        markAsRead(notif._id);
                      }}
                      className="text-[11px] font-semibold text-slate-400 hover:text-slate-600 ml-auto"
                    >
                      Mark as read
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

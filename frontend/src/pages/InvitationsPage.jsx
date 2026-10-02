import React, { useState, useEffect } from 'react';
import {
  Clock,
  Heart,
  MapPin,
  Calendar,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Loader2,
  AlertCircle,
  ShieldAlert,
  Info
} from 'lucide-react';
import { api } from '../api/apiClient';
import { useAuth } from '../context/AuthContext';
import { StatusBadge } from '../components/StatusBadge';
import { MistakenCancellationModal } from '../components/MistakenCancellationModal';

export const InvitationsPage = () => {
  const { user, refreshUser } = useAuth();
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Accept Confirmation Modal
  const [confirmAcceptInv, setConfirmAcceptInv] = useState(null);
  const [accepting, setAccepting] = useState(false);

  // Decline Confirmation
  const [decliningId, setDecliningId] = useState(null);

  // Mistaken Cancellation Modal
  const [mistakenInvId, setMistakenInvId] = useState(null);

  const fetchInvitations = async () => {
    try {
      setLoading(true);
      const res = await api.getMyInvitations();
      if (res.success) {
        setInvitations(res.invitations || []);
      }
    } catch (err) {
      setError(err.message || 'Failed to load invitations.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvitations();
  }, []);

  const handleAccept = async () => {
    if (!confirmAcceptInv) return;

    try {
      setAccepting(true);
      setError(null);
      const res = await api.acceptInvitation(confirmAcceptInv._id);
      if (res.success) {
        setSuccessMsg(
          'Blood request accepted! Your 6-month donation cooldown has begun and the requester has been notified with your contact details.'
        );
        setConfirmAcceptInv(null);
        await refreshUser();
        fetchInvitations();
      }
    } catch (err) {
      setError(err.message || 'Failed to accept invitation.');
    } finally {
      setAccepting(false);
    }
  };

  const handleDecline = async (id) => {
    if (!window.confirm('Are you sure you want to decline this blood donation request?')) {
      return;
    }

    try {
      setDecliningId(id);
      setError(null);
      const res = await api.declineInvitation(id);
      if (res.success) {
        setSuccessMsg('Invitation declined.');
        fetchInvitations();
      }
    } catch (err) {
      setError(err.message || 'Failed to decline invitation.');
    } finally {
      setDecliningId(null);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-black text-slate-900">Blood Donation Invitations</h1>
        <p className="mt-1 text-xs text-slate-500">
          Review emergency blood donation requests sent to you and manage your responses.
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-3 text-xs text-rose-800">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-start gap-3 text-xs text-emerald-800">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Invitations List */}
      {loading ? (
        <div className="py-16 text-center text-xs text-slate-400 bg-white rounded-2xl border border-slate-200">
          <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-red-600" />
          Loading invitations...
        </div>
      ) : invitations.length === 0 ? (
        <div className="py-16 text-center bg-white rounded-2xl border border-slate-200 p-8">
          <Clock className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-800">No Invitations at this Time</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            When patients or hospitals near your location submit a blood request matching your blood group, you will receive notifications here and via email.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {invitations.map((inv) => {
            const req = inv.requestId;
            if (!req) return null;

            return (
              <div
                key={inv._id}
                className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4"
              >
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center justify-center w-11 h-11 rounded-xl bg-red-100 text-red-700 font-black text-lg">
                      {req.requiredBloodGroup}
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-900">
                          {req.unitsRequired} Unit(s) Needed by {req.requesterNameSnapshot}
                        </span>
                        <StatusBadge status={inv.status} />
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        <span>{req.requestAddress}</span>
                      </p>
                    </div>
                  </div>

                  <span className="text-[11px] text-slate-400">
                    Received: {new Date(inv.sentAt).toLocaleDateString()}
                  </span>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3 bg-slate-50 rounded-xl text-xs">
                  <div>
                    <span className="text-slate-400">Patient Age:</span>
                    <p className="font-semibold text-slate-800">{req.requesterAgeSnapshot} years</p>
                  </div>
                  <div>
                    <span className="text-slate-400">Required Date & Time:</span>
                    <p className="font-semibold text-slate-800">
                      {new Date(req.requiredDate).toLocaleDateString()} at {req.requiredTime}
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-400">Search Radius:</span>
                    <p className="font-semibold text-slate-800">{req.searchRadiusKm} km</p>
                  </div>
                  {req.additionalInformation && (
                    <div className="col-span-2 sm:col-span-3 pt-1 border-t border-slate-200/60">
                      <span className="text-slate-400">Notes from Requester:</span>
                      <p className="font-medium text-slate-700 italic">"{req.additionalInformation}"</p>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                  {inv.status === 'Sent' && (
                    <div className="flex items-center gap-3 w-full sm:w-auto">
                      <button
                        onClick={() => setConfirmAcceptInv(inv)}
                        className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-xs shadow-red-200 transition"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Accept Blood Request</span>
                      </button>

                      <button
                        disabled={decliningId === inv._id}
                        onClick={() => handleDecline(inv._id)}
                        className="px-4 py-2 border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold transition"
                      >
                        {decliningId === inv._id ? 'Declining...' : 'Decline'}
                      </button>
                    </div>
                  )}

                  {inv.status === 'Accepted' && (
                    <div className="flex flex-wrap items-center justify-between w-full gap-2 p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                      <div className="text-xs text-emerald-900">
                        <span className="font-bold">✓ You Accepted this Request:</span> The requester has been provided your mobile number to coordinate hospital arrival.
                      </div>
                      <button
                        onClick={() => setMistakenInvId(inv._id)}
                        className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold shadow-2xs transition"
                      >
                        Report Mistaken Acceptance
                      </button>
                    </div>
                  )}

                  {inv.status === 'Cancellation Requested' && (
                    <div className="p-3 bg-orange-50 rounded-xl border border-orange-200 text-xs text-orange-900 w-full">
                      <strong>Cancellation Pending:</strong> You reported an accidental acceptance. Awaiting approval from the requester.
                    </div>
                  )}

                  {inv.status === 'Closed' && (
                    <div className="text-xs text-slate-400 italic">
                      This request has been matched with another donor or is now closed.
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Acceptance Confirmation Modal (Explains 6-month Cooldown) */}
      {confirmAcceptInv && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-2 text-red-600 font-bold text-base">
              <ShieldAlert className="w-5 h-5 text-red-600" />
              <span>Confirm Blood Request Acceptance</span>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              You are accepting the request for <strong>{confirmAcceptInv.requestId?.unitsRequired} unit(s) of {confirmAcceptInv.requestId?.requiredBloodGroup} blood</strong> for <strong>{confirmAcceptInv.requestId?.requesterNameSnapshot}</strong>.
            </p>

            <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl text-xs text-amber-900 space-y-1.5">
              <p className="font-bold">Important Portal Business Rule Notice:</p>
              <p>
                Accepting this request is recorded as a donation commitment and will <strong>automatically deactivate your donor availability and start a 6-month donation cooldown</strong>.
              </p>
              <p className="text-[11px] text-amber-800">
                Your registered mobile number will be securely shared with the requester to arrange blood collection.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setConfirmAcceptInv(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition"
              >
                Review Later
              </button>
              <button
                type="button"
                disabled={accepting}
                onClick={handleAccept}
                className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-sm shadow-red-200 transition disabled:opacity-50 flex items-center gap-1.5"
              >
                {accepting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Confirming...</span>
                  </>
                ) : (
                  <span>I Agree & Accept Request</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mistaken Cancellation Modal */}
      <MistakenCancellationModal
        isOpen={!!mistakenInvId}
        invitationId={mistakenInvId}
        onClose={() => setMistakenInvId(null)}
        onSubmitted={() => {
          setSuccessMsg('Mistaken acceptance reported to requester for cancellation approval.');
          fetchInvitations();
        }}
      />
    </div>
  );
};

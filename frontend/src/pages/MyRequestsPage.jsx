import React, { useState, useEffect } from 'react';
import {
  FileText,
  Phone,
  User,
  MapPin,
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Loader2,
  AlertCircle,
  Eye,
  Plus
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { api } from '../api/apiClient';
import { StatusBadge } from '../components/StatusBadge';

export const MyRequestsPage = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Selected request modal / detail view
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [requestDetails, setRequestDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // Cancel Request Modal
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);

  // Mistaken Cancellation Decision Action
  const [actionLoading, setActionLoading] = useState(false);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const res = await api.getMyRequests();
      if (res.success) {
        setRequests(res.requests || []);
      }
    } catch (err) {
      setError(err.message || 'Failed to load requests.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const openDetails = async (req) => {
    setSelectedRequest(req);
    try {
      setLoadingDetails(true);
      const res = await api.getRequestById(req._id);
      if (res.success) {
        setRequestDetails(res);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleApproveCancellation = async (invitationId) => {
    try {
      setActionLoading(true);
      const res = await api.approveCancellation(invitationId);
      if (res.success) {
        setSuccessMsg('Cancellation approved. Donor cooldown removed and blood request reopened.');
        openDetails(selectedRequest);
        fetchRequests();
      }
    } catch (err) {
      setError(err.message || 'Failed to approve cancellation.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectCancellation = async (invitationId) => {
    const reason = window.prompt('Please enter a reason for rejecting the cancellation:');
    if (reason === null) return;

    try {
      setActionLoading(true);
      const res = await api.rejectCancellation(invitationId, reason);
      if (res.success) {
        setSuccessMsg('Cancellation request rejected. Accepted status retained.');
        openDetails(selectedRequest);
        fetchRequests();
      }
    } catch (err) {
      setError(err.message || 'Failed to reject cancellation.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelRequest = async (e) => {
    e.preventDefault();
    if (!selectedRequest) return;

    try {
      setCancelling(true);
      const res = await api.cancelRequest(selectedRequest._id, cancelReason);
      if (res.success) {
        setSuccessMsg('Blood request has been cancelled.');
        setShowCancelModal(false);
        setCancelReason('');
        setSelectedRequest(null);
        fetchRequests();
      }
    } catch (err) {
      setError(err.message || 'Failed to cancel request.');
    } finally {
      setCancelling(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900">My Blood Requests</h1>
          <p className="mt-1 text-xs text-slate-500">
            Track active requests, view accepted donor contact details, and manage invitations.
          </p>
        </div>

        <Link
          to="/request-blood"
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-xs transition"
        >
          <Plus className="w-4 h-4" />
          <span>New Blood Request</span>
        </Link>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-3 text-xs text-rose-800">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-start gap-3 text-xs text-emerald-800">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Requests List */}
      {loading ? (
        <div className="py-16 text-center text-xs text-slate-400 bg-white rounded-2xl border border-slate-200">
          <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-red-600" />
          Loading your blood requests...
        </div>
      ) : requests.length === 0 ? (
        <div className="py-16 text-center bg-white rounded-2xl border border-slate-200 p-8">
          <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-800">No Blood Requests Found</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            You haven't posted any blood requests yet. When you or someone near you needs blood, start a request to notify eligible nearby donors.
          </p>
          <Link
            to="/request-blood"
            className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition"
          >
            <span>Create Blood Request</span>
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map((req) => (
            <div
              key={req._id}
              className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-slate-300 transition"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-3">
                <div className="flex items-center gap-3">
                  <span className="flex items-center justify-center w-11 h-11 rounded-xl bg-red-100 text-red-700 font-black text-lg">
                    {req.requiredBloodGroup}
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-sm">
                        {req.unitsRequired} Unit(s) Required
                      </span>
                      <StatusBadge status={req.status} />
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span>{req.requestAddress}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openDetails(req)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>View Details</span>
                  </button>
                </div>
              </div>

              {/* Matched Donor Highlight Card */}
              {req.status === 'Matched' && req.acceptedDonorId && (
                <div className="mt-4 p-4 rounded-xl bg-emerald-50/80 border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-800">
                      ✓ Donor Matched & Confirmed
                    </span>
                    <h4 className="font-bold text-sm text-slate-900 mt-0.5">
                      {req.acceptedDonorId.fullName} ({req.acceptedDonorId.bloodGroup})
                    </h4>
                    <p className="text-xs text-slate-600">
                      Approx Location: {req.acceptedDonorId.locationAddress}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <a
                      href={`tel:${req.acceptedDonorId.phone}`}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition"
                    >
                      <Phone className="w-4 h-4" />
                      <span>Call Donor: {req.acceptedDonorId.phone}</span>
                    </a>
                  </div>
                </div>
              )}

              {/* Mistaken Acceptance Alert Banner */}
              {req.status === 'Cancellation Requested' && (
                <div className="mt-4 p-4 rounded-xl bg-orange-50 border border-orange-300 flex items-start gap-3 text-xs text-orange-900">
                  <AlertTriangle className="w-5 h-5 text-orange-600 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-bold">Donor Reported Mistaken Acceptance</p>
                    <p className="mt-0.5 text-orange-800">
                      The matched donor reported that they accepted this request accidentally. Click "View Details" to approve or reject this cancellation.
                    </p>
                  </div>
                </div>
              )}

              {/* Request Metadata Footer */}
              <div className="mt-3 flex flex-wrap items-center justify-between text-xs text-slate-400 gap-2">
                <div className="flex items-center gap-4">
                  <span>Required Date: <strong className="text-slate-700">{new Date(req.requiredDate).toLocaleDateString()} at {req.requiredTime}</strong></span>
                  <span>Radius: <strong className="text-slate-700">{req.searchRadiusKm} km</strong></span>
                  <span>Contact: <strong className="text-slate-700">{req.contactPhone}</strong></span>
                </div>
                <span>Created: {new Date(req.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Request Details Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="relative bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-400 uppercase tracking-widest font-mono">Request Details</span>
                <h3 className="text-base font-bold flex items-center gap-2 mt-0.5">
                  <span>{selectedRequest.requiredBloodGroup} Blood Request</span>
                  <StatusBadge status={selectedRequest.status} />
                </h3>
              </div>
              <button
                onClick={() => {
                  setSelectedRequest(null);
                  setRequestDetails(null);
                }}
                className="p-1 rounded-full text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto space-y-5 text-xs sm:text-sm">
              {loadingDetails ? (
                <div className="py-12 text-center text-slate-400">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-red-600" />
                  Loading invitation statuses...
                </div>
              ) : (
                <>
                  {/* Summary Box */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
                    <div>
                      <span className="text-slate-400 text-xs">Required Blood Group:</span>
                      <p className="font-extrabold text-red-600 text-base">{selectedRequest.requiredBloodGroup}</p>
                    </div>
                    <div>
                      <span className="text-slate-400 text-xs">Units Needed:</span>
                      <p className="font-bold text-slate-900">{selectedRequest.unitsRequired} Unit(s)</p>
                    </div>
                    <div>
                      <span className="text-slate-400 text-xs">Search Radius:</span>
                      <p className="font-bold text-slate-900">{selectedRequest.searchRadiusKm} km</p>
                    </div>
                    <div>
                      <span className="text-slate-400 text-xs">Hospital / Location:</span>
                      <p className="font-medium text-slate-800 truncate">{selectedRequest.requestAddress}</p>
                    </div>
                    <div>
                      <span className="text-slate-400 text-xs">Required By:</span>
                      <p className="font-medium text-slate-800">
                        {new Date(selectedRequest.requiredDate).toLocaleDateString()} {selectedRequest.requiredTime}
                      </p>
                    </div>
                    <div>
                      <span className="text-slate-400 text-xs">Contact Phone:</span>
                      <p className="font-bold text-slate-900">{selectedRequest.contactPhone}</p>
                    </div>
                  </div>

                  {/* Accepted Donor Contact Info Section */}
                  {requestDetails?.request?.acceptedDonorId && (
                    <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-300">
                      <h4 className="font-bold text-sm text-emerald-900 mb-2">
                        Accepted Donor Contact Information
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-slate-500">Name:</span>{' '}
                          <strong>{requestDetails.request.acceptedDonorId.fullName}</strong>
                        </div>
                        <div>
                          <span className="text-slate-500">Blood Group:</span>{' '}
                          <strong className="text-red-600">{requestDetails.request.acceptedDonorId.bloodGroup}</strong>
                        </div>
                        <div>
                          <span className="text-slate-500">Direct Phone:</span>{' '}
                          <a
                            href={`tel:${requestDetails.request.acceptedDonorId.phone}`}
                            className="font-bold text-emerald-700 underline text-sm"
                          >
                            {requestDetails.request.acceptedDonorId.phone}
                          </a>
                        </div>
                        <div>
                          <span className="text-slate-500">Location Area:</span>{' '}
                          <strong>{requestDetails.request.acceptedDonorId.locationAddress}</strong>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Mistaken Acceptance Alert & Decision Actions */}
                  {selectedRequest.status === 'Cancellation Requested' && (
                    <div className="p-4 bg-amber-50 rounded-xl border border-amber-300 space-y-3">
                      <div className="flex items-center gap-2 text-amber-900 font-bold text-sm">
                        <AlertTriangle className="w-5 h-5 text-amber-600" />
                        <span>Donor Requested Cancellation of Mistaken Acceptance</span>
                      </div>
                      <p className="text-xs text-amber-800">
                        The donor reported they accepted by mistake. If approved, their cooldown is removed and this request is reopened for new searches.
                      </p>

                      {/* Find the invitation with Cancellation Requested */}
                      {requestDetails?.invitations?.filter((i) => i.status === 'Cancellation Requested').map((inv) => (
                        <div key={inv._id} className="p-3 bg-white rounded-lg border border-amber-200 space-y-2">
                          <p className="text-xs text-slate-700">
                            <strong>Reported Reason:</strong> "{inv.cancellationReason || 'Mistake'}"
                          </p>
                          <div className="flex items-center gap-2 pt-1">
                            <button
                              disabled={actionLoading}
                              onClick={() => handleApproveCancellation(inv._id)}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition disabled:opacity-50"
                            >
                              Approve Cancellation & Reopen Request
                            </button>
                            <button
                              disabled={actionLoading}
                              onClick={() => handleRejectCancellation(inv._id)}
                              className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition disabled:opacity-50"
                            >
                              Reject Cancellation
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Invited Donors Status Table */}
                  <div>
                    <h4 className="font-bold text-sm text-slate-900 mb-2">
                      Invited Donors Status ({requestDetails?.invitations?.length || 0})
                    </h4>
                    {requestDetails?.invitations?.length === 0 ? (
                      <p className="text-xs text-slate-400">No invitations recorded.</p>
                    ) : (
                      <div className="overflow-x-auto border border-slate-200 rounded-xl">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold">
                            <tr>
                              <th className="py-2.5 px-3">Donor</th>
                              <th className="py-2.5 px-3">Blood Group</th>
                              <th className="py-2.5 px-3">Status</th>
                              <th className="py-2.5 px-3">Sent At</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {requestDetails?.invitations?.map((inv) => (
                              <tr key={inv._id} className="hover:bg-slate-50/50">
                                <td className="py-2.5 px-3 font-semibold text-slate-900">
                                  {inv.donorId?.fullName || 'Anonymous Donor'}
                                </td>
                                <td className="py-2.5 px-3 font-bold text-red-600">
                                  {inv.donorId?.bloodGroup}
                                </td>
                                <td className="py-2.5 px-3">
                                  <StatusBadge status={inv.status} />
                                </td>
                                <td className="py-2.5 px-3 text-slate-400">
                                  {new Date(inv.sentAt).toLocaleDateString()}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              {['Searching', 'Invitations Sent', 'Matched'].includes(selectedRequest.status) && (
                <button
                  onClick={() => setShowCancelModal(true)}
                  className="px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-lg transition"
                >
                  Cancel Blood Request
                </button>
              )}
              <button
                onClick={() => {
                  setSelectedRequest(null);
                  setRequestDetails(null);
                }}
                className="ml-auto px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-bold hover:bg-slate-800 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Request Confirmation Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 z-60 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 mb-2">Cancel Blood Request</h3>
            <p className="text-xs text-slate-600 mb-4">
              Are you sure you want to cancel this request? All open donor invitations will be closed and donors will be notified.
            </p>

            <form onSubmit={handleCancelRequest} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Cancellation Reason <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="e.g. Patient discharged, blood obtained from hospital bank..."
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-900 focus:ring-2 focus:ring-red-500 outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCancelModal(false)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition"
                >
                  Keep Request
                </button>
                <button
                  type="submit"
                  disabled={cancelling}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition disabled:opacity-50"
                >
                  {cancelling ? 'Cancelling...' : 'Confirm Cancellation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { FileText, MapPin, Calendar, Users, Phone, AlertCircle, Loader2 } from 'lucide-react';
import { api } from '../api/apiClient';
import { StatusBadge } from '../components/StatusBadge';

export const RequestHistoryPage = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setLoading(true);
        const res = await api.getRequestHistory();
        if (res.success) {
          setHistory(res.history || []);
        }
      } catch (err) {
        setError(err.message || 'Failed to load request history.');
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, []);

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-black text-slate-900">Blood Request History</h1>
        <p className="mt-1 text-xs text-slate-500">
          Complete log of all blood requests created under your account with match and resolution statuses.
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-3 text-xs text-rose-800">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="py-16 text-center text-xs text-slate-400 bg-white rounded-2xl border border-slate-200">
          <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-red-600" />
          Loading request history...
        </div>
      ) : history.length === 0 ? (
        <div className="py-16 text-center bg-white rounded-2xl border border-slate-200 p-8">
          <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-800">No Historical Requests</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            All your submitted blood requests and their outcomes will be archived here.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {history.map((req) => (
            <div
              key={req._id}
              className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
                <div className="flex items-center gap-3">
                  <span className="flex items-center justify-center w-11 h-11 rounded-xl bg-red-100 text-red-700 font-black text-lg">
                    {req.requiredBloodGroup}
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-sm text-slate-900">
                        {req.unitsRequired} Unit(s) Required
                      </h3>
                      <StatusBadge status={req.status} />
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span>{req.requestAddress}</span>
                    </p>
                  </div>
                </div>

                <div className="text-xs text-slate-400 text-right font-mono">
                  Req ID: {req._id.substring(req._id.length - 8).toUpperCase()}
                </div>
              </div>

              {/* Grid Data */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-slate-50 p-3 rounded-xl">
                <div>
                  <span className="text-slate-400">Search Radius:</span>
                  <p className="font-semibold text-slate-800">{req.searchRadiusKm} km</p>
                </div>
                <div>
                  <span className="text-slate-400">Required Date:</span>
                  <p className="font-semibold text-slate-800">
                    {formatDate(req.requiredDate)} {req.requiredTime}
                  </p>
                </div>
                <div>
                  <span className="text-slate-400">Invited Donors:</span>
                  <p className="font-semibold text-slate-800">{req.invitationsCount} invited</p>
                </div>
                <div>
                  <span className="text-slate-400">Created At:</span>
                  <p className="font-semibold text-slate-800">{formatDate(req.createdAt)}</p>
                </div>
              </div>

              {/* Accepted Donor Snapshot if matched */}
              {req.acceptedDonorId && (
                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 flex flex-wrap items-center justify-between text-xs text-emerald-950 gap-2">
                  <div>
                    <span className="font-bold">Accepted Donor:</span> {req.acceptedDonorId.fullName} ({req.acceptedDonorId.bloodGroup}) &bull; {req.acceptedDonorId.locationAddress}
                  </div>
                  <div>
                    Contact: <strong className="text-emerald-700">{req.acceptedDonorId.phone}</strong>
                  </div>
                </div>
              )}

              {/* Cancellation Reason if cancelled */}
              {req.status === 'Cancelled' && req.cancellationReason && (
                <div className="p-2.5 bg-rose-50 rounded-lg text-xs text-rose-800">
                  <strong>Cancellation Reason:</strong> {req.cancellationReason}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { History, Heart, Calendar, MapPin, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { api } from '../api/apiClient';

export const DonationHistoryPage = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setLoading(true);
        const res = await api.getDonationHistory();
        if (res.success) {
          setHistory(res.history || []);
        }
      } catch (err) {
        setError(err.message || 'Failed to load donation history.');
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
        <h1 className="text-2xl font-black text-slate-900">Donation History</h1>
        <p className="mt-1 text-xs text-slate-500">
          Official records of your blood contributions, acceptance-based commitments, and eligibility restoration logs.
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
          Loading donation records...
        </div>
      ) : history.length === 0 ? (
        <div className="py-16 text-center bg-white rounded-2xl border border-slate-200 p-8">
          <History className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-800">No Recorded Donations Yet</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Once you accept an emergency blood request or complete a donation, the historical record and cooldown tracking will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {history.map((record) => (
            <div
              key={record._id}
              className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="flex items-start gap-3.5">
                <span className="flex items-center justify-center w-11 h-11 rounded-xl bg-red-100 text-red-700 font-black text-lg shrink-0">
                  {record.bloodGroup}
                </span>

                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-bold text-slate-900 text-sm">
                      {record.units} Unit(s) &bull; Requester: {record.requesterId?.fullName || 'Hospital Request'}
                    </span>

                    {/* Record Type Badge */}
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        record.recordType === 'Confirmed Actual Donation'
                          ? 'bg-purple-100 text-purple-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {record.recordType}
                    </span>

                    {/* Status Badge */}
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        record.status === 'Reversed - Mistaken Acceptance'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {record.status}
                    </span>
                  </div>

                  <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span>{record.requestLocation || record.requestId?.requestAddress || 'Hospital Location'}</span>
                  </p>

                  {record.status === 'Reversed - Mistaken Acceptance' && (
                    <p className="text-[11px] text-amber-700 mt-1.5 italic bg-amber-50 p-2 rounded-lg border border-amber-200">
                      <strong>Reversed Reason:</strong> "{record.reverseReason || 'Accidental acceptance approved for cancellation'}"
                    </p>
                  )}
                </div>
              </div>

              <div className="text-xs text-slate-500 space-y-1 md:text-right shrink-0 border-t md:border-t-0 pt-2 md:pt-0">
                <div>
                  Recorded: <strong className="text-slate-800">{formatDate(record.recordedDate)}</strong>
                </div>
                <div>
                  Next Eligible: <strong className="text-slate-800">{formatDate(record.nextEligibleDate)}</strong>
                </div>
                <div className="text-[10px] text-slate-400 font-mono">
                  ID: {record._id.substring(record._id.length - 8).toUpperCase()}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

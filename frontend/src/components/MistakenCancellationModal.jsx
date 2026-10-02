import React, { useState } from 'react';
import { AlertTriangle, X, Loader2 } from 'lucide-react';
import { api } from '../api/apiClient';

export const MistakenCancellationModal = ({ isOpen, onClose, invitationId, onSubmitted }) => {
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reason.trim()) {
      setError('Please provide a reason for the mistaken acceptance cancellation.');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      const res = await api.requestMistakenCancellation(invitationId, reason);
      if (res.success) {
        onSubmitted && onSubmitted(res.invitation);
        onClose();
      }
    } catch (err) {
      setError(err.message || 'Failed to submit cancellation request.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="relative bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-amber-500 text-white">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-white" />
            <h3 className="text-base font-bold">Report Mistaken Acceptance</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-white/80 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900">
            <p className="font-semibold mb-1">Important Notice:</p>
            <p>
              Submitting this request alerts the blood requester that you accepted accidentally. If approved by the requester, your 6-month cooldown will be reversed and your availability restored.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Reason for Mistaken Acceptance <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g., Accidentally tapped accept while reviewing, unavailable for emergency travel, etc."
              required
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
            />
          </div>

          {error && (
            <div className="p-3 rounded-lg text-xs bg-rose-50 text-rose-800 border border-rose-200">
              {error}
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-sm font-semibold shadow-xs disabled:opacity-50 transition"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Submitting...</span>
                </>
              ) : (
                <span>Submit Cancellation Request</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

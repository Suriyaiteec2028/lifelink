import React from 'react';
import { X, HeartHandshake, AlertCircle } from 'lucide-react';

export const CompatibilityChartModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const matrix = [
    { requested: 'A+', donors: 'A+, A−, O+, O−', note: 'Can receive from A and O types' },
    { requested: 'A−', donors: 'A−, O−', note: 'Rh-negative only' },
    { requested: 'B+', donors: 'B+, B−, O+, O−', note: 'Can receive from B and O types' },
    { requested: 'B−', donors: 'B−, O−', note: 'Rh-negative only' },
    { requested: 'O+', donors: 'O+, O−', note: 'Can only receive O types' },
    { requested: 'O−', donors: 'O−', note: 'Universal Red Cell Donor; can only receive O−' },
    { requested: 'AB+', donors: 'All Groups (A+, A−, B+, B−, O+, O−, AB+, AB−)', note: 'Universal Red Cell Recipient' },
    { requested: 'AB−', donors: 'AB−, A−, B−, O−', note: 'Rh-negative only' },
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="relative bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-red-600 to-rose-700 text-white">
          <div className="flex items-center gap-2">
            <HeartHandshake className="w-6 h-6 text-white" />
            <h3 className="text-lg font-bold">Red Blood Cell (RBC) Compatibility Matrix</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-white/80 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-sm text-slate-600 mb-4">
            LifeLink filters eligible donors according to clinical red blood cell compatibility rules. Below is the mapping used by our donor matching engine:
          </p>

          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Requested Blood Group</th>
                  <th className="py-3 px-4">Compatible Donor Groups</th>
                  <th className="py-3 px-4">Clinical Note</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {matrix.map((row) => (
                  <tr key={row.requested} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-bold text-red-600">
                      <span className="inline-block px-2.5 py-1 bg-red-50 border border-red-200 rounded-md">
                        {row.requested}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-900">{row.donors}</td>
                    <td className="py-3 px-4 text-xs text-slate-500">{row.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-5 p-3.5 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2.5 text-xs text-amber-900">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <span>
              <strong>Medical Disclaimer:</strong> This portal displays compatible donors based on standard RBC mapping. Actual transfusion compatibility, cross-matching, and donor suitability must always be confirmed by qualified medical professionals and licensed blood banks before any transfusion.
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-semibold hover:bg-slate-800 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

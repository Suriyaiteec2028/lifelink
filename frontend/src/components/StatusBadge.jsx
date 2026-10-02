import React from 'react';

export const StatusBadge = ({ status, type = 'generic' }) => {
  let colorClasses = 'bg-slate-100 text-slate-700 border-slate-200';

  switch (status) {
    // Donor Statuses
    case 'Active':
      colorClasses = 'bg-emerald-50 text-emerald-700 border-emerald-200';
      break;
    case 'Inactive':
      colorClasses = 'bg-slate-100 text-slate-600 border-slate-200';
      break;
    case 'Donation Cooldown':
      colorClasses = 'bg-amber-50 text-amber-800 border-amber-300 font-semibold';
      break;

    // Blood Request Statuses
    case 'Searching':
    case 'Draft':
      colorClasses = 'bg-blue-50 text-blue-700 border-blue-200';
      break;
    case 'Invitations Sent':
      colorClasses = 'bg-indigo-50 text-indigo-700 border-indigo-200';
      break;
    case 'Matched':
      colorClasses = 'bg-emerald-50 text-emerald-800 border-emerald-300 font-bold';
      break;
    case 'Cancellation Requested':
      colorClasses = 'bg-orange-50 text-orange-800 border-orange-300 animate-pulse';
      break;
    case 'Cancelled':
      colorClasses = 'bg-rose-50 text-rose-700 border-rose-200';
      break;
    case 'Closed':
      colorClasses = 'bg-slate-100 text-slate-600 border-slate-200';
      break;

    // Invitation Statuses
    case 'Sent':
      colorClasses = 'bg-blue-50 text-blue-700 border-blue-200';
      break;
    case 'Accepted':
      colorClasses = 'bg-emerald-50 text-emerald-800 border-emerald-300 font-semibold';
      break;
    case 'Declined':
      colorClasses = 'bg-slate-100 text-slate-500 border-slate-200';
      break;

    default:
      colorClasses = 'bg-slate-100 text-slate-700 border-slate-200';
  }

  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${colorClasses}`}
    >
      <span className="w-1.5 h-1.5 rounded-full mr-1.5 bg-current opacity-70"></span>
      {status}
    </span>
  );
};

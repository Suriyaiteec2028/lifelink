import React from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, ArrowLeft } from 'lucide-react';

export const NotFoundPage = () => {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-6 text-center">
      <div className="w-16 h-16 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center font-black text-2xl mb-4 shadow-sm shadow-red-200">
        404
      </div>
      <h1 className="text-2xl font-black text-slate-900">Page Not Found</h1>
      <p className="mt-1 text-xs text-slate-500 max-w-sm">
        The requested page does not exist or has been moved to another location.
      </p>
      <Link
        to="/dashboard"
        className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl shadow-xs transition"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Return to Dashboard</span>
      </Link>
    </div>
  );
};

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Heart,
  Search,
  MapPin,
  ShieldCheck,
  Clock,
  ArrowRight,
  HeartHandshake,
  CheckCircle2,
  Users
} from 'lucide-react';
import { CompatibilityChartModal } from '../components/CompatibilityChartModal';

export const LandingPage = () => {
  const [showChart, setShowChart] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top Bar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex items-center justify-center w-9 h-9 rounded-xl bg-red-600 text-white font-black text-lg shadow-sm shadow-red-200">
              🩸
            </span>
            <div>
              <span className="font-extrabold text-xl tracking-tight text-slate-900">
                Blood<span className="text-red-600">Donor</span>
              </span>
              <span className="hidden sm:inline-block ml-2 text-xs text-slate-500 font-medium border-l border-slate-200 pl-2">
                Blood Donor & Request Portal
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowChart(true)}
              className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-slate-600 hover:text-red-600 hover:bg-red-50 transition"
            >
              <HeartHandshake className="w-4 h-4 text-red-600" />
              <span>Compatibility Matrix</span>
            </button>
            <Link
              to="/login"
              className="px-4 py-2 text-sm font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition"
            >
              Sign In
            </Link>
            <Link
              to="/register"
              className="px-4 py-2 text-sm font-semibold bg-red-600 hover:bg-red-700 text-white rounded-lg shadow-sm shadow-red-200 transition"
            >
              Register as Donor
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 bg-gradient-to-b from-white via-red-50/20 to-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold bg-red-100 text-red-800 mb-6">
              <Heart className="w-3.5 h-3.5 fill-red-600 text-red-600" />
              <span>Location-Based Matching &bull; RBC Compatibility</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-tight">
              Connecting Life-Saving Donors with Those in <span className="text-red-600">Urgent Need</span>
            </h1>

            <p className="mt-6 text-lg text-slate-600 leading-relaxed">
              BloodDonor matches blood requests with eligible, active blood donors based on exact geographical distance, red-blood-cell compatibility, and a safe 6-month cooldown waiting period.
            </p>

            {/* Quick Actions */}
            <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
              <Link
                to="/register"
                className="inline-flex items-center gap-2 px-6 py-3.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-md shadow-red-200 hover:shadow-lg transition transform hover:-translate-y-0.5"
              >
                <span>Register to Donate</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/login"
                className="inline-flex items-center gap-2 px-6 py-3.5 bg-white hover:bg-slate-50 text-slate-800 font-bold rounded-xl border border-slate-300 shadow-xs transition"
              >
                <span>Find Donors Now</span>
              </Link>
            </div>

            {/* Test Scenario Quick Credentials Banner */}
            <div className="mt-12 p-4 bg-white/80 backdrop-blur-xs border border-slate-200 rounded-2xl shadow-xs text-left max-w-xl mx-auto text-xs">
              <div className="flex items-center gap-2 font-bold text-slate-800 mb-2">
                <Users className="w-4 h-4 text-red-600" />
                <span>Quick Demo Accounts (Pre-Seeded):</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-600">
                <div className="p-2 bg-slate-50 rounded-lg">
                  <p className="font-semibold text-slate-900">Requester: Suriya</p>
                  <p>suriya@example.com</p>
                  <p>Password: <code className="text-red-600 font-mono">Password@123</code></p>
                  <p className="text-[10px] text-slate-500">O+ &bull; Ramapuram, Chennai</p>
                </div>
                <div className="p-2 bg-slate-50 rounded-lg">
                  <p className="font-semibold text-slate-900">Donor: Ranjith</p>
                  <p>ranjith@example.com</p>
                  <p>Password: <code className="text-red-600 font-mono">Password@123</code></p>
                  <p className="text-[10px] text-slate-500">O+ &bull; Tambaram, Chennai (~14.5km)</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Core Features */}
      <section className="py-16 bg-white border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
              Engineered for Emergency Reliability & Privacy
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              A standalone portal built to bridge the critical gap between patients and donors safely.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80 hover:border-red-200 hover:shadow-md transition">
              <div className="w-12 h-12 rounded-xl bg-red-100 text-red-600 flex items-center justify-center font-bold mb-4">
                <MapPin className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-2">Accurate Haversine Geolocation</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Calculates true great-circle distance using coordinates, allowing requesters to search within custom radii (5 km to 100+ km) without city-boundary assumptions.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80 hover:border-red-200 hover:shadow-md transition">
              <div className="w-12 h-12 rounded-xl bg-red-100 text-red-600 flex items-center justify-center font-bold mb-4">
                <HeartHandshake className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-2">RBC Compatibility Matching</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Matches donors based on verified red blood cell recipient rules (e.g. O+ receives O+ and O-, AB+ receives all compatible types).
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80 hover:border-red-200 hover:shadow-md transition">
              <div className="w-12 h-12 rounded-xl bg-red-100 text-red-600 flex items-center justify-center font-bold mb-4">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-2">Automated 6-Month Cooldown</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Protects donor wellness by automatically placing donors in a configurable 6-month cooldown upon acceptance, preventing premature requests.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto bg-slate-900 text-slate-400 py-10 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-base">🩸</span>
            <span className="font-bold text-white text-sm">BloodDonor – Blood Donor & Blood Request Portal</span>
          </div>
          <div>
            &copy; 2026 BloodDonor Portal &bull; Standalone Architecture Ready for Hospital Attendance Integration
          </div>
        </div>
      </footer>

      <CompatibilityChartModal isOpen={showChart} onClose={() => setShowChart(false)} />
    </div>
  );
};

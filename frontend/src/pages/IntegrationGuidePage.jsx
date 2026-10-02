import React, { useState } from 'react';
import {
  Stethoscope,
  Code2,
  CheckCircle2,
  ExternalLink,
  ShieldCheck,
  Server,
  Layers,
  ArrowRight,
  Terminal,
  Copy,
  Check
} from 'lucide-react';

export const IntegrationGuidePage = () => {
  const [copied, setCopied] = useState(false);

  const sampleApiCall = `// Example Doctor Dashboard integration call
const response = await fetch('http://localhost:5000/api/requests/search-donors', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer <DOCTOR_OR_SERVICE_JWT_TOKEN>'
  },
  body: JSON.stringify({
    requiredBloodGroup: 'O+',
    requestLatitude: 13.0315, // Doctor's PHC or hospital coordinates
    requestLongitude: 80.1818,
    searchRadiusKm: 30
  })
});

const { donors } = await response.json();
console.log('Nearby Eligible Donors:', donors);`;

  const copyCode = () => {
    navigator.clipboard.writeText(sampleApiCall);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 mb-2">
          <Stethoscope className="w-3.5 h-3.5" />
          <span>Section 26 &bull; Architecture & Integration Interface</span>
        </div>
        <h1 className="text-2xl font-black text-slate-900">Hospital Doctor Dashboard Integration Guide</h1>
        <p className="mt-1 text-xs text-slate-500">
          How LifeLink integrates into the existing Hospital Geofence Attendance System without modifying existing hospital features.
        </p>
      </div>

      {/* Integration Principles Card */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-xs border border-slate-200 space-y-6">
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <Layers className="w-5 h-5 text-red-600" />
          <span>Architectural Independence & Future Connectivity</span>
        </h2>

        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
          As required by the project specifications, LifeLink operates as a <strong>standalone portal</strong> with its own database, authentication, donor matching engine, and notification queue. It is decoupled from the Hospital Attendance System, ensuring zero risk to doctor attendance tracking, CMO dashboards, or biometric geofencing.
        </p>

        {/* 4 Pillars Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <h3 className="font-bold text-slate-900 text-sm mb-1 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>1. Zero Changes to Core Hospital System</span>
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              No hospital biometric logic, geofencing coordinates, or attendance database tables are modified. LifeLink maintains its own separate MongoDB database and collections.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <h3 className="font-bold text-slate-900 text-sm mb-1 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>2. New "Blood Donation" Doctor Menu</span>
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              In a future phase, the existing Doctor Dashboard simply adds a new menu item that embeds the LifeLink portal or calls its REST APIs with the doctor's PHC location.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <h3 className="font-bold text-slate-900 text-sm mb-1 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>3. Shared Donor Matching Engine</span>
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Doctors search the same pool of registered, active, 18+ blood donors within custom radii (e.g. 5–50 km from the PHC) using the Haversine formula and RBC compatibility matrix.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <h3 className="font-bold text-slate-900 text-sm mb-1 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>4. Secure Donor Contact Access</span>
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Doctors receive notifications directly when a donor accepts. The doctor is then granted instant access to the accepted donor's registered mobile number to coordinate hospital arrival.
            </p>
          </div>
        </div>

        {/* Code Snippet */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Terminal className="w-4 h-4 text-slate-500" />
              <span>REST API Integration Interface</span>
            </span>
            <button
              onClick={copyCode}
              className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-red-600 transition"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy Snippet'}</span>
            </button>
          </div>

          <div className="p-4 bg-slate-900 text-slate-100 rounded-xl font-mono text-xs overflow-x-auto shadow-inner">
            <pre>{sampleApiCall}</pre>
          </div>
        </div>

        {/* Integration Endpoints Table */}
        <div>
          <h3 className="text-sm font-bold text-slate-900 mb-3">Exposed Integration Endpoints</h3>
          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-700">
                <tr>
                  <th className="py-2.5 px-3">Method</th>
                  <th className="py-2.5 px-3">Endpoint</th>
                  <th className="py-2.5 px-3">Purpose</th>
                  <th className="py-2.5 px-3">Doctor Dashboard Use</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr>
                  <td className="py-2.5 px-3 font-bold text-blue-600">POST</td>
                  <td className="py-2.5 px-3 font-mono text-slate-800">/api/requests/search-donors</td>
                  <td className="py-2.5 px-3 text-slate-600">Searches active donors within custom radius</td>
                  <td className="py-2.5 px-3 text-slate-600">Passes PHC coordinates & required blood group</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3 font-bold text-emerald-600">POST</td>
                  <td className="py-2.5 px-3 font-mono text-slate-800">/api/requests</td>
                  <td className="py-2.5 px-3 text-slate-600">Creates new hospital blood request</td>
                  <td className="py-2.5 px-3 text-slate-600">Initiates emergency surgery or trauma request</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3 font-bold text-purple-600">POST</td>
                  <td className="py-2.5 px-3 font-mono text-slate-800">/api/requests/:id/invitations</td>
                  <td className="py-2.5 px-3 text-slate-600">Dispatches multi-donor invitations</td>
                  <td className="py-2.5 px-3 text-slate-600">Invites multiple matching donors concurrently</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3 font-bold text-amber-600">GET</td>
                  <td className="py-2.5 px-3 font-mono text-slate-800">/api/requests/:id</td>
                  <td className="py-2.5 px-3 text-slate-600">Polls or views accepted donor contact phone</td>
                  <td className="py-2.5 px-3 text-slate-600">Displays donor mobile number once accepted</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

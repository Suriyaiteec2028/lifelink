import React, { useState } from 'react';
import { MapPin, Navigation, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

export const LocationPicker = ({
  address,
  latitude,
  longitude,
  onChange,
  label = 'Location Address',
  required = true
}) => {
  const [detecting, setDetecting] = useState(false);
  const [detectionStatus, setDetectionStatus] = useState(null); // { type: 'success'|'error', text: '' }

  const detectLocation = () => {
    if (!navigator.geolocation) {
      setDetectionStatus({
        type: 'error',
        text: 'Geolocation is not supported by your browser. Please enter your location manually.'
      });
      return;
    }

    setDetecting(true);
    setDetectionStatus(null);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = Number(position.coords.latitude.toFixed(6));
        const lon = Number(position.coords.longitude.toFixed(6));

        try {
          // Attempt reverse geocoding via OpenStreetMap Nominatim
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`,
            { headers: { 'User-Agent': 'LifeLink-Portal/1.0' } }
          );

          let detectedAddress = `${lat}, ${lon}`;
          if (response.ok) {
            const data = await response.json();
            if (data && data.display_name) {
              detectedAddress = data.display_name;
            }
          }

          onChange({
            address: detectedAddress,
            latitude: lat,
            longitude: lon
          });

          setDetectionStatus({
            type: 'success',
            text: 'Current location detected successfully via GPS!'
          });
        } catch (err) {
          // Geocoding failed, but GPS coordinates obtained
          onChange({
            address: `Coordinates: ${lat}, ${lon}`,
            latitude: lat,
            longitude: lon
          });
          setDetectionStatus({
            type: 'success',
            text: 'GPS coordinates detected. You can edit the readable address manually.'
          });
        } finally {
          setDetecting(false);
        }
      },
      (error) => {
        setDetecting(false);
        let errorMsg = 'Failed to detect location. Please enter manually.';
        if (error.code === error.PERMISSION_DENIED) {
          errorMsg = 'Location permission was denied. Please allow access or enter your location manually.';
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          errorMsg = 'Location information is unavailable on your device.';
        } else if (error.code === error.TIMEOUT) {
          errorMsg = 'Location request timed out. Please enter manually.';
        }
        setDetectionStatus({
          type: 'error',
          text: errorMsg
        });
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <label className="block text-sm font-medium text-slate-700">
          {label} {required && <span className="text-red-600">*</span>}
        </label>
        <button
          type="button"
          onClick={detectLocation}
          disabled={detecting}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 px-2.5 py-1.5 rounded-md transition-colors disabled:opacity-50"
        >
          {detecting ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Detecting...</span>
            </>
          ) : (
            <>
              <Navigation className="w-3.5 h-3.5" />
              <span>Use Current Location</span>
            </>
          )}
        </button>
      </div>

      <div className="relative rounded-md shadow-sm">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
          <MapPin className="h-5 w-5" />
        </div>
        <input
          type="text"
          value={address || ''}
          onChange={(e) =>
            onChange({
              address: e.target.value,
              latitude,
              longitude
            })
          }
          placeholder="e.g. Ramapuram, Chennai, Tamil Nadu"
          required={required}
          className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition"
        />
      </div>

      {detectionStatus && (
        <div
          className={`flex items-start gap-2 p-2.5 rounded-lg text-xs ${
            detectionStatus.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          {detectionStatus.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          )}
          <span>{detectionStatus.text}</span>
        </div>
      )}

      {/* Lat/Lon preview and manual override */}
      <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
        <div>
          <label className="text-slate-500 font-medium">Latitude</label>
          <input
            type="number"
            step="any"
            value={latitude !== undefined && latitude !== null ? latitude : ''}
            onChange={(e) =>
              onChange({
                address,
                latitude: e.target.value === '' ? '' : parseFloat(e.target.value),
                longitude
              })
            }
            placeholder="13.0827"
            className="mt-1 block w-full px-2.5 py-1.5 border border-slate-200 rounded-md text-slate-700 bg-slate-50 focus:bg-white focus:ring-1 focus:ring-red-500 outline-none"
          />
        </div>
        <div>
          <label className="text-slate-500 font-medium">Longitude</label>
          <input
            type="number"
            step="any"
            value={longitude !== undefined && longitude !== null ? longitude : ''}
            onChange={(e) =>
              onChange({
                address,
                latitude,
                longitude: e.target.value === '' ? '' : parseFloat(e.target.value)
              })
            }
            placeholder="80.2707"
            className="mt-1 block w-full px-2.5 py-1.5 border border-slate-200 rounded-md text-slate-700 bg-slate-50 focus:bg-white focus:ring-1 focus:ring-red-500 outline-none"
          />
        </div>
      </div>
    </div>
  );
};

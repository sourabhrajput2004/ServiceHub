import { useLanguage } from "../../context/LanguageContext";import React, { useState } from 'react';
import {MapPin, Navigation, CheckCircle2, AlertCircle} from 'lucide-react';

export default function LocationPicker({ coordinates, onCoordinatesChange, address, onAddressChange, addressId = 'location-address', addressError, coordinatesError }) {const { tr } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [locationError, setLocationError] = useState(null);

  const detectLocation = () => {
    setLoading(true);
    setLocationError(null);

    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser.');
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords = {
          lat: parseFloat(position.coords.latitude.toFixed(6)),
          lng: parseFloat(position.coords.longitude.toFixed(6))
        };
        onCoordinatesChange(coords);
        setLoading(false);
      },
      (error) => {
        console.warn('Geolocation error:', error);
        onCoordinatesChange(null);
        setLocationError('Could not access your location. Allow location access and try again at your shop.');
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  return (
    <div className="shop-location-picker space-y-4">
      {/* GPS Detection Bar */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-blue-100 text-blue-600 rounded-lg shrink-0">
            <Navigation className="w-5 h-5" />
          </div>
          <div>
            <h5 className="text-sm font-semibold text-slate-800">{tr("Shop Physical Coordinates (GPS Verification)")}

            </h5>
            <p className="text-xs text-slate-500">{tr('Detect the location while you are at your shop.')}

            </p>
          </div>
        </div>

        <button
          type="button"
          id="shop-coordinates"
          aria-invalid={Boolean(coordinatesError)}
          aria-describedby={coordinatesError?'shop-coordinates-error':undefined}
          onClick={detectLocation}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm transition shrink-0 disabled:opacity-50">
          
          {tr(loading
          ? <span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full" /> :

          <MapPin className="w-4 h-4" />)
          }
          {tr(coordinates ? 'Re-detect Exact GPS' : 'Detect GPS Coordinates')}
        </button>
      </div>

      {tr(locationError &&
      <div className="text-xs text-amber-600 bg-amber-50 border border-amber-200 px-3 py-2 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {tr(locationError)}
        </div>)
      }

      {/* Coordinate Badges & Map Preview */}
      {tr(coordinates &&
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-white p-3.5 rounded-xl border border-slate-200 text-xs">
          <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg">
            <span className="text-slate-500 font-medium">{tr("Latitude:")}</span>
            <span className="font-mono font-bold text-slate-800">{tr(coordinates.lat)}{tr("\xB0 N")}</span>
          </div>
          <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg">
            <span className="text-slate-500 font-medium">{tr("Longitude:")}</span>
            <span className="font-mono font-bold text-slate-800">{tr(coordinates.lng)}{tr("\xB0 E")}</span>
          </div>

          <div className="sm:col-span-2 pt-1 flex items-center justify-between text-slate-500">
            <span className="text-emerald-600 font-medium flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" />{tr("Geo-coordinates tagged for Super Admin verification")}

          </span>
            <a
            href={`https://www.google.com/maps?q=${coordinates.lat},${coordinates.lng}`}
            target="_blank"
            rel="noreferrer"
            className="text-blue-600 hover:underline flex items-center gap-1 text-xs">{tr("View on Google Maps")}


            
            </a>
          </div>
        </div>)
      }

      {coordinatesError&&<p className="shop-field-error" id="shop-coordinates-error" aria-live="polite">{tr(coordinatesError)}</p>}
      {/* Detailed Address Text */}
      <div>
        <label htmlFor={addressId} className="block text-xs font-semibold text-slate-700 mb-1.5">{tr("Complete Shop Address (Shop No., Floor, Commercial Complex / Market)")}

        </label>
        <textarea
          id={addressId}
          maxLength={500}
          aria-invalid={Boolean(addressError)}
          aria-describedby={addressError?addressId+'-error':undefined}
          rows={3}
          value={address}
          onChange={(e) => onAddressChange(e.target.value)}
          placeholder={tr("e.g. Shop No. 12, Ground Floor, Gaur Gravity Mall, RDC Raj Nagar, Ghaziabad - 201002")}
          required
          className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition" />
        {addressError&&<p className="shop-field-error" id={addressId+'-error'} aria-live="polite">{tr(addressError)}</p>}
      </div>
    </div>);

}

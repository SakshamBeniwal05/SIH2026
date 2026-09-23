import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Header } from '../components/common/Header';
import { EvacuationBanner } from '../components/alerts/EvacuationBanner';
import { useTheme } from '../context/ThemeContext';
import { useGps } from '../context/GpsContext';
import {
  Camera,
  MapPin,
  UploadCloud,
  CheckCircle2,
  AlertOctagon,
  Send,
  Cpu,
  RefreshCw,
  Locate,
  Crosshair,
  Navigation
} from 'lucide-react';

export function ReportHazard() {
  const { isDark } = useTheme();
  const {
    gpsLocation,
    status: gpsStatus,
    errorMessage: gpsErrorMessage,
    acquireGps,
    setSimulatedGps
  } = useGps();

  const [location, setLocation] = useState(
    gpsLocation ? { lat: gpsLocation.lat, lng: gpsLocation.lng } : { lat: 26.1445, lng: 91.7362 }
  );
  const [gpsAcquired, setGpsAcquired] = useState(Boolean(gpsLocation));
  const [category, setCategory] = useState('slope_movement');
  const [severity, setSeverity] = useState('severe');
  const [description, setDescription] = useState('Active debris cascade and widening fissures observed along NH-29 Pagla Pahar bypass corridor.');
  const [imageUrl, setImageUrl] = useState('https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=600&q=80');
  const [selectedFile, setSelectedFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [resultFeedback, setResultFeedback] = useState(null);

  // Sync if gpsLocation updates
  useEffect(() => {
    if (gpsLocation) {
      setLocation({ lat: gpsLocation.lat, lng: gpsLocation.lng });
      setGpsAcquired(true);
    }
  }, [gpsLocation]);

  const handleAcquireDeviceGps = async () => {
    try {
      const loc = await acquireGps();
      setLocation({ lat: loc.lat, lng: loc.lng });
      setGpsAcquired(true);
    } catch (err) {
      console.warn('GPS acquire failed:', err.message);
    }
  };

  const handleSelectPresetGps = (lat, lng, label, desc) => {
    setSimulatedGps(lat, lng, label);
    setLocation({ lat, lng });
    setGpsAcquired(true);
    if (desc) {
      setDescription(desc);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      const preview = URL.createObjectURL(file);
      setImageUrl(preview);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setResultFeedback(null);

    try {
      let finalMediaUrl = imageUrl;

      // Direct binary file upload if user picked a local file
      if (selectedFile) {
        const formData = new FormData();
        formData.append('file', selectedFile);
        try {
          const uploadRes = await axios.post('/api/media/upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });
          if (uploadRes.data?.mediaUrl) {
            finalMediaUrl = uploadRes.data.mediaUrl;
          }
        } catch (uploadErr) {
          console.warn('Upload fallback to preview URL:', uploadErr.message);
        }
      }

      // Submit report to Backend
      const response = await axios.post('/api/reports/submit', {
        mediaUrl: finalMediaUrl,
        category,
        severityObserved: severity,
        coordinates: [location.lng, location.lat],
        description
      });

      setResultFeedback({
        status: 'SUCCESS',
        report: response.data.report,
        aiEvaluation: response.data.aiEvaluation
      });
    } catch (err) {
      setResultFeedback({
        status: 'ERROR',
        message: err.response?.data?.error || err.message
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={`min-h-screen pt-12 flex flex-col transition-colors ${
      isDark ? 'bg-[#0a0e15] text-[#dfe2ed]' : 'bg-[#f8fafc] text-[#0f172a]'
    }`}>
      <Header />
      <EvacuationBanner />

      <main className="flex-1 max-w-3xl w-full mx-auto p-4 md:p-8 space-y-6">
        <div className="pb-4 border-b border-slate-700/50">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-none telemetry-pulse-node" />
            <h1 className="font-headline font-extrabold text-xl md:text-2xl tracking-wider uppercase">
              CROWDSOURCED FIELD HAZARD DISPATCH
            </h1>
          </div>
          <p className="font-body text-xs text-slate-400 mt-1">
            Submit time-stamped and geotagged photographic telemetry of slope fissures, rockfalls, or severed roads. The autonomous Gemini ReAct Agent ingests this report to dynamically adjust GIS hazard boundaries.
          </p>
        </div>

        <form onSubmit={handleSubmit} className={`p-6 border space-y-5 shadow-xl ${
          isDark ? 'bg-[#0f131b] border-[#27303e]' : 'bg-white border-[#cbd5e1]'
        }`}>
          {/* Photo Evidence Capture / Upload */}
          <div>
            <label className="block font-label text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
              Photographic / Telemetry Evidence
            </label>
            <div className={`border-2 border-dashed p-4 flex flex-col items-center justify-center cursor-pointer transition-colors ${
              isDark ? 'border-[#334155] bg-[#10131b] hover:border-cyan-500' : 'border-[#cbd5e1] bg-slate-50 hover:border-cyan-500'
            }`}>
              {imageUrl ? (
                <div className="relative w-full h-44 overflow-hidden border border-slate-700">
                  <img src={imageUrl} alt="Field preview" className="w-full h-full object-cover" />
                  <div className="absolute top-2 right-2 bg-black/70 px-2 py-1 text-[10px] font-telemetry text-white border border-slate-600">
                    CLICK TO CHANGE PHOTO
                  </div>
                </div>
              ) : (
                <div className="text-center py-6">
                  <Camera className="w-8 h-8 text-cyan-400 mx-auto mb-2" />
                  <span className="font-headline text-xs font-bold text-cyan-400">
                    TAP TO CAPTURE OR UPLOAD GEOTAGGED PHOTO
                  </span>
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="w-full mt-2 text-xs font-telemetry text-slate-400 file:mr-4 file:py-1 file:px-2 file:border file:border-slate-700 file:bg-slate-800 file:text-xs file:text-white"
              />
            </div>
          </div>

          {/* GPS Coordinate Status & Satellite Acquire Controls */}
          <div className={`p-4 border space-y-2.5 font-telemetry text-xs ${
            isDark ? 'bg-[#181c23] border-[#27303e]' : 'bg-[#f1f5f9] border-[#cbd5e1]'
          }`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[#00E676]" />
                <span className="font-bold">
                  GPS POSITION: [{location.lat.toFixed(5)}° N, {location.lng.toFixed(5)}° E]
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-[10px] font-bold uppercase px-2 py-0.5 border ${
                  gpsAcquired
                    ? 'bg-emerald-950 text-emerald-300 border-emerald-600'
                    : 'bg-amber-950 text-amber-300 border-amber-600'
                }`}>
                  {gpsStatus === 'acquiring'
                    ? 'ACQUIRING SATELLITE FIX...'
                    : gpsAcquired
                      ? `LOCKED (±${gpsLocation?.accuracy || 8}m)`
                      : 'SECTOR DEFAULT'}
                </span>

                <button
                  type="button"
                  onClick={handleAcquireDeviceGps}
                  disabled={gpsStatus === 'acquiring'}
                  className={`flex items-center gap-1.5 px-3 py-1 border font-headline text-xs font-bold uppercase transition-all shadow-md ${
                    gpsStatus === 'acquiring'
                      ? 'bg-cyan-900/60 border-cyan-500 text-cyan-300 animate-pulse'
                      : 'bg-[#0288D1] hover:bg-[#0277BD] text-white border-[#01579B]'
                  }`}
                >
                  <Locate className={`w-3.5 h-3.5 ${gpsStatus === 'acquiring' ? 'animate-spin' : ''}`} />
                  <span>{gpsStatus === 'acquiring' ? 'Locating...' : 'Get My GPS'}</span>
                </button>
              </div>
            </div>

            {/* If GPS error notice exists */}
            {gpsErrorMessage && (
              <div className="p-2 text-[10px] bg-red-950/80 border border-red-600 text-red-200">
                <span className="font-bold">GPS Alert:</span> {gpsErrorMessage}
              </div>
            )}

            {/* Quick Himalayan Hazard Sector Presets */}
            <div className="pt-1.5 border-t border-slate-700/40 flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] text-slate-400 font-headline uppercase font-semibold mr-1">
                Quick Sector Presets:
              </span>
              <button
                type="button"
                onClick={() => handleSelectPresetGps(
                  25.8000,
                  93.7500,
                  'Chumukedima Pagla Pahar (Nagaland)',
                  'Active rockfall & debris cascade blocking NH-29 Pagla Pahar corridor.'
                )}
                className="px-2 py-0.5 text-[10px] border border-slate-600 hover:border-cyan-500 hover:text-cyan-300 transition-colors"
              >
                Chumukedima / NH-29
              </button>
              <button
                type="button"
                onClick={() => handleSelectPresetGps(
                  24.8167,
                  93.6833,
                  'Tupul Noney Corridor (Manipur)',
                  'Severe rotational slope fissure above Tupul yard along Ijai river gorge.'
                )}
                className="px-2 py-0.5 text-[10px] border border-slate-600 hover:border-cyan-500 hover:text-cyan-300 transition-colors"
              >
                Tupul Noney Gorge
              </button>
              <button
                type="button"
                onClick={() => handleSelectPresetGps(
                  23.7271,
                  92.7176,
                  'Aizawl Melthum (Mizoram)',
                  'High-volume debris slump and road foundation subsidence at Melthum ridge.'
                )}
                className="px-2 py-0.5 text-[10px] border border-slate-600 hover:border-cyan-500 hover:text-cyan-300 transition-colors"
              >
                Aizawl Melthum Ridge
              </button>
              <button
                type="button"
                onClick={() => handleSelectPresetGps(
                  25.1833,
                  93.0167,
                  'Dima Hasao Haflong (Assam)',
                  'Jatinga River flash surge scouring railbed foundations and highway shoulder.'
                )}
                className="px-2 py-0.5 text-[10px] border border-slate-600 hover:border-cyan-500 hover:text-cyan-300 transition-colors"
              >
                Haflong / Jatinga (Assam)
              </button>
            </div>
          </div>

          {/* Category Selector */}
          <div>
            <label className="block font-label text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
              Observation Category
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: 'slope_movement', label: 'Slope Slip' },
                { id: 'crack', label: 'Tension Crack' },
                { id: 'road_blocked', label: 'Road Blocked' },
                { id: 'bridge_damage', label: 'Culvert Scour' }
              ].map(cat => (
                <button
                  type="button"
                  key={cat.id}
                  onClick={() => setCategory(cat.id)}
                  className={`py-2 px-3 border font-headline text-xs font-bold uppercase transition-all ${
                    category === cat.id
                      ? 'bg-[#D32F2F] text-white border-[#B71C1C] shadow-[0_0_8px_rgba(211,47,47,0.4)]'
                      : isDark
                        ? 'bg-[#10131b] border-[#27303e] text-slate-400 hover:border-slate-500'
                        : 'bg-slate-100 border-[#cbd5e1] text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Description Input */}
          <div>
            <label className="block font-label text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
              Field Description & Structural Telemetry
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe fissures, asphalt separation, debris depth, or boulder impact..."
              className={`w-full border p-3 font-body text-xs focus:outline-none focus:border-[#D32F2F] ${
                isDark ? 'bg-[#0a0e15] border-[#27303e] text-slate-200' : 'bg-[#f8fafc] border-[#cbd5e1] text-slate-800'
              }`}
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full flex items-center justify-center gap-2 bg-[#D32F2F] hover:bg-[#B71C1C] disabled:bg-slate-800 text-white font-headline text-xs font-bold py-3 px-6 transition-all border border-[#B71C1C] shadow-lg hover:shadow-red-600/30 cursor-pointer uppercase tracking-wider"
          >
            {submitting ? (
              <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Dispatch Report to AI Risk Engine</span>
              </>
            )}
          </button>
        </form>

        {/* AI Ingestion Feedback Card */}
        {resultFeedback && (
          <div className={`p-4 border font-body text-xs space-y-2 ${
            resultFeedback.status === 'SUCCESS'
              ? isDark ? 'bg-[#10131b] border-[#00E676] text-slate-200' : 'bg-emerald-50 border-emerald-500 text-slate-800'
              : 'bg-red-950/50 border-red-500 text-red-300'
          }`}>
            <div className="flex items-center gap-2 font-headline font-bold text-xs uppercase text-emerald-400">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Report Dispatched & Synthesized by AI ReAct Loop!</span>
            </div>

            {resultFeedback.aiEvaluation && (
              <div className="p-3 border border-slate-700 bg-black/40 space-y-1.5 font-telemetry text-xs">
                <div className="text-cyan-400 font-bold uppercase">
                  [GEMINI ReAct FINAL ASSESSMENT]:
                </div>
                <p className="text-slate-200 leading-relaxed whitespace-pre-line">
                  {resultFeedback.aiEvaluation.finalAssessment}
                </p>
                <div className="text-[10px] text-slate-400 pt-1 border-t border-slate-800">
                  New Zone 1 Boundary: <strong>{resultFeedback.aiEvaluation.newTiers?.[0]?.radiusKm} km</strong>. All connected command terminals updated.
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

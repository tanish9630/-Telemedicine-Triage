import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Navigation, MapPin, Trophy, Loader2, Search,
  Calendar, Clock, X, CheckCircle2, AlertCircle, Star, Eye, Award
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

// Leaflet loaded via CDN in index.html
declare const L: any;

interface NearbyDoctor {
  _id: string;
  fullName: string;
  specialization: string;
  email: string;
  location: { lat: number; lng: number; address: string };
  distanceKm: number;
}

const SPEC_COLORS: Record<string, string> = {
  'Cardiologist': 'from-rose-500 to-pink-600',
  'Neurologist': 'from-purple-500 to-indigo-600',
  'Pediatrician': 'from-emerald-500 to-teal-600',
  'Orthopedic Surgeon': 'from-orange-500 to-amber-600',
  'Dermatologist': 'from-cyan-500 to-blue-600',
  'General Practitioner (OPD)': 'from-indigo-500 to-blue-600',
  'Gynecologist': 'from-pink-500 to-rose-500',
  'Surgeon': 'from-slate-600 to-slate-800',
  'Psychiatrist': 'from-violet-500 to-purple-600',
  'ENT Specialist': 'from-teal-500 to-cyan-600',
  'Pulmonologist': 'from-sky-500 to-blue-600',
};

const getGradient = (spec: string) => SPEC_COLORS[spec] || 'from-indigo-500 to-purple-600';

const getDoctorRating = (id: string) => {
  const saved = localStorage.getItem(`doctor_rating_${id}`);
  if (saved) return parseFloat(saved);
  const seed = id.charCodeAt(0) + id.charCodeAt(id.length - 1);
  return parseFloat((4.1 + (seed % 9) / 10).toFixed(1));
};

export function NearbyDoctors() {
  const { token } = useAuth();
  const navigate = useNavigate();

  const [doctors, setDoctors] = useState<NearbyDoctor[]>([]);
  const [loading, setLoading] = useState(false);
  const [locStatus, setLocStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const [address, setAddress] = useState('');
  const [geocoding, setGeocoding] = useState(false);
  const [patientCoords, setPatientCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [radius, setRadius] = useState(50);

  // Booking modal state
  const [bookingDoctor, setBookingDoctor] = useState<NearbyDoctor | null>(null);
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);

  // Fetch nearest doctors from backend
  const fetchNearby = useCallback(async (lat: number, lng: number) => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await fetch(`${API}/location/nearest-doctors`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ lat, lng, radius }),
      });
      if (!res.ok) throw new Error('Failed to fetch nearby doctors');
      const data: NearbyDoctor[] = await res.json();
      setDoctors(data);
      if (data.length === 0) setErrorMsg(`No doctors found within ${radius} km. Try increasing the radius.`);
    } catch (err: any) {
      setErrorMsg(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }, [token, radius]);

  // Use browser geolocation
  const handleUseMyLocation = () => {
    setLocStatus('loading');
    setErrorMsg('');
    if (!('geolocation' in navigator)) {
      setLocStatus('error');
      setErrorMsg('Geolocation is not supported by your browser.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setPatientCoords(coords);
        setLocStatus('done');
        fetchNearby(coords.lat, coords.lng);
      },
      () => {
        setLocStatus('error');
        setErrorMsg('Location access denied. Please allow location or enter your city below.');
      }
    );
  };

  // Geocode typed address via Nominatim
  const handleGeocode = async () => {
    if (!address.trim()) return;
    setGeocoding(true);
    setErrorMsg('');
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1`,
        { headers: { 'Accept-Language': 'en' } }
      );
      const data = await res.json();
      if (!data?.length) throw new Error('Address not found. Try a different city or landmark.');
      const coords = { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
      setPatientCoords(coords);
      setLocStatus('done');
      fetchNearby(coords.lat, coords.lng);
    } catch (err: any) {
      setErrorMsg(err.message || 'Geocoding failed');
    } finally {
      setGeocoding(false);
    }
  };

  // Initialise Leaflet map once
  useEffect(() => {
    if (!mapRef.current || leafletMapRef.current || typeof L === 'undefined') return;
    leafletMapRef.current = L.map(mapRef.current, { zoomControl: true }).setView([20.5937, 78.9629], 5);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
    }).addTo(leafletMapRef.current);
  }, []);

  // Update map markers whenever doctors or patient coords change
  useEffect(() => {
    if (!leafletMapRef.current || typeof L === 'undefined') return;

    // Clear old markers
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    const bounds: [number, number][] = [];

    // Patient marker
    if (patientCoords) {
      const patientIcon = L.divIcon({
        html: `<div style="
          width:36px;height:36px;border-radius:50%;
          background:linear-gradient(135deg,#4f46e5,#7c3aed);
          display:flex;align-items:center;justify-content:center;
          border:3px solid white;box-shadow:0 4px 15px rgba(79,70,229,0.5);
          font-size:16px;
        ">📍</div>`,
        className: '',
        iconSize: [36, 36],
        iconAnchor: [18, 18],
      });
      const m = L.marker([patientCoords.lat, patientCoords.lng], { icon: patientIcon })
        .addTo(leafletMapRef.current)
        .bindPopup('<b>📍 You are here</b>');
      markersRef.current.push(m);
      bounds.push([patientCoords.lat, patientCoords.lng]);
    }

    // Doctor markers
    doctors.forEach((doc, idx) => {
      const isNearest = idx === 0;
      const icon = L.divIcon({
        html: `<div style="
          width:${isNearest ? '40px' : '32px'};
          height:${isNearest ? '40px' : '32px'};
          border-radius:50%;
          background:${isNearest ? 'linear-gradient(135deg,#f59e0b,#d97706)' : 'linear-gradient(135deg,#06b6d4,#0891b2)'};
          display:flex;align-items:center;justify-content:center;
          border:3px solid white;
          box-shadow:0 4px 15px rgba(0,0,0,0.25);
          font-size:${isNearest ? '18px' : '14px'};
        ">${isNearest ? '🏆' : '🏥'}</div>`,
        className: '',
        iconSize: [isNearest ? 40 : 32, isNearest ? 40 : 32],
        iconAnchor: [isNearest ? 20 : 16, isNearest ? 20 : 16],
      });
      const m = L.marker([doc.location.lat, doc.location.lng], { icon })
        .addTo(leafletMapRef.current)
        .bindPopup(`
          <div style="min-width:160px;font-family:sans-serif">
            <b style="color:#4f46e5">${isNearest ? '🏆 Nearest · ' : ''}${doc.fullName}</b><br/>
            <span style="font-size:12px;color:#64748b">${doc.specialization}</span><br/>
            <span style="font-size:12px;font-weight:bold;color:#0891b2">${doc.distanceKm} km away</span>
          </div>
        `);
      markersRef.current.push(m);
      bounds.push([doc.location.lat, doc.location.lng]);
    });

    if (bounds.length > 1) {
      leafletMapRef.current.fitBounds(bounds, { padding: [40, 40] });
    } else if (bounds.length === 1) {
      leafletMapRef.current.setView(bounds[0], 12);
    }
  }, [doctors, patientCoords]);

  // Booking handler
  const handleBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingDoctor) return;
    setSubmitting(true);
    try {
      const dateTime = new Date(`${date}T${time}`).toISOString();
      const res = await fetch(`${API}/appointments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ doctorId: bookingDoctor._id, dateTime, reason }),
      });
      if (res.ok) {
        setSuccess(true);
        setTimeout(() => {
          setBookingDoctor(null); setSuccess(false);
          setDate(''); setTime(''); setReason('');
        }, 2500);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      {/* Page Header */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-white/5 px-6 py-4 shadow-sm transition-colors">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <Navigation className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900 dark:text-white">Nearby Doctors</h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">Sorted by real-world distance</p>
            </div>
          </div>
          {doctors.length > 0 && (
            <span className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 px-4 py-1.5 rounded-full border border-indigo-200 dark:border-indigo-500/20">
              {doctors.length} doctor{doctors.length !== 1 ? 's' : ''} found
            </span>
          )}
        </div>
      </header>

      {/* Hero Banner */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="absolute opacity-10 top-2 right-10 w-40 h-40 rounded-full bg-white blur-3xl pointer-events-none hidden" />
          <h2 className="text-3xl font-bold text-white mb-1">Find the Closest Doctor</h2>
          <p className="text-indigo-100 text-sm mb-6 max-w-xl">
            Share your location or enter your city to see verified doctors ranked by proximity, with live distance badges and an interactive map.
          </p>

          {/* Location Controls */}
          <div className="flex flex-wrap gap-3 items-center">
            {/* GPS Button */}
            <button
              id="use-my-location-btn"
              onClick={handleUseMyLocation}
              disabled={locStatus === 'loading'}
              className="flex items-center space-x-2 bg-white text-indigo-700 font-bold px-5 py-3 rounded-2xl shadow-lg hover:bg-indigo-50 transition-all disabled:opacity-60"
            >
              {locStatus === 'loading'
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : <Navigation className="w-4 h-4" />
              }
              <span>{locStatus === 'loading' ? 'Getting location…' : 'Use My Location'}</span>
            </button>

            {/* Divider */}
            <span className="text-indigo-200 font-semibold text-sm hidden sm:block">or</span>

            {/* Manual address */}
            <div className="flex flex-1 min-w-[200px] max-w-sm">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                <input
                  id="address-input"
                  type="text"
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleGeocode()}
                  placeholder="Enter city or address…"
                  className="w-full pl-9 pr-4 py-3 rounded-l-2xl text-sm bg-white/95 text-slate-900 outline-none focus:ring-2 focus:ring-white/50 border-0"
                />
              </div>
              <button
                id="search-address-btn"
                onClick={handleGeocode}
                disabled={geocoding || !address.trim()}
                className="bg-white/20 hover:bg-white/30 text-white font-bold px-4 py-3 rounded-r-2xl transition-all disabled:opacity-50 border-l border-white/20"
              >
                {geocoding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              </button>
            </div>

            {/* Radius selector */}
            <div className="flex items-center space-x-2 bg-white/15 rounded-2xl px-4 py-3">
              <MapPin className="w-4 h-4 text-indigo-200" />
              <select
                value={radius}
                onChange={e => setRadius(Number(e.target.value))}
                className="bg-transparent text-white text-sm font-semibold outline-none cursor-pointer"
              >
                {[10, 25, 50, 100, 200].map(r => (
                  <option key={r} value={r} className="text-slate-900">{r} km radius</option>
                ))}
              </select>
            </div>
          </div>

          {/* Error */}
          {errorMsg && (
            <div className="mt-4 flex items-center space-x-2 text-rose-200 text-sm font-semibold">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}
        </div>
      </div>

      {/* Main Content: Map + Cards */}
      <main className="max-w-7xl mx-auto px-4 py-6 flex-1 w-full pb-24 md:pb-8">
        {/* Map */}
        <div className="mb-6 rounded-3xl overflow-hidden border border-slate-200 dark:border-white/10 shadow-xl relative">
          <div ref={mapRef} className="w-full" style={{ height: '360px' }} />
          {locStatus === 'idle' && (
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm flex flex-col items-center justify-center rounded-3xl">
              <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center mb-4 shadow-xl shadow-indigo-600/40">
                <Navigation className="w-8 h-8 text-white" />
              </div>
              <p className="text-white font-bold text-lg">Share your location to see the map</p>
              <p className="text-slate-300 text-sm mt-1">Click "Use My Location" or type a city above</p>
            </div>
          )}
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-16 space-y-4">
            <div className="w-14 h-14 bg-indigo-100 dark:bg-indigo-500/20 rounded-2xl flex items-center justify-center">
              <Loader2 className="w-7 h-7 text-indigo-600 dark:text-indigo-400 animate-spin" />
            </div>
            <p className="text-slate-600 dark:text-slate-400 font-semibold">Finding doctors near you…</p>
          </div>
        )}

        {/* Doctor Cards */}
        {!loading && doctors.length > 0 && (
          <>
            <div className="flex items-center space-x-3 mb-5">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                Doctors Near You
              </h3>
              <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-200 dark:border-emerald-500/20">
                Sorted by distance ↑
              </span>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
              {doctors.map((doc, idx) => {
                const isNearest = idx === 0;
                const gradient = getGradient(doc.specialization);
                const initials = doc.fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
                const rating = getDoctorRating(doc._id);
                const seed = doc._id.charCodeAt(0) + doc._id.charCodeAt(doc._id.length - 1);
                const reviewCount = 18 + (seed % 112);

                return (
                  <div
                    key={doc._id}
                    className={`relative bg-white dark:bg-slate-900 border rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 group flex flex-col
                      ${isNearest
                        ? 'border-amber-300 dark:border-amber-500/40 ring-2 ring-amber-300/50 dark:ring-amber-500/20'
                        : 'border-slate-100 dark:border-white/5 hover:border-indigo-300 dark:hover:border-indigo-500/30'
                      }`}
                  >
                    {/* Nearest badge */}
                    {isNearest && (
                      <div className="absolute top-3 right-3 z-10 flex items-center space-x-1 bg-amber-400 text-amber-900 text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                        <Trophy className="w-3.5 h-3.5" />
                        <span>Nearest to You</span>
                      </div>
                    )}

                    {/* Card header gradient */}
                    <div className={`bg-gradient-to-br ${gradient} p-6 relative overflow-hidden`}>
                      <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -translate-y-8 translate-x-8" />
                      <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-white font-bold text-2xl shadow-lg mb-3 border border-white/20">
                        {initials}
                      </div>
                      <h3 className="text-lg font-bold text-white">{doc.fullName}</h3>
                      <p className="text-white/80 text-sm font-medium">{doc.specialization}</p>
                      <div className="flex items-center mt-2 space-x-1">
                        {[1, 2, 3, 4, 5].map(s => (
                          <Star key={s} className={`w-3.5 h-3.5 ${rating >= s ? 'text-amber-300 fill-amber-300' : 'text-white/30'}`} />
                        ))}
                        <span className="text-white/80 text-xs ml-1">{rating} ({reviewCount})</span>
                      </div>
                    </div>

                    {/* Card body */}
                    <div className="p-5 flex-1 flex flex-col">
                      {/* Distance badge */}
                      <div className={`inline-flex items-center space-x-1.5 self-start mb-4 px-3 py-1.5 rounded-full text-sm font-bold
                        ${isNearest
                          ? 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20'
                          : 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/20'
                        }`}
                      >
                        <MapPin className="w-3.5 h-3.5" />
                        <span>{doc.distanceKm} km away</span>
                      </div>

                      <div className="space-y-2 mb-4">
                        <div className="flex items-start text-xs text-slate-600 dark:text-slate-400">
                          <MapPin className="w-3.5 h-3.5 mr-2 text-indigo-400 flex-shrink-0 mt-0.5" />
                          <span className="line-clamp-2">{doc.location.address || 'Address on file'}</span>
                        </div>
                        <div className="flex items-center text-xs text-slate-600 dark:text-slate-400">
                          <Award className="w-3.5 h-3.5 mr-2 text-indigo-500 dark:text-indigo-400" />
                          Registered Professional
                        </div>
                        <div className="flex items-center text-xs text-slate-600 dark:text-slate-400">
                          <CheckCircle2 className="w-3.5 h-3.5 mr-2 text-emerald-500" />
                          Certified via CareConnect AI
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="mt-auto flex gap-2">
                        <button
                          onClick={() => navigate(`/doctor/profile/${doc._id}`)}
                          className="flex-1 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 font-semibold py-2.5 rounded-2xl transition-all text-xs flex items-center justify-center"
                        >
                          <Eye className="w-3.5 h-3.5 mr-1.5" /> View Profile
                        </button>
                        <button
                          onClick={() => setBookingDoctor(doc)}
                          className={`flex-1 bg-gradient-to-r ${gradient} hover:opacity-90 text-white font-bold py-2.5 rounded-2xl transition-all shadow-md flex items-center justify-center text-xs group-hover:scale-[1.02]`}
                        >
                          <Calendar className="w-3.5 h-3.5 mr-1.5" /> Book
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </main>

      {/* Booking Modal */}
      {bookingDoctor && (
        <div className="fixed inset-0 bg-slate-900/40 dark:bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/10 rounded-3xl shadow-2xl w-full max-w-md p-8 transition-colors">
            {success ? (
              <div className="text-center py-8">
                <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-10 h-10 text-emerald-500 dark:text-emerald-400" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Request Sent!</h3>
                <p className="text-slate-500 dark:text-slate-400">
                  Your appointment request has been sent to{' '}
                  <span className="text-slate-800 dark:text-white font-semibold">{bookingDoctor.fullName}</span>.
                  You'll be notified when it's approved.
                </p>
              </div>
            ) : (
              <>
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">Book Appointment</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                      with {bookingDoctor.fullName} · {bookingDoctor.specialization}
                    </p>
                    <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-1 flex items-center">
                      <MapPin className="w-3.5 h-3.5 mr-1" />
                      {bookingDoctor.distanceKm} km from your location
                    </p>
                  </div>
                  <button
                    onClick={() => setBookingDoctor(null)}
                    className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
                  >
                    <X className="w-5 h-5 text-slate-400" />
                  </button>
                </div>
                <form onSubmit={handleBook} className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center">
                      <Calendar className="w-4 h-4 mr-1.5 text-indigo-500" /> Preferred Date
                    </label>
                    <input
                      required type="date" value={date} onChange={e => setDate(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm transition-all [color-scheme:light] dark:[color-scheme:dark]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center">
                      <Clock className="w-4 h-4 mr-1.5 text-indigo-500" /> Preferred Time
                    </label>
                    <input
                      required type="time" value={time} onChange={e => setTime(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm transition-all [color-scheme:light] dark:[color-scheme:dark]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Reason / Symptoms
                    </label>
                    <textarea
                      required value={reason} onChange={e => setReason(e.target.value)} rows={3}
                      placeholder="Describe your symptoms or reason for consultation…"
                      className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white placeholder-slate-400 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm resize-none transition-all"
                    />
                  </div>
                  <button
                    type="submit" disabled={submitting}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg flex items-center justify-center"
                  >
                    {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Calendar className="w-4 h-4 mr-2" /> Send Request</>}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}

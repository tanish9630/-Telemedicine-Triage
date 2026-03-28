import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AgoraRTC from 'agora-rtc-sdk-ng';
import type { ICameraVideoTrack, IMicrophoneAudioTrack, IAgoraRTCClient, IAgoraRTCRemoteUser } from 'agora-rtc-sdk-ng';
import { Mic, MicOff, Video as VideoIcon, VideoOff, PhoneOff, Loader2, UserCircle2, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ThemeToggle } from '../components/ThemeToggle';
import { notifyCallStarted } from '../hooks/useCallNotification';

const APP_ID = import.meta.env.VITE_AGORA_APP_ID || '';

export function VideoConsultation() {
  const { channelName } = useParams<{ channelName: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [joined, setJoined] = useState(false);
  const [localVideoTrack, setLocalVideoTrack] = useState<ICameraVideoTrack | null>(null);
  const [localAudioTrack, setLocalAudioTrack] = useState<IMicrophoneAudioTrack | null>(null);
  const [remoteUsers, setRemoteUsers] = useState<IAgoraRTCRemoteUser[]>([]);

  const [micMuted, setMicMuted] = useState(false);
  const [cameraOff, setCameraOff] = useState(false);

  const client = useRef<IAgoraRTCClient | null>(null);
  // Use a callback ref so we always have the latest DOM node
  const localVideoRef = useRef<HTMLDivElement | null>(null);
  const localTrackRef = useRef<ICameraVideoTrack | null>(null);

  const setLocalVideoRef = useCallback((node: HTMLDivElement | null) => {
    localVideoRef.current = node;
    // Play local video as soon as the div mounts AND the track is ready
    if (node && localTrackRef.current) {
      localTrackRef.current.play(node);
    }
  }, []);

  useEffect(() => {
    if (!APP_ID) {
      alert('Please add your Agora APP_ID to the .env file.');
      return;
    }

    const initAgora = async () => {
      client.current = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });

      client.current.on('user-published', async (user, mediaType) => {
        await client.current!.subscribe(user, mediaType);
        if (mediaType === 'video') {
          setRemoteUsers(prev => {
            if (prev.find(u => u.uid === user.uid)) return prev;
            return [...prev, user];
          });
        }
        if (mediaType === 'audio') {
          user.audioTrack?.play();
        }
      });

      client.current.on('user-unpublished', (user, mediaType) => {
        if (mediaType === 'video') {
          setRemoteUsers(prev => prev.filter(u => u.uid !== user.uid));
        }
      });

      client.current.on('user-left', (user) => {
        setRemoteUsers(prev => prev.filter(u => u.uid !== user.uid));
      });

      try {
        await client.current.join(APP_ID, channelName || 'test', null, null);

        const [audioTrack, videoTrack] = await AgoraRTC.createMicrophoneAndCameraTracks();
        setLocalAudioTrack(audioTrack);
        setLocalVideoTrack(videoTrack);
        localTrackRef.current = videoTrack;

        // If the div is already mounted, play immediately
        if (localVideoRef.current) {
          videoTrack.play(localVideoRef.current);
        }

        await client.current.publish([audioTrack, videoTrack]);
        setJoined(true);
        // Broadcast call started to other tabs
        notifyCallStarted(channelName || 'call', user?.fullName || 'Unknown', user?.role || 'patient');
        // Mark appointment as completed in localStorage
        const completedKey = `completed_${channelName}`;
        localStorage.setItem(completedKey, 'true');
      } catch (error) {
        console.error('Agora Error: ', error);
        alert('Failed to join video room. Check console for details.');
      }
    };

    initAgora();

    return () => {
      localTrackRef.current?.close();
      localAudioTrack?.close();
      client.current?.leave();
    };
  }, [channelName]);

  const toggleMic = async () => {
    if (localAudioTrack) {
      const newMuted = !micMuted;
      await localAudioTrack.setMuted(newMuted);
      setMicMuted(newMuted);
    }
  };

  const toggleCamera = async () => {
    if (localVideoTrack) {
      const newOff = !cameraOff;
      // setEnabled physically stops the camera (light turns off)
      await localVideoTrack.setEnabled(!newOff);
      setCameraOff(newOff);
    }
  };

  const leaveCall = async () => {
    localTrackRef.current?.close();
    localAudioTrack?.close();
    await client.current?.leave();
    // Redirect based on the user's role
    const role = user?.role;
    if (role === 'doctor') navigate('/doctor/dashboard');
    else if (role === 'patient') navigate('/patient/dashboard');
    else navigate('/');
  };

  if (!APP_ID) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white transition-colors">
        <div className="text-center space-y-4 max-w-md p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl transition-colors">
          <h2 className="text-xl font-bold">Configuration Required</h2>
          <p className="text-slate-500 dark:text-slate-400">Add your Agora.io App ID to <code className="bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">frontend/.env</code> under <code className="bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">VITE_AGORA_APP_ID</code> and restart the dev server.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-slate-100 dark:bg-slate-950 flex flex-col overflow-hidden relative font-sans transition-colors">
      {/* Header */}
      <div className="h-16 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md px-6 flex items-center justify-between z-10 border-b border-slate-200 dark:border-slate-800 flex-shrink-0 transition-colors">
        <div className="flex items-center space-x-3 text-slate-800 dark:text-white">
          <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
          <span className="font-semibold text-lg tracking-wide">Live Consultation Room</span>
          <span className="text-sm font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full">{channelName}</span>
          {joined && <span className="flex items-center text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 px-2.5 py-1 rounded-full font-semibold"><CheckCircle2 className="w-3 h-3 mr-1" /> Consultation Active</span>}
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-slate-500 dark:text-slate-400 text-sm">{new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}</div>
          <ThemeToggle />
        </div>
      </div>

      {/* Main Video Area */}
      <div className="flex-1 p-4 flex gap-4 overflow-hidden">

        {/* Remote Video */}
        <div className="flex-1 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden relative shadow-md flex flex-col justify-center items-center transition-colors">
          {remoteUsers.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-slate-500 dark:text-slate-400 h-full">
              <Loader2 className="w-12 h-12 mb-4 animate-spin opacity-50 text-indigo-500" />
              <p className="text-lg font-medium text-slate-700 dark:text-slate-300">Waiting for the other participant...</p>
              <p className="text-sm text-slate-500 mt-1">Share the room code: <span className="text-indigo-600 dark:text-indigo-400 font-mono">{channelName}</span></p>
            </div>
          ) : remoteUsers.map(u => (
            <RemoteVideoPlayer key={u.uid} user={u} />
          ))}
        </div>

        {/* Right sidebar: self-view + info */}
        <div className="w-64 flex flex-col gap-4">
          {/* Self Preview */}
          <div className="relative rounded-2xl overflow-hidden bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md aspect-video transition-colors">
            {/* This div is always rendered so the callback ref can attach immediately */}
            <div
              ref={setLocalVideoRef}
              className="absolute inset-0 w-full h-full"
              style={{ display: cameraOff ? 'none' : 'block' }}
            />
            {/* Camera-off placeholder */}
            {cameraOff && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 transition-colors">
                <UserCircle2 className="w-12 h-12 mb-2 opacity-50" />
                <span className="text-xs">Camera Off</span>
              </div>
            )}
            {/* Loading before joined */}
            {!joined && !cameraOff && (
              <div className="absolute inset-0 flex items-center justify-center bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 transition-colors">
                <Loader2 className="w-8 h-8 animate-spin" />
              </div>
            )}
            <div className="absolute bottom-2 left-2 bg-white/70 dark:bg-slate-900/70 backdrop-blur-sm px-2 py-1 rounded-lg text-slate-900 dark:text-white text-xs font-semibold z-10 shadow-sm border border-slate-200/50 dark:border-slate-700/50">
              You {micMuted && '🔇'} {cameraOff && '📷'}
            </div>
          </div>

          {/* Consultation Details */}
          <div className="flex-1 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 flex flex-col shadow-md transition-colors">
            <h3 className="text-slate-800 dark:text-white font-semibold mb-4">Session Info</h3>
            <div className="space-y-3">
              <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border border-slate-100 dark:border-slate-700 transition-colors">
                <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">Room</div>
                <div className="font-mono text-indigo-600 dark:text-emerald-400 font-bold text-sm break-all">{channelName}</div>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border border-slate-100 dark:border-slate-700 transition-colors">
                <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">Status</div>
                <div className={`font-semibold text-sm ${joined ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-500 dark:text-amber-400'}`}>
                  {joined ? '● Connected' : '◌ Connecting...'}
                </div>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border border-slate-100 dark:border-slate-700 transition-colors">
                <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">Participants</div>
                <div className="font-semibold text-slate-900 dark:text-white text-sm">{remoteUsers.length + (joined ? 1 : 0)} in call</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Control Bar */}
      <div className="h-24 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 flex justify-center items-center space-x-5 z-10 flex-shrink-0 transition-colors">
        <ControlButton onClick={toggleMic} active={!micMuted} color="slate">
          {micMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
        </ControlButton>

        <ControlButton onClick={toggleCamera} active={!cameraOff} color="slate">
          {cameraOff ? <VideoOff className="w-6 h-6" /> : <VideoIcon className="w-6 h-6" />}
        </ControlButton>

        {/* End Call */}
        <button
          onClick={leaveCall}
          className="w-16 h-16 rounded-full bg-rose-500 flex items-center justify-center hover:bg-rose-600 hover:scale-105 transition-all duration-200 shadow-[0_0_15px_rgba(244,63,94,0.3)] dark:shadow-[0_0_25px_rgba(244,63,94,0.5)] ring-4 ring-rose-200 dark:ring-rose-500/30"
        >
          <PhoneOff className="w-7 h-7 text-white" />
        </button>
      </div>
    </div>
  );
}

function ControlButton({ onClick, active, children }: { onClick: () => void; active: boolean; color?: string; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`w-14 h-14 rounded-full flex items-center justify-center transition-all duration-200 shadow-md text-slate-700 dark:text-white
        ${active ? 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700' : 'bg-rose-100 hover:bg-rose-200 text-rose-600 ring-4 ring-rose-100 dark:bg-rose-500 dark:hover:bg-rose-600 dark:text-white dark:ring-rose-500/20'}`}
    >
      {children}
    </button>
  );
}

function RemoteVideoPlayer({ user }: { user: IAgoraRTCRemoteUser }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user.videoTrack && containerRef.current) {
      user.videoTrack.play(containerRef.current);
    }
    return () => {
      user.videoTrack?.stop();
    };
  }, [user.videoTrack]);

  return (
    <div className="absolute inset-0">
      <div ref={containerRef} className="w-full h-full [&>div>video]:object-contain bg-black/5 dark:bg-black" />
    </div>
  );
}

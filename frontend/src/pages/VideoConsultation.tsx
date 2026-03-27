import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AgoraRTC from 'agora-rtc-sdk-ng';
import type { ICameraVideoTrack, IMicrophoneAudioTrack, IAgoraRTCClient, IAgoraRTCRemoteUser } from 'agora-rtc-sdk-ng';
import { Mic, MicOff, Video as VideoIcon, VideoOff, PhoneOff, Loader2, UserCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

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
      <div className="h-screen flex items-center justify-center bg-slate-900 text-white">
        <div className="text-center space-y-4 max-w-md p-6 bg-slate-800 rounded-3xl border border-slate-700">
          <h2 className="text-xl font-bold">Configuration Required</h2>
          <p className="text-slate-400">Add your Agora.io App ID to <code className="bg-slate-900 px-2 py-1 rounded">frontend/.env</code> under <code className="bg-slate-900 px-2 py-1 rounded">VITE_AGORA_APP_ID</code> and restart the dev server.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-slate-900 flex flex-col overflow-hidden relative font-sans">
      {/* Header */}
      <div className="h-16 bg-slate-800/80 backdrop-blur-md px-6 flex items-center justify-between z-10 border-b border-slate-700 flex-shrink-0">
        <div className="flex items-center space-x-3 text-white">
          <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
          <span className="font-semibold text-lg tracking-wide">Live Consultation Room</span>
          <span className="text-sm font-medium text-slate-400 bg-slate-700/50 px-3 py-1 rounded-full">{channelName}</span>
        </div>
        <div className="text-slate-400 text-sm">{new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}</div>
      </div>

      {/* Main Video Area */}
      <div className="flex-1 p-4 flex gap-4 overflow-hidden">

        {/* Remote Video */}
        <div className="flex-1 bg-slate-800 rounded-3xl border border-slate-700 overflow-hidden relative shadow-2xl flex flex-col justify-center items-center">
          {remoteUsers.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-slate-400 h-full">
              <Loader2 className="w-12 h-12 mb-4 animate-spin opacity-50 text-indigo-500" />
              <p className="text-lg font-medium">Waiting for the other participant...</p>
              <p className="text-sm text-slate-500 mt-1">Share the room code: <span className="text-indigo-400 font-mono">{channelName}</span></p>
            </div>
          ) : remoteUsers.map(u => (
            <RemoteVideoPlayer key={u.uid} user={u} />
          ))}
        </div>

        {/* Right sidebar: self-view + info */}
        <div className="w-64 flex flex-col gap-4">
          {/* Self Preview */}
          <div className="relative rounded-2xl overflow-hidden bg-slate-800 border border-slate-700 shadow-xl aspect-video">
            {/* This div is always rendered so the callback ref can attach immediately */}
            <div
              ref={setLocalVideoRef}
              className="absolute inset-0 w-full h-full"
              style={{ display: cameraOff ? 'none' : 'block' }}
            />
            {/* Camera-off placeholder */}
            {cameraOff && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-800 text-slate-400">
                <UserCircle2 className="w-12 h-12 mb-2 opacity-50" />
                <span className="text-xs">Camera Off</span>
              </div>
            )}
            {/* Loading before joined */}
            {!joined && !cameraOff && (
              <div className="absolute inset-0 flex items-center justify-center bg-slate-800 text-slate-500">
                <Loader2 className="w-8 h-8 animate-spin" />
              </div>
            )}
            <div className="absolute bottom-2 left-2 bg-slate-900/70 backdrop-blur-sm px-2 py-1 rounded-lg text-white text-xs font-semibold z-10">
              You {micMuted && '🔇'} {cameraOff && '📷'}
            </div>
          </div>

          {/* Consultation Details */}
          <div className="flex-1 bg-slate-800 rounded-2xl border border-slate-700 p-5 flex flex-col">
            <h3 className="text-white font-semibold mb-4">Session Info</h3>
            <div className="space-y-3">
              <div className="bg-slate-700/50 p-3 rounded-xl border border-slate-600">
                <div className="text-xs text-slate-400 mb-1">Room</div>
                <div className="font-mono text-emerald-400 text-sm break-all">{channelName}</div>
              </div>
              <div className="bg-slate-700/50 p-3 rounded-xl border border-slate-600">
                <div className="text-xs text-slate-400 mb-1">Status</div>
                <div className={`font-semibold text-sm ${joined ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {joined ? '● Connected' : '◌ Connecting...'}
                </div>
              </div>
              <div className="bg-slate-700/50 p-3 rounded-xl border border-slate-600">
                <div className="text-xs text-slate-400 mb-1">Participants</div>
                <div className="font-semibold text-white text-sm">{remoteUsers.length + (joined ? 1 : 0)} in call</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Control Bar */}
      <div className="h-24 bg-slate-800/90 backdrop-blur-md border-t border-slate-700 flex justify-center items-center space-x-5 z-10 flex-shrink-0">
        <ControlButton onClick={toggleMic} active={!micMuted} color="slate">
          {micMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
        </ControlButton>

        <ControlButton onClick={toggleCamera} active={!cameraOff} color="slate">
          {cameraOff ? <VideoOff className="w-6 h-6" /> : <VideoIcon className="w-6 h-6" />}
        </ControlButton>

        {/* End Call */}
        <button
          onClick={leaveCall}
          className="w-16 h-16 rounded-full bg-rose-500 flex items-center justify-center hover:bg-rose-600 hover:scale-105 transition-all duration-200 shadow-[0_0_25px_rgba(244,63,94,0.5)] ring-4 ring-rose-500/30"
        >
          <PhoneOff className="w-7 h-7 text-white" />
        </button>
      </div>
    </div>
  );
}

function ControlButton({ onClick, active, color, children }: { onClick: () => void; active: boolean; color: string; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`w-14 h-14 rounded-full flex items-center justify-center transition-all duration-200 shadow-lg text-white
        ${active ? 'bg-slate-700 hover:bg-slate-600' : 'bg-rose-500 hover:bg-rose-600 ring-4 ring-rose-500/20'}`}
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
    <div className="w-full h-full relative">
      <div ref={containerRef} className="w-full h-full" />
      <div className="absolute bottom-6 left-6 bg-slate-900/70 backdrop-blur-md px-4 py-2 rounded-xl text-white text-sm font-semibold shadow-lg border border-white/10 flex items-center">
        {user.hasAudio ? <Mic className="w-4 h-4 mr-2 text-emerald-400" /> : <MicOff className="w-4 h-4 mr-2 text-rose-400" />}
        Participant {user.uid}
      </div>
    </div>
  );
}

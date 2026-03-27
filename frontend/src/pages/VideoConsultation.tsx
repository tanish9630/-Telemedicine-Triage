import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AgoraRTC from 'agora-rtc-sdk-ng';
import type { ICameraVideoTrack, IMicrophoneAudioTrack, IAgoraRTCClient, IAgoraRTCRemoteUser } from 'agora-rtc-sdk-ng';
import { Mic, MicOff, Video as VideoIcon, VideoOff, PhoneOff, Loader2 } from 'lucide-react';

// Use environment variable for App ID. The user needs to populate this in .env
const APP_ID = import.meta.env.VITE_AGORA_APP_ID || '';

export function VideoConsultation() {
  const { channelName } = useParams<{ channelName: string }>();
  const navigate = useNavigate();

  const [joined, setJoined] = useState(false);
  const [localVideoTrack, setLocalVideoTrack] = useState<ICameraVideoTrack | null>(null);
  const [localAudioTrack, setLocalAudioTrack] = useState<IMicrophoneAudioTrack | null>(null);
  const [remoteUsers, setRemoteUsers] = useState<IAgoraRTCRemoteUser[]>([]);
  
  const [micMuted, setMicMuted] = useState(false);
  const [videoMuted, setVideoMuted] = useState(false);
  
  const client = useRef<IAgoraRTCClient | null>(null);
  const localVideoRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!APP_ID || APP_ID === 'YOUR_APP_ID_HERE') {
      alert("Please enter your Agora APP_ID in the .env file.");
      return;
    }

    const initAgora = async () => {
      client.current = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });

      client.current.on("user-published", async (user, mediaType) => {
        await client.current!.subscribe(user, mediaType);
        if (mediaType === "video") {
          setRemoteUsers((prev) => [...prev, user]);
        }
        if (mediaType === "audio") {
          user.audioTrack?.play();
        }
      });

      client.current.on("user-unpublished", (user, mediaType) => {
        if (mediaType === "video") {
          setRemoteUsers((prev) => prev.filter((u) => u.uid !== user.uid));
        }
      });

      client.current.on("user-left", (user) => {
        setRemoteUsers((prev) => prev.filter((u) => u.uid !== user.uid));
      });

      try {
        // App ID, Channel Name, Token (null for testing), UID (null for auto)
        await client.current.join(APP_ID, channelName || 'test', null, null);
        
        const [audioTrack, videoTrack] = await AgoraRTC.createMicrophoneAndCameraTracks();
        setLocalAudioTrack(audioTrack);
        setLocalVideoTrack(videoTrack);
        
        await client.current.publish([audioTrack, videoTrack]);
        setJoined(true);
      } catch (error) {
        console.error("Agora Error: ", error);
        alert("Failed to join video room. Check console for details.");
      }
    };

    initAgora();

    return () => {
      // Cleanup
      localAudioTrack?.close();
      localVideoTrack?.close();
      client.current?.leave();
    };
  }, [channelName]);

  // Ensure local video plays in ref securely after track created and ref attached
  useEffect(() => {
    if (localVideoTrack && localVideoRef.current) {
      localVideoTrack.play(localVideoRef.current);
    }
  }, [localVideoTrack]);

  const toggleMic = async () => {
    if (localAudioTrack) {
      await localAudioTrack.setMuted(!micMuted);
      setMicMuted(!micMuted);
    }
  };

  const toggleVideo = async () => {
    if (localVideoTrack) {
      await localVideoTrack.setMuted(!videoMuted);
      setVideoMuted(!videoMuted);
    }
  };

  const leaveCall = async () => {
    localAudioTrack?.close();
    localVideoTrack?.close();
    await client.current?.leave();
    navigate('/doctor/dashboard');
  };

  if (!APP_ID || APP_ID === 'YOUR_APP_ID_HERE') {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-900 text-white">
        <div className="text-center space-y-4 max-w-md p-6 bg-slate-800 rounded-3xl border border-slate-700">
          <h2 className="text-xl font-bold">Configuration Required</h2>
          <p className="text-slate-400">Add your Agora.io App ID to your <code className="bg-slate-900 px-2 py-1 rounded">.env</code> file under <code className="bg-slate-900 px-2 py-1 rounded">VITE_AGORA_APP_ID</code> and restart the server to enable video calls.</p>
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
      </div>

      {/* Main Video Area */}
      <div className="flex-1 p-4 flex gap-4 overflow-hidden">
        
        {/* Remote Video Container */}
        <div className="flex-1 bg-slate-800 rounded-3xl border border-slate-700 overflow-hidden relative shadow-2xl flex flex-col justify-center items-center">
          {remoteUsers.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-slate-400 h-full">
              <Loader2 className="w-12 h-12 mb-4 animate-spin opacity-50 text-indigo-500" />
              <p className="text-lg font-medium">Waiting for participant to join...</p>
            </div>
          ) : (
            remoteUsers.map((user) => (
              <RemoteVideoPlayer key={user.uid} user={user} />
            ))
          )}
        </div>

        {/* Local Video Picture-in-Picture */}
        <div className="w-1/4 max-w-[320px] min-w-[240px] flex flex-col gap-4 relative">
          <div className="w-full aspect-video bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden shadow-xl relative top-0 right-0 z-20">
            {joined ? (
              <div ref={localVideoRef} className="w-full h-full object-cover">
                {videoMuted && (
                  <div className="absolute inset-0 bg-slate-800 flex items-center justify-center z-10">
                    <VideoOff className="w-10 h-10 text-slate-500" />
                  </div>
                )}
              </div>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-slate-500 bg-slate-800">
                <Loader2 className="w-8 h-8 animate-spin" />
              </div>
            )}
            <div className="absolute bottom-3 left-3 bg-slate-900/60 backdrop-blur-sm px-3 py-1.5 rounded-lg text-white text-xs font-semibold shadow-sm border border-white/10">
              You
            </div>
          </div>
          
          <div className="flex-1 bg-slate-800 rounded-2xl border border-slate-700 p-6 flex flex-col">
            <h3 className="text-white font-semibold mb-4">Consultation Details</h3>
            <div className="space-y-4">
              <div className="bg-slate-700/50 p-4 rounded-xl border border-slate-600">
                <div className="text-xs text-slate-400 mb-1">Patient Vitals</div>
                <div className="font-semibold text-emerald-400">Heart Rate: 84 BPM</div>
                <div className="font-semibold text-emerald-400">Temp: 98.6°F</div>
              </div>
              <div className="bg-slate-700/50 p-4 rounded-xl border border-slate-600">
                <div className="text-xs text-slate-400 mb-1">Primary Symptom</div>
                <div className="font-semibold text-white truncate">Persistent Fever</div>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Control Bar */}
      <div className="h-24 bg-slate-800/90 backdrop-blur-md border-t border-slate-700 flex justify-center items-center space-x-6 z-10 flex-shrink-0">
        <button 
          onClick={toggleMic}
          className={`w-14 h-14 rounded-full flex items-center justify-center transition-all duration-200 shadow-lg ${micMuted ? 'bg-rose-500 hover:bg-rose-600 ring-4 ring-rose-500/20' : 'bg-slate-700 hover:bg-slate-600 text-white'}`}
        >
          {micMuted ? <MicOff className="w-6 h-6 text-white" /> : <Mic className="w-6 h-6" />}
        </button>
        
        <button 
          onClick={leaveCall}
          className="w-16 h-16 rounded-full bg-rose-500 flex items-center justify-center hover:bg-rose-600 hover:scale-105 transition-all duration-200 shadow-[0_0_20px_rgb(244,63,94,0.4)] ring-4 ring-rose-500/20"
        >
          <PhoneOff className="w-7 h-7 text-white" />
        </button>
        
        <button 
          onClick={toggleVideo}
          className={`w-14 h-14 rounded-full flex items-center justify-center transition-all duration-200 shadow-lg ${videoMuted ? 'bg-rose-500 hover:bg-rose-600 ring-4 ring-rose-500/20' : 'bg-slate-700 hover:bg-slate-600 text-white'}`}
        >
          {videoMuted ? <VideoOff className="w-6 h-6 text-white" /> : <VideoIcon className="w-6 h-6" />}
        </button>
      </div>
    </div>
  );
}

// Remote Video component that safely plays the user's video track in a ref
function RemoteVideoPlayer({ user }: { user: IAgoraRTCRemoteUser }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user.videoTrack && containerRef.current) {
      user.videoTrack.play(containerRef.current);
    }
  }, [user.videoTrack]);

  return (
    <div className="w-full h-full relative group">
      <div ref={containerRef} className="w-full h-full [&>div>video]:object-cover" />
      <div className="absolute bottom-6 left-6 bg-slate-900/60 backdrop-blur-md px-4 py-2 rounded-xl text-white text-sm font-semibold shadow-lg border border-white/10 flex items-center">
        {user.hasAudio ? <Mic className="w-4 h-4 mr-2" /> : <MicOff className="w-4 h-4 mr-2 text-rose-500" />}
        Participant {user.uid}
      </div>
    </div>
  );
}

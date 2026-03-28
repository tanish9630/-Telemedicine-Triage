import { useEffect, useRef, useState } from 'react';

export interface IncomingCall {
  channelName: string;
  callerName: string;
  callerRole: 'doctor' | 'patient';
}

const CHANNEL_NAME = 'careconnect-calls';

/**
 * Broadcasts an outgoing call notification to all other tabs.
 */
export function notifyCallStarted(channelName: string, callerName: string, callerRole: 'doctor' | 'patient') {
  try {
    const bc = new BroadcastChannel(CHANNEL_NAME);
    bc.postMessage({ type: 'CALL_STARTED', channelName, callerName, callerRole });
    bc.close();
  } catch {
    // BroadcastChannel not supported — silently ignore
  }
}

/**
 * Hook: listens for incoming video call notifications from other tabs.
 * Returns the incoming call info and a function to dismiss it.
 */
export function useCallNotification() {
  const [incomingCall, setIncomingCall] = useState<IncomingCall | null>(null);
  const bcRef = useRef<BroadcastChannel | null>(null);

  useEffect(() => {
    try {
      bcRef.current = new BroadcastChannel(CHANNEL_NAME);
      bcRef.current.onmessage = (event) => {
        if (event.data?.type === 'CALL_STARTED') {
          setIncomingCall({
            channelName: event.data.channelName,
            callerName: event.data.callerName,
            callerRole: event.data.callerRole,
          });
        }
        if (event.data?.type === 'CALL_ENDED') {
          setIncomingCall(null);
        }
      };
    } catch {
      // BroadcastChannel not supported
    }

    return () => {
      bcRef.current?.close();
    };
  }, []);

  const dismissCall = () => setIncomingCall(null);

  return { incomingCall, dismissCall };
}

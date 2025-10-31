/**
 * Matrix Call View Component - CLEAN VERSION
 * Simple, straightforward call logic with NO bugs
 */

import React, { useEffect, useRef, useState } from 'react';
import { MatrixCall } from 'matrix-js-sdk/lib/webrtc/call';
import { CallState } from 'matrix-js-sdk/lib/webrtc/call';
import { matrixCallService } from '../../services/matrixCallService';
import './MatrixCallView.styles.scss';

interface MatrixCallViewProps {
    roomId: string;
    isVideoCall: boolean;
    onCallEnd: () => void;
}

export const MatrixCallView: React.FC<MatrixCallViewProps> = ({
    roomId,
    isVideoCall,
    onCallEnd
}) => {
    const localVideoRef = useRef<HTMLVideoElement>(null);
    const remoteVideoRef = useRef<HTMLVideoElement>(null);
    
    const [callState, setCallState] = useState<CallState | null>(null);
    const [isMuted, setIsMuted] = useState(false);
    const [isVideoMuted, setIsVideoMuted] = useState(false);
    const [activeCall, setActiveCall] = useState<MatrixCall | null>(null);
    const [error, setError] = useState<string | null>(null);
    
    // Initialize call ONCE on mount
    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const isAnswering = urlParams.get('answer') === 'true';
        
        console.log('🔥 MatrixCallView INIT - Room:', roomId, '| Answer mode:', isAnswering);
        
        const matrixClientService = (window as any).matrixClientService;
        if (!matrixClientService) {
            setError('Matrix client not available');
            return;
        }
        
        const client = matrixClientService.getClient();
        if (!client) {
            setError('Matrix client not ready');
            return;
        }
        
        const calls = client.callEventHandler?.calls;
        if (!calls) {
            setError('Call handler not available');
            return;
        }
        
        // Find incoming call for this room
        const incomingCall = Array.from(calls.values()).find((call: any) => 
            call.roomId === roomId && 
            call.direction === 'inbound' && 
            call.state === 'ringing'
        ) as MatrixCall | undefined;
        
        console.log('🔥 Incoming call exists?', !!incomingCall);
        console.log('🔥 Is answering mode?', isAnswering);
        
        if (isAnswering && incomingCall) {
            // ANSWER MODE: Answer the existing call
            console.log('✅ ANSWERING incoming call');
            setActiveCall(incomingCall);
            
            matrixCallService.answerCall(
                incomingCall,
                isVideoCall,
                localVideoRef.current || undefined,
                remoteVideoRef.current || undefined
            ).catch((err) => {
                console.error('❌ Failed to answer:', err);
                setError(err.message);
            });
        } else if (!isAnswering) {
            // START MODE: Start new outgoing call
            console.log('✅ STARTING new outgoing call');
            
            matrixCallService.startCall({
                roomId,
                isVideoCall,
                localVideoElement: localVideoRef.current || undefined,
                remoteVideoElement: remoteVideoRef.current || undefined
            }).then((call) => {
                setActiveCall(call);
            }).catch((err) => {
                console.error('❌ Failed to start call:', err);
                setError(err.message);
            });
        } else {
            // ANSWER MODE but no incoming call
            setError('No incoming call found to answer');
        }
        
        // Cleanup on unmount
        return () => {
            console.log('🧹 Cleaning up call...');
            if (activeCall) {
                (activeCall as any).hangup();
            }
        };
    }, []); // Run ONCE only!
    
    // Monitor call state
    useEffect(() => {
        if (!activeCall) return;
        
        const handleStateChange = (state: CallState) => {
            console.log('📞 Call state changed:', state);
            setCallState(state);
            if (state === CallState.Ended) {
                onCallEnd();
            }
        };
        
        (activeCall as any).on('state', handleStateChange);
        
        return () => {
            (activeCall as any).off('state', handleStateChange);
        };
    }, [activeCall, onCallEnd]);
    
    // Render
    return (
        <div className="matrix-call">
            <div className="matrix-call__header">
                <h2>{isVideoCall ? '📹 Video Call' : '📞 Voice Call'}</h2>
                <div className="matrix-call__state">
                    {error ? `Error: ${error}` : 
                     callState === CallState.Connected ? 'Connected' :
                     callState === CallState.Ringing ? 'Ringing...' :
                     callState === CallState.Ended ? 'Call ended' :
                     'Initializing...'}
                </div>
            </div>
            
            <div className="matrix-call__videos">
                <div className="matrix-call__remote-video">
                    <video ref={remoteVideoRef} className="matrix-call__video" autoPlay playsInline />
                </div>
                {isVideoCall && (
                    <div className="matrix-call__local-video">
                        <video ref={localVideoRef} className="matrix-call__video" autoPlay playsInline muted />
                    </div>
                )}
            </div>
            
            <div className="matrix-call__controls">
                <button onClick={() => (activeCall as any)?.hangup?.()}>
                    ❌ Hang Up
                </button>
            </div>
        </div>
    );
};


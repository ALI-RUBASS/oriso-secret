/**
 * GroupCallWidget - Multi-participant group video calls using LiveKit's pre-built components
 */

import React, { useEffect, useState, useRef } from 'react';
import { callManager, CallData } from '../../services/CallManager';
import { LiveKitRoom, VideoConference, useToken } from '@livekit/components-react';
import '@livekit/components-styles';
import './GroupCallWidget.scss';

export const GroupCallWidget: React.FC = () => {
    const [callData, setCallData] = useState<CallData | null>(null);
    const [callState, setCallState] = useState<string | null>(null);
    const [livekitToken, setLivekitToken] = useState<string>('');
    const [isConnecting, setIsConnecting] = useState(false);
    
    // Dragging state
    const [isDragging, setIsDragging] = useState(false);
    const [position, setPosition] = useState({ x: 100, y: 100 });
    const dragRef = useRef<{ startX: number; startY: number; elemX: number; elemY: number } | null>(null);

    // Subscribe to CallManager
    useEffect(() => {
        const unsubscribe = callManager.subscribe((newCallData) => {
            console.log('📡 GroupCallWidget: CallManager update:', newCallData);
            setCallData(newCallData);
            setCallState(newCallData?.state || null);
            if (!newCallData) {
                setLivekitToken('');
                setIsConnecting(false);
            }
        });
        const currentCall = callManager.getCurrentCall();
        setCallData(currentCall);
        setCallState(currentCall?.state || null);
        return () => unsubscribe();
    }, []);

    // Handle incoming call answer
    useEffect(() => {
        if (!callData || !callData.isGroup || !callData.isIncoming) return;
        if (callData.state !== 'connecting') return;

        console.log('✅ Answering incoming call, fetching token...');
        fetchTokenAndConnect();
    }, [callState]);

    // Handle outgoing call
    useEffect(() => {
        if (!callData || !callData.isGroup || callData.isIncoming) return;
        if (isConnecting) return;

        console.log('📞 Starting outgoing call, fetching token...');
        fetchTokenAndConnect();
    }, [callData]);

    const fetchTokenAndConnect = async () => {
        if (!callData) return;
        setIsConnecting(true);

        try {
            const matrixClientService = (window as any).matrixClientService;
            const client = matrixClientService?.getClient();
            if (!client) throw new Error('Matrix client not initialized');

            const myUserId = client.getUserId();
            if (!myUserId) throw new Error('User ID not available');

            const userName = myUserId.replace('@', '').split(':')[0];
            const roomName = callData.roomId;

            console.log('🔑 Fetching LiveKit token...');
            const url = `/api/livekit/token?roomName=${encodeURIComponent(roomName)}&identity=${encodeURIComponent(userName)}&_t=${Date.now()}`;
            
            const response = await fetch(url, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
                cache: 'no-store'
            });

            if (!response.ok) throw new Error(`Token request failed: ${response.status}`);
            
            const data = await response.json();
            if (!data.token) throw new Error('No token received');

            console.log('✅ Token received, connecting to LiveKit...');
            setLivekitToken(data.token);

        } catch (err) {
            console.error('❌ Failed to get token:', err);
            alert(`Failed to start call: ${(err as Error).message}`);
            callManager.endCall();
        }
    };

    const handleAnswer = () => {
        if (!callData || !callData.isIncoming) return;
        console.log('✅ User clicked Answer');
        callManager.answerCall();
    };

    const handleDecline = () => {
        console.log('❌ User declined call');
        callManager.endCall();
    };

    const handleEndCall = () => {
        console.log('📴 Ending call');
        callManager.endCall();
    };

    // Dragging handlers (mouse + touch)
    const handleMouseDown = (e: React.MouseEvent) => {
        if ((e.target as HTMLElement).closest('.btn-end-call, .btn-answer, .btn-decline')) return;
        setIsDragging(true);
        dragRef.current = {
            startX: e.clientX,
            startY: e.clientY,
            elemX: position.x,
            elemY: position.y
        };
    };

    const handleTouchStart = (e: React.TouchEvent) => {
        if ((e.target as HTMLElement).closest('.btn-end-call, .btn-answer, .btn-decline')) return;
        const touch = e.touches[0];
        setIsDragging(true);
        dragRef.current = {
            startX: touch.clientX,
            startY: touch.clientY,
            elemX: position.x,
            elemY: position.y
        };
    };

    const handleMouseMove = (e: MouseEvent) => {
        if (!isDragging || !dragRef.current) return;
        const dx = e.clientX - dragRef.current.startX;
        const dy = e.clientY - dragRef.current.startY;
        setPosition({
            x: dragRef.current.elemX + dx,
            y: dragRef.current.elemY + dy
        });
    };

    const handleTouchMove = (e: TouchEvent) => {
        if (!isDragging || !dragRef.current) return;
        const touch = e.touches[0];
        const dx = touch.clientX - dragRef.current.startX;
        const dy = touch.clientY - dragRef.current.startY;
        setPosition({
            x: dragRef.current.elemX + dx,
            y: dragRef.current.elemY + dy
        });
    };

    const handleMouseUp = () => {
        setIsDragging(false);
        dragRef.current = null;
    };

    const handleTouchEnd = () => {
        setIsDragging(false);
        dragRef.current = null;
    };

    useEffect(() => {
        if (isDragging) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
            window.addEventListener('touchmove', handleTouchMove);
            window.addEventListener('touchend', handleTouchEnd);
            return () => {
                window.removeEventListener('mousemove', handleMouseMove);
                window.removeEventListener('mouseup', handleMouseUp);
                window.removeEventListener('touchmove', handleTouchMove);
                window.removeEventListener('touchend', handleTouchEnd);
            };
        }
    }, [isDragging]);

    // Only render for group calls
    if (!callData || !callData.isGroup) return null;

    const livekitUrl = 'wss://livekit.oriso.site';

    return (
        <div 
            className={`group-call-widget ${isDragging ? 'dragging' : ''}`}
            style={{ left: `${position.x}px`, top: `${position.y}px` }}
            onMouseDown={handleMouseDown}
            onTouchStart={handleTouchStart}
        >
            {/* Incoming call - show answer/decline buttons */}
            {callData.isIncoming && callData.state === 'ringing' ? (
                <div className="incoming-call-popup">
                    <div className="incoming-call-header">
                        <span>GROUP CALL</span>
                    </div>
                    <div className="incoming-call-content">
                        <div className="call-avatar-large">G</div>
                        <h2>Incoming Group Call</h2>
                        <p>Someone is calling...</p>
                        <div className="incoming-call-actions">
                            <button className="btn-answer" onClick={handleAnswer}>
                                Answer
                            </button>
                            <button className="btn-decline" onClick={handleDecline}>
                                Decline
                            </button>
                        </div>
                    </div>
                </div>
            ) : livekitToken ? (
                /* Active call - show LiveKit's pre-built UI */
                <div className="livekit-room-container">
                    <div className="livekit-header">
                        <span>GROUP CALL</span>
                        <button className="btn-end-call" onClick={handleEndCall}>
                            End Call
                        </button>
                    </div>
                    <LiveKitRoom
                        video={callData.isVideo}
                        audio={true}
                        token={livekitToken}
                        serverUrl={livekitUrl}
                        connect={true}
                        onDisconnected={handleEndCall}
                        style={{ height: '600px', width: '900px' }}
                    >
                        <VideoConference 
                            chatMessageFormatter={() => null}
                        />
                    </LiveKitRoom>
                </div>
            ) : (
                /* Connecting state */
                <div className="connecting-popup">
                    <div className="connecting-header">
                        <span>GROUP CALL</span>
                    </div>
                    <div className="connecting-content">
                        <div className="call-avatar-large">G</div>
                        <h2>Connecting...</h2>
                        <p>Setting up group call</p>
                    </div>
                </div>
            )}
        </div>
    );
};

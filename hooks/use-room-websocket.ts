import { useState, useEffect, useRef, useCallback } from 'react';
import { useGlobalWebSocket } from '@/contexts/websocket-context';

interface RoomData {
  selectedPlayers: any[];
  formation: string;
  bet?: string;
  stake?: number;
  hostAddress: string;
  tournamentId: string;
}

interface WebSocketMessage {
  type: string;
  roomId?: string;
  hostData?: RoomData;
  guestData?: RoomData;
  error?: string;
  reason?: string;
  requiredStake?: number;
  betType?: string;
  tournamentId?: number;
  txHash?: string;
  winnerAddress?: string; // This should fix the TypeScript error
}

interface RoomInfo {
  roomId: string;
  requiredStake: number;
  betType: string;
  hostData: RoomData;
  hostAddress: string;
}

interface UseRoomWebSocketReturn {
  isConnected: boolean;
  roomId: string | null;
  roomStatus: 'idle' | 'waiting' | 'handshaking' | 'accepted' | 'tournament' | 'ready_for_competition' | 'winner_announced' | 'error';
  error: string | null;
  roomInfo: RoomInfo | null;
  hostData: RoomData | null;
  guestData: RoomData | null;
  tournamentId: number | null;
  winnerInfo: { winnerAddress: string; txHash: string } | null;
  createRoom: (data: RoomData) => void;
  getRoomInfo: (roomId: string) => void;
  joinRoom: (roomId: string, data: RoomData) => void;
  acceptHandshake: (roomId: string) => void;
  rejectHandshake: (roomId: string, reason?: string) => void;
  setPlayerReady: (roomId: string) => void;
  sendStakeCompleted: (roomId: string, txHash: string) => void;
  announceWinner: (roomId: string, winnerAddress: string) => void;
  disconnect: () => void;
}

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8001';

export function useRoomWebSocket(): UseRoomWebSocketReturn {
  const [roomId, setRoomId] = useState<string | null>(null);
  const [roomStatus, setRoomStatus] = useState<'idle' | 'waiting' | 'handshaking' | 'accepted' | 'tournament' | 'ready_for_competition' | 'winner_announced' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [roomInfo, setRoomInfo] = useState<RoomInfo | null>(null);
  const [hostData, setHostData] = useState<RoomData | null>(null);
  const [guestData, setGuestData] = useState<RoomData | null>(null);
  const [tournamentId, setTournamentId] = useState<number | null>(null);
  const [winnerInfo, setWinnerInfo] = useState<{ winnerAddress: string; txHash: string } | null>(null);
  
  // Use global WebSocket connection
  const { isConnected, sendMessage, subscribe } = useGlobalWebSocket();

  const log = useCallback((message: string, type: 'INFO' | 'ERROR' | 'WARN' = 'INFO') => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [${type}] [RoomWebSocket] ${message}`);
  }, []);

  const handleMessage = useCallback((message: WebSocketMessage) => {
    console.log('🎯 [DEBUG] WebSocket message received:', message.type, message);
    
    switch (message.type) {
      case 'ROOM_CREATED':
        log(`Room created successfully: ${message.roomId}`);
        setRoomId(message.roomId || null);
        setRoomStatus('waiting');
        setError(null);
        break;

      case 'ROOM_INFO_SUCCESS':
        log(`Room info received: ${message.roomId}`);
        if (message.roomId && message.requiredStake !== undefined && message.betType && message.hostData) {
          setRoomInfo({
            roomId: message.roomId,
            requiredStake: message.requiredStake,
            betType: message.betType,
            hostData: message.hostData,
            hostAddress: message.hostData.hostAddress
          });
          
          // Check if tournament was already created
          if (message.tournamentId) {
            log(`Tournament ID found in room info: ${message.tournamentId}`);
            setTournamentId(message.tournamentId);
          }
        }
        setError(null);
        break;

      case 'ROOM_INFO_FAILED':
        log(`Room info failed: ${message.error}`, 'ERROR');
        setError(message.error || 'Failed to get room info');
        setRoomInfo(null);
        break;

      case 'ROOM_CREATION_FAILED':
        log(`Room creation failed: ${message.error}`, 'ERROR');
        setError(message.error || 'Failed to create room');
        setRoomStatus('error');
        break;

      case 'JOIN_ROOM_SUCCESS':
        log(`Successfully joined room: ${message.roomId}`);
        setRoomId(message.roomId || null);
        setRoomStatus('handshaking');
        setError(null);
        
        // Store bet type and required stake information
        if (message.roomId && message.requiredStake !== undefined && message.betType) {
          setRoomInfo({
            roomId: message.roomId || '',
            requiredStake: message.requiredStake,
            betType: message.betType,
            hostData: message.hostData || { hostAddress: '', selectedPlayers: [], formation: '', tournamentId: '' },
            hostAddress: message.hostData?.hostAddress || ''
          });
        }
        break;

      case 'JOIN_ROOM_FAILED':
        log(`Failed to join room: ${message.error}`, 'ERROR');
        setError(message.error || 'Failed to join room');
        setRoomStatus('error');
        break;

      case 'GUEST_JOINED':
        log(`Guest joined room: ${message.roomId}`);
        setRoomStatus('handshaking');
        break;

      case 'HANDSHAKE_REQUEST':
        log(`Handshake request received for room: ${message.roomId}`);
        setRoomStatus('handshaking');
        if (message.hostData) setHostData(message.hostData);
        if (message.guestData) setGuestData(message.guestData);
        break;

      case 'HANDSHAKE_ACCEPTED':
        log(`Handshake accepted for room: ${message.roomId}`);
        setRoomStatus('accepted');
        if (message.hostData) setHostData(message.hostData);
        if (message.guestData) setGuestData(message.guestData);
        break;

      case 'HANDSHAKE_REJECTED':
        log(`Handshake rejected: ${message.reason}`, 'ERROR');
        setError(message.reason || 'Handshake was rejected');
        setRoomStatus('error');
        break;

      case 'HANDSHAKE_COMPLETE':
        log(`Handshake completed for room: ${message.roomId}`);
        setRoomStatus('accepted');
        break;

      case 'TOURNAMENT_START':
        log(`Tournament starting for room: ${message.roomId}`);
        setRoomStatus('tournament');
        break;

      case 'HOST_DISCONNECTED':
        log(`Host disconnected from room: ${message.roomId}`, 'WARN');
        setError('Host disconnected from the room');
        setRoomStatus('error');
        break;

      case 'GUEST_DISCONNECTED':
        log(`Guest disconnected from room: ${message.roomId}`, 'WARN');
        setError('Guest disconnected from the room');
        setRoomStatus('error');
        break;

      case 'TOURNAMENT_CREATED':
        log(`Tournament created by server for room: ${message.roomId}`);
        if (message.tournamentId) {
          setTournamentId(message.tournamentId);
          log(`Tournament ID set: ${message.tournamentId}`);
          console.log('🎯 [DEBUG] Tournament created - ID:', message.tournamentId, 'Room:', message.roomId);
        } else {
          log(`Tournament created but no ID provided`, 'WARN');
          console.log('⚠️ [DEBUG] Tournament created but no ID in message:', message);
        }
        break;

      case 'TOURNAMENT_CREATION_FAILED':
        log(`Tournament creation failed: ${message.error}`, 'ERROR');
        setError(message.error || 'Failed to create tournament');
        setRoomStatus('error');
        break;

      case 'BOTH_PLAYERS_STAKED':
        log(`Both players have staked for room: ${message.roomId}`);
        setRoomStatus('ready_for_competition');
        break;

      case 'WAITING_FOR_OPPONENT_STAKE':
        log(`Waiting for opponent to stake for room: ${message.roomId}`);
        // Room status remains as is, just show the waiting message
        break;

      case 'WINNER_ANNOUNCED':
        log(`Winner announced for room: ${message.roomId}`);
        setRoomStatus('winner_announced');
        // Store winner information
        if (message.winnerAddress && message.txHash) {
          setWinnerInfo({ winnerAddress: message.winnerAddress, txHash: message.txHash });
          console.log('🏆 Winner announced:', message.winnerAddress, 'Tx:', message.txHash);
        } else {
          console.log('⚠️ Winner announced but missing address or txHash:', message);
        }
        break;

      case 'WINNER_ANNOUNCEMENT_FAILED':
        log(`Winner announcement failed: ${message.error}`, 'ERROR');
        setError(message.error || 'Failed to announce winner');
        break;

      default:
        log(`Unknown message type: ${message.type}`, 'WARN');
    }
  }, [log]);

  // Debug: Log winner info changes
  useEffect(() => {
    console.log('🎯 [DEBUG] Winner info changed:', winnerInfo)
  }, [winnerInfo])

  // Subscribe to global WebSocket messages
  useEffect(() => {
    const unsubscribe = subscribe(handleMessage);
    return unsubscribe;
  }, [subscribe, handleMessage]);

  const createRoom = useCallback((data: RoomData) => {
    log(`Creating room with data: ${JSON.stringify(data)}`);
    sendMessage({
      type: 'CREATE_ROOM',
      hostData: data
    });
  }, [sendMessage, log]);

  const getRoomInfo = useCallback((roomId: string) => {
    log(`Getting room info for: ${roomId}`);
    sendMessage({
      type: 'GET_ROOM_INFO',
      roomId
    });
  }, [sendMessage, log]);

  const joinRoom = useCallback((roomId: string, data: RoomData) => {
    log(`Joining room: ${roomId} with data: ${JSON.stringify(data)}`);
    
    // Check if user is trying to join their own room
    if (roomInfo && roomInfo.hostAddress && roomInfo.hostAddress.toLowerCase() === data.hostAddress.toLowerCase()) {
      setError('You cannot join your own room');
      return;
    }
    
    sendMessage({
      type: 'JOIN_ROOM',
      roomId,
      guestData: data
    });
  }, [sendMessage, log, roomInfo]);

  const acceptHandshake = useCallback((roomId: string) => {
    log(`Accepting handshake for room: ${roomId}`);
    sendMessage({
      type: 'HANDSHAKE_ACCEPT',
      roomId
    });
  }, [sendMessage, log]);

  const rejectHandshake = useCallback((roomId: string, reason?: string) => {
    log(`Rejecting handshake for room: ${roomId}${reason ? ` with reason: ${reason}` : ''}`);
    sendMessage({
      type: 'HANDSHAKE_REJECT',
      roomId,
      reason
    });
  }, [sendMessage, log]);

  const setPlayerReady = useCallback((roomId: string) => {
    log(`Setting player ready for room: ${roomId}`);
    sendMessage({
      type: 'PLAYER_READY',
      roomId
    });
  }, [sendMessage, log]);

  const sendStakeCompleted = useCallback((roomId: string, txHash: string) => {
    log(`Sending stake completed for room: ${roomId}, txHash: ${txHash}`);
    sendMessage({
      type: 'STAKE_COMPLETED',
      roomId,
      txHash
    });
  }, [sendMessage, log]);

  const announceWinner = useCallback((roomId: string, winnerAddress: string) => {
    log(`Announcing winner for room: ${roomId}, winner: ${winnerAddress}`);
    sendMessage({
      type: 'ANNOUNCE_WINNER',
      roomId,
      winnerAddress
    });
  }, [sendMessage, log]);

  const disconnect = useCallback(() => {
    log('Disconnecting from room WebSocket');
    setRoomId(null);
    setRoomStatus('idle');
    setError(null);
    setRoomInfo(null);
    setHostData(null);
    setGuestData(null);
    setTournamentId(null);
    setWinnerInfo(null);
  }, [log]);

  return {
    isConnected,
    roomId,
    roomStatus,
    error,
    roomInfo,
    hostData,
    guestData,
    tournamentId,
    winnerInfo,
    createRoom,
    getRoomInfo,
    joinRoom,
    acceptHandshake,
    rejectHandshake,
    setPlayerReady,
    sendStakeCompleted,
    announceWinner,
    disconnect
  };
} 
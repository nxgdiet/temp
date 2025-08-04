// Load environment variables from .env.local
require('dotenv').config({ path: '.env.local' });

const WebSocket = require('ws');
const http = require('http');
const crypto = require('crypto');
const { TournamentOwnerService } = require('./lib/tournament-owner-service.js');

// Create HTTP server
const server = http.createServer();

// Create WebSocket server.
const wss = new WebSocket.Server({ server });

// Store active rooms and their participants
const rooms = new Map();
const clients = new Map();

// Initialize tournament owner service
let tournamentOwnerService;
try {
  tournamentOwnerService = new TournamentOwnerService();
  console.log('✅ Tournament Owner Service initialized');
} catch (error) {
  console.error('❌ Failed to initialize Tournament Owner Service:', error.message);
}

console.log('🚀 TokenRivals Room Server starting... v2.0');

// Generate a random room ID
function generateRoomId() {
  return crypto.randomBytes(4).toString('hex').toUpperCase();
}

// Log function with timestamps
function log(message, type = 'INFO') {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] [${type}] ${message}`);
}

wss.on('connection', (ws, req) => {
  const clientId = crypto.randomBytes(8).toString('hex');
  clients.set(ws, { id: clientId, roomId: null, isHost: false });
  
  log(`🔌 New client connected: ${clientId}`);

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      log(`📨 Received message from ${clientId}: ${data.type}`);
      
      switch (data.type) {
        case 'CREATE_ROOM':
          handleCreateRoom(ws, data);
          break;
        case 'GET_ROOM_INFO':
          handleGetRoomInfo(ws, data);
          break;
        case 'JOIN_ROOM':
          handleJoinRoom(ws, data);
          break;
        case 'HANDSHAKE_ACCEPT':
          handleHandshakeAccept(ws, data);
          break;
        case 'HANDSHAKE_REJECT':
          handleHandshakeReject(ws, data);
          break;
        case 'PLAYER_READY':
          handlePlayerReady(ws, data);
          break;
        case 'STAKE_COMPLETED':
          handleStakeCompleted(ws, data);
          break;
        case 'ANNOUNCE_WINNER':
          handleAnnounceWinner(ws, data);
          break;
        default:
          log(`❌ Unknown message type: ${data.type}`, 'ERROR');
      }
    } catch (error) {
      log(`❌ Error parsing message: ${error.message}`, 'ERROR');
    }
  });

  ws.on('close', () => {
    const client = clients.get(ws);
    if (client) {
      log(`🔌 Client disconnected: ${client.id}`);
      
      // Clean up room if host disconnects
      if (client.roomId && client.isHost) {
        const room = rooms.get(client.roomId);
        if (room) {
          log(`🗑️ Host disconnected, marking room for cleanup: ${client.roomId}`);
          // Mark room for cleanup after 5 minutes instead of immediate deletion
          setTimeout(() => {
            const currentRoom = rooms.get(client.roomId);
            if (currentRoom && currentRoom.host === ws) {
              log(`🗑️ Cleaning up room after timeout: ${client.roomId}`);
              // Notify other participants
              if (currentRoom.guest) {
                currentRoom.guest.send(JSON.stringify({
                  type: 'HOST_DISCONNECTED',
                  roomId: client.roomId
                }));
              }
              rooms.delete(client.roomId);
            }
          }, 5 * 60 * 1000); // 5 minutes
        }
      }
      
      // Remove from room if guest
      if (client.roomId && !client.isHost) {
        const room = rooms.get(client.roomId);
        if (room && room.guest === ws) {
          log(`👤 Guest disconnected from room: ${client.roomId}`);
          room.guest = null;
          // Notify host
          if (room.host) {
            room.host.send(JSON.stringify({
              type: 'GUEST_DISCONNECTED',
              roomId: client.roomId
            }));
          }
        }
      }
      
      clients.delete(ws);
    }
  });

  ws.on('error', (error) => {
    log(`❌ WebSocket error for ${clientId}: ${error.message}`, 'ERROR');
  });
});

function handleCreateRoom(ws, data) {
  const client = clients.get(ws);
  const roomId = generateRoomId();
  
  log(`🏠 Creating room: ${roomId} for client: ${client.id}`);
  
  // Check if room already exists (very unlikely but possible)
  if (rooms.has(roomId)) {
    log(`⚠️ Room ID collision detected: ${roomId}`, 'WARN');
    ws.send(JSON.stringify({
      type: 'ROOM_CREATION_FAILED',
      error: 'Room ID collision, please try again'
    }));
    return;
  }
  
  // Create room
  const room = {
    id: roomId,
    host: ws,
    guest: null,
    hostData: data.hostData,
    status: 'waiting',
    createdAt: new Date(),
    requiredStake: data.hostData?.stake || 0,
    betType: data.hostData?.bet || 'LONG',
    tournamentId: null,
    hostStaked: false,
    guestStaked: false
  };
  
  rooms.set(roomId, room);
  client.roomId = roomId;
  client.isHost = true;
  
  log(`✅ Room created successfully: ${roomId}`);
  
  // Send room creation confirmation
  ws.send(JSON.stringify({
    type: 'ROOM_CREATED',
    roomId: roomId,
    hostData: data.hostData
  }));
  
  log(`📊 Active rooms: ${rooms.size}`);
}

function handleGetRoomInfo(ws, data) {
  const roomId = data.roomId;
  
  log(`🔍 Client requesting room info for: ${roomId}`);
  log(`📊 Current rooms: ${Array.from(rooms.keys()).join(', ')}`);
  
  const room = rooms.get(roomId);
  
  if (!room) {
    log(`❌ Room not found: ${roomId}`);
    ws.send(JSON.stringify({
      type: 'ROOM_INFO_FAILED',
      error: 'Room not found'
    }));
    return;
  }
  
  if (room.guest) {
    log(`❌ Room ${roomId} is full`);
    // Send tournament info if available, even for full rooms
    if (room.tournamentId) {
      log(`📡 Sending tournament info for full room: ${roomId}, tournament: ${room.tournamentId}`);
      ws.send(JSON.stringify({
        type: 'ROOM_INFO_SUCCESS',
        roomId: roomId,
        requiredStake: room.requiredStake,
        betType: room.betType,
        hostData: room.hostData,
        tournamentId: room.tournamentId
      }));
    } else {
      ws.send(JSON.stringify({
        type: 'ROOM_INFO_FAILED',
        error: 'Room is full'
      }));
    }
    return;
  }
  
  // Send room information
  ws.send(JSON.stringify({
    type: 'ROOM_INFO_SUCCESS',
    roomId: roomId,
    requiredStake: room.requiredStake,
    betType: room.betType,
    hostData: room.hostData,
    tournamentId: room.tournamentId || null
  }));
  
  log(`✅ Room info sent for: ${roomId} (Stake: $${room.requiredStake}, Bet: ${room.betType})`);
}

function handleJoinRoom(ws, data) {
  const client = clients.get(ws);
  const roomId = data.roomId;
  
  log(`🚪 Client ${client.id} attempting to join room: ${roomId}`);
  
  const room = rooms.get(roomId);
  
  if (!room) {
    log(`❌ Room not found: ${roomId}`);
    ws.send(JSON.stringify({
      type: 'JOIN_ROOM_FAILED',
      error: 'Room not found'
    }));
    return;
  }
  
  if (room.guest) {
    log(`❌ Room ${roomId} is full`);
    ws.send(JSON.stringify({
      type: 'JOIN_ROOM_FAILED',
      error: 'Room is full'
    }));
    return;
  }

  // Validate stake amount
  const guestStake = data.guestData?.stake || 0;
  if (guestStake !== room.requiredStake) {
    log(`❌ Stake mismatch - Required: ${room.requiredStake}, Provided: ${guestStake}`);
    ws.send(JSON.stringify({
      type: 'JOIN_ROOM_FAILED',
      error: `Stake amount must be $${room.requiredStake}`
    }));
    return;
  }

  // Validate bet type
  const guestBet = data.guestData?.bet;
  if (guestBet !== room.betType) {
    log(`❌ Bet type mismatch - Required: ${room.betType}, Provided: ${guestBet}`);
    ws.send(JSON.stringify({
      type: 'JOIN_ROOM_FAILED',
      error: `This room requires ${room.betType} betting. Your bet will be automatically set to ${room.betType}.`
    }));
    return;
  }
  
  // Add guest to room
  room.guest = ws;
  room.guestData = data.guestData;
  client.roomId = roomId;
  client.isHost = false;
  
  log(`✅ Guest ${client.id} joined room: ${roomId}`);
  
  // Send join confirmation to guest
  log(`📡 Sending JOIN_ROOM_SUCCESS to guest with betType: ${room.betType}, requiredStake: ${room.requiredStake}`);
  ws.send(JSON.stringify({
    type: 'JOIN_ROOM_SUCCESS',
    roomId: roomId,
    hostData: room.hostData,
    betType: room.betType,
    requiredStake: room.requiredStake
  }));
  
  // Notify host about guest joining
  room.host.send(JSON.stringify({
    type: 'GUEST_JOINED',
    roomId: roomId,
    guestData: data.guestData
  }));
  
  // Initiate handshake
  log(`🤝 Initiating handshake for room: ${roomId}`);
  room.status = 'handshaking';
  
  // Send handshake request to host
  room.host.send(JSON.stringify({
    type: 'HANDSHAKE_REQUEST',
    roomId: roomId,
    guestData: data.guestData
  }));
}

async function handleHandshakeAccept(ws, data) {
  const client = clients.get(ws);
  const roomId = data.roomId;
  
  log(`✅ Host accepted handshake for room: ${roomId}`);
  
  const room = rooms.get(roomId);
  if (!room || room.host !== ws) {
    log(`❌ Invalid handshake accept from non-host client`, 'ERROR');
    return;
  }
  
  room.status = 'accepted';
  
  // Create tournament on blockchain when both users are connected
  log(`🔍 Checking tournament creation conditions:`);
  log(`  - tournamentOwnerService: ${tournamentOwnerService ? '✅ Available' : '❌ Not available'}`);
  log(`  - room.hostData: ${room.hostData ? '✅ Available' : '❌ Not available'}`);
  log(`  - room.guestData: ${room.guestData ? '✅ Available' : '❌ Not available'}`);
  
  if (tournamentOwnerService && room.hostData && room.guestData) {
    try {
      log(`🏆 Creating tournament on blockchain for room: ${roomId}`);
      
      const hostAddress = room.hostData.hostAddress;
      const guestAddress = room.guestData.hostAddress; // Guest address is stored in hostAddress field
      
      log(`Creating tournament with participants: Host(${hostAddress}), Guest(${guestAddress})`);
      
      // Use the tournament ID provided by the frontend if available
      const frontendTournamentId = room.hostData.tournamentId;
      log(`Frontend provided tournament ID: ${frontendTournamentId}`);
      
      let tournamentResult;
      if (frontendTournamentId && frontendTournamentId !== '') {
        // Use the frontend tournament ID
        log(`Using frontend tournament ID: ${frontendTournamentId}`);
        tournamentResult = await tournamentOwnerService.createTournament(hostAddress, guestAddress, parseInt(frontendTournamentId));
      } else {
        // Fallback to generating new tournament ID
        log(`No frontend tournament ID provided, generating new one`);
        tournamentResult = await tournamentOwnerService.createTournament(hostAddress, guestAddress);
      }
      
      if (tournamentResult.success && tournamentResult.tournamentId) {
        log(`✅ Tournament created successfully with ID: ${tournamentResult.tournamentId}`);
        
        // Store tournament ID in room
        room.tournamentId = tournamentResult.tournamentId;
        
        // Send tournament creation notification to both players
        const tournamentMessage = {
          type: 'TOURNAMENT_CREATED',
          roomId: roomId,
          tournamentId: tournamentResult.tournamentId,
          txHash: tournamentResult.txHash
        };
        
        log(`📡 Sending TOURNAMENT_CREATED message to host and guest`);
        log(`  - Host client ID: ${clients.get(room.host)?.id}`);
        log(`  - Guest client ID: ${clients.get(room.guest)?.id}`);
        log(`  - Host WebSocket readyState: ${room.host.readyState}`);
        log(`  - Guest WebSocket readyState: ${room.guest.readyState}`);
        log(`  - Tournament message: ${JSON.stringify(tournamentMessage)}`);
        room.host.send(JSON.stringify(tournamentMessage));
        room.guest.send(JSON.stringify(tournamentMessage));
        
        log(`📡 Tournament creation event sent to both clients for room: ${roomId}`);
      } else {
        log(`❌ Failed to create tournament: ${tournamentResult.error}`, 'ERROR');
        
        // Send error to both clients
        const errorMessage = {
          type: 'TOURNAMENT_CREATION_FAILED',
          roomId: roomId,
          error: tournamentResult.error || 'Failed to create tournament'
        };
        
        room.host.send(JSON.stringify(errorMessage));
        room.guest.send(JSON.stringify(errorMessage));
      }
    } catch (error) {
      log(`❌ Error creating tournament: ${error.message}`, 'ERROR');
      
      // Send error to both clients
      const errorMessage = {
        type: 'TOURNAMENT_CREATION_FAILED',
        roomId: roomId,
        error: error.message
      };
      
      room.host.send(JSON.stringify(errorMessage));
      room.guest.send(JSON.stringify(errorMessage));
    }
  } else {
    log(`⚠️ Cannot create tournament - missing service or participant data`, 'WARN');
    log(`  - tournamentOwnerService: ${tournamentOwnerService ? 'available' : 'missing'}`);
    log(`  - hostData: ${room.hostData ? 'available' : 'missing'}`);
    log(`  - guestData: ${room.guestData ? 'available' : 'missing'}`);
  }
  
  // Notify guest about handshake acceptance
  if (room.guest) {
    room.guest.send(JSON.stringify({
      type: 'HANDSHAKE_ACCEPTED',
      roomId: roomId,
      hostData: room.hostData
    }));
  }
  
  // Notify host about successful handshake
  ws.send(JSON.stringify({
    type: 'HANDSHAKE_COMPLETE',
    roomId: roomId,
    guestData: room.guestData
  }));
  
  log(`🎉 Handshake completed for room: ${roomId}`);
}

async function handleStakeCompleted(ws, data) {
  const client = clients.get(ws);
  const roomId = data.roomId;
  const txHash = data.txHash;
  
  log(`💰 Stake completed for room: ${roomId}, txHash: ${txHash}`);
  
  const room = rooms.get(roomId);
  if (!room) {
    log(`❌ Room not found for stake completion: ${roomId}`, 'ERROR');
    return;
  }
  
  // Mark player as staked
  if (client.isHost) {
    room.hostStaked = true;
    log(`✅ Host staked for room: ${roomId}`);
  } else {
    room.guestStaked = true;
    log(`✅ Guest staked for room: ${roomId}`);
  }
  
  // Check if both players have staked
  if (room.hostStaked && room.guestStaked) {
    log(`🎯 Both players staked for room: ${roomId} - verifying on contract`);
    
    // Verify both stakes on the blockchain
    if (tournamentOwnerService && room.tournamentId) {
      try {
        const bothDeposited = await tournamentOwnerService.bothParticipantsDeposited(room.tournamentId);
        
        if (bothDeposited.success && bothDeposited.bothDeposited) {
          log(`✅ Contract confirmed both players staked for tournament: ${room.tournamentId}`);
          
          // Send competition start signal to both players
          const competitionMessage = {
            type: 'BOTH_PLAYERS_STAKED',
            roomId: roomId,
            tournamentId: room.tournamentId,
            message: 'Both players have staked successfully. Competition can begin!'
          };
          
          room.host.send(JSON.stringify(competitionMessage));
          room.guest.send(JSON.stringify(competitionMessage));
          
          room.status = 'ready_for_competition';
          log(`🚀 Competition ready for room: ${roomId}`);
        } else {
          log(`⚠️ Contract verification failed - not all players have staked`, 'WARN');
          
          // Send waiting message to the player who just staked
          ws.send(JSON.stringify({
            type: 'WAITING_FOR_OPPONENT_STAKE',
            roomId: roomId,
            message: 'Waiting for opponent to complete their stake...'
          }));
        }
      } catch (error) {
        log(`❌ Error verifying stakes on contract: ${error.message}`, 'ERROR');
      }
    } else {
      log(`⚠️ Cannot verify stakes - missing tournament service or ID`, 'WARN');
    }
  } else {
    // Send waiting message to the player who just staked
    const waitingPlayer = client.isHost ? 'guest' : 'host';
    ws.send(JSON.stringify({
      type: 'WAITING_FOR_OPPONENT_STAKE',
      roomId: roomId,
      message: `Waiting for ${waitingPlayer} to complete their stake...`
    }));
    
    log(`⏳ Waiting for ${waitingPlayer} to stake in room: ${roomId}`);
  }
}

function handleHandshakeReject(ws, data) {
  const client = clients.get(ws);
  const roomId = data.roomId;
  
  log(`❌ Host rejected handshake for room: ${roomId}`);
  
  const room = rooms.get(roomId);
  if (!room || room.host !== ws) {
    log(`❌ Invalid handshake reject from non-host client`, 'ERROR');
    return;
  }
  
  // Notify guest about handshake rejection
  if (room.guest) {
    room.guest.send(JSON.stringify({
      type: 'HANDSHAKE_REJECTED',
      roomId: roomId,
      reason: data.reason || 'Host rejected the connection'
    }));
    
    // Remove guest from room
    const guestClient = clients.get(room.guest);
    if (guestClient) {
      guestClient.roomId = null;
    }
    room.guest = null;
  }
  
  room.status = 'waiting';
  
  log(`🔄 Room ${roomId} reset to waiting state`);
}

function handlePlayerReady(ws, data) {
  const client = clients.get(ws);
  const roomId = data.roomId;
  
  log(`✅ Player ready in room: ${roomId} (${client.isHost ? 'host' : 'guest'})`);
  
  const room = rooms.get(roomId);
  if (!room) {
    log(`❌ Room not found for player ready: ${roomId}`, 'ERROR');
    return;
  }
  
  // Mark player as ready
  if (client.isHost) {
    room.hostReady = true;
  } else {
    room.guestReady = true;
  }
  
  // Check if both players are ready
  if (room.hostReady && room.guestReady) {
    log(`🎮 Both players ready, starting tournament for room: ${roomId}`);
    
    // Send tournament start notification to both players
    room.host.send(JSON.stringify({
      type: 'TOURNAMENT_START',
      roomId: roomId,
      hostData: room.hostData,
      guestData: room.guestData
    }));
    
    room.guest.send(JSON.stringify({
      type: 'TOURNAMENT_START',
      roomId: roomId,
      hostData: room.hostData,
      guestData: room.guestData
    }));
    
    room.status = 'tournament';
  }
}

async function handleAnnounceWinner(ws, data) {
  const client = clients.get(ws);
  const roomId = data.roomId;
  const winnerAddress = data.winnerAddress;
  
  log(`🏆 Winner announcement requested for room: ${roomId}, winner: ${winnerAddress}`);
  
  const room = rooms.get(roomId);
  if (!room) {
    log(`❌ Room not found for winner announcement: ${roomId}`, 'ERROR');
    return;
  }
  
  // Verify the client is a participant
  const isHost = room.host === ws;
  const isGuest = room.guest === ws;
  
  if (!isHost && !isGuest) {
    log(`❌ Non-participant trying to announce winner`, 'ERROR');
    return;
  }
  
  // Verify the winner is one of the participants
  const hostAddress = room.hostData?.hostAddress;
  const guestAddress = room.guestData?.hostAddress;
  
  if (winnerAddress.toLowerCase() !== hostAddress?.toLowerCase() && 
      winnerAddress.toLowerCase() !== guestAddress?.toLowerCase()) {
    log(`❌ Invalid winner address: ${winnerAddress}`, 'ERROR');
    return;
  }
  
  // Announce winner on blockchain
  if (tournamentOwnerService && room.tournamentId) {
    try {
      log(`🏆 Announcing winner on blockchain for tournament: ${room.tournamentId}`);
      
      const result = await tournamentOwnerService.announceWinner(room.tournamentId, winnerAddress);
      
      if (result.success && result.txHash) {
        log(`✅ Winner announced successfully with tx: ${result.txHash}`);
        
        // Send winner announcement to both players
        const winnerMessage = {
          type: 'WINNER_ANNOUNCED',
          roomId: roomId,
          tournamentId: room.tournamentId,
          winnerAddress: winnerAddress,
          txHash: result.txHash
        };
        
        room.host.send(JSON.stringify(winnerMessage));
        if (room.guest) {
          room.guest.send(JSON.stringify(winnerMessage));
        }
        
        log(`📡 Winner announcement sent to both clients for room: ${roomId}`);
      } else {
        log(`❌ Failed to announce winner: ${result.error}`, 'ERROR');
        
        // Send error to the requesting client
        ws.send(JSON.stringify({
          type: 'WINNER_ANNOUNCEMENT_FAILED',
          roomId: roomId,
          error: result.error || 'Failed to announce winner'
        }));
      }
    } catch (error) {
      log(`❌ Error announcing winner: ${error.message}`, 'ERROR');
      
      // Send error to the requesting client
      ws.send(JSON.stringify({
        type: 'WINNER_ANNOUNCEMENT_FAILED',
        roomId: roomId,
        error: error.message
      }));
    }
  } else {
    log(`⚠️ Cannot announce winner - missing service or tournament ID`, 'WARN');
    
    ws.send(JSON.stringify({
      type: 'WINNER_ANNOUNCEMENT_FAILED',
      roomId: roomId,
      error: 'Tournament service not available'
    }));
  }
}

// Health check endpoint
server.on('request', (req, res) => {
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'healthy',
      activeRooms: rooms.size,
      activeClients: clients.size,
      timestamp: new Date().toISOString()
    }));
  } else {
    res.writeHead(404);
    res.end('Not Found');
  }
});

// Start server
const PORT = process.env.PORT || 8001;
server.listen(PORT, () => {
  log(`🎯 TokenRivals Room Server running on port ${PORT}`);
  log(`📊 Health check available at http://localhost:${PORT}/health`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  log('🛑 Shutting down server...');
  wss.close(() => {
    server.close(() => {
      log('✅ Server shutdown complete');
      process.exit(0);
    });
  });
});

// Error handling
process.on('uncaughtException', (error) => {
  log(`💥 Uncaught Exception: ${error.message}`, 'ERROR');
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  log(`💥 Unhandled Rejection at: ${promise}, reason: ${reason}`, 'ERROR');
  process.exit(1);
}); 

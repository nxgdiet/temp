# TokenRivals Tournament System

A real-time cryptocurrency tournament system where players compete by betting on token price movements using their selected squad of tokens.

## Features

- **Real-time Price Tracking**: Uses Pyth Network price feeds for live cryptocurrency prices
- **WebSocket Room Management**: Separate server handles room creation, joining, and handshaking
- **60-Second Tournaments**: Live tournaments with real-time progress tracking
- **Long/Short Betting**: Players can bet on price going up (LONG) or down (SHORT)
- **Squad Building**: Players select tokens for different positions (Strikers, Midfielders, Defenders)
- **Real-time Charts**: Live progress charts showing squad value changes
- **Winner Determination**: Automatic winner calculation based on percentage changes

## How It Works

### Tournament Rules

1. **LONG Betting**: Player bets token prices will go UP
   - Score = % increase in squad value during the match
   - Higher percentage increase = better score

2. **SHORT Betting**: Player bets token prices will go DOWN
   - Score = -% decrease in squad value during the match
   - Higher percentage decrease = better score (negative becomes positive)

3. **Winner**: Player with the higher score wins

### Game Flow

1. **Squad Selection**: Players select tokens for their squad on the home screen
2. **Room Creation**: Host creates a room and gets a room code
3. **Room Joining**: Guest enters the room code to join
4. **Handshaking**: Host accepts the guest's connection
5. **Tournament Start**: 60-second live tournament begins
6. **Real-time Tracking**: Live price updates and progress charts
7. **Winner Declaration**: Automatic winner determination and results display

## Setup Instructions

### Prerequisites

- Node.js (v16 or higher)
- npm or pnpm

### 1. Install Dependencies

```bash
# Install frontend dependencies
npm install

# Install server dependencies
cd server
npm install
cd ..
```

### 2. Start the WebSocket Server

```bash
# Start the room management server
node server.js
```

The server will start on port 3001 and you'll see detailed logs like:
```
🚀 TokenRivals Room Server starting...
🎯 TokenRivals Room Server running on port 3001
📊 Health check available at http://localhost:3001/health
```

### 3. Start the Frontend

```bash
# In a new terminal, start the Next.js frontend
npm run dev
```

The frontend will start on port 3000.

### 4. Test the System

1. Open `http://localhost:3000` in your browser
2. Select tokens for your squad
3. Choose LONG or SHORT betting
4. Create a room and copy the room code
5. Open a new browser tab/window
6. Join the room using the code
7. Watch the 60-second tournament with real-time price tracking

## System Architecture

### Frontend Components

- **`app/page.tsx`**: Squad selection interface
- **`app/betting-selection/page.tsx`**: LONG/SHORT betting selection
- **`app/room-creation/page.tsx`**: Room creation with WebSocket
- **`app/room-join/page.tsx`**: Room joining interface
- **`app/competition/page.tsx`**: Live tournament with real-time charts

### Backend Services

- **`server.js`**: WebSocket server for room management
- **`lib/tournament-service.ts`**: Price fetching and tournament logic
- **`hooks/use-tournament.ts`**: Tournament state management
- **`hooks/use-room-websocket.ts`**: WebSocket connection management

### Key Features

#### Real-time Price Fetching
- Uses Pyth Network Hermes client
- Caches prices for 1 second to avoid rate limiting
- Supports all tokens in the game (BTC, ETH, SOL, etc.)

#### WebSocket Communication
- Room creation and joining
- Handshake protocol between players
- Real-time status updates
- Automatic cleanup on disconnection

#### Tournament Logic
- 60-second duration
- Real-time squad value calculation
- Percentage change tracking
- Automatic winner determination

## Logging and Debugging

### Server Logs
The WebSocket server provides detailed logs:
```
[2024-01-01T12:00:00.000Z] [INFO] 🚀 TokenRivals Room Server starting...
[2024-01-01T12:00:01.000Z] [INFO] 🔌 New client connected: abc123def456
[2024-01-01T12:00:02.000Z] [INFO] 🏠 Creating room: A1B2C3D4 for client: abc123def456
[2024-01-01T12:00:03.000Z] [INFO] ✅ Room created successfully: A1B2C3D4
```

### Frontend Logs
The frontend provides detailed tournament logs:
```
[2024-01-01T12:00:00.000Z] [INFO] [Tournament] Starting tournament...
[2024-01-01T12:00:01.000Z] [INFO] [Tournament] Initial values - Host: $1234.56, Guest: $1234.56
[2024-01-01T12:00:02.000Z] [INFO] [Tournament] Progress update - Host: $1235.67, Guest: $1233.45, Time: 58000ms
```

## Health Check

Check server status at: `http://localhost:3001/health`

Response:
```json
{
  "status": "healthy",
  "activeRooms": 2,
  "activeClients": 4,
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

## Troubleshooting

### Common Issues

1. **WebSocket Connection Failed**
   - Ensure server is running on port 3001
   - Check firewall settings
   - Verify `NEXT_PUBLIC_WS_URL` environment variable

2. **Price Fetching Errors**
   - Check internet connection
   - Verify Pyth Network API access
   - Check browser console for CORS issues

3. **Tournament Not Starting**
   - Ensure both players have joined
   - Check WebSocket connection status
   - Verify room handshake completion

### Debug Mode

Enable detailed logging by setting environment variables:
```bash
NEXT_PUBLIC_DEBUG=true
NEXT_PUBLIC_WS_URL=ws://localhost:3001
```

## Future Enhancements

- [ ] Persistent room storage
- [ ] Multiple tournament formats
- [ ] Leaderboards and rankings
- [ ] Token performance analytics
- [ ] Mobile app support
- [ ] Social features and sharing

## License

MIT License - see LICENSE file for details. 
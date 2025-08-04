# TokenRivals WebSocket Server - Docker Setup

This directory contains Docker configuration to run the TokenRivals WebSocket server.

## Quick Start

### Using Docker Compose (Recommended)

1. **Update Environment Variables**
   Edit the `docker-compose.yml` file and replace the placeholder values:
   ```yaml
   environment:
     - OWNER_PRIVATE_KEY=your_actual_private_key_here
     - NEXT_PUBLIC_REOWN_PROJECT_ID=your_actual_project_id_here
   ```

2. **Build and Run**
   ```bash
   docker-compose up --build
   ```

3. **Run in Background**
   ```bash
   docker-compose up -d --build
   ```

### Using Docker Directly

1. **Build the Image**
   ```bash
   docker build -t tokenrivals-server .
   ```

2. **Run the Container**
   ```bash
   docker run -p 8001:8001 \
     -e OWNER_PRIVATE_KEY=your_private_key \
     -e NEXT_PUBLIC_CONTRACT_ADDRESS=0x26d215752f68bc2254186f9f6ff068b8c4bdfd37 \
     -e NEXT_PUBLIC_RPC_URL=https://node.ghostnet.etherlink.com \
     -e NEXT_PUBLIC_CHAIN_ID=128123 \
     -e NEXT_PUBLIC_WS_URL=ws://localhost:8001 \
     tokenrivals-server
   ```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `8001` |
| `OWNER_PRIVATE_KEY` | Blockchain owner private key | Required |
| `NEXT_PUBLIC_CONTRACT_ADDRESS` | Smart contract address | `0x26d215752f68bc2254186f9f6ff068b8c4bdfd37` |
| `NEXT_PUBLIC_RPC_URL` | Blockchain RPC URL | `https://node.ghostnet.etherlink.com` |
| `NEXT_PUBLIC_CHAIN_ID` | Blockchain chain ID | `128123` |
| `NEXT_PUBLIC_WS_URL` | WebSocket URL for clients | `ws://localhost:8001` |
| `NEXT_PUBLIC_REOWN_PROJECT_ID` | Reown project ID | Required |

## Health Check

The server includes a health check endpoint at `http://localhost:8001/health` that returns:
```json
{
  "status": "healthy",
  "activeRooms": 0,
  "activeClients": 0,
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## Logs

View server logs:
```bash
# With docker-compose
docker-compose logs -f

# With docker
docker logs -f <container_id>
```

## Stopping the Server

```bash
# With docker-compose
docker-compose down

# With docker
docker stop <container_id>
```

## Troubleshooting

1. **Port Already in Use**: Change the port mapping in `docker-compose.yml` or stop the existing service
2. **Environment Variables**: Ensure all required environment variables are set
3. **Blockchain Connection**: Verify the RPC URL and contract address are correct
4. **Private Key**: Make sure the owner private key has sufficient permissions

## Development

For development with hot reloading:
```bash
docker-compose -f docker-compose.dev.yml up
```

Note: You'll need to create a `docker-compose.dev.yml` file with volume mounts for development. 
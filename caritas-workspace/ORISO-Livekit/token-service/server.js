const express = require('express');
const cors = require('cors');
const { AccessToken } = require('livekit-server-sdk');

const app = express();
const PORT = 3010;

// LiveKit credentials
const LIVEKIT_API_KEY = 'APIm7qGJ8kR3fN2pL5tX';
const LIVEKIT_API_SECRET = 'secretW9vY4bH6nK8mP2qR7sT3xZ5A1B2C3D4E5F6G7H8';

app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', service: 'livekit-token-service' });
});

// Generate LiveKit token (GET with query params)
app.get('/api/livekit/token', async (req, res) => {
    try {
        const { roomName, identity } = req.query;

        if (!roomName || !identity) {
            return res.status(400).json({ error: 'roomName and identity are required' });
        }

        console.log(`Generating token for user: ${identity}, room: ${roomName}`);

        // Create access token
        const at = new AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET, {
            identity: identity,
            name: identity,
        });

        // Add grant for the room
        at.addGrant({
            room: roomName,
            roomJoin: true,
            canPublish: true,
            canSubscribe: true,
        });

        const token = await at.toJwt();

        console.log(`✅ Token generated for ${identity}: ${token.substring(0, 20)}...`);

        res.json({ token });
    } catch (error) {
        console.error('Error generating token:', error);
        res.status(500).json({ error: 'Failed to generate token', details: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 LiveKit Token Service running on port ${PORT}`);
    console.log(`   API Key: ${LIVEKIT_API_KEY}`);
    console.log(`   Endpoint: http://localhost:${PORT}/api/livekit/token`);
});


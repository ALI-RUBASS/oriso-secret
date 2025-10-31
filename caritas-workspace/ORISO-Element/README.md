# ORISO-Element

## Overview
Element.io Matrix web client for the ORISO platform. Provides a modern, secure chat interface using the Matrix protocol.

## Access
- **URL:** http://91.99.219.182:8087
- **Protocol:** Matrix
- **Port:** 8087

## Features
- 🔒 End-to-end encryption
- 💬 Real-time messaging
- 📞 Voice/Video calls (WebRTC)
- 🌐 Federation support
- 📱 Cross-platform sync

## Service Management

### Check Status
```bash
sudo systemctl status element-io.service
```

### Start/Stop/Restart
```bash
sudo systemctl start element-io.service
sudo systemctl stop element-io.service
sudo systemctl restart element-io.service
```

### View Logs
```bash
tail -f /home/caritas/Desktop/online-beratung/caritas-workspace/ORISO-Element/server.log
```

## Configuration

### Main Config: `config.json`
```json
{
  "default_server_name": "matrix.org",
  "default_theme": "dark",
  "brand": "Element",
  "features": {
    "feature_video_rooms": true,
    "feature_element_call": true
  }
}
```

### Matrix Integration
Element connects to Matrix Synapse server:
- **Homeserver:** http://91.99.219.182:8008
- **Protocol:** Matrix Client-Server API

## Deployment

### Current Setup (Systemd Service)
```bash
# Service runs Python SimpleHTTPServer
python3 -m http.server 8087
```

### Update Service Path
```bash
sudo nano /etc/systemd/system/element-io.service
# Change WorkingDirectory to:
# /home/caritas/Desktop/online-beratung/caritas-workspace/ORISO-Element

sudo systemctl daemon-reload
sudo systemctl restart element-io.service
```

## Files Structure
```
ORISO-Element/
├── index.html              # Main Element application
├── config.json             # Configuration
├── config.sample.json      # Sample configuration
├── bundles/                # JavaScript bundles
├── themes/                 # Element themes
├── img/                    # Images and icons
└── README.md               # This file
```

## Integration with ORISO

### Frontend Integration
The ORISO-Frontend uses Matrix SDK to:
- Register users on Matrix
- Create Matrix rooms
- Handle call events
- Sync messages

See: `ORISO-Frontend/src/services/matrixClientService.ts`

### Backend Integration
UserService manages Matrix accounts:
- Creates Matrix users
- Stores Matrix credentials
- Manages room membership

## Troubleshooting

### Element not loading
```bash
# Check if service is running
sudo systemctl status element-io.service

# Check port
netstat -tlnp | grep 8087

# Check logs
tail -50 /home/caritas/Desktop/online-beratung/caritas-workspace/ORISO-Element/server.log
```

### Can't connect to Matrix
- Check Matrix Synapse is running on port 8008
- Verify homeserver URL in config.json
- Check CORS settings in Matrix Synapse

### Video calls not working
- Ensure TURN server is configured
- Check WebRTC connectivity
- Verify STUN server access

## URLs

- **Element UI:** http://91.99.219.182:8087
- **Matrix Synapse:** http://91.99.219.182:8008
- **Matrix Admin:** http://91.99.219.182:8008/_synapse/admin

## Security

- Element runs over HTTP (use Nginx for HTTPS)
- End-to-end encryption handled by Matrix
- Credentials stored in browser localStorage
- Regular updates recommended

## Updates

To update Element:
```bash
# Download latest release
wget https://github.com/vector-im/element-web/releases/latest/download/element-v*.tar.gz

# Extract and replace files
tar -xzf element-v*.tar.gz
cp -r element-v*/* /home/caritas/Desktop/online-beratung/caritas-workspace/ORISO-Element/

# Restart service
sudo systemctl restart element-io.service
```

---

**Status:** Production Ready ✅  
**Access:** http://91.99.219.182:8087  
**Service:** element-io.service

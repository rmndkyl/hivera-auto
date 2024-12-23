# 🚀 HIVERA Auto Mining Bot

A powerful automated mining bot for Hivera - the decentralized network powered by TON Blockchain. Contribute to global AI innovation while earning rewards!

[![Register Now](https://img.shields.io/badge/Register-Hivera-blue)](https://t.me/Hiverabot/app?startapp=2597c1372)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

## ✨ Key Features

- 🔄 **Smart Auto Mining**: Automatically mines Hivera tokens with optimized strategies
- 👥 **Multi-Account Support**: Run multiple accounts simultaneously
- 🌐 **Proxy Integration**: Supports HTTP/HTTPS proxies for better stability
- 📊 **Live Monitoring**: Real-time balance and mining status updates
- ⚡ **High Performance**: Optimized for maximum mining efficiency
- 🛡️ **Reliable**: Built-in error handling and recovery mechanisms

## 🚀 Quick Start

### Prerequisites
- Node.js (Latest LTS version)
- npm package manager
- Hivera Account ([Register Here](https://t.me/Hiverabot/app?startapp=2597c1372))

### Installation
1. Clone and install dependencies:
   ```bash
   git clone https://github.com/rmndkyl/hivera-auto.git
   cd hivera-auto
   npm install
   ```

2. Get your Hivera JWT:
   - Open [Hivera Bot](https://t.me/Hiverabot/app?startapp=2597c1372)
   - Press F12 for Developer Tools
   - Navigate to Application > Local Storage
   - Copy your Hivera_jwt token

3. Configure your setup:
   - Place JWT token(s) in `users.txt` (one per line)
   - Add proxies in `proxies.txt` (format: http://user:pass@ip:port)
   - Adjust `config.json` settings:
     ```json
     {
       "minPower": 1000,
       "useProxy": true,
       "maxThreads": 5,
       "timeSleep": 5
     }
     ```

### Start Mining
```bash
npm run start
```

## 💡 Tips for Best Performance

- Use reliable proxies
- Monitor power levels
- Keep JWT tokens secure
- Ensure stable internet connection

## 🔗 Links

- [Register Hivera Account](https://t.me/Hiverabot/app?startapp=2597c1372)

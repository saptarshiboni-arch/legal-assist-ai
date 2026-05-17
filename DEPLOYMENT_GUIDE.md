# LexAI - Production Deployment Guide 🚀

This document provides a comprehensive, production-ready blueprint for deploying **LexAI**, your integrated **MERN Stack + FastAPI Python** legal contract analyzer application. 

Since your project is designed to run in development with a single terminal command (`npm start` via `concurrently`), this guide offers two main strategies:
1. **Option A: The All-in-One Cloud VPS (DigitalOcean/AWS EC2)** — *Recommended for keeping hosting simple, matching the single-terminal workflow using production-grade tools like PM2, and running everything on a single virtual server.*
2. **Option B: Modern Managed Microservices (Vercel + Render + MongoDB Atlas)** — *Recommended for zero-maintenance hosting, high scalability, and taking advantage of free tiers for frontends and databases.*

---

## 📊 Deployment Architecture Overview

```mermaid
graph TD
    subgraph Client-Side (Browser)
        ReactApp["Vite + React Client<br>(Port 5173 / CDN)"]
    end

    subgraph Server-Side / VPS
        Nginx["Nginx Reverse Proxy<br>(Port 80/443 SSL)"]
        NodeServer["Express.js Server<br>(Port 5000)"]
        FastAPIServer["FastAPI Python Server<br>(Port 8000)"]
        MongoDB[("MongoDB Database<br>(Local or Atlas)")]
    end

    ReactApp -->|HTTPS / WSS| Nginx
    Nginx -->|Proxy Pass /api| NodeServer
    Nginx -->|Proxy Pass /upload, /chat| FastAPIServer
    NodeServer -->|Mongoose| MongoDB
    FastAPIServer -->|Groq SDK| GroqAI["Groq Cloud AI API"]
```

---

## 🛠️ Code Adjustments for Production (Highly Recommended)

Before deploying, make these small, dynamic adjustments to your codebase so that it works seamlessly on both `localhost` and your production server without manual code swaps.

### 1. Serve Vite React directly from the Express Backend (Option A Optimization)
Instead of running a separate React dev server in production, you can build your React code into static files and let Express serve them. This eliminates CORS issues and runs the whole MERN stack under a single port (**5000**)!

Update [mern-auth/server/server.js](file:///c:/Users/AMD/Desktop/sagnik/mern-auth/server/server.js) to include the static serving middleware right above the error/listener blocks:

```javascript
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Serve static assets in production
if (process.env.NODE_ENV === 'production') {
  // Set static folder (Vite outputs to client/dist)
  app.use(express.static(path.join(__dirname, '../client/dist')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../client', 'dist', 'index.html'));
  });
}
```

### 2. Make the FastAPI Base URL Dynamic
In [mern-auth/client/src/pages/LegalTech.jsx](file:///c:/Users/AMD/Desktop/sagnik/mern-auth/client/src/pages/LegalTech.jsx), update the `LEGAL_TECH_API` constant to read from Vite's environment variables with a localhost fallback:

```javascript
// Dynamic API URL for production and development
const LEGAL_TECH_API = import.meta.env.VITE_LEGAL_TECH_API_URL || "http://localhost:8000";
```

### 3. Dynamic CORS Configuration in FastAPI
In [legal_tech_actual/main.py](file:///c:/Users/AMD/Desktop/sagnik/legal_tech_actual/main.py), configure allowed origins dynamically to include your production frontend:

```python
# Fetch allowed origins from environment variable, falling back to local configurations
allowed_origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173,http://localhost:5174,http://localhost:5175,http://localhost:3000").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

---

## ⚡ Option A: The All-in-One Cloud VPS (DigitalOcean, AWS, Linode)

This method lets you deploy the entire stack on a single Virtual Private Server (VPS) running Ubuntu. It is highly cost-effective and mirrors your "one-terminal" local start using a process manager called **PM2**.

> [!NOTE]
> PM2 is a production process manager for Node.js and Python. It runs your servers in the background, restarts them automatically if they crash, and monitors CPU/Memory usage.

### Step 1: Server Setup
1. Spin up an **Ubuntu 22.04 LTS** VPS on DigitalOcean or AWS (1GB or 2GB RAM is perfect).
2. Connect to your VPS via SSH:
   ```bash
   ssh root@your_server_ip
   ```
3. Update packages and install Node.js (v18+), Python (3.10+), and MongoDB:
   ```bash
   # Update Ubuntu
   sudo apt update && sudo apt upgrade -y

   # Install Node.js (via NodeSource)
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt install -y nodejs

   # Install Python & Pip
   sudo apt install -y python3-pip python3-venv python3-dev

   # Install Nginx (Web Server / Reverse Proxy)
   sudo apt install -y nginx

   # Install Git
   sudo apt install -y git
   ```

### Step 2: Install MongoDB (If hosting DB on same VPS)
If you aren't using a cloud database like MongoDB Atlas, install MongoDB locally:
```bash
sudo apt install -y mongodb
sudo systemctl start mongodb
sudo systemctl enable mongodb
```

### Step 3: Clone Project & Install Dependencies
1. Clone your Git repository onto the server:
   ```bash
   cd /var/www
   git clone https://github.com/saptarshiboni-arch/legal-assist-ai.git lexai
   cd lexai
   ```

2. **Root Controllers**:
   ```bash
   npm install --production
   ```

3. **MERN Backend**:
   ```bash
   cd mern-auth/server
   npm install --production
   ```

4. **MERN Frontend** (Build Static Files):
   ```bash
   cd ../client
   npm install
   # Create a production build of the Vite React app
   npm run build
   ```

5. **FastAPI Python Backend**:
   ```bash
   cd ../../legal_tech_actual
   python3 -m venv venv
   source venv/bin/activate
   pip3 install -r requirements.txt
   deactivate
   ```

### Step 4: Configure Production Environments
Create `.env` files in each service directory using the production values:

**`mern-auth/server/.env`**:
```ini
MONGODB_URI=mongodb://localhost:27017/lexai
JWT_SECRET=super_secret_production_jwt_key
REFRESH_SECRET=super_secret_production_refresh_key
PORT=5000
NODE_ENV=production
CLIENT_URL=https://yourdomain.com
SENDER_EMAIL=your_verified_sender_email@gmail.com
SENDER_PASSWORD=your_gmail_app_password
```

**`legal_tech_actual/.env`**:
```ini
GROQ_API_KEY=your_live_groq_api_key
ALLOWED_ORIGINS=https://yourdomain.com
```

---

### Step 5: Configure PM2 to Manage All Processes (Your Production "npm start")
Instead of using `concurrently` in production, we will configure a PM2 process file to start all services, manage logging, and run them as daemons.

Create a file named `ecosystem.config.json` in your root directory:

```json
{
  "apps": [
    {
      "name": "lexai-node-backend",
      "script": "server.js",
      "cwd": "/var/www/lexai/mern-auth/server",
      "env": {
        "NODE_ENV": "production",
        "PORT": 5000
      },
      "instances": 1,
      "autorestart": true,
      "watch": false,
      "max_memory_restart": "300M"
    },
    {
      "name": "lexai-fastapi-backend",
      "script": "/var/www/lexai/legal_tech_actual/venv/bin/uvicorn",
      "args": "main:app --host 127.0.0.1 --port 8000",
      "cwd": "/var/www/lexai/legal_tech_actual",
      "interpreter": "none",
      "autorestart": true,
      "watch": false,
      "max_memory_restart": "400M"
    }
  ]
}
```

#### Starting the PM2 Daemon:
Install PM2 globally and launch the ecosystem:
```bash
sudo npm install -y pm2 -g
cd /var/www/lexai

# Start both Node and FastAPI backends
pm2 start ecosystem.config.json

# Save process list to start automatically on system reboots
pm2 save
pm2 startup
```

> [!TIP]
> PM2 is a powerhouse! Use these commands to inspect and monitor your production app:
> * `pm2 status` — Shows a table of running backend processes.
> * `pm2 logs` — Shows real-time server printouts and debug streams.
> * `pm2 restart all` — Restarts both Python and Node servers instantly.
> * `pm2 monit` — Opens an interactive console graphing memory and CPU load.

---

### Step 6: Configure Nginx Reverse Proxy & SSL
Configure Nginx to route all traffic to the correct ports and secure the server with Let's Encrypt SSL.

1. Open a new Nginx server configuration:
   ```bash
   sudo nano /etc/nginx/sites-available/lexai
   ```

2. Add this configuration (replaces CORS issues and routes traffic securely):
   ```nginx
   server {
       listen 80;
       server_name yourdomain.com www.yourdomain.com;

       # Express Backend (and built Vite React Frontend via Option A.1)
       location / {
           proxy_pass http://127.0.0.1:5000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }

       # FastAPI Python Backend
       location /api-python/ {
           # Rewrite path from /api-python/upload to /upload for FastAPI
           rewrite ^/api-python/(.*)$ /$1 break;
           proxy_pass http://127.0.0.1:8000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
       }
   }
   ```

3. Enable the config and restart Nginx:
   ```bash
   sudo ln -s /etc/nginx/sites-available/lexai /etc/nginx/sites-enabled/
   sudo rm /etc/nginx/sites-enabled/default
   sudo nginx -t
   sudo systemctl restart nginx
   ```

4. **Add Free SSL Certificate (HTTPS)**:
   ```bash
   sudo apt install certbot python3-certbot-nginx -y
   sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
   ```

---

## ☁️ Option B: Distributed Cloud Microservices (Vercel + Render / Railway)

This method hosts each component on optimized cloud platforms. It is highly redundant, handles building automatically, and requires zero virtual machine configuration.

| Component | Platform | Plan | Key Benefit |
| :--- | :--- | :--- | :--- |
| **MongoDB Database** | [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) | Shared Free Tier | 512MB managed database, automatic cloud backups. |
| **Vite React Frontend** | [Vercel](https://vercel.com/) or [Netlify](https://www.netlify.com/) | Hobby Free Tier | Lightning-fast static delivery via Global Edge CDN. |
| **Express Backend** | [Render](https://render.com/) or [Railway](https://railway.app/) | Individual Tier | Easy Git integration, automatic Node environment deployments. |
| **FastAPI Backend** | [Render](https://render.com/) or [Railway](https://railway.app/) | Individual Tier | Python package handling, fast upload/processing pipelines. |

### Step 1: Create a MongoDB Atlas Database
1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) and register a free account.
2. Build a Database using the **M0 Shared Free Tier**.
3. Create a database user credentials (username & password).
4. Go to **Network Access** and whitelist IP `0.0.0.0/0` (allowing cloud servers to connect securely).
5. Copy your connection string: `mongodb+srv://<username>:<password>@cluster0.xxx.mongodb.net/lexai?retryWrites=true&w=majority`

### Step 2: Deploy FastAPI Python Backend to Render/Railway
1. Register on [Render](https://render.com/).
2. Click **New +** and choose **Web Service**.
3. Connect your GitHub repository.
4. Set up configuration:
   * **Name**: `lexai-python-api`
   * **Runtime**: `Python`
   * **Root Directory**: `legal_tech_actual`
   * **Build Command**: `pip install -r requirements.txt`
   * **Start Command**: `uvicorn main:app --host 0.0.0.0 --port 10000`
5. Go to the **Environment** tab and add:
   * `GROQ_API_KEY` = `your_actual_groq_api_key`
6. Deploy! Render will give you a public URL (e.g., `https://lexai-python-api.onrender.com`).

### Step 3: Deploy Express.js Node Backend to Render/Railway
1. Click **New +** -> **Web Service** on Render.
2. Select your same GitHub repository.
3. Configure the settings:
   * **Name**: `lexai-node-api`
   * **Runtime**: `Node`
   * **Root Directory**: `mern-auth/server`
   * **Build Command**: `npm install`
   * **Start Command**: `node server.js`
4. Add your **Environment Variables** in Render's dashboard:
   * `MONGODB_URI` = `mongodb+srv://...` (your Atlas Connection String)
   * `JWT_SECRET` = `your_production_secret`
   * `REFRESH_SECRET` = `your_production_secret`
   * `CLIENT_URL` = `https://your-frontend-domain.vercel.app`
   * `PORT` = `10000` (Render binds automatically)
   * `SENDER_EMAIL` = `your_verified_sender_email@gmail.com`
   * `SENDER_PASSWORD` = `your_app_password`
5. Deploy! Get your backend API URL (e.g., `https://lexai-node-api.onrender.com`).

### Step 4: Deploy Vite React Frontend to Vercel
1. Log in to [Vercel](https://vercel.com/) with your GitHub account.
2. Click **Add New** -> **Project**.
3. Select your repository.
4. Configure Project settings:
   * **Framework Preset**: `Vite`
   * **Root Directory**: `mern-auth/client`
   * **Build Command**: `npm run build`
   * **Output Directory**: `dist`
5. Add **Environment Variables**:
   * `VITE_BACKEND_URL` = `https://lexai-node-api.onrender.com` (Express URL from Step 3)
   * `VITE_LEGAL_TECH_API_URL` = `https://lexai-python-api.onrender.com` (FastAPI URL from Step 2)
6. Click **Deploy**. Your React interface is now live with global HTTPS!

---

## 🔒 Production Readiness Checklist

Before going public, verify that all security features are turned on:

- [ ] **HTTPS Enforced**: All requests are routed through SSL certificates.
- [ ] **MongoDB Secure Access**: MongoDB credentials are hidden inside server environment variables.
- [ ] **Groq API Key Isolation**: The Groq API key is completely isolated to the Python backend `.env` and never exposed to the frontend console/network requests.
- [ ] **Nodemon Deactivated**: Nodemon is disabled in production to optimize performance.
- [ ] **FastAPI Hot-Reload Off**: FastAPI is run without the `--reload` flag.
- [ ] **CORS Restrictions**: `allowed_origins` and `CLIENT_URL` match your exact domain names, preventing unauthorized cross-origin requests.

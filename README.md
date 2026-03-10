# own's hub - Premium Adult Video Streaming

A premium adult video streaming website with a dark, seductive design inspired by ownshub.com.

## Features
- 🎥 Video streaming with modal player
- 🔴 Live video indicators
- 📱 Responsive design
- 🎨 Dark theme with red accents
- 🔍 Search and filtering
- 📂 Category organization

## How to Run

### Option 1: Local File (Limited)
Simply open `index.html` in your browser. Note: Some video embedding may be restricted.

### Option 2: Local Server (Recommended)
For full functionality with video embedding, run a local HTTP server:

#### Using Python:
```bash
cd path/to/website
python -m http.server 8000
```
Then open: `http://localhost:8000`

#### Using Node.js:
```bash
npm install -g http-server
cd path/to/website
http-server
```
Then open: `http://localhost:8080`

#### Using PHP:
```bash
cd path/to/website
php -S localhost:8000
```
Then open: `http://localhost:8000`

## Backend Setup

To enable all features, you must run the backend server:

1. Open a terminal and navigate to the backend folder:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the backend server:
   ```bash
   npm start
   ```
   The backend will run at http://localhost:3001

If you want others to access your backend, deploy it to a public service (like Render, Heroku, or Vercel) and update the frontend code to use the deployed backend URL instead of http://localhost:3001.

## Technologies Used
- HTML5
- CSS3 (Custom Properties, Flexbox, Grid)
- JavaScript (ES6+)
- Vimeo API for video embedding

# gitgitownshub
git git hurray!

# ownshub-backend (Node.js + Express + SQLite)

## Setup
1. Open a terminal in the backend folder:
   cd backend
2. Install dependencies:
   npm install
3. Start the server:
   npm start

The backend will run at http://localhost:3001

## API Endpoints
- POST /api/signup      { username, password } → { token, username }
- POST /api/login       { username, password } → { token, username }
- POST /api/comments    { videoId, text } (JWT required) → comment object
- GET  /api/comments/:videoId → [ comment objects ]

## How to connect from frontend
- Use fetch() to call these endpoints from your HTML/JS.
- Store the JWT token in localStorage after login/signup.
- Send the token in the Authorization header as: Bearer <token>

## Example fetch for posting a comment:

fetch('http://localhost:3001/api/comments', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + localStorage.getItem('token')
  },
  body: JSON.stringify({ videoId: 1, text: 'Nice video!' })
})
.then(res => res.json())
.then(console.log)

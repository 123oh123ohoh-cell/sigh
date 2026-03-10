
// OwnsHub Real-Time Chat Client
// Assumes user is logged in and localStorage has 'loggedInUser' and 'token'

const socket = io('https://ownshub.onrender.com', { transports: ['websocket'] });
const myUsername = localStorage.getItem('loggedInUser');
const token = localStorage.getItem('token');

// Parse ?user=username from URL
function getQueryParam(name) {
  const url = new URL(window.location.href);
  return url.searchParams.get(name);
}

let currentChatUser = null;

// Join your own room for private messages
if (myUsername) socket.emit('join', myUsername);



let allUsers = [];
let onlineUsers = new Set();
let userSearch = '';



function renderUserList() {
  const userList = document.getElementById('userList');
  userList.innerHTML = '';
  let filtered = allUsers.filter(u => u !== myUsername);
  if (userSearch.startsWith('@')) {
    const searchTerm = userSearch.slice(1).toLowerCase();
    filtered = filtered.filter(u => u.toLowerCase().includes(searchTerm));
  } else if (userSearch.length === 0) {
    // Show all users if nothing is typed
    // (or you can limit to recent chats if you want)
  } else {
    filtered = [];
  }
  filtered.forEach(u => {
    const li = document.createElement('li');
    // Avatar using DiceBear
    const avatar = document.createElement('img');
    avatar.src = `https://api.dicebear.com/7.x/thumbs/svg?seed=${encodeURIComponent(u)}`;
    avatar.alt = u + ' avatar';
    avatar.className = 'avatar';
    li.appendChild(avatar);
    // Online dot
    const dot = document.createElement('span');
    dot.style.display = 'inline-block';
    dot.style.width = '10px';
    dot.style.height = '10px';
    dot.style.borderRadius = '50%';
    dot.style.marginRight = '6px';
    dot.style.background = onlineUsers.has(u) ? '#4caf50' : '#888';
    li.appendChild(dot);
    // Username
    const nameSpan = document.createElement('span');
    nameSpan.textContent = u;
    li.appendChild(nameSpan);
    li.onclick = () => selectUser(u, li);
    userList.appendChild(li);
  });
}

// Real-time search
document.addEventListener('DOMContentLoaded', function() {
  const searchInput = document.getElementById('userSearchInput');
  if (searchInput) {
    searchInput.addEventListener('input', function() {
      userSearch = searchInput.value;
      renderUserList();
    });
  }
});



fetch('https://ownshub.onrender.com/api/users')
  .then(res => res.json())
  .then(users => {
    allUsers = users;
    renderUserList();
    // Auto-select user if ?user=username is present
    const preselectUser = getQueryParam('user');
    if (preselectUser && allUsers.includes(preselectUser) && preselectUser !== myUsername) {
      // Always show the user in the list and select them, even if search is active
      userSearch = '';
      renderUserList();
      function trySelect() {
        const userList = document.getElementById('userList');
        const lis = Array.from(userList.children);
        const li = lis.find(li => li.textContent.trim().toLowerCase() === preselectUser.toLowerCase());
        if (li) {
          selectUser(preselectUser, li);
          li.scrollIntoView({ block: 'center' });
          setTimeout(() => {
            const input = document.getElementById('chatInput');
            if (input) input.focus();
          }, 100);
        } else {
          setTimeout(trySelect, 50);
        }
      }
      trySelect();
    }
  });

// Listen for online users from Socket.io
socket.on('online_users', function(list) {
  onlineUsers = new Set(list);
  renderUserList();
});
socket.emit('get_online_users');

function selectUser(username, liElem) {
  currentChatUser = username;
  document.getElementById('chatHeader').textContent = username;
  // Highlight selected user
  document.querySelectorAll('.user-list li').forEach(li => li.classList.remove('active'));
  liElem.classList.add('active');
  // Show chat input, hide welcome
  if (window.showChatInput) window.showChatInput();
  // Clear messages area
  document.getElementById('messagesArea').innerHTML = '';
  // Fetch chat history
  fetch(`https://ownshub.onrender.com/api/messages?user=${encodeURIComponent(username)}`, {
    headers: { 'Authorization': 'Bearer ' + token }
  })
    .then(res => res.json())
    .then(messages => {
      if (messages.length === 0) {
        document.getElementById('messagesArea').innerHTML = '<div style="color:var(--text-gray);text-align:center;margin-top:40px;">No messages yet. Say hi!</div>';
      } else {
        messages.forEach(msg => appendMessage(msg, msg.sender === myUsername));
        scrollMessagesToBottom();
      }
    });
}


// Send message
function sendMessage() {
  const input = document.getElementById('chatInput');
  const content = input.value.trim();
  if (!content || !currentChatUser) return;
  const msg = {
    sender: myUsername,
    receiver: currentChatUser,
    content,
    timestamp: new Date().toISOString()
  };
  socket.emit('private_message', msg);
  appendMessage(msg, true);
  input.value = '';
  scrollMessagesToBottom();
}

// If no user selected, show welcome
if (!currentChatUser && window.showChatWelcome) window.showChatWelcome();

document.getElementById('sendBtn').onclick = sendMessage;
document.getElementById('chatInput').addEventListener('keydown', function(e) {
  if (e.key === 'Enter') sendMessage();
});

// Receive real-time message
socket.on('private_message', function(msg) {
  if (msg.sender === currentChatUser || (msg.sender === myUsername && msg.receiver === currentChatUser)) {
    appendMessage(msg, msg.sender === myUsername);
    scrollMessagesToBottom();
  }
});

function appendMessage(msg, isMine) {
  const div = document.createElement('div');
  div.className = 'message' + (isMine ? ' me' : '');
  div.innerHTML = `<div class="bubble">${msg.content}</div><div class="meta">${isMine ? 'You' : msg.sender} • ${new Date(msg.timestamp).toLocaleTimeString()}</div>`;
  document.getElementById('messagesArea').appendChild(div);
}

function scrollMessagesToBottom() {
  const area = document.getElementById('messagesArea');
  area.scrollTop = area.scrollHeight;
}

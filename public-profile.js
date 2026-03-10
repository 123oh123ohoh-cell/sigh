// Parse ?user=username from URL
function getQueryParam(name) {
    const url = new URL(window.location.href);
    return url.searchParams.get(name);
}

const username = getQueryParam('user');
const loggedInUser = localStorage.getItem('loggedInUser');
const token = localStorage.getItem('token');

const profileTitle = document.getElementById('profileTitle');
const infoDiv = document.getElementById('publicProfileInfo');
const editBtnDiv = document.getElementById('editProfileBtnContainer');

if (!username) {
    infoDiv.innerHTML = '<p>No user specified.</p>';
} else {
    profileTitle.textContent = `@${username}`;
    fetch(`http://localhost:3001/api/profile?user=${encodeURIComponent(username)}`)
        .then(res => res.json())
        .then(data => {
            // If no profile, show default
            if (!data || Object.keys(data).length === 0) {
                data = {
                    displayName: username,
                    pronouns: '',
                    customPronouns: '',
                    bio: '',
                    avatar: ''
                };
            }
            let pronouns = data.pronouns === 'custom' ? data.customPronouns : data.pronouns;
            // Default avatar SVG (circle with user icon)
            const defaultAvatar = `<svg width="110" height="110" viewBox="0 0 110 110" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="55" cy="55" r="54" fill="#e0e0e0" stroke="#fff" stroke-width="2"/><ellipse cx="55" cy="46" rx="26" ry="26" fill="#bdbdbd"/><ellipse cx="55" cy="85" rx="36" ry="20" fill="#bdbdbd"/></svg>`;
            infoDiv.innerHTML = `
                <div class="public-profile-summary">
                    ${data.avatar ? `<img class='public-profile-avatar' src='${data.avatar}' alt='Avatar'>` : defaultAvatar}
                    <div class="public-profile-info">
                        <div style="font-size:1.5em;font-weight:bold;">${data.displayName || username}</div>
                        <div style="font-size:1.08em;color:#bbb;margin-top:2px;">${pronouns ? pronouns : '<span style=\'opacity:0.7;\'>No pronouns set</span>'}</div>
                    </div>
                    <div class="public-profile-bio">${data.bio ? data.bio : '<span style=\'opacity:0.7;\'>No bio yet</span>'}</div>
                </div>
            `;
            // Show edit button if viewing own profile
            if (loggedInUser && loggedInUser === username) {
                editBtnDiv.innerHTML = '<a href="profile.html" class="btn" style="background:linear-gradient(90deg,#ffb347 0%,#ffcc80 100%);color:#181818;padding:10px 24px;border-radius:6px;font-weight:700;text-decoration:none;">Edit Profile</a>';
            }
        })
        .catch(() => {
            // On error, show default profile
            const defaultAvatar = `<svg width="110" height="110" viewBox="0 0 110 110" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="55" cy="55" r="54" fill="#e0e0e0" stroke="#fff" stroke-width="2"/><ellipse cx="55" cy="46" rx="26" ry="26" fill="#bdbdbd"/><ellipse cx="55" cy="85" rx="36" ry="20" fill="#bdbdbd"/></svg>`;
            infoDiv.innerHTML = `
                <div class="public-profile-summary">
                    ${defaultAvatar}
                    <div class="public-profile-info">
                        <div style="font-size:1.5em;font-weight:bold;">${username}</div>
                        <div style="font-size:1.08em;color:#bbb;margin-top:2px;"><span style='opacity:0.7;'>No pronouns set</span></div>
                    </div>
                    <div class="public-profile-bio"><span style='opacity:0.7;'>No bio yet</span></div>
                </div>
            `;
            if (loggedInUser && loggedInUser === username) {
                editBtnDiv.innerHTML = '<a href="profile.html" class="btn">Edit Profile</a>';
            }
        });
}

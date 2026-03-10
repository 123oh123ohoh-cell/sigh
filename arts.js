// --- Arts Section Logic ---

function renderArtsGallery(arts) {
    const gallery = document.getElementById('artsGallery');
    if (!gallery) return;
    if (!arts.length) {
        gallery.innerHTML = '<p style="color:#bbb;text-align:center;">No art posted yet.</p>';
        return;
    }
    const loggedInUser = localStorage.getItem('loggedInUser');
    gallery.innerHTML = '<div style="display:flex;flex-wrap:wrap;gap:24px;justify-content:center;">' +
        arts.map(art => {
            let deleteBtn = '';
            if (loggedInUser && loggedInUser === art.username) {
                deleteBtn = `<button class="delete-art-btn" data-artid="${art.id}" style="background:#ff4d4d;color:#fff;padding:6px 18px;border:none;border-radius:6px;font-weight:700;cursor:pointer;margin-top:10px;">Delete</button>`;
            }
            return `
            <div class="arts-card" style="background:#222;border-radius:12px;padding:16px;width:220px;box-shadow:0 2px 12px rgba(0,0,0,0.12);display:flex;flex-direction:column;align-items:center;">
                <a href="art-view.html?id=${art.id}" style="display:block;"><img src="${art.image}" alt="Art" style="width:180px;height:180px;object-fit:cover;border-radius:8px;background:#333;cursor:pointer;"></a>
                <div style="margin-top:10px;font-weight:bold;color:#ffb347;">${art.title}</div>
                <div style="font-size:0.98em;color:#bbb;margin:4px 0 6px 0;">by <a href="public-profile.html?user=${encodeURIComponent(art.username)}" style="color:#ffb347;">@${art.username}</a></div>
                <div style="font-size:0.97em;color:#eee;min-height:32px;text-align:center;">${art.description || ''}</div>
                <div style="font-size:0.85em;color:#888;margin-top:6px;">${art.date}</div>
                ${deleteBtn}
            </div>
            `;
        }).join('') + '</div>';
    // Add delete button event listeners
    document.querySelectorAll('.delete-art-btn').forEach(btn => {
        btn.addEventListener('click', async function(e) {
            e.preventDefault();
            if (confirm('Are you sure you want to delete this art?')) {
                const artId = btn.getAttribute('data-artid');
                const token = localStorage.getItem('token');
                try {
                    const res = await fetch('https://ownshub.onrender.com/api/arts/' + encodeURIComponent(artId), {
                        method: 'DELETE',
                        headers: { 'Authorization': 'Bearer ' + token }
                    });
                    if (res.ok) {
                        alert('Art deleted.');
                        fetchAndRenderArts();
                    } else {
                        alert('Failed to delete art.');
                    }
                } catch {
                    alert('Failed to delete art.');
                }
            }
        });
    });
}

async function fetchAndRenderArts() {
    try {
        const res = await fetch('https://ownshub.onrender.com/api/arts');
        const arts = await res.json();
        renderArtsGallery(arts);
    } catch {
        renderArtsGallery([]);
    }
}

function showPostArtForm() {
    const container = document.getElementById('postArtContainer');
    if (!container) return;
    const loggedInUser = localStorage.getItem('loggedInUser');
    const token = localStorage.getItem('token');
    if (!loggedInUser || !token) {
        container.innerHTML = '<p style="color:#bbb;">Log in to post your art!</p>';
        return;
    }
    container.innerHTML = `
        <form id="postArtForm" style="background:#222;padding:18px 18px 12px 18px;border-radius:12px;display:inline-block;max-width:340px;">
            <div style="margin-bottom:10px;font-weight:bold;color:#ffb347;">Post Your Art</div>
            <input type="file" id="artImage" accept="image/*" required style="margin-bottom:10px;width:100%;">
            <input type="text" id="artTitle" placeholder="Title" maxlength="40" required style="margin-bottom:10px;width:100%;padding:6px 8px;">
            <textarea id="artDesc" placeholder="Description (optional)" maxlength="120" rows="2" style="margin-bottom:10px;width:100%;padding:6px 8px;"></textarea>
            <button type="submit" style="background:linear-gradient(90deg,#ffb347 0%,#ffcc80 100%);color:#181818;padding:8px 24px;border:none;border-radius:6px;font-weight:700;cursor:pointer;">Post Art</button>
        </form>
    `;
    document.getElementById('postArtForm').onsubmit = async function(e) {
        e.preventDefault();
        const imgInput = document.getElementById('artImage');
        const title = document.getElementById('artTitle').value.trim();
        const desc = document.getElementById('artDesc').value.trim();
        if (!imgInput.files[0]) return alert('Please select an image.');
        const reader = new FileReader();
        reader.onload = async function(evt) {
            const image = evt.target.result;
            try {
                const res = await fetch('https://ownshub.onrender.com/api/arts', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer ' + token
                    },
                    body: JSON.stringify({ image, title, description: desc })
                });
                const data = await res.json();
                if (res.ok && data.id) {
                    fetchAndRenderArts();
                    document.getElementById('postArtForm').reset();
                    alert('Art posted!');
                } else {
                    alert(data.error || 'Failed to post art.');
                }
            } catch {
                alert('Failed to post art.');
            }
        };
        reader.readAsDataURL(imgInput.files[0]);
    };
}

document.addEventListener('DOMContentLoaded', function() {
    fetchAndRenderArts();
    showPostArtForm();
});

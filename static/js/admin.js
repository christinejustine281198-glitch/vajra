const API_BASE = '/api';

// Check authentication on load
window.addEventListener('DOMContentLoaded', async () => {
    try {
        const response = await fetch('/admin/check', {
            credentials: 'include'
        });

        if (!response.ok) {
            window.location.href = '/admin';
            return;
        }
    } catch (error) {
        window.location.href = '/admin';
        return;
    }

    initNavigation();
    loadAllData();

    // Image preview
    document.getElementById('imageInput').addEventListener('change', handleImagePreview);
});

// Navigation
function initNavigation() {
    const navLinks = document.querySelectorAll('.nav-link[data-section]');
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const section = link.dataset.section;

            // Update active states
            navLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');

            document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
            document.getElementById(section).classList.add('active');
        });
    });
}

// Logout
async function logout() {
    try {
        await fetch('/admin/logout', {
            method: 'POST',
            credentials: 'include'
        });
        window.location.href = '/admin';
    } catch (error) {
        console.error('Logout error:', error);
    }
}

// Notifications
function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Load all data
async function loadAllData() {
    await loadDepartments();
    await loadResults();
    await loadMedia();
    populateDropdowns();
}

// Departments
async function loadDepartments() {
    try {
        const response = await fetch(`${API_BASE}/departments`);
        const departments = await response.json();

        const tbody = document.querySelector('#departmentsTable tbody');
        tbody.innerHTML = departments.map(dept => `
            <tr>
                <td>#${dept.rank}</td>
                <td>${dept.name}</td>
                <td>${dept.total_points}</td>
                <td>
                    <div class="action-btns">
                        <button class="btn-icon btn-delete" onclick="deleteDepartment(${dept.id})">🗑️</button>
                    </div>
                </td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Error loading departments:', error);
    }
}

document.getElementById('addDepartmentForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);

    try {
        const response = await fetch(`${API_BASE}/departments`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(Object.fromEntries(formData))
        });

        if (response.ok) {
            showNotification('Department added successfully!');
            e.target.reset();
            loadAllData();
        }
    } catch (error) {
        showNotification('Error adding department', 'error');
    }
});

async function deleteDepartment(id) {
    if (!confirm('Delete this department?')) return;

    try {
        const response = await fetch(`${API_BASE}/departments/${id}`, {
            method: 'DELETE',
            credentials: 'include'
        });

        if (response.ok) {
            showNotification('Department deleted!');
            loadAllData();
        }
    } catch (error) {
        showNotification('Error deleting department', 'error');
    }
}

// Results
async function loadResults() {
    try {
        const response = await fetch(`${API_BASE}/results`);
        const results = await response.json();

        const tbody = document.querySelector('#resultsTable tbody');
        tbody.innerHTML = results.map(result => {
            let position = '';
            if (result.position === 1) position = '🥇 1st';
            else if (result.position === 2) position = '🥈 2nd';
            else if (result.position === 3) position = '🥉 3rd';

            // Format event type
            let eventType = result.event_type || '';
            if (eventType === 'mens') eventType = "👨 Men's";
            else if (eventType === 'womens') eventType = "👩 Women's";
            else if (eventType === 'team') eventType = '👥 Team';
            else if (eventType === 'individual') eventType = '🧍 Individual';

            return `
                <tr>
                    <td>${result.event_name}</td>
                    <td><strong style="color: #4facfe;">${eventType}</strong></td>
                    <td>${result.department_name}</td>
                    <td>${position}</td>
                    <td>${result.points_awarded}</td>
                    <td>
                        <div class="action-btns">
                            <button class="btn-icon btn-delete" onclick="deleteResult(${result.id})">🗑️</button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    } catch (error) {
        console.error('Error loading results:', error);
    }
}

document.getElementById('addResultForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);

    try {
        const response = await fetch(`${API_BASE}/results`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(Object.fromEntries(formData))
        });

        if (response.ok) {
            showNotification('Result added successfully! Point table updated.');
            e.target.reset();
            loadAllData();
        }
    } catch (error) {
        showNotification('Error adding result', 'error');
    }
});

async function deleteResult(id) {
    if (!confirm('Delete this result?')) return;

    try {
        const response = await fetch(`${API_BASE}/results/${id}`, {
            method: 'DELETE',
            credentials: 'include'
        });

        if (response.ok) {
            showNotification('Result deleted! Point table updated.');
            loadAllData();
        }
    } catch (error) {
        showNotification('Error deleting result', 'error');
    }
}

// Media
async function loadMedia() {
    try {
        const response = await fetch(`${API_BASE}/media`);
        const media = await response.json();

        const tbody = document.querySelector('#mediaTable tbody');
        tbody.innerHTML = media.map(m => `
            <tr>
                <td>${m.media_type}</td>
                <td>${m.event_name || 'N/A'}</td>
                <td>${m.caption || '-'}</td>
                <td><img src="${m.image_path.startsWith('http') ? m.image_path : '/static/' + m.image_path}" style="width: 100px; border-radius: 8px;"></td>
                <td>
                    <div class="action-btns">
                        <button class="btn-icon btn-delete" onclick="deleteMedia(${m.id})">🗑️</button>
                    </div>
                </td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Error loading media:', error);
    }
}

document.getElementById('addMediaForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);

    try {
        const response = await fetch(`${API_BASE}/media`, {
            method: 'POST',
            credentials: 'include',
            body: formData
        });

        if (response.ok) {
            showNotification('Image uploaded successfully!');
            e.target.reset();
            document.getElementById('imagePreview').style.display = 'none';
            loadAllData();
        }
    } catch (error) {
        showNotification('Error uploading image', 'error');
    }
});

async function deleteMedia(id) {
    if (!confirm('Delete this image?')) return;

    try {
        const response = await fetch(`${API_BASE}/media/${id}`, {
            method: 'DELETE',
            credentials: 'include'
        });

        if (response.ok) {
            showNotification('Image deleted!');
            loadAllData();
        }
    } catch (error) {
        showNotification('Error deleting image', 'error');
    }
}

function handleImagePreview(e) {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
            document.getElementById('previewImg').src = event.target.result;
            document.getElementById('imagePreview').style.display = 'block';
        };
        reader.readAsDataURL(file);
    }
}

// Populate dropdowns
async function populateDropdowns() {
    try {
        const deptsRes = await fetch(`${API_BASE}/departments`);
        const departments = await deptsRes.json();

        // Department dropdown
        const deptSelect = document.getElementById('resultDeptSelect');
        if (deptSelect) {
            deptSelect.innerHTML = departments.map(d => `<option value="${d.id}">${d.name}</option>`).join('');
        }

    } catch (error) {
        console.error('Error populating dropdowns:', error);
    }
}

// API Base URL
const API_BASE = '/api';

// Tab Functionality
document.addEventListener('DOMContentLoaded', () => {
    initTabs();
    loadAllData();

    // Auto-refresh every 30 seconds
    setInterval(loadAllData, 30000);
});

function initTabs() {
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const tabName = btn.dataset.tab;

            // Remove active class from all
            tabBtns.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));

            // Add active class to clicked
            btn.classList.add('active');
            document.getElementById(tabName).classList.add('active');
        });
    });
}

// Load All Data
async function loadAllData() {
    await loadPointTable();
    await loadResults();
    await loadWinners();
    await loadGallery();
}

// Load Point Table
async function loadPointTable() {
    try {
        const response = await fetch(`${API_BASE}/departments`);
        const departments = await response.json();

        const container = document.getElementById('pointTable');

        if (departments.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">📊</div>
                    <p class="empty-state-text">No departments added yet</p>
                </div>
            `;
            return;
        }

        container.innerHTML = departments.map((dept, index) => {
            let badgeClass = 'default';
            if (dept.rank === 1) badgeClass = 'gold';
            else if (dept.rank === 2) badgeClass = 'silver';
            else if (dept.rank === 3) badgeClass = 'bronze';

            return `
                <div class="rank-card" style="animation-delay: ${index * 0.1}s">
                    <div class="rank-badge ${badgeClass}">
                        #${dept.rank}
                    </div>
                    <div class="rank-info">
                        <div class="dept-name">${dept.name}</div>
                        <div class="dept-rank">Rank ${dept.rank}</div>
                    </div>
                    <div class="points-display">
                        <div class="points-value">${dept.total_points}</div>
                        <div class="points-label">Points</div>
                    </div>
                </div>
            `;
        }).join('');
    } catch (error) {
        console.error('Error loading point table:', error);
    }
}

// Load Schedules
async function loadSchedules() {
    try {
        const response = await fetch(`${API_BASE}/schedules`);
        const schedules = await response.json();

        const container = document.getElementById('scheduleGrid');

        if (schedules.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">📅</div>
                    <p class="empty-state-text">No schedules added yet</p>
                </div>
            `;
            return;
        }

        container.innerHTML = schedules.map(schedule => {
            let eventType = schedule.event_type || '';
            if (eventType === 'mens') eventType = "Men's";
            else if (eventType === 'womens') eventType = "Women's";
            else if (eventType === 'team') eventType = 'Team';
            else if (eventType === 'individual') eventType = 'Individual';

            return `
                <div class="schedule-card">
                    <div class="event-name">${schedule.event_name} <span style="color: #4facfe; font-size: 0.85em;">${eventType}</span></div>
                    <div class="schedule-details">
                        <div class="detail-row">
                            <span class="detail-icon">📅</span>
                            <span>${schedule.date}</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-icon">⏰</span>
                            <span>${schedule.time}</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-icon">📍</span>
                            <span>${schedule.venue}</span>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    } catch (error) {
        console.error('Error loading schedules:', error);
    }
}

// Load Results
async function loadResults() {
    try {
        const response = await fetch(`${API_BASE}/results`);
        const results = await response.json();

        const container = document.getElementById('resultsGrid');

        if (results.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">🏅</div>
                    <p class="empty-state-text">No results declared yet</p>
                </div>
            `;
            return;
        }

        // Group results by unique event signature (name + type)
        const groupedResults = {};
        results.forEach(result => {
            const key = `${result.event_name}|${result.event_type}`;
            if (!groupedResults[key]) {
                groupedResults[key] = {
                    name: result.event_name,
                    type: result.event_type,
                    results: []
                };
            }
            groupedResults[key].results.push(result);
        });

        container.innerHTML = Object.values(groupedResults).map(group => {
            // Sort by position
            group.results.sort((a, b) => a.position - b.position);

            // Format event type
            let eventTypeFormatted = '';
            const typeLower = (group.type || '').toLowerCase();
            if (typeLower === 'mens') eventTypeFormatted = "👨 Men's";
            else if (typeLower === 'womens') eventTypeFormatted = "👩 Women's";
            else if (typeLower === 'team') eventTypeFormatted = "👥 Team";
            else if (typeLower === 'individual') eventTypeFormatted = "👤 Individual";
            else if (group.type) eventTypeFormatted = group.type; // Fallback

            const eventTypeHtml = eventTypeFormatted
                ? `<span style="font-size: 0.8em; color: #4facfe; font-weight: 500; margin-left: 8px;">${eventTypeFormatted}</span>`
                : '';

            return `
                <div class="result-card">
                    <div class="result-event">
                        ${group.name} ${eventTypeHtml}
                    </div>
                    <div class="result-positions">
                        ${group.results.map(result => {
                let positionLabel = '';
                let positionClass = '';
                if (result.position === 1) {
                    positionLabel = '🥇 1st Place';
                    positionClass = 'first';
                } else if (result.position === 2) {
                    positionLabel = '🥈 2nd Place';
                    positionClass = 'second';
                } else if (result.position === 3) {
                    positionLabel = '🥉 3rd Place';
                    positionClass = 'third';
                }

                return `
                                <div class="position-row">
                                    <span class="position-label ${positionClass}">${positionLabel}</span>
                                    <span>${result.department_name} <span style="font-weight: 700; color: #4facfe; margin-left: 5px;">(+${result.points_awarded} pts)</span></span>
                                </div>
                            `;
            }).join('')}
                    </div>
                </div>
            `;
        }).join('');
    } catch (error) {
        console.error('Error loading results:', error);
    }
}

// Load Winners Gallery
async function loadWinners() {
    try {
        const response = await fetch(`${API_BASE}/media`);
        const media = await response.json();

        const winners = media.filter(m => m.media_type === 'winner');
        const container = document.getElementById('winnersGallery');

        if (winners.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">🏆</div>
                    <p class="empty-state-text">No winners declared yet</p>
                </div>
            `;
            return;
        }

        container.innerHTML = winners.map(winner => `
            <div class="gallery-item">
                <img src="${winner.image_path.startsWith('http') ? winner.image_path : '/static/' + winner.image_path}" alt="${winner.caption || 'Winner'}">
                <div class="gallery-caption">
                    ${winner.caption || winner.event_name}
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading winners:', error);
    }
}

// Load Event Gallery
async function loadGallery() {
    try {
        const response = await fetch(`${API_BASE}/media`);
        const media = await response.json();

        const events = media.filter(m => m.media_type === 'event');
        const container = document.getElementById('eventGallery');

        if (events.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">📸</div>
                    <p class="empty-state-text">No photos uploaded yet</p>
                </div>
            `;
            return;
        }

        container.innerHTML = events.map(event => `
            <div class="gallery-item">
                <img src="${event.image_path.startsWith('http') ? event.image_path : '/static/' + event.image_path}" alt="${event.caption || 'Event Photo'}">
                <div class="gallery-caption">
                    ${event.caption || event.event_name || 'Event Photo'}
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading gallery:', error);
    }
}

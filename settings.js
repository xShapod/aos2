let servers = [];
let currentCategory = 'all';

// Load servers from localStorage
document.addEventListener('DOMContentLoaded', function() {
    const savedServers = localStorage.getItem('ispServers');
    if (savedServers) {
        servers = JSON.parse(savedServers);
    }
    
    renderServerList(currentCategory);
    setupEventListeners();
});

// Render server list for sorting
function renderServerList(category) {
    const serverList = document.getElementById('serverList');
    serverList.innerHTML = '';
    
    let filteredServers = servers;
    
    if (category !== 'all') {
        filteredServers = servers.filter(server => server.category === category);
    }
    
    // Sort by current rank
    filteredServers.sort((a, b) => a.rank - b.rank);
    
    if (filteredServers.length === 0) {
        serverList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-server"></i>
                <h3>No servers found</h3>
                <p>Add some servers in the main page first</p>
            </div>
        `;
        return;
    }
    
    filteredServers.forEach((server, index) => {
        const listItem = document.createElement('div');
        listItem.className = 'server-list-item';
        listItem.setAttribute('data-id', server.id);
        
        listItem.innerHTML = `
            <div class="server-rank-number">${server.rank}</div>
            <div class="server-list-info">
                <div class="server-list-name">${server.name}</div>
                <div class="server-list-address">${server.address}</div>
            </div>
            <div class="server-list-category">${getCategoryDisplayName(server.category)}</div>
            <div class="rank-controls">
                <button class="rank-btn" onclick="moveServerUp(${server.id})" ${index === 0 ? 'disabled' : ''}>
                    <i class="fas fa-arrow-up"></i>
                </button>
                <button class="rank-btn" onclick="moveServerDown(${server.id})" ${index === filteredServers.length - 1 ? 'disabled' : ''}>
                    <i class="fas fa-arrow-down"></i>
                </button>
            </div>
        `;
        
        serverList.appendChild(listItem);
    });
}

// Get display name for category
function getCategoryDisplayName(category) {
    const categories = {
        'live': 'Live TV',
        'movies': 'Movies',
        'series': 'Series',
        'others': 'Others'
    };
    return categories[category] || category;
}

// Move server up in rank
function moveServerUp(serverId) {
    const server = servers.find(s => s.id === serverId);
    if (!server) return;
    
    const currentRank = server.rank;
    if (currentRank <= 1) return;
    
    // Find the server with the previous rank
    const prevServer = servers.find(s => s.rank === currentRank - 1);
    if (prevServer) {
        // Swap ranks
        server.rank = currentRank - 1;
        prevServer.rank = currentRank;
        
        saveServers();
        renderServerList(currentCategory);
        showToast('Server order updated!');
    }
}

// Move server down in rank
function moveServerDown(serverId) {
    const server = servers.find(s => s.id === serverId);
    if (!server) return;
    
    const currentRank = server.rank;
    const maxRank = servers.length;
    
    if (currentRank >= maxRank) return;
    
    // Find the server with the next rank
    const nextServer = servers.find(s => s.rank === currentRank + 1);
    if (nextServer) {
        // Swap ranks
        server.rank = currentRank + 1;
        nextServer.rank = currentRank;
        
        saveServers();
        renderServerList(currentCategory);
        showToast('Server order updated!');
    }
}

// Save the new order
function saveNewOrder() {
    saveServers();
    showToast('Server order saved successfully!');
}

// Reset to default order (by name)
function resetToDefaultOrder() {
    if (confirm('Are you sure you want to reset to alphabetical order?')) {
        servers.sort((a, b) => a.name.localeCompare(b.name));
        
        // Update ranks
        servers.forEach((server, index) => {
            server.rank = index + 1;
        });
        
        saveServers();
        renderServerList(currentCategory);
        showToast('Order reset to alphabetical!');
    }
}

// Set up event listeners for settings page
function setupEventListeners() {
    // Back button
    document.getElementById('backBtn').addEventListener('click', function() {
        window.location.href = 'index.html';
    });
    
    // Category tabs
    document.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', function() {
            document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            currentCategory = this.getAttribute('data-category');
            renderServerList(currentCategory);
        });
    });
    
    // Save order button
    document.getElementById('saveOrder').addEventListener('click', saveNewOrder);
    
    // Reset order button
    document.getElementById('resetOrder').addEventListener('click', resetToDefaultOrder);
}

// Show toast notification
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.style.background = type === 'error' ? 'var(--danger)' : 'var(--success)';
    toast.classList.add('show');
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// Save servers to localStorage
function saveServers() {
    localStorage.setItem('ispServers', JSON.stringify(servers));
}

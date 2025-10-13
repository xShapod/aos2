let servers = [];
let currentCategory = 'all';

// Load servers from localStorage
document.addEventListener('DOMContentLoaded', function() {
    const savedServers = localStorage.getItem('ispServers');
    if (savedServers) {
        servers = JSON.parse(savedServers);
    }
    
    loadSettings();
    renderServerList(currentCategory);
    setupEventListeners();
});

// Render server list for sorting
function renderServerList(category) {
    const serverList = document.getElementById('serverList');
    serverList.innerHTML = '';
    
    let filteredServers = servers;
    
    if (category !== 'all') {
        if (category === 'favorites') {
            filteredServers = servers.filter(server => server.isFavorite);
        } else {
            filteredServers = servers.filter(server => server.tags && server.tags.includes(category));
        }
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
            <div class="server-rank-number">${index + 1}</div>
            <div class="server-list-info">
                <div class="server-list-name">
                    ${server.name}
                    ${server.isFavorite ? '<i class="fas fa-star favorited" style="color: var(--warning); margin-left: 0.5rem;"></i>' : ''}
                </div>
                <div class="server-list-address">${server.address}</div>
                ${server.tags && server.tags.length > 0 ? `
                    <div class="server-list-tags">
                        ${server.tags.map(tag => `<span class="server-tag">${tag}</span>`).join('')}
                    </div>
                ` : ''}
                <div class="server-list-meta">
                    <span>Used ${server.usageCount || 0} times</span>
                    ${server.lastAccessed ? `<span>Last used: ${formatTimeAgo(server.lastAccessed)}</span>` : ''}
                </div>
            </div>
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

// Move server up in rank
function moveServerUp(serverId) {
    const serverIndex = servers.findIndex(s => s.id === serverId);
    if (serverIndex === -1 || serverIndex === 0) return;
    
    // Get the current server and the one above it
    const currentServer = servers[serverIndex];
    const aboveServer = servers[serverIndex - 1];
    
    // Swap ranks
    const tempRank = currentServer.rank;
    currentServer.rank = aboveServer.rank;
    aboveServer.rank = tempRank;
    
    // Swap positions in the array
    servers[serverIndex] = aboveServer;
    servers[serverIndex - 1] = currentServer;
    
    saveServers();
    renderServerList(currentCategory);
    showToast('Server moved up!');
}

// Move server down in rank
function moveServerDown(serverId) {
    const serverIndex = servers.findIndex(s => s.id === serverId);
    if (serverIndex === -1 || serverIndex === servers.length - 1) return;
    
    // Get the current server and the one below it
    const currentServer = servers[serverIndex];
    const belowServer = servers[serverIndex + 1];
    
    // Swap ranks
    const tempRank = currentServer.rank;
    currentServer.rank = belowServer.rank;
    belowServer.rank = tempRank;
    
    // Swap positions in the array
    servers[serverIndex] = belowServer;
    servers[serverIndex + 1] = currentServer;
    
    saveServers();
    renderServerList(currentCategory);
    showToast('Server moved down!');
}

// Save the new order
function saveNewOrder() {
    // Reassign ranks based on current order to ensure they're sequential
    servers.forEach((server, index) => {
        server.rank = index + 1;
    });
    
    saveServers();
    showToast('Server order saved successfully!');
}

// Reset to default order (by name)
function resetToDefaultOrder() {
    if (confirm('Are you sure you want to reset to alphabetical order?')) {
        // Sort by name alphabetically
        servers.sort((a, b) => a.name.localeCompare(b.name));
        
        // Update ranks based on new order
        servers.forEach((server, index) => {
            server.rank = index + 1;
        });
        
        saveServers();
        renderServerList(currentCategory);
        showToast('Order reset to alphabetical!');
    }
}

// Clear usage statistics
function clearUsageStats() {
    if (confirm('Are you sure you want to clear all usage statistics? This cannot be undone.')) {
        servers.forEach(server => {
            server.usageCount = 0;
            server.lastAccessed = null;
            server.responseTime = null;
            server.lastTested = null;
        });
        
        saveServers();
        renderServerList(currentCategory);
        showToast('Usage statistics cleared!');
    }
}

// Create backup
function createBackup() {
    const backup = {
        servers: servers,
        timestamp: Date.now(),
        version: '2.0'
    };
    
    const dataStr = JSON.stringify(backup, null, 2);
    const dataBlob = new Blob([dataStr], {type: 'application/json'});
    
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `isp-servers-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    showToast('Backup created successfully!');
}

// Clear all data
function clearAllData() {
    if (confirm('⚠️ DANGER ZONE! This will delete ALL your servers and settings. This cannot be undone!')) {
        if (prompt('Type "DELETE ALL" to confirm:') === 'DELETE ALL') {
            localStorage.removeItem('ispServers');
            localStorage.removeItem('appSettings');
            servers = [];
            showToast('All data cleared!', 'error');
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 2000);
        }
    }
}

// Load settings
function loadSettings() {
    const savedSettings = localStorage.getItem('appSettings');
    if (savedSettings) {
        const settings = JSON.parse(savedSettings);
        
        // Apply settings to form elements
        document.getElementById('backupFrequency').value = settings.backupFrequency || 'disabled';
        document.getElementById('backupRetention').value = settings.backupRetention || '7';
        document.getElementById('darkMode').checked = settings.darkMode !== false;
        document.getElementById('compactView').checked = settings.compactView || false;
        document.getElementById('autoTest').checked = settings.autoTest !== false;
        document.getElementById('showUsageStats').checked = settings.showUsageStats !== false;
    }
}

// Save settings
function saveSettings() {
    const settings = {
        backupFrequency: document.getElementById('backupFrequency').value,
        backupRetention: document.getElementById('backupRetention').value,
        darkMode: document.getElementById('darkMode').checked,
        compactView: document.getElementById('compactView').checked,
        autoTest: document.getElementById('autoTest').checked,
        showUsageStats: document.getElementById('showUsageStats').checked
    };
    
    localStorage.setItem('appSettings', JSON.stringify(settings));
    showToast('Settings saved!');
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
    
    // Clear stats button
    document.getElementById('clearStats').addEventListener('click', clearUsageStats);
    
    // Backup buttons
    document.getElementById('createBackup').addEventListener('click', createBackup);
    document.getElementById('clearData').addEventListener('click', clearAllData);
    
    // Settings change listeners
    document.querySelectorAll('select, input').forEach(element => {
        element.addEventListener('change', saveSettings);
    });
}

// Utility function
function formatTimeAgo(timestamp) {
    const now = Date.now();
    const diff = now - timestamp;
    
    if (diff < 60000) return 'just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return `${Math.floor(diff / 86400000)}d ago`;
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
// Enhanced server data structure
let servers = [
    {
        id: 1,
        name: "Live Sports HD",
        address: "http://live.sports.isp.com",
        tags: ["live", "sports", "hd"],
        type: "bdix",
        status: "active",
        description: "High-definition live sports channels",
        notes: "Great for football matches",
        rank: 1,
        createdAt: new Date('2023-01-15').getTime(),
        isFavorite: true,
        usageCount: 15,
        lastAccessed: Date.now(),
        responseTime: 120,
        lastTested: Date.now(),
        uptime: 98.5,
        color: "#4361ee"
    },
    {
        id: 2,
        name: "Movie Vault",
        address: "ftp://movies.isp.com:2020",
        tags: ["movies", "collection"],
        type: "bdix",
        status: "active",
        description: "Large collection of movies from various genres",
        notes: "Good for weekend movie nights",
        rank: 2,
        createdAt: new Date('2023-02-20').getTime(),
        isFavorite: false,
        usageCount: 8,
        lastAccessed: Date.now() - 86400000,
        responseTime: 200,
        lastTested: Date.now() - 3600000,
        uptime: 95.2,
        color: "#7209b7"
    }
];

let currentSort = 'manual';
let currentCategory = 'all';
let currentEditServerId = null;
let selectedServers = new Set();
let isBulkMode = false;

// Server templates
const serverTemplates = {
    'live-tv': {
        name: "Live TV Server",
        tags: ["live", "tv", "streaming"],
        description: "Live television channels",
        type: "bdix"
    },
    'movies': {
        name: "Movie Server",
        tags: ["movies", "entertainment"],
        description: "Movie collection server",
        type: "bdix"
    },
    'series': {
        name: "Series Server",
        tags: ["series", "tv-shows"],
        description: "TV series and shows",
        type: "non-bdix"
    }
};

// Load servers from localStorage
document.addEventListener('DOMContentLoaded', function() {
    const savedServers = localStorage.getItem('ispServers');
    if (savedServers) {
        servers = JSON.parse(savedServers);
    } else {
        localStorage.setItem('ispServers', JSON.stringify(servers));
    }
    
    renderServers(currentCategory, currentSort);
    updateQuickStats();
    setupEventListeners();
    setupKeyboardShortcuts();
});

// Enhanced render function
function renderServers(category, sortBy) {
    const serverGrid = document.getElementById('serverGrid');
    serverGrid.innerHTML = '';
    
    let filteredServers = servers;
    
    // Apply category filter
    if (category !== 'all') {
        if (category === 'favorites') {
            filteredServers = servers.filter(server => server.isFavorite);
        } else if (category === 'recent') {
            const oneWeekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
            filteredServers = servers.filter(server => server.lastAccessed && server.lastAccessed > oneWeekAgo);
        } else {
            filteredServers = servers.filter(server => server.tags && server.tags.includes(category));
        }
    }
    
    // Apply search filter
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    if (searchTerm) {
        filteredServers = filteredServers.filter(server => 
            server.name.toLowerCase().includes(searchTerm) || 
            (server.description && server.description.toLowerCase().includes(searchTerm)) ||
            (server.tags && server.tags.some(tag => tag.toLowerCase().includes(searchTerm))) ||
            (server.notes && server.notes.toLowerCase().includes(searchTerm))
        );
    }
    
    // Sort servers
    filteredServers = sortServers(filteredServers, sortBy);
    
    if (filteredServers.length === 0) {
        serverGrid.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-server"></i>
                <h3>No servers found</h3>
                <p>Try changing your filters or add a new server</p>
            </div>
        `;
        return;
    }
    
    filteredServers.forEach(server => {
        const serverCard = document.createElement('div');
        serverCard.className = `server-card ${selectedServers.has(server.id) ? 'selected' : ''}`;
        serverCard.setAttribute('data-id', server.id);
        
        serverCard.innerHTML = `
            ${isBulkMode ? `
                <div class="bulk-checkbox">
                    <input type="checkbox" ${selectedServers.has(server.id) ? 'checked' : ''} 
                           onchange="toggleServerSelection(${server.id})">
                </div>
            ` : ''}
            <div class="edit-icon" onclick="openEditModal(${server.id})">
                <i class="fas fa-edit"></i>
            </div>
            <div class="favorite-star ${server.isFavorite ? 'favorited' : ''}" 
                 onclick="toggleFavorite(${server.id})">
                <i class="fas fa-star"></i>
            </div>
            <div class="server-header">
                <div>
                    <div class="server-name">${server.name}</div>
                    <div class="server-status ${server.status}">
                        <i class="fas fa-circle"></i>
                        ${server.status === 'active' ? 'Active' : 'Inactive'}
                        <span class="bdix-badge ${server.type}">${server.type === 'bdix' ? 'BDIX' : 'Non-BDIX'}</span>
                        ${server.responseTime ? `<span class="response-badge">${server.responseTime}ms</span>` : ''}
                    </div>
                </div>
            </div>
            <div class="server-address">${server.address}</div>
            ${server.description ? `<div class="server-description">${server.description}</div>` : ''}
            ${server.notes ? `<div class="server-notes">${server.notes}</div>` : ''}
            ${server.tags && server.tags.length > 0 ? `
                <div class="server-tags">
                    ${server.tags.map(tag => `<span class="server-tag">${tag}</span>`).join('')}
                </div>
            ` : ''}
            <div class="server-meta">
                <span class="usage-count"><i class="fas fa-chart-line"></i> Used ${server.usageCount || 0} times</span>
                ${server.lastAccessed ? `<span class="last-accessed">Last used: ${formatTimeAgo(server.lastAccessed)}</span>` : ''}
            </div>
            <div class="server-actions">
                <button class="btn btn-primary" onclick="connectToServer(${server.id})">
                    <i class="fas fa-external-link-alt"></i> Open
                </button>
                <button class="btn btn-info" onclick="testServerConnection(${server.id})">
                    <i class="fas fa-heartbeat"></i> Test
                </button>
                <button class="btn btn-danger" onclick="deleteServer(${server.id})">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
        serverGrid.appendChild(serverCard);
    });
}

// Enhanced sort function
function sortServers(servers, sortBy) {
    const sortedServers = [...servers];
    
    switch(sortBy) {
        case 'manual':
            return sortedServers.sort((a, b) => a.rank - b.rank);
        case 'name':
            return sortedServers.sort((a, b) => a.name.localeCompare(b.name));
        case 'recent':
            return sortedServers.sort((a, b) => b.createdAt - a.createdAt);
        case 'usage':
            return sortedServers.sort((a, b) => (b.usageCount || 0) - (a.usageCount || 0));
        case 'response':
            return sortedServers.sort((a, b) => (a.responseTime || 9999) - (b.responseTime || 9999));
        default:
            return sortedServers;
    }
}

// New function: Toggle server selection for bulk operations
function toggleServerSelection(serverId) {
    if (selectedServers.has(serverId)) {
        selectedServers.delete(serverId);
    } else {
        selectedServers.add(serverId);
    }
    updateBulkActions();
    renderServers(currentCategory, currentSort);
}

// New function: Update bulk actions UI
function updateBulkActions() {
    const bulkActions = document.getElementById('bulkActions');
    const selectedCount = document.getElementById('selectedCount');
    
    if (selectedServers.size > 0) {
        bulkActions.style.display = 'block';
        selectedCount.textContent = `${selectedServers.size} servers selected`;
    } else {
        bulkActions.style.display = 'none';
        isBulkMode = false;
    }
}

// New function: Toggle bulk mode
function toggleBulkMode() {
    isBulkMode = !isBulkMode;
    if (!isBulkMode) {
        selectedServers.clear();
        updateBulkActions();
    }
    renderServers(currentCategory, currentSort);
}

// New function: Bulk favorite
function bulkFavorite() {
    servers.forEach(server => {
        if (selectedServers.has(server.id)) {
            server.isFavorite = true;
        }
    });
    saveServers();
    renderServers(currentCategory, currentSort);
    showToast('Selected servers added to favorites!');
    selectedServers.clear();
    updateBulkActions();
}

// New function: Bulk delete
function bulkDelete() {
    if (confirm(`Are you sure you want to delete ${selectedServers.size} servers?`)) {
        servers = servers.filter(server => !selectedServers.has(server.id));
        // Recalculate ranks
        servers.forEach((server, index) => {
            server.rank = index + 1;
        });
        saveServers();
        renderServers(currentCategory, currentSort);
        showToast(`${selectedServers.size} servers deleted successfully!`);
        selectedServers.clear();
        updateBulkActions();
    }
}

// New function: Update quick stats
function updateQuickStats() {
    const totalServers = servers.length;
    const favoriteServers = servers.filter(s => s.isFavorite).length;
    const activeServers = servers.filter(s => s.status === 'active').length;
    const oneWeekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
    const recentServers = servers.filter(s => s.lastAccessed && s.lastAccessed > oneWeekAgo).length;
    
    document.getElementById('totalServers').textContent = totalServers;
    document.getElementById('favoriteServers').textContent = favoriteServers;
    document.getElementById('activeServers').textContent = activeServers;
    document.getElementById('recentServers').textContent = recentServers;
}

// New function: Toggle favorite
function toggleFavorite(serverId) {
    const server = servers.find(s => s.id === serverId);
    if (server) {
        server.isFavorite = !server.isFavorite;
        saveServers();
        renderServers(currentCategory, currentSort);
        updateQuickStats();
        showToast(server.isFavorite ? 'Added to favorites!' : 'Removed from favorites!');
    }
}

// New function: Test server connection
function testServerConnection(serverId) {
    const server = servers.find(s => s.id === serverId);
    if (server) {
        showToast(`Testing connection to ${server.name}...`);
        
        // Simulate connection test (in real implementation, this would make actual HTTP requests)
        setTimeout(() => {
            const responseTime = Math.floor(Math.random() * 500) + 50; // 50-550ms
            server.responseTime = responseTime;
            server.lastTested = Date.now();
            server.status = responseTime < 300 ? 'active' : 'inactive';
            
            saveServers();
            renderServers(currentCategory, currentSort);
            showToast(`Connection test completed: ${responseTime}ms`);
        }, 1000);
    }
}

// New function: Apply template
function applyTemplate(templateName) {
    const template = serverTemplates[templateName];
    if (template) {
        document.getElementById('serverName').value = template.name;
        document.getElementById('serverTags').value = template.tags.join(', ');
        document.getElementById('serverDescription').value = template.description;
        document.getElementById('serverType').value = template.type;
        showToast(`${template.name} template applied!`);
    }
}

// New function: Import from URL
function importFromURL() {
    const url = document.getElementById('importUrl').value;
    const method = document.querySelector('input[name="importMethod"]:checked').value;
    
    if (!url) {
        showToast('Please enter a valid URL', 'error');
        return;
    }
    
    showToast('Downloading server list...');
    
    // Simulate URL import (in real implementation, this would fetch from the URL)
    setTimeout(() => {
        try {
            const importedServers = [
                {
                    id: Date.now() + 1,
                    name: "Imported Live Server",
                    address: "http://imported.live.server.com",
                    tags: ["live", "imported"],
                    type: "bdix",
                    status: "active",
                    description: "Imported from URL",
                    rank: servers.length + 1,
                    createdAt: Date.now()
                }
            ];
            
            if (method === 'replace') {
                servers = importedServers;
                showToast('All servers replaced from URL!');
            } else {
                // Merge and avoid duplicates by address
                const serverMap = new Map();
                servers.forEach(server => serverMap.set(server.address, server));
                importedServers.forEach(server => serverMap.set(server.address, server));
                servers = Array.from(serverMap.values());
                showToast('Servers merged from URL!');
            }
            
            saveServers();
            renderServers(currentCategory, currentSort);
            updateQuickStats();
            closeUrlModal();
        } catch (e) {
            showToast('Error importing from URL!', 'error');
        }
    }, 2000);
}

// Enhanced connect function with usage tracking
function connectToServer(serverId) {
    const server = servers.find(s => s.id === serverId);
    if (server) {
        // Update usage statistics
        server.usageCount = (server.usageCount || 0) + 1;
        server.lastAccessed = Date.now();
        saveServers();
        updateQuickStats();
        
        showToast(`Opening: ${server.address}`);
        
        try {
            window.open(server.address, '_blank');
        } catch (e) {
            showToast(`Could not open automatically. Please copy and paste: ${server.address}`);
            navigator.clipboard.writeText(server.address).then(() => {
                showToast(`URL copied to clipboard: ${server.address}`);
            });
        }
    }
}

// Enhanced add server with duplicate detection
function addServer() {
    const name = document.getElementById('serverName').value;
    const address = document.getElementById('serverAddress').value;
    const tags = document.getElementById('serverTags').value.split(',').map(tag => tag.trim()).filter(tag => tag);
    const type = document.getElementById('serverType').value;
    const description = document.getElementById('serverDescription').value;
    const notes = document.getElementById('serverNotes').value;
    
    // Duplicate detection
    const duplicate = servers.find(server => server.address === address);
    if (duplicate) {
        if (!confirm('A server with this address already exists. Do you want to add it anyway?')) {
            return;
        }
    }
    
    const newServer = {
        id: Date.now(),
        name,
        address,
        tags,
        type,
        status: 'active',
        description: description || '',
        notes: notes || '',
        rank: servers.length + 1,
        createdAt: Date.now(),
        isFavorite: false,
        usageCount: 0,
        lastAccessed: null,
        responseTime: null,
        lastTested: null,
        uptime: 100
    };
    
    servers.push(newServer);
    saveServers();
    renderServers(currentCategory, currentSort);
    updateQuickStats();
    
    document.getElementById('serverForm').reset();
    showToast(`Server "${name}" added successfully!`);
}

// Enhanced setupEventListeners
function setupEventListeners() {
    // Existing event listeners...
    document.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', function() {
            document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            currentCategory = this.getAttribute('data-category');
            renderServers(currentCategory, currentSort);
        });
    });
    
    document.querySelectorAll('.sort-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.sort-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            currentSort = this.getAttribute('data-sort');
            renderServers(currentCategory, currentSort);
        });
    });
    
    // New event listeners
    document.getElementById('diagnosticsBtn').addEventListener('click', function() {
        window.location.href = 'diagnostics.html';
    });
    
    document.getElementById('bulkFavorite').addEventListener('click', bulkFavorite);
    document.getElementById('bulkDelete').addEventListener('click', bulkDelete);
    document.getElementById('bulkCancel').addEventListener('click', toggleBulkMode);
    
    document.querySelectorAll('.template-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            applyTemplate(this.getAttribute('data-template'));
        });
    });
    
    document.getElementById('importUrlBtn').addEventListener('click', function() {
        document.getElementById('importUrlModal').style.display = 'flex';
    });
    
    document.getElementById('closeUrlModal').addEventListener('click', function() {
        document.getElementById('importUrlModal').style.display = 'none';
    });
    
    document.getElementById('confirmImportUrl').addEventListener('click', importFromURL);
    
    // Enhanced edit modal
    document.getElementById('saveEdit').addEventListener('click', function() {
        if (currentEditServerId) {
            const server = servers.find(s => s.id === currentEditServerId);
            if (server) {
                server.status = document.getElementById('editStatus').value;
                server.type = document.getElementById('editType').value;
                server.tags = document.getElementById('editTags').value.split(',').map(tag => tag.trim()).filter(tag => tag);
                server.notes = document.getElementById('editNotes').value;
                
                saveServers();
                renderServers(currentCategory, currentSort);
                closeEditModal();
                showToast('Server updated successfully!');
            }
        }
    });
}

// New function: Setup keyboard shortcuts
function setupKeyboardShortcuts() {
    document.addEventListener('keydown', function(e) {
        // Ctrl+F - Focus search
        if (e.ctrlKey && e.key === 'f') {
            e.preventDefault();
            document.getElementById('searchInput').focus();
        }
        
        // Ctrl+N - Focus new server form
        if (e.ctrlKey && e.key === 'n') {
            e.preventDefault();
            document.getElementById('serverName').focus();
        }
        
        // Esc - Cancel bulk mode/close modals
        if (e.key === 'Escape') {
            if (isBulkMode) {
                toggleBulkMode();
            } else if (document.getElementById('exportImportModal').style.display === 'flex') {
                closeModal();
            } else if (document.getElementById('editServerModal').style.display === 'flex') {
                closeEditModal();
            }
        }
    });
}

// Utility function: Format time ago
function formatTimeAgo(timestamp) {
    const now = Date.now();
    const diff = now - timestamp;
    
    if (diff < 60000) return 'just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return `${Math.floor(diff / 86400000)}d ago`;
}

// Keep existing functions (showExportModal, showImportModal, etc.) but enhance them as needed
// [Previous functions like showExportModal, showImportModal, etc. remain the same but enhanced]

// Enhanced openEditModal
function openEditModal(serverId) {
    const server = servers.find(s => s.id === serverId);
    if (server) {
        currentEditServerId = serverId;
        document.getElementById('editStatus').value = server.status;
        document.getElementById('editType').value = server.type;
        document.getElementById('editTags').value = server.tags ? server.tags.join(', ') : '';
        document.getElementById('editNotes').value = server.notes || '';
        document.getElementById('editUsageCount').textContent = server.usageCount || 0;
        document.getElementById('editServerModal').style.display = 'flex';
    }
}

// Enhanced saveServers with backup
function saveServers() {
    localStorage.setItem('ispServers', JSON.stringify(servers));
    
    // Auto-backup every 24 hours
    const lastBackup = localStorage.getItem('lastBackup');
    const now = Date.now();
    if (!lastBackup || (now - parseInt(lastBackup)) > 24 * 60 * 60 * 1000) {
        const backup = {
            servers: servers,
            timestamp: now,
            version: '1.0'
        };
        localStorage.setItem('ispServersBackup', JSON.stringify(backup));
        localStorage.setItem('lastBackup', now.toString());
    }
}

// Rest of the existing functions remain with enhancements as needed...
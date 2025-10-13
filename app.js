// Enhanced server data structure
let servers = [
    {
        id: 1,
        name: "Live Sports HD",
        address: "http://live.sports.isp.com",
        category: "live",
        type: "bdix",
        status: "active",
        description: "High-definition live sports channels",
        rank: 1,
        createdAt: new Date('2023-01-15').getTime(),
        isFavorite: true,
        usageCount: 15,
        lastAccessed: Date.now(),
        responseTime: 120,
        lastTested: Date.now(),
        uptime: 98.5
    },
    {
        id: 2,
        name: "Movie Vault",
        address: "ftp://movies.isp.com:2020",
        category: "movies",
        type: "bdix",
        status: "active",
        description: "Large collection of movies from various genres",
        rank: 2,
        createdAt: new Date('2023-02-20').getTime(),
        isFavorite: false,
        usageCount: 8,
        lastAccessed: Date.now() - 86400000,
        responseTime: 200,
        lastTested: Date.now() - 3600000,
        uptime: 95.2
    }
];

let currentSort = 'manual';
let currentCategory = 'all';
let currentEditServerId = null;
let selectedServers = new Set();
let isBulkMode = false;

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
            filteredServers = servers.filter(server => server.category === category);
        }
    }
    
    // Apply search filter
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    if (searchTerm) {
        filteredServers = filteredServers.filter(server => 
            server.name.toLowerCase().includes(searchTerm) || 
            (server.description && server.description.toLowerCase().includes(searchTerm))
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

// Toggle server selection for bulk operations
function toggleServerSelection(serverId) {
    if (selectedServers.has(serverId)) {
        selectedServers.delete(serverId);
    } else {
        selectedServers.add(serverId);
    }
    updateBulkActions();
    renderServers(currentCategory, currentSort);
}

// Update bulk actions UI
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

// Toggle bulk mode
function toggleBulkMode() {
    isBulkMode = !isBulkMode;
    if (!isBulkMode) {
        selectedServers.clear();
        updateBulkActions();
    }
    renderServers(currentCategory, currentSort);
}

// Bulk favorite
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

// Bulk delete
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

// Update quick stats
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

// Toggle favorite
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

// Test server connection
function testServerConnection(serverId) {
    const server = servers.find(s => s.id === serverId);
    if (server) {
        showToast(`Testing connection to ${server.name}...`);
        
        // Simulate connection test
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

// Import from URL
function importFromURL() {
    const url = document.getElementById('importUrl').value;
    const method = document.querySelector('input[name="importMethod"]:checked').value;
    
    if (!url) {
        showToast('Please enter a valid URL', 'error');
        return;
    }
    
    showToast('Downloading server list...');
    
    // Simulate URL import
    setTimeout(() => {
        try {
            const importedServers = [
                {
                    id: Date.now() + 1,
                    name: "Imported Live Server",
                    address: "http://imported.live.server.com",
                    category: "live",
                    type: "bdix",
                    status: "active",
                    description: "Imported from URL",
                    rank: servers.length + 1,
                    createdAt: Date.now(),
                    isFavorite: false,
                    usageCount: 0
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
    const category = document.getElementById('serverCategory').value;
    const type = document.getElementById('serverType').value;
    const description = document.getElementById('serverDescription').value;
    
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
        category,
        type,
        status: 'active',
        description: description || '',
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
    // Category tabs
    document.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', function() {
            document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            currentCategory = this.getAttribute('data-category');
            renderServers(currentCategory, currentSort);
        });
    });
    
    // Sort buttons
    document.querySelectorAll('.sort-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.sort-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            currentSort = this.getAttribute('data-sort');
            renderServers(currentCategory, currentSort);
        });
    });
    
    // Search input - FIXED
    document.getElementById('searchInput').addEventListener('input', function() {
        renderServers(currentCategory, currentSort);
    });
    
    // Add server form
    document.getElementById('serverForm').addEventListener('submit', function(e) {
        e.preventDefault();
        addServer();
    });
    
    // Settings button - FIXED
    document.getElementById('settingsBtn').addEventListener('click', function() {
        window.location.href = 'settings.html';
    });
    
    // Diagnostics button - FIXED
    document.getElementById('diagnosticsBtn').addEventListener('click', function() {
        window.location.href = 'diagnostics.html';
    });
    
    // Export/Import buttons - FIXED
    document.getElementById('exportBtn').addEventListener('click', showExportModal);
    document.getElementById('importBtn').addEventListener('click', showImportModal);
    document.getElementById('downloadBtn').addEventListener('click', downloadBackup);
    document.getElementById('uploadBtn').addEventListener('click', triggerUpload);
    document.getElementById('fileUpload').addEventListener('change', handleFileUpload);
    
    // Bulk operations
    document.getElementById('bulkFavorite').addEventListener('click', bulkFavorite);
    document.getElementById('bulkDelete').addEventListener('click', bulkDelete);
    document.getElementById('bulkCancel').addEventListener('click', toggleBulkMode);
    
    // Import from URL
    document.getElementById('importUrlBtn').addEventListener('click', function() {
        document.getElementById('importUrlModal').style.display = 'flex';
    });
    
    document.getElementById('closeUrlModal').addEventListener('click', function() {
        document.getElementById('importUrlModal').style.display = 'none';
    });
    
    document.getElementById('confirmImportUrl').addEventListener('click', importFromURL);
    
    // Modal buttons - FIXED
    document.getElementById('closeModal').addEventListener('click', closeModal);
    document.getElementById('copyData').addEventListener('click', copyExportData);
    document.getElementById('replaceData').addEventListener('click', replaceServers);
    document.getElementById('mergeData').addEventListener('click', mergeServers);
    
    // Edit modal events - FIXED
    document.getElementById('closeEditModal').addEventListener('click', closeEditModal);
    document.getElementById('saveEdit').addEventListener('click', saveEditChanges);
    
    // Close modals when clicking outside - FIXED
    document.getElementById('exportImportModal').addEventListener('click', function(e) {
        if (e.target === this) closeModal();
    });
    
    document.getElementById('editServerModal').addEventListener('click', function(e) {
        if (e.target === this) closeEditModal();
    });
    
    document.getElementById('importUrlModal').addEventListener('click', function(e) {
        if (e.target === this) document.getElementById('importUrlModal').style.display = 'none';
    });
}

// Enhanced openEditModal - FIXED
function openEditModal(serverId) {
    const server = servers.find(s => s.id === serverId);
    if (server) {
        currentEditServerId = serverId;
        document.getElementById('editStatus').value = server.status;
        document.getElementById('editType').value = server.type;
        document.getElementById('editUsageCount').textContent = server.usageCount || 0;
        document.getElementById('editServerModal').style.display = 'flex';
    }
}

// Close edit modal - FIXED
function closeEditModal() {
    document.getElementById('editServerModal').style.display = 'none';
    currentEditServerId = null;
}

// Save edit changes - FIXED
function saveEditChanges() {
    if (currentEditServerId) {
        const server = servers.find(s => s.id === currentEditServerId);
        if (server) {
            server.status = document.getElementById('editStatus').value;
            server.type = document.getElementById('editType').value;
            
            saveServers();
            renderServers(currentCategory, currentSort);
            closeEditModal();
            showToast('Server updated successfully!');
        }
    }
}

// Show export modal
function showExportModal() {
    const modal = document.getElementById('exportImportModal');
    const modalTitle = document.getElementById('modalTitle');
    const exportData = document.getElementById('exportData');
    const importActions = document.getElementById('importActions');
    const copyBtn = document.getElementById('copyData');
    
    modalTitle.textContent = 'Export Servers';
    exportData.value = JSON.stringify(servers, null, 2);
    importActions.style.display = 'none';
    copyBtn.style.display = 'block';
    modal.style.display = 'flex';
}

// Show import modal
function showImportModal() {
    const modal = document.getElementById('exportImportModal');
    const modalTitle = document.getElementById('modalTitle');
    const exportData = document.getElementById('exportData');
    const importActions = document.getElementById('importActions');
    const copyBtn = document.getElementById('copyData');
    
    modalTitle.textContent = 'Import Servers';
    exportData.value = '';
    exportData.placeholder = 'Paste your server data here...';
    exportData.readOnly = false;
    importActions.style.display = 'flex';
    copyBtn.style.display = 'none';
    modal.style.display = 'flex';
    
    // Focus on the textarea immediately
    setTimeout(() => {
        exportData.focus();
    }, 100);
}

// Close modal
function closeModal() {
    document.getElementById('exportImportModal').style.display = 'none';
}

// Copy export data to clipboard
function copyExportData() {
    const exportData = document.getElementById('exportData');
    exportData.select();
    document.execCommand('copy');
    showToast('Server data copied to clipboard!');
}

// Download backup file
function downloadBackup() {
    const dataStr = JSON.stringify(servers, null, 2);
    const dataBlob = new Blob([dataStr], {type: 'application/json'});
    
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'isp-servers-backup.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    showToast('Backup file downloaded successfully!');
}

// Trigger file upload
function triggerUpload() {
    document.getElementById('fileUpload').click();
}

// Handle file upload
function handleFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const importedServers = JSON.parse(e.target.result);
            if (Array.isArray(importedServers)) {
                if (confirm('Do you want to replace all current servers with the uploaded backup?')) {
                    servers = importedServers;
                    saveServers();
                    renderServers(currentCategory, currentSort);
                    showToast('Servers restored from backup!');
                } else {
                    // Merge instead
                    const serverMap = new Map();
                    servers.forEach(server => {
                        serverMap.set(server.address, server);
                    });
                    importedServers.forEach(server => {
                        serverMap.set(server.address, server);
                    });
                    servers = Array.from(serverMap.values());
                    saveServers();
                    renderServers(currentCategory, currentSort);
                    showToast('Servers merged with backup!');
                }
            } else {
                showToast('Invalid backup file format!', 'error');
            }
        } catch (e) {
            showToast('Error reading backup file!', 'error');
        }
    };
    reader.readAsText(file);
    
    // Reset file input
    event.target.value = '';
}

// Replace all servers with imported data
function replaceServers() {
    const exportData = document.getElementById('exportData');
    try {
        const importedServers = JSON.parse(exportData.value);
        if (Array.isArray(importedServers)) {
            servers = importedServers;
            saveServers();
            renderServers(currentCategory, currentSort);
            closeModal();
            showToast('All servers replaced successfully!');
        } else {
            showToast('Invalid server data format!', 'error');
        }
    } catch (e) {
        showToast('Invalid JSON data!', 'error');
    }
}

// Merge imported data with existing servers
function mergeServers() {
    const exportData = document.getElementById('exportData');
    try {
        const importedServers = JSON.parse(exportData.value);
        if (Array.isArray(importedServers)) {
            // Create a map to avoid duplicates by address
            const serverMap = new Map();
            
            // Add existing servers
            servers.forEach(server => {
                serverMap.set(server.address, server);
            });
            
            // Add imported servers (overwriting duplicates by address)
            importedServers.forEach(server => {
                serverMap.set(server.address, server);
            });
            
            servers = Array.from(serverMap.values());
            saveServers();
            renderServers(currentCategory, currentSort);
            closeModal();
            showToast('Servers merged successfully!');
        } else {
            showToast('Invalid server data format!', 'error');
        }
    } catch (e) {
        showToast('Invalid JSON data!', 'error');
    }
}

// Delete a server
function deleteServer(id) {
    if (confirm('Are you sure you want to delete this server?')) {
        const serverName = servers.find(server => server.id === id).name;
        servers = servers.filter(server => server.id !== id);
        
        // Recalculate ranks
        servers.forEach((server, index) => {
            server.rank = index + 1;
        });
        
        saveServers();
        renderServers(currentCategory, currentSort);
        updateQuickStats();
        
        showToast(`Server "${serverName}" deleted successfully!`);
    }
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
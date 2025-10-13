let servers = [];

// Load servers from localStorage
document.addEventListener('DOMContentLoaded', function() {
    const savedServers = localStorage.getItem('ispServers');
    if (savedServers) {
        servers = JSON.parse(savedServers);
    }
    
    renderDiagnostics();
    setupEventListeners();
});

function renderDiagnostics() {
    updateHealthOverview();
    renderServerStatusGrid();
    renderAlerts();
}

function updateHealthOverview() {
    const onlineServers = servers.filter(s => s.status === 'active' && (!s.responseTime || s.responseTime < 300)).length;
    const offlineServers = servers.filter(s => s.status === 'inactive' || (s.responseTime && s.responseTime >= 300)).length;
    
    // Calculate average response time
    const serversWithResponse = servers.filter(s => s.responseTime);
    const avgResponse = serversWithResponse.length > 0 
        ? Math.round(serversWithResponse.reduce((sum, server) => sum + server.responseTime, 0) / serversWithResponse.length)
        : 0;
    
    // Calculate average uptime
    const avgUptime = servers.length > 0 
        ? Math.round(servers.reduce((sum, server) => sum + (server.uptime || 100), 0) / servers.length)
        : 100;

    document.getElementById('onlineServers').textContent = onlineServers;
    document.getElementById('offlineServers').textContent = offlineServers;
    document.getElementById('avgResponse').textContent = `${avgResponse}ms`;
    document.getElementById('uptimePercent').textContent = `${avgUptime}%`;
}

function renderServerStatusGrid() {
    const grid = document.getElementById('serverStatusGrid');
    grid.innerHTML = '';

    if (servers.length === 0) {
        grid.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-server"></i>
                <h3>No servers found</h3>
                <p>Add some servers in the main page first</p>
            </div>
        `;
        return;
    }

    servers.forEach(server => {
        const isOnline = server.status === 'active' && (!server.responseTime || server.responseTime < 300);
        const statusClass = isOnline ? 'online' : 'offline';
        const statusText = isOnline ? 'Online' : 'Offline';
        const statusIcon = isOnline ? 'fa-check-circle' : 'fa-times-circle';

        const card = document.createElement('div');
        card.className = `server-status-card ${statusClass}`;
        card.innerHTML = `
            <div class="server-status-header">
                <div>
                    <div class="server-status-name">${server.name}</div>
                    <div class="server-status-address">${server.address}</div>
                </div>
                <div class="status-indicator status-${statusClass}">
                    <i class="fas ${statusIcon}"></i>
                    ${statusText}
                </div>
            </div>
            
            <div class="server-metrics">
                <div class="metric">
                    <div class="metric-value">${server.responseTime || 'N/A'}</div>
                    <div class="metric-label">Response Time</div>
                </div>
                <div class="metric">
                    <div class="metric-value">${server.uptime || 100}%</div>
                    <div class="metric-label">Uptime</div>
                </div>
                <div class="metric">
                    <div class="metric-value">${server.usageCount || 0}</div>
                    <div class="metric-label">Usage Count</div>
                </div>
                <div class="metric">
                    <div class="metric-value">${server.lastTested ? formatTimeAgo(server.lastTested) : 'Never'}</div>
                    <div class="metric-label">Last Tested</div>
                </div>
            </div>
            
            <div class="server-actions">
                <button class="btn btn-primary" onclick="testSingleServer(${server.id})">
                    <i class="fas fa-heartbeat"></i> Test Now
                </button>
                <button class="btn btn-secondary" onclick="viewServerDetails(${server.id})">
                    <i class="fas fa-info-circle"></i> Details
                </button>
            </div>
        `;
        grid.appendChild(card);
    });
}

function renderAlerts() {
    const alertsList = document.getElementById('alertsList');
    alertsList.innerHTML = '';

    // Generate sample alerts based on server status
    const alerts = [];
    
    servers.forEach(server => {
        if (server.responseTime > 500) {
            alerts.push({
                type: 'warning',
                title: 'High Response Time',
                description: `${server.name} is responding slowly (${server.responseTime}ms)`,
                time: Date.now() - 300000 // 5 minutes ago
            });
        }
        
        if (server.status === 'inactive') {
            alerts.push({
                type: 'critical',
                title: 'Server Offline',
                description: `${server.name} is currently offline`,
                time: Date.now() - 900000 // 15 minutes ago
            });
        }
        
        if ((server.uptime || 100) < 90) {
            alerts.push({
                type: 'warning',
                title: 'Low Uptime',
                description: `${server.name} has low uptime (${server.uptime}%)`,
                time: Date.now() - 1800000 // 30 minutes ago
            });
        }
    });

    // Add sample info alert if no critical alerts
    if (alerts.length === 0) {
        alerts.push({
            type: 'info',
            title: 'All Systems Normal',
            description: 'All servers are operating within normal parameters',
            time: Date.now() - 60000 // 1 minute ago
        });
    }

    alerts.forEach(alert => {
        const alertItem = document.createElement('div');
        alertItem.className = `alert-item ${alert.type}`;
        
        const icon = alert.type === 'critical' ? 'fa-exclamation-triangle' : 
                    alert.type === 'warning' ? 'fa-exclamation-circle' : 'fa-info-circle';
        
        alertItem.innerHTML = `
            <div class="alert-icon">
                <i class="fas ${icon}"></i>
            </div>
            <div class="alert-content">
                <div class="alert-title">${alert.title}</div>
                <div class="alert-description">${alert.description}</div>
            </div>
            <div class="alert-time">${formatTimeAgo(alert.time)}</div>
        `;
        alertsList.appendChild(alertItem);
    });
}

function testAllServers() {
    showToast('Testing all servers...');
    
    // Simulate testing all servers
    servers.forEach((server, index) => {
        setTimeout(() => {
            // Simulate connection test
            const responseTime = Math.floor(Math.random() * 600) + 50;
            server.responseTime = responseTime;
            server.lastTested = Date.now();
            server.status = responseTime < 300 ? 'active' : 'inactive';
            server.uptime = Math.max(80, Math.min(100, 100 - Math.random() * 20)); // Random uptime 80-100%
            
            // Update localStorage
            localStorage.setItem('ispServers', JSON.stringify(servers));
            
            // Re-render if this is the last server
            if (index === servers.length - 1) {
                renderDiagnostics();
                showToast('All servers tested successfully!');
            }
        }, index * 500); // Stagger tests
    });
}

function testSingleServer(serverId) {
    const server = servers.find(s => s.id === serverId);
    if (server) {
        showToast(`Testing ${server.name}...`);
        
        // Update UI to show testing state
        const card = document.querySelector(`[onclick="testSingleServer(${serverId})"]`).closest('.server-status-card');
        card.classList.add('testing');
        
        setTimeout(() => {
            // Simulate connection test
            const responseTime = Math.floor(Math.random() * 600) + 50;
            server.responseTime = responseTime;
            server.lastTested = Date.now();
            server.status = responseTime < 300 ? 'active' : 'inactive';
            server.uptime = Math.max(80, Math.min(100, 100 - Math.random() * 20));
            
            // Update localStorage
            localStorage.setItem('ispServers', JSON.stringify(servers));
            
            // Re-render diagnostics
            renderDiagnostics();
            showToast(`Test completed: ${responseTime}ms`);
        }, 1000);
    }
}

function viewServerDetails(serverId) {
    // In a real implementation, this would show a detailed modal
    const server = servers.find(s => s.id === serverId);
    if (server) {
        alert(`Server Details:\n\nName: ${server.name}\nAddress: ${server.address}\nResponse Time: ${server.responseTime || 'N/A'}ms\nUptime: ${server.uptime || 100}%\nLast Tested: ${server.lastTested ? new Date(server.lastTested).toLocaleString() : 'Never'}`);
    }
}

function setupEventListeners() {
    document.getElementById('backBtn').addEventListener('click', function() {
        window.location.href = 'index.html';
    });
    
    document.getElementById('testAllBtn').addEventListener('click', testAllServers);
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

function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = type === 'error' ? 'toast error' : 'toast';
    toast.classList.add('show');
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

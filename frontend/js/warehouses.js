const API = "http://localhost:5196/api";

const WAREHOUSE_PROFILES = {
    "W1": { icon: "pill", color: "signal-red", theme: "Pharma Cold Storage" },
    "W2": { icon: "package", color: "signal-blue", theme: "General Goods Depot" },
    "W3": { icon: "shopping-bag", color: "signal-violet", theme: "Retail Distribution" }
};

document.addEventListener("DOMContentLoaded", () => {
    console.log("BYL Debug: Warehouses JS Loaded successfully.");
    loadWarehouseData();
});

let warehousesCache = [];

async function loadWarehouseData() {
    const grid = document.getElementById("warehouse-grid");
    try {
        console.log("BYL Debug: Fetching warehouses from: " + `${API}/warehouses`);
        const res = await fetch(`${API}/warehouses`);
        
        if (!res.ok) throw new Error(`API returned HTTP Status ${res.status}`);

        warehousesCache = await res.json();
        console.log("BYL Debug: Data fetched successfully:", warehousesCache);

        renderWarehouseGrid(warehousesCache);

        document.getElementById("status-dot").className = "status-dot";
        document.getElementById("status-text").textContent = "Connected";
        document.getElementById("last-sync").textContent = "Last sync: " + new Date().toLocaleTimeString();
    } catch (err) {
        console.error("BYL Debug Error caught in loadWarehouseData:", err);
        
        // Update Status indicator to Offline
        document.getElementById("status-dot").className = "status-dot offline";
        document.getElementById("status-text").textContent = "Offline (Error)";
        
        // Print the actual error on the screen in a red alert box!
        if (grid) {
            grid.innerHTML = `
                <div style="grid-column: 1/-1; background: var(--signal-red-bg); color: var(--signal-red); border: 1px solid #FECACA; padding: 20px; border-radius: var(--radius-md); font-weight: 500;">
                    <div style="font-weight: 700; font-size: 15px; margin-bottom: 8px; display: flex; align-items: center; gap: 8px;">
                        ⚠️ System Load Failure
                    </div>
                    <div style="font-size: 13px; font-family: monospace; background: rgba(0,0,0,0.05); padding: 10px; border-radius: 4px; margin-bottom: 10px;">
                        ${err.message}
                    </div>
                    <div style="font-size: 12px; color: var(--text-secondary);">
                        Please verify that the C# Backend is running on port 5196 and SQL Server tables are seeded. Open browser Console (F12) for detailed stack trace.
                    </div>
                </div>
            `;
        }
    }
}

function renderWarehouseGrid(warehouses) {
    const grid = document.getElementById("warehouse-grid");
    if (!grid) {
        console.error("BYL Debug: Element 'warehouse-grid' not found in HTML!");
        return;
    }
    grid.innerHTML = "";

    if (warehouses.length === 0) {
        grid.innerHTML = `<div style="grid-column: 1/-1; text-align:center; padding: 40px; color: var(--text-muted);">No warehouses registered in the network database.</div>`;
        return;
    }

    warehouses.forEach(w => {
        const profile = WAREHOUSE_PROFILES[w.warehouseID] || { icon: "warehouse", color: "signal-blue", theme: w.type };
        const utilPct = w.capacity > 0 ? ((w.currentLoad / w.capacity) * 100).toFixed(1) : 0;
        const utilClass = utilPct > 80 ? "fill-red" : utilPct > 50 ? "fill-amber" : "fill-green";

        const card = document.createElement("div");
        card.className = "warehouse-card";
        card.onclick = () => openWarehouseDetail(w.warehouseID);

        card.innerHTML = `
            <div class="wh-card-header">
                <div class="wh-icon-badge" style="background:var(--${profile.color}-bg); color:var(--${profile.color});">
                    <i data-lucide="${profile.icon}"></i>
                </div>
                <div style="flex:1;">
                    <div class="wh-card-id">${w.warehouseID}</div>
                    <div class="wh-card-name">${w.name}</div>
                </div>
            </div>
            <div class="wh-card-location">
                <i data-lucide="map-pin"></i> ${w.location}
            </div>
            <div class="wh-card-specialization">${profile.theme}</div>
            <div class="wh-utilization">
                <div class="wh-util-header">
                    <span>Capacity Utilization</span>
                    <span class="wh-util-pct">${utilPct}%</span>
                </div>
                <div class="kpi-bar-track">
                    <div class="kpi-bar-fill ${utilClass}" style="width:${utilPct}%;"></div>
                </div>
                <div class="wh-util-numbers">${w.currentLoad} / ${w.capacity} units</div>
            </div>
            <button class="btn btn-primary btn-sm" style="width:100%; margin-top:12px;">
                <i data-lucide="eye"></i> View Full Report
            </button>
        `;

        grid.appendChild(card);
    });

    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    } else {
        console.warn("BYL Debug: Lucide library not loaded yet.");
    }
}

async function openWarehouseDetail(id) {
    try {
        const res = await fetch(`${API}/warehouses/${id}`);
        if (!res.ok) throw new Error("Could not load warehouse detail.");

        const data = await res.json();
        const w = data.warehouse;
        const profile = WAREHOUSE_PROFILES[id] || { icon: "warehouse", color: "signal-blue" };

        document.getElementById("detail-wh-name").textContent = `${w.warehouseID} — ${w.name}`;

        let stockHtml = "";
        if (data.stockInventory.length === 0) {
            stockHtml = `<div style="color:var(--text-dim);text-align:center;padding:12px;">No stock records</div>`;
        } else {
            stockHtml = data.stockInventory.map(s => {
                const pct = (s.currentUnits / s.maximumCapacity * 100).toFixed(0);
                const isCritical = s.currentUnits < s.minimumRequired;
                const barClass = isCritical ? "fill-red" : pct > 70 ? "fill-green" : "fill-amber";
                return `
                <div class="stock-item">
                    <div class="stock-item-header">
                        <span class="stock-cargo">${s.cargoType}</span>
                        <span class="${isCritical ? 'badge badge-high' : 'badge badge-low'}">
                            ${s.currentUnits} units ${isCritical ? '• LOW' : '• OK'}
                        </span>
                    </div>
                    <div class="kpi-bar-track" style="margin-top:6px;">
                        <div class="kpi-bar-fill ${barClass}" style="width:${pct}%;"></div>
                    </div>
                    <div class="stock-numbers">Min: ${s.minimumRequired} • Max: ${s.maximumCapacity}</div>
                </div>`;
            }).join("");
        }

        let incomingHtml = "";
        if (data.incomingShipments.length === 0) {
            incomingHtml = `<div style="color:var(--text-dim);text-align:center;padding:12px;">No incoming shipments</div>`;
        } else {
            incomingHtml = data.incomingShipments.map(c => `
                <div class="incoming-item">
                    <div style="flex:1;">
                        <div style="font-weight:700;color:var(--text-white);">${c.containerID} • ${c.cargoType}</div>
                        <div style="font-size:11.5px;color:var(--text-muted);">Vehicle: ${c.assignedVehicleID || '--'} • Route: ${c.optimalRoute || '--'}</div>
                    </div>
                    <div style="display:flex;gap:6px;">
                        ${c.status === "Dispatched" 
                            ? `<button class="btn btn-primary btn-sm" onclick="confirmArrival('${id}','${c.containerID}')"><i data-lucide="check"></i></button>
                               <button class="btn btn-ghost btn-sm" onclick="flagDelay('${id}','${c.containerID}')"><i data-lucide="alert-triangle"></i></button>`
                            : `<span class="badge badge-${c.status.toLowerCase()}">${c.status}</span>`
                        }
                    </div>
                </div>
            `).join("");
        }

        let commsHtml = "";
        if (data.communicationLog.length === 0) {
            commsHtml = `<div style="color:var(--text-dim);text-align:center;padding:12px;">No communications</div>`;
        } else {
            commsHtml = data.communicationLog.map(m => {
                const dotClass = m.priority === "High" ? "critical" : m.messageType === "ArrivalConfirmation" ? "success" : "info";
                return `
                <div class="comm-item">
                    <span class="alert-dot ${dotClass}"></span>
                    <div style="flex:1;">
                        <div style="font-size:11px;color:var(--accent-glow);font-weight:700;text-transform:uppercase;">${m.messageType}</div>
                        <div class="alert-text" style="margin-top:4px;">${m.message}</div>
                        <div class="alert-time">${new Date(m.timestamp).toLocaleString()}</div>
                    </div>
                </div>`;
            }).join("");
        }

        document.getElementById("warehouse-detail-body").innerHTML = `
            <div class="wh-detail-overview">
                <div class="spec-row"><span class="spec-label">Facility ID</span><span class="spec-value">${w.warehouseID}</span></div>
                <div class="spec-row"><span class="spec-label">Specialization</span><span class="spec-value">${w.type}</span></div>
                <div class="spec-row"><span class="spec-label">Location</span><span class="spec-value">${w.location}</span></div>
                <div class="spec-row"><span class="spec-label">Capacity Utilization</span><span class="spec-value" style="color:var(--accent-glow);font-weight:700;">${data.utilizationPercent}%</span></div>
            </div>

            <div class="wh-section">
                <div class="wh-section-title">
                    <i data-lucide="package"></i> Stock Inventory Status
                    ${data.criticalDemands.length > 0 ? `<span class="badge badge-high" style="margin-left:8px;">${data.criticalDemands.length} CRITICAL</span>` : ''}
                </div>
                <div class="stock-list">${stockHtml}</div>
            </div>

            <div class="wh-section">
                <div class="wh-section-title">
                    <i data-lucide="truck"></i> Incoming Shipments (${data.incomingShipments.length})
                </div>
                <div class="incoming-list">${incomingHtml}</div>
            </div>

            <div class="wh-section">
                <div class="wh-section-title">
                    <i data-lucide="message-square"></i> Communication Log with Port
                </div>
                <div class="comm-list">${commsHtml}</div>
            </div>
        `;

        document.getElementById("warehouse-detail-overlay").style.display = "flex";
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }

    } catch (err) {
        alert("Error loading warehouse details: " + err.message);
    }
}

function closeWarehouseDetail(event) {
    if (event && event.target !== event.currentTarget) return;
    document.getElementById("warehouse-detail-overlay").style.display = "none";
}

async function confirmArrival(whId, containerId) {
    if (!confirm(`Confirm arrival of ${containerId} at ${whId}?`)) return;
    try {
        const res = await fetch(`${API}/warehouses/${whId}/confirm-arrival/${containerId}`, { method: "POST" });
        if (!res.ok) throw new Error("Confirmation failed");
        alert(`Arrival of ${containerId} confirmed successfully!`);
        openWarehouseDetail(whId);
    } catch (err) {
        alert("Error: " + err.message);
    }
}

async function flagDelay(whId, containerId) {
    if (!confirm(`Flag ${containerId} as delayed?`)) return;
    try {
        const res = await fetch(`${API}/warehouses/${whId}/flag-delay/${containerId}`, { method: "POST" });
        if (!res.ok) throw new Error("Flag failed");
        alert(`Delay warning sent for ${containerId}!`);
        openWarehouseDetail(whId);
    } catch (err) {
        alert("Error: " + err.message);
    }
}
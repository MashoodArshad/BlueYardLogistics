const API = "http://localhost:5196/api";

// Vehicle metadata with realistic names and SVG illustrations
const VEHICLE_PROFILES = {
    "V1": {
        name: "Arctic Wolf — Reefer Truck",
        class: "Temperature-Controlled Cold Chain",
        svg: `<svg viewBox="0 0 200 100" class="vehicle-svg">
            <rect x="10" y="30" width="120" height="45" rx="4" fill="rgba(74,144,212,0.2)" stroke="rgba(74,144,212,0.4)" stroke-width="1.5"/>
            <rect x="15" y="35" width="110" height="10" rx="2" fill="rgba(34,212,127,0.15)" stroke="rgba(34,212,127,0.3)" stroke-width="0.5"/>
            <text x="70" y="43" text-anchor="middle" fill="rgba(34,212,127,0.6)" font-size="5" font-weight="700">REFRIGERATED</text>
            <rect x="130" y="42" width="35" height="33" rx="3" fill="rgba(127,182,224,0.2)" stroke="rgba(74,144,212,0.3)" stroke-width="1"/>
            <rect x="138" y="48" width="18" height="8" rx="1" fill="rgba(240,244,248,0.1)"/>
            <circle cx="35" cy="80" r="8" fill="rgba(240,244,248,0.08)" stroke="rgba(240,244,248,0.15)" stroke-width="1.5"/>
            <circle cx="100" cy="80" r="8" fill="rgba(240,244,248,0.08)" stroke="rgba(240,244,248,0.15)" stroke-width="1.5"/>
            <circle cx="150" cy="80" r="7" fill="rgba(240,244,248,0.08)" stroke="rgba(240,244,248,0.15)" stroke-width="1.5"/>
            <circle cx="168" cy="50" r="3" fill="rgba(245,200,100,0.6)"/>
        </svg>`
    },
    "V2": {
        name: "Iron Stallion — Flatbed Truck",
        class: "Open-Deck Heavy Cargo Hauler",
        svg: `<svg viewBox="0 0 200 100" class="vehicle-svg">
            <rect x="10" y="40" width="120" height="8" rx="1" fill="rgba(245,166,35,0.2)" stroke="rgba(245,166,35,0.3)" stroke-width="1"/>
            <rect x="15" y="30" width="30" height="18" rx="2" fill="rgba(245,166,35,0.15)"/>
            <rect x="50" y="25" width="35" height="23" rx="2" fill="rgba(74,144,212,0.15)"/>
            <rect x="90" y="32" width="25" height="16" rx="2" fill="rgba(255,77,94,0.15)"/>
            <rect x="130" y="35" width="35" height="30" rx="3" fill="rgba(127,182,224,0.2)" stroke="rgba(74,144,212,0.3)" stroke-width="1"/>
            <rect x="138" y="41" width="18" height="8" rx="1" fill="rgba(240,244,248,0.1)"/>
            <circle cx="35" cy="55" r="8" fill="rgba(240,244,248,0.08)" stroke="rgba(240,244,248,0.15)" stroke-width="1.5"/>
            <circle cx="100" cy="55" r="8" fill="rgba(240,244,248,0.08)" stroke="rgba(240,244,248,0.15)" stroke-width="1.5"/>
            <circle cx="150" cy="70" r="7" fill="rgba(240,244,248,0.08)" stroke="rgba(240,244,248,0.15)" stroke-width="1.5"/>
            <circle cx="168" cy="42" r="3" fill="rgba(245,200,100,0.6)"/>
        </svg>`
    },
    "V3": {
        name: "Shadow Hawk — Medium Cargo Truck",
        class: "Enclosed Medium-Duty Transport",
        svg: `<svg viewBox="0 0 200 100" class="vehicle-svg">
            <rect x="10" y="30" width="100" height="40" rx="4" fill="rgba(155,127,230,0.15)" stroke="rgba(155,127,230,0.3)" stroke-width="1.5"/>
            <rect x="110" y="38" width="35" height="32" rx="3" fill="rgba(127,182,224,0.2)" stroke="rgba(74,144,212,0.3)" stroke-width="1"/>
            <rect x="118" y="44" width="18" height="8" rx="1" fill="rgba(240,244,248,0.1)"/>
            <circle cx="30" cy="76" r="8" fill="rgba(240,244,248,0.08)" stroke="rgba(240,244,248,0.15)" stroke-width="1.5"/>
            <circle cx="85" cy="76" r="8" fill="rgba(240,244,248,0.08)" stroke="rgba(240,244,248,0.15)" stroke-width="1.5"/>
            <circle cx="130" cy="76" r="7" fill="rgba(240,244,248,0.08)" stroke="rgba(240,244,248,0.15)" stroke-width="1.5"/>
            <circle cx="148" cy="45" r="3" fill="rgba(245,200,100,0.6)"/>
        </svg>`
    },
    "V4": {
        name: "Titan Prime — Heavy Hauler",
        class: "Maximum Payload Industrial Carrier",
        svg: `<svg viewBox="0 0 200 100" class="vehicle-svg">
            <rect x="5" y="25" width="130" height="50" rx="4" fill="rgba(255,77,94,0.12)" stroke="rgba(255,77,94,0.25)" stroke-width="1.5"/>
            <text x="70" y="55" text-anchor="middle" fill="rgba(255,77,94,0.4)" font-size="7" font-weight="700">HEAVY LOAD</text>
            <rect x="135" y="35" width="40" height="40" rx="3" fill="rgba(127,182,224,0.2)" stroke="rgba(74,144,212,0.3)" stroke-width="1"/>
            <rect x="143" y="42" width="22" height="10" rx="1" fill="rgba(240,244,248,0.1)"/>
            <circle cx="25" cy="82" r="9" fill="rgba(240,244,248,0.08)" stroke="rgba(240,244,248,0.15)" stroke-width="1.5"/>
            <circle cx="55" cy="82" r="9" fill="rgba(240,244,248,0.08)" stroke="rgba(240,244,248,0.15)" stroke-width="1.5"/>
            <circle cx="100" cy="82" r="9" fill="rgba(240,244,248,0.08)" stroke="rgba(240,244,248,0.15)" stroke-width="1.5"/>
            <circle cx="155" cy="82" r="8" fill="rgba(240,244,248,0.08)" stroke="rgba(240,244,248,0.15)" stroke-width="1.5"/>
            <circle cx="178" cy="42" r="3" fill="rgba(245,200,100,0.6)"/>
        </svg>`
    },
    "V5": {
        name: "Swift Fox — Light Van",
        class: "Rapid Last-Mile Delivery Unit",
        svg: `<svg viewBox="0 0 200 100" class="vehicle-svg">
            <rect x="20" y="35" width="80" height="35" rx="6" fill="rgba(34,212,127,0.12)" stroke="rgba(34,212,127,0.25)" stroke-width="1.5"/>
            <rect x="100" y="40" width="30" height="30" rx="4" fill="rgba(127,182,224,0.2)" stroke="rgba(74,144,212,0.3)" stroke-width="1"/>
            <rect x="106" y="46" width="16" height="7" rx="1" fill="rgba(240,244,248,0.1)"/>
            <circle cx="40" cy="76" r="7" fill="rgba(240,244,248,0.08)" stroke="rgba(240,244,248,0.15)" stroke-width="1.5"/>
            <circle cx="80" cy="76" r="7" fill="rgba(240,244,248,0.08)" stroke="rgba(240,244,248,0.15)" stroke-width="1.5"/>
            <circle cx="115" cy="76" r="6" fill="rgba(240,244,248,0.08)" stroke="rgba(240,244,248,0.15)" stroke-width="1.5"/>
            <circle cx="133" cy="47" r="2.5" fill="rgba(245,200,100,0.6)"/>
        </svg>`
    },
    "V6": {
        name: "Polar Bear — Reefer Truck II",
        class: "Secondary Cold Chain Unit",
        svg: `<svg viewBox="0 0 200 100" class="vehicle-svg">
            <rect x="10" y="30" width="120" height="45" rx="4" fill="rgba(74,144,212,0.2)" stroke="rgba(74,144,212,0.4)" stroke-width="1.5"/>
            <rect x="15" y="35" width="110" height="10" rx="2" fill="rgba(34,212,127,0.15)" stroke="rgba(34,212,127,0.3)" stroke-width="0.5"/>
            <text x="70" y="43" text-anchor="middle" fill="rgba(34,212,127,0.6)" font-size="5" font-weight="700">REFRIGERATED</text>
            <rect x="130" y="42" width="35" height="33" rx="3" fill="rgba(127,182,224,0.2)" stroke="rgba(74,144,212,0.3)" stroke-width="1"/>
            <circle cx="35" cy="80" r="8" fill="rgba(240,244,248,0.08)" stroke="rgba(240,244,248,0.15)" stroke-width="1.5"/>
            <circle cx="100" cy="80" r="8" fill="rgba(240,244,248,0.08)" stroke="rgba(240,244,248,0.15)" stroke-width="1.5"/>
            <circle cx="150" cy="80" r="7" fill="rgba(240,244,248,0.08)" stroke="rgba(240,244,248,0.15)" stroke-width="1.5"/>
        </svg>`
    }
};

document.addEventListener("DOMContentLoaded", () => {
    loadFleetData();
});

let vehiclesCache = [];
let containersCache = [];

async function loadFleetData() {
    try {
        const [vRes, cRes] = await Promise.all([
            fetch(`${API}/vehicles`),
            fetch(`${API}/containers`)
        ]);
        if (!vRes.ok || !cRes.ok) throw new Error("Fleet data unavailable.");

        vehiclesCache = await vRes.json();
        containersCache = await cRes.json();

        renderFleetGrid(vehiclesCache);

        document.getElementById("status-dot").className = "status-dot";
        document.getElementById("status-text").textContent = "Connected";
        document.getElementById("last-sync").textContent = "Last sync: " + new Date().toLocaleTimeString();
    } catch (err) {
        document.getElementById("status-dot").className = "status-dot offline";
        document.getElementById("status-text").textContent = "Offline";
    }
}

function renderFleetGrid(vehicles) {
    const grid = document.getElementById("fleet-grid");
    grid.innerHTML = "";

    vehicles.forEach(v => {
        const profile = VEHICLE_PROFILES[v.vehicleID] || { name: v.vehicleID, class: v.type, svg: "" };
        const isAvailable = v.status === "Available";
        const statusClass = isAvailable ? "fleet-available" : "fleet-transit";
        const statusLabel = isAvailable ? "Available" : "In Transit";
        const badgeClass = isAvailable ? "badge-available" : "badge-dispatched";

        const card = document.createElement("div");
        card.className = `fleet-card ${statusClass}`;
        card.onclick = () => openFleetDetail(v.vehicleID);

        card.innerHTML = `
            <div class="fleet-card-visual">
                ${profile.svg}
            </div>
            <div class="fleet-card-info">
                <div class="fleet-card-name">${profile.name}</div>
                <div class="fleet-card-class">${profile.class}</div>
                <div class="fleet-card-stats">
                    <span class="fleet-stat"><i data-lucide="weight"></i> ${v.capacityKg.toLocaleString()} kg</span>
                    <span class="fleet-stat"><i data-lucide="map-pin"></i> ${v.currentLocation}</span>
                </div>
                <span class="badge ${badgeClass}">${statusLabel}</span>
            </div>
        `;

        grid.appendChild(card);
    });

    lucide.createIcons();
}

function openFleetDetail(vehicleId) {
    const vehicle = vehiclesCache.find(v => v.vehicleID === vehicleId);
    if (!vehicle) return;

    const profile = VEHICLE_PROFILES[vehicleId] || { name: vehicleId, class: vehicle.type, svg: "" };
    const assignedContainer = containersCache.find(c => c.assignedVehicleID === vehicleId);
    const isAvailable = vehicle.status === "Available";

    document.getElementById("detail-vehicle-name").textContent = profile.name;

    let bodyHtml = `
        <div class="fleet-detail-visual">${profile.svg}</div>
        <div class="fleet-detail-specs">
            <div class="spec-row"><span class="spec-label">Vehicle ID</span><span class="spec-value">${vehicle.vehicleID}</span></div>
            <div class="spec-row"><span class="spec-label">Classification</span><span class="spec-value">${profile.class}</span></div>
            <div class="spec-row"><span class="spec-label">Max Payload</span><span class="spec-value">${vehicle.capacityKg.toLocaleString()} kg</span></div>
            <div class="spec-row"><span class="spec-label">Current Position</span><span class="spec-value">${vehicle.currentLocation}</span></div>
            <div class="spec-row"><span class="spec-label">Operational Status</span><span class="spec-value"><span class="badge ${isAvailable ? 'badge-available' : 'badge-dispatched'}">${vehicle.status}</span></span></div>
        </div>
    `;

    if (assignedContainer) {
        bodyHtml += `
        <div class="fleet-detail-mission">
            <div class="mission-header">Active Mission Assignment</div>
            <div class="spec-row"><span class="spec-label">Container Unit</span><span class="spec-value" style="color:var(--accent-glow);font-weight:700;">${assignedContainer.containerID}</span></div>
            <div class="spec-row"><span class="spec-label">Cargo Category</span><span class="spec-value">${assignedContainer.cargoType}</span></div>
            <div class="spec-row"><span class="spec-label">Cargo Weight</span><span class="spec-value">${assignedContainer.weightKg.toLocaleString()} kg</span></div>
            <div class="spec-row"><span class="spec-label">Final Destination</span><span class="spec-value">${assignedContainer.destination}</span></div>
            <div class="spec-row"><span class="spec-label">Assigned Warehouse</span><span class="spec-value">${assignedContainer.assignedWarehouseID || '--'}</span></div>
            <div class="spec-row"><span class="spec-label">Computed Highway Route</span><span class="spec-value" style="color:var(--accent-glow);font-family:monospace;">${assignedContainer.optimalRoute || '--'}</span></div>
            <div class="spec-row"><span class="spec-label">Total Transit Distance</span><span class="spec-value" style="color:var(--signal-green);font-weight:700;">${assignedContainer.totalRouteDistanceKm ? assignedContainer.totalRouteDistanceKm + ' km' : '--'}</span></div>
        </div>`;
    } else {
        bodyHtml += `
        <div class="fleet-detail-mission" style="text-align:center; padding:20px; color:var(--text-dim);">
            No active mission. Vehicle is parked and available for dispatch.
        </div>`;
    }

    document.getElementById("fleet-detail-body").innerHTML = bodyHtml;
    document.getElementById("fleet-detail-overlay").style.display = "flex";
    lucide.createIcons();
}

function closeFleetDetail(event) {
    if (event && event.target !== event.currentTarget) return;
    document.getElementById("fleet-detail-overlay").style.display = "none";
}
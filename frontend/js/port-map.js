/* =========================================================================
   BLUE YARD LOGISTICS — Satellite Map Engine Phase 2
   Real Satellite + Animated Routes + Vehicle Tracking + Journey Replay
   ========================================================================= */

const API = "http://localhost:5196/api";
const PORT_CENTER = [66.9837, 24.8375];

const MAP_STYLES = {
    satellite: {
        version: 8,
        sources: {
            'sat': { type: 'raster', tiles: ['https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'], tileSize: 256 },
            'lbl': { type: 'raster', tiles: ['https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}'], tileSize: 256 }
        },
        layers: [
            { id: 'sat-layer', type: 'raster', source: 'sat' },
            { id: 'lbl-layer', type: 'raster', source: 'lbl', paint: { 'raster-opacity': 0.5 } }
        ]
    },
    streets: {
        version: 8,
        sources: { 'osm': { type: 'raster', tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'], tileSize: 256 } },
        layers: [{ id: 'osm-layer', type: 'raster', source: 'osm' }]
    },
    dark: {
        version: 8,
        sources: { 'dark': { type: 'raster', tiles: ['https://basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png'], tileSize: 256 } },
        layers: [{ id: 'dark-layer', type: 'raster', source: 'dark' }]
    }
};

const LOC = {
    "Port":   { lng: 66.9750, lat: 24.8340 },
    "J1":     { lng: 66.9820, lat: 24.8310 },
    "J2":     { lng: 66.9820, lat: 24.8380 },
    "J3":     { lng: 66.9900, lat: 24.8350 },
    "W1":     { lng: 66.9980, lat: 24.8290 },
    "W2":     { lng: 66.9960, lat: 24.8430 },
    "W3":     { lng: 67.0020, lat: 24.8380 },
    "berth1": { lng: 66.9730, lat: 24.8330 },
    "berth2": { lng: 66.9740, lat: 24.8355 },
    "T-A":    { lng: 66.9790, lat: 24.8310 },
    "T-B":    { lng: 66.9800, lat: 24.8345 },
    "T-C":    { lng: 66.9810, lat: 24.8375 },
    "yard":   { lng: 66.9850, lat: 24.8340 },
    "tower":  { lng: 66.9800, lat: 24.8360 },
    "gate":   { lng: 66.9880, lat: 24.8355 },
    "depot":  { lng: 66.9870, lat: 24.8380 }
};

const ROAD_EDGES = [
    ["Port","J1"],["Port","J2"],["J1","J2"],["J1","W1"],
    ["J2","J3"],["J2","W2"],["J3","W1"],["J3","W3"],["W2","W3"]
];

let map, markers = [], routeSources = [], vehicleAnimations = [];
let allContainers = [], allVehicles = [], allWarehouses = [], allVessels = [];

document.addEventListener("DOMContentLoaded", () => {
    initMap();
    initHUDTime();
});

function initMap() {
    updateLoadBar(20);

    map = new maplibregl.Map({
        container: 'port-map',
        style: MAP_STYLES.satellite,
        center: PORT_CENTER,
        zoom: 13.2,
        pitch: 50,
        bearing: -15,
        antialias: true,
        attributionControl: false
    });

    map.addControl(new maplibregl.NavigationControl(), 'bottom-right');
    map.addControl(new maplibregl.ScaleControl({ unit: 'metric' }), 'bottom-left');

    map.on('load', () => {
        updateLoadBar(50);
        drawInfrastructure();
        loadAllData();
    });
}

function drawInfrastructure() {
    // Port boundary zone
    addPolygon('port-zone', [
        [66.969, 24.827],[66.990, 24.827],[66.990, 24.843],[66.969, 24.843],[66.969, 24.827]
    ], '#4A90D4', 0.06);

    // Warehouse district boundary
    addPolygon('wh-zone', [
        [66.993, 24.826],[67.006, 24.826],[67.006, 24.846],[66.993, 24.846],[66.993, 24.826]
    ], '#F5A623', 0.04);

    // Draw all road network edges
    ROAD_EDGES.forEach(([from, to], i) => {
        const f = LOC[from], t = LOC[to];
        if (!f || !t) return;

        const srcId = `road-${i}`;
        map.addSource(srcId, {
            type: 'geojson',
            data: { type: 'Feature', geometry: { type: 'LineString', coordinates: [[f.lng, f.lat],[t.lng, t.lat]] } }
        });

        map.addLayer({
            id: srcId + '-bg',
            type: 'line',
            source: srcId,
            paint: { 'line-color': '#1E293B', 'line-width': 8, 'line-opacity': 0.4 }
        });

        map.addLayer({
            id: srcId + '-line',
            type: 'line',
            source: srcId,
            paint: { 'line-color': '#94A3B8', 'line-width': 3, 'line-opacity': 0.5, 'line-dasharray': [3, 2] }
        });

        routeSources.push(srcId);
    });

    // Draw node circles for junctions
    Object.entries(LOC).forEach(([key, coord]) => {
        if (["berth1","berth2","depot","gate"].includes(key)) return;
        const srcId = `node-${key}`;
        map.addSource(srcId, {
            type: 'geojson',
            data: { type: 'Feature', geometry: { type: 'Point', coordinates: [coord.lng, coord.lat] } }
        });
        map.addLayer({
            id: srcId + '-circle',
            type: 'circle',
            source: srcId,
            paint: {
                'circle-radius': key.startsWith('W') ? 8 : key.startsWith('J') ? 5 : key === 'Port' ? 10 : 6,
                'circle-color': key.startsWith('W') ? '#F5A623' : key === 'Port' ? '#4A90D4' : '#64748B',
                'circle-stroke-width': 2,
                'circle-stroke-color': '#FFFFFF',
                'circle-opacity': 0.8
            }
        });
    });

    updateLoadBar(70);
}

function addPolygon(id, coords, color, opacity) {
    map.addSource(id, {
        type: 'geojson',
        data: { type: 'Feature', geometry: { type: 'Polygon', coordinates: [coords] } }
    });
    map.addLayer({ id: id + '-fill', type: 'fill', source: id, paint: { 'fill-color': color, 'fill-opacity': opacity } });
    map.addLayer({ id: id + '-line', type: 'line', source: id, paint: { 'line-color': color, 'line-width': 1.5, 'line-opacity': 0.4, 'line-dasharray': [5, 3] } });
}

async function loadAllData() {
    try {
        const [vRes, cRes, vhRes, wRes] = await Promise.all([
            fetch(`${API}/vessels`), fetch(`${API}/containers`),
            fetch(`${API}/vehicles`), fetch(`${API}/warehouses`)
        ]);
        if (vRes.ok) allVessels = await vRes.json();
        if (cRes.ok) allContainers = await cRes.json();
        if (vhRes.ok) allVehicles = await vhRes.json();
        if (wRes.ok) allWarehouses = await wRes.json();
    } catch (e) {
        console.warn("BYL: API offline, using fallback.");
    }

    placeAllMarkers();
    drawActiveRoutes();
    startVehicleTracking();
    updateLoadBar(100);
}

function placeAllMarkers() {
    markers.forEach(m => m.remove());
    markers = [];

    // Vessels
    allVessels.forEach((v, i) => {
        const loc = LOC[`berth${i+1}`] || LOC.berth1;
        addMarker(loc, 'vessel', v.vesselID, 'ship', '#1A5BA0', () => {
            const vc = allContainers.filter(c => c.vesselID === v.vesselID);
            showPanel('vessel', { ...v, containers: vc });
            flyTo(loc, 15.5);
        });
    });

    // Terminals
    ['T-A','T-B','T-C'].forEach(id => {
        const loc = LOC[id];
        addMarker(loc, 'terminal', id, 'building-2', '#7C3AED', () => {
            const tc = allContainers.filter(c => c.assignedTerminalID === id);
            showPanel('terminal', { id, name: id, containers: tc });
            flyTo(loc, 15.5);
        });
    });

    // Warehouses
    allWarehouses.forEach(w => {
        const loc = LOC[w.warehouseID];
        if (!loc) return;
        addMarker(loc, 'warehouse', w.warehouseID, 'warehouse', '#D97706', () => {
            const wc = allContainers.filter(c => c.assignedWarehouseID === w.warehouseID);
            showPanel('warehouse', { ...w, containers: wc });
            flyTo(loc, 15);
        });
    });

    // Control Tower
    addMarker(LOC.tower, 'tower', 'CTRL', 'radio-tower', '#DC2626', () => {
        showPanel('tower', { vessels: allVessels.length, containers: allContainers.length });
        flyTo(LOC.tower, 15);
    });

    lucide.createIcons();
}

function addMarker(loc, type, label, icon, color, onClick) {
    const el = document.createElement('div');
    el.className = 'custom-marker';
    el.style.cursor = 'pointer';

    const isVessel = type === 'vessel';
    const isVehicle = type === 'vehicle';
    const size = isVessel ? 38 : isVehicle ? 26 : 30;
    const radius = isVessel ? '50% 50% 50% 0' : isVehicle ? '50%' : '6px';
    const rotate = isVessel ? 'transform:rotate(-45deg);' : '';

    el.innerHTML = `
        <div style="width:${size}px;height:${size}px;background:linear-gradient(135deg,${color},${lighten(color)});border:2px solid white;border-radius:${radius};display:flex;align-items:center;justify-content:center;box-shadow:0 3px 10px rgba(0,0,0,0.4);${rotate}${isVehicle ? 'animation:vehiclePulse 2s ease-in-out infinite;' : ''}">
            <i data-lucide="${icon}" style="color:white;width:${size*0.4}px;height:${size*0.4}px;${isVessel ? 'transform:rotate(45deg);' : ''}"></i>
        </div>
        <div class="marker-label">${label}</div>
    `;

    const marker = new maplibregl.Marker({ element: el, anchor: 'bottom' })
        .setLngLat([loc.lng, loc.lat])
        .addTo(map);

    el.addEventListener('click', (e) => { e.stopPropagation(); onClick(); });
    markers.push(marker);
    return marker;
}

function lighten(hex) {
    const r = parseInt(hex.slice(1,3),16), g = parseInt(hex.slice(3,5),16), b = parseInt(hex.slice(5,7),16);
    return `rgb(${Math.min(r+40,255)},${Math.min(g+40,255)},${Math.min(b+40,255)})`;
}

// ==========================================
// PHASE 2: ANIMATED ROUTE HIGHLIGHTING
// ==========================================
function drawActiveRoutes() {
    const dispatched = allContainers.filter(c => c.optimalRoute && c.optimalRoute.includes('➔'));

    dispatched.forEach((c, i) => {
        const pathNodes = c.optimalRoute.split('➔').map(n => n.trim());
        const coords = pathNodes.map(n => LOC[n]).filter(Boolean).map(l => [l.lng, l.lat]);

        if (coords.length < 2) return;

        const srcId = `active-route-${i}`;
        map.addSource(srcId, {
            type: 'geojson',
            data: { type: 'Feature', geometry: { type: 'LineString', coordinates: coords } }
        });

        // Glow background
        map.addLayer({
            id: srcId + '-glow',
            type: 'line',
            source: srcId,
            paint: { 'line-color': '#22D47F', 'line-width': 10, 'line-opacity': 0.15, 'line-blur': 4 }
        });

        // Main route line
        map.addLayer({
            id: srcId + '-main',
            type: 'line',
            source: srcId,
            paint: { 'line-color': '#22D47F', 'line-width': 4, 'line-opacity': 0.8 }
        });

        // Animated dashes
        map.addLayer({
            id: srcId + '-dash',
            type: 'line',
            source: srcId,
            paint: {
                'line-color': '#FFFFFF',
                'line-width': 2,
                'line-dasharray': [2, 4],
                'line-opacity': 0.6
            }
        });

        // Animate the dash offset
        animateDash(srcId + '-dash');
    });
}

function animateDash(layerId) {
    let offset = 0;
    function step() {
        offset = (offset + 0.3) % 20;
        if (map.getLayer(layerId)) {
            map.setPaintProperty(layerId, 'line-dasharray', [2, 4]);
            map.setPaintProperty(layerId, 'line-translate', [offset, 0]);
        }
        requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
}

// ==========================================
// PHASE 2: VEHICLE TRACKING ANIMATION
// ==========================================
function startVehicleTracking() {
    allVehicles.forEach(v => {
        const assigned = allContainers.find(c => c.assignedVehicleID === v.vehicleID);
        if (!assigned || !assigned.optimalRoute) return;

        const pathNodes = assigned.optimalRoute.split('➔').map(n => n.trim());
        const coords = pathNodes.map(n => LOC[n]).filter(Boolean);
        if (coords.length < 2) return;

        // Create vehicle marker
        const marker = addMarker(coords[0], 'vehicle', v.vehicleID, 'truck', '#16A34A', () => {
            showPanel('vehicle', { ...v, container: assigned });
            flyTo(coords[Math.floor(coords.length / 2)], 15.5);
        });

        // Animate along route
        animateAlongPath(marker, coords, 20000);
    });
}

function animateAlongPath(marker, coords, duration) {
    // Build full coordinate array with interpolation
    const fullPath = [];
    for (let i = 0; i < coords.length - 1; i++) {
        const steps = 60;
        for (let s = 0; s <= steps; s++) {
            const t = s / steps;
            fullPath.push({
                lng: coords[i].lng + (coords[i+1].lng - coords[i].lng) * t,
                lat: coords[i].lat + (coords[i+1].lat - coords[i].lat) * t
            });
        }
    }

    let idx = 0;
    const interval = duration / fullPath.length;

    function step() {
        if (idx >= fullPath.length) idx = 0;
        marker.setLngLat([fullPath[idx].lng, fullPath[idx].lat]);
        idx++;
        setTimeout(step, interval);
    }
    step();
}

// ==========================================
// INFO PANEL
// ==========================================
function showPanel(type, data) {
    const panel = document.getElementById("map-info-panel");
    const title = document.getElementById("info-title");
    const body = document.getElementById("info-body");
    panel.classList.add("visible");

    if (type === 'vessel') {
        title.textContent = data.name;
        body.innerHTML = `
            <div class="info-section">Vessel Details</div>
            <div class="info-row"><span class="info-label">ID</span><span class="info-value">${data.vesselID}</span></div>
            <div class="info-row"><span class="info-label">Origin</span><span class="info-value">${data.origin}</span></div>
            <div class="info-row"><span class="info-label">Status</span><span class="info-value">${data.status}</span></div>
            <div class="info-section">Manifest (${data.containers.length})</div>
            ${data.containers.map(c => `<div class="info-row"><span class="info-label" style="color:var(--accent-glow);font-weight:700;">${c.containerID}</span><span class="info-value">${c.cargoType} · ${c.weightKg}kg</span></div>`).join('')}
        `;
    } else if (type === 'warehouse') {
        title.textContent = data.name;
        body.innerHTML = `
            <div class="info-section">Facility</div>
            <div class="info-row"><span class="info-label">ID</span><span class="info-value">${data.warehouseID}</span></div>
            <div class="info-row"><span class="info-label">Type</span><span class="info-value">${data.type}</span></div>
            <div class="info-row"><span class="info-label">Load</span><span class="info-value">${data.currentLoad}/${data.capacity}</span></div>
            <div class="info-section">Assigned (${data.containers.length})</div>
            ${data.containers.map(c => `<div class="info-row"><span class="info-label" style="color:var(--accent-glow);font-weight:700;">${c.containerID}</span><span class="info-value">${c.cargoType} · ${c.status}</span></div>`).join('') || '<div style="color:var(--text-muted);font-size:12px;">Empty</div>'}
        `;
    } else if (type === 'vehicle') {
        title.textContent = `Vehicle ${data.vehicleID}`;
        body.innerHTML = `
            <div class="info-section">Fleet</div>
            <div class="info-row"><span class="info-label">Type</span><span class="info-value">${data.type}</span></div>
            <div class="info-row"><span class="info-label">Capacity</span><span class="info-value">${data.capacityKg} kg</span></div>
            <div class="info-row"><span class="info-label">Status</span><span class="info-value">${data.status}</span></div>
            ${data.container ? `
                <div class="info-section">Active Mission</div>
                <div class="info-row"><span class="info-label">Container</span><span class="info-value" style="color:var(--accent-glow);">${data.container.containerID}</span></div>
                <div class="info-row"><span class="info-label">Cargo</span><span class="info-value">${data.container.cargoType}</span></div>
                <div class="info-row"><span class="info-label">Route</span><span class="info-value" style="font-size:11px;">${data.container.optimalRoute || '--'}</span></div>
                <div class="info-row"><span class="info-label">Distance</span><span class="info-value">${data.container.totalRouteDistanceKm || '--'} km</span></div>
            ` : ''}
        `;
    } else if (type === 'terminal') {
        title.textContent = data.name;
        body.innerHTML = `
            <div class="info-section">Terminal ${data.id}</div>
            <div class="info-row"><span class="info-label">Active Containers</span><span class="info-value">${data.containers.length}</span></div>
            ${data.containers.map(c => `<div class="info-row"><span class="info-label" style="color:var(--accent-glow);font-weight:700;">${c.containerID}</span><span class="info-value">${c.cargoType}</span></div>`).join('') || '<div style="color:var(--text-muted);font-size:12px;">Empty</div>'}
        `;
    } else if (type === 'tower') {
        title.textContent = "Port Control Tower";
        body.innerHTML = `
            <div class="info-section">Operations</div>
            <div class="info-row"><span class="info-label">Vessels</span><span class="info-value">${data.vessels}</span></div>
            <div class="info-row"><span class="info-label">Containers</span><span class="info-value">${data.containers}</span></div>
            <div class="info-row"><span class="info-label">System</span><span class="info-value" style="color:#22D47F;">Online</span></div>
        `;
    }
}

function closeInfoPanel() {
    document.getElementById("map-info-panel").classList.remove("visible");
}

function flyTo(loc, zoom) {
    map.flyTo({ center: [loc.lng, loc.lat], zoom, pitch: 55, duration: 1500, essential: true });
}

function switchMapStyle(style) {
    map.setStyle(MAP_STYLES[style]);
    document.querySelectorAll('.style-btn').forEach(b => b.classList.remove('active'));
    document.getElementById(`btn-${style}`).classList.add('active');
    document.getElementById('map-mode-label').textContent = style.toUpperCase();
    map.once('style.load', () => { drawInfrastructure(); loadAllData(); });
}

function toggleMapLayer(layerType, visible) {
    markers.forEach(m => {
        const el = m.getElement();
        const match = el.querySelector(`[data-lucide]`);
        if (!match) return;
        const icon = match.getAttribute('data-lucide');
        const map = { 'vessels': ['ship'], 'warehouses': ['warehouse'], 'terminals': ['building-2','radio-tower'], 'vehicles': ['truck'] };
        if (map[layerType] && map[layerType].includes(icon)) {
            el.style.display = visible ? '' : 'none';
        }
    });
}

function toggleLayers() {
    document.getElementById('layers-body').classList.toggle('collapsed');
}

function updateLoadBar(val) {
    const bar = document.getElementById('load-fill');
    if (bar) { bar.style.width = val + '%'; if (val >= 100) setTimeout(() => document.getElementById('map-loading').classList.add('hidden'), 800); }
}

function initHUDTime() {
    setInterval(() => {
        const d = new Date();
        const el = document.getElementById('map-time');
        if (el) el.textContent = d.toLocaleTimeString() + ' | ' + d.toLocaleDateString();
    }, 1000);
}
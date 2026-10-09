const API = "http://localhost:5196/api";

const NODE_COORDINATES = {
    "Port": { x: 100, y: 200, label: "Port Terminal" },
    "J1": { x: 260, y: 110, label: "Junction J1" },
    "J2": { x: 260, y: 290, label: "Junction J2" },
    "J3": { x: 460, y: 200, label: "Junction J3" },
    "W1": { x: 680, y: 100, label: "Warehouse W1 (Pharma)" },
    "W2": { x: 500, y: 320, label: "Warehouse W2 (General)" },
    "W3": { x: 680, y: 280, label: "Warehouse W3 (Retail)" }
};

const ROAD_EDGES = [
    { from: "Port", to: "J1", label: "3.0 km" },
    { from: "Port", to: "J2", label: "5.0 km" },
    { from: "J1", to: "J2", label: "2.0 km" },
    { from: "J1", to: "W1", label: "6.0 km" },
    { from: "J2", to: "J3", label: "4.0 km" },
    { from: "J2", to: "W2", label: "7.0 km" },
    { from: "J3", to: "W1", label: "3.0 km" },
    { from: "J3", to: "W3", label: "5.0 km" },
    { from: "W2", to: "W3", label: "4.5 km" }
];

document.addEventListener("DOMContentLoaded", () => {
    loadRoutePlannerData();
    drawStaticGraph();
});

let globalContainers = [];
let activeVehicleTimeout = null;

async function loadRoutePlannerData() {
    try {
        const res = await fetch(`${API}/containers`);
        if (!res.ok) throw new Error("Could not fetch consignments.");
        globalContainers = await res.json();
        populateConsignmentsDropdown(globalContainers);

        document.getElementById("status-dot").className = "status-dot";
        document.getElementById("status-text").textContent = "Connected";
        document.getElementById("last-sync").textContent = "Last sync: " + new Date().toLocaleTimeString();
    } catch (error) {
        document.getElementById("status-dot").className = "status-dot offline";
        document.getElementById("status-text").textContent = "Offline";
    }
}

function populateConsignmentsDropdown(containers) {
    const selector = document.getElementById("route-container-selector");
    selector.innerHTML = `<option value="">Select a container...</option>`;
    containers.forEach(c => {
        const option = document.createElement("option");
        option.value = c.containerID;
        option.textContent = `${c.containerID} Consignment — (${c.cargoType})`;
        selector.appendChild(option);
    });
}

function drawStaticGraph() {
    const edgeGroup = document.getElementById("svg-edges");
    const nodeGroup = document.getElementById("svg-nodes");

    edgeGroup.innerHTML = "";
    nodeGroup.innerHTML = "";

    ROAD_EDGES.forEach(edge => {
        const p1 = NODE_COORDINATES[edge.from];
        const p2 = NODE_COORDINATES[edge.to];

        const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
        line.setAttribute("x1", p1.x);
        line.setAttribute("y1", p1.y);
        line.setAttribute("x2", p2.x);
        line.setAttribute("y2", p2.y);
        line.setAttribute("stroke", "var(--border-default)");
        line.setAttribute("stroke-width", "3");
        line.setAttribute("id", `road-${edge.from}-${edge.to}`);
        edgeGroup.appendChild(line);

        const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
        text.setAttribute("x", (p1.x + p2.x) / 2);
        text.setAttribute("y", (p1.y + p2.y) / 2 - 8);
        text.setAttribute("fill", "var(--text-tertiary)");
        text.setAttribute("font-size", "10px");
        text.setAttribute("font-weight", "600");
        text.setAttribute("text-anchor", "middle");
        text.textContent = edge.label;
        edgeGroup.appendChild(text);
    });

    Object.keys(NODE_COORDINATES).forEach(key => {
        const n = NODE_COORDINATES[key];

        const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        circle.setAttribute("cx", n.x);
        circle.setAttribute("cy", n.y);
        circle.setAttribute("r", "15");
        circle.setAttribute("fill", "var(--bg-surface)");
        circle.setAttribute("stroke", "var(--border-strong)");
        circle.setAttribute("stroke-width", "2.5");
        circle.setAttribute("id", `node-${key}`);
        nodeGroup.appendChild(circle);

        const textId = document.createElementNS("http://www.w3.org/2000/svg", "text");
        textId.setAttribute("x", n.x);
        textId.setAttribute("y", n.y + 4);
        textId.setAttribute("fill", "var(--text-strong)");
        textId.setAttribute("font-size", "10.5px");
        textId.setAttribute("font-weight", "700");
        textId.setAttribute("text-anchor", "middle");
        textId.textContent = key;
        nodeGroup.appendChild(textId);

        const textLabel = document.createElementNS("http://www.w3.org/2000/svg", "text");
        textLabel.setAttribute("x", n.x);
        textLabel.setAttribute("y", n.y - 22);
        textLabel.setAttribute("fill", "var(--text-secondary)");
        textLabel.setAttribute("font-size", "10px");
        textLabel.setAttribute("font-weight", "600");
        textLabel.setAttribute("text-anchor", "middle");
        textLabel.textContent = n.label;
        nodeGroup.appendChild(textLabel);
    });
}

function onConsignmentSelect() {
    const selectedId = document.getElementById("route-container-selector").value;
    const detailsPanel = document.getElementById("route-details-panel");
    const placeholder = document.getElementById("route-placeholder-text");

    if (activeVehicleTimeout) {
        clearTimeout(activeVehicleTimeout);
    }
    
    // Remove old vehicle markers from SVG
    const oldVehicle = document.getElementById("moving-vehicle");
    if (oldVehicle) oldVehicle.remove();

    drawStaticGraph();

    if (!selectedId) {
        detailsPanel.style.display = "none";
        placeholder.style.display = "block";
        return;
    }

    const c = globalContainers.find(item => item.containerID === selectedId);

    if (!c || !c.optimalRoute) {
        detailsPanel.style.display = "none";
        placeholder.style.display = "block";
        placeholder.textContent = "This consignment has not completed Dijkstra routing calculations yet.";
        return;
    }

    placeholder.style.display = "none";
    detailsPanel.style.display = "block";

    document.getElementById("route-state").textContent = c.status;
    document.getElementById("route-state").className = "badge badge-" + c.status.toLowerCase().replace(/\s/g, "");
    document.getElementById("route-warehouse").textContent = c.assignedWarehouseID || "--";
    document.getElementById("route-vehicle").textContent = c.assignedVehicleID || "--";
    document.getElementById("route-distance").textContent = `${c.totalRouteDistanceKm} km`;
    document.getElementById("route-path-nodes").textContent = c.optimalRoute;

    // Trigger flow and vehicle dispatch animations
    animateDijkstraPath(c.optimalRoute);
}

function animateDijkstraPath(routeStr) {
    const path = routeStr.split(" ➔ ").map(node => node.trim());
    const edgeGroup = document.getElementById("svg-edges");

    // 1. Upgraded highlight and glowing flow along edges
    for (let i = 0; i < path.length; i++) {
        const node = path[i];
        const circle = document.getElementById(`node-${node}`);
        
        if (circle) {
            circle.setAttribute("stroke", "var(--signal-blue)");
            circle.setAttribute("stroke-width", "3.5");
        }

        if (i < path.length - 1) {
            const nextNode = path[i + 1];
            let line = document.getElementById(`road-${node}-${nextNode}`) 
                    || document.getElementById(`road-${nextNode}-${node}`);

            if (line) {
                // Set green background route connection line
                line.setAttribute("stroke", "var(--signal-blue)");
                line.setAttribute("stroke-width", "5.5");
                
                // Add class for beautiful flowing dots animation
                line.classList.add("active-route-flow");
            }
        }
    }

    // 2. Spawn and animate the physical transit vehicle
    spawnAndAnimateVehicle(path);
}

function spawnAndAnimateVehicle(path) {
    const nodeGroup = document.getElementById("svg-nodes");
    const startNodeCoords = NODE_COORDINATES[path[0]];

    // Create a composite SVG group for the moving vehicle indicator
    const vehicleGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
    vehicleGroup.setAttribute("id", "moving-vehicle");
    vehicleGroup.style.transition = "transform 1.8s cubic-bezier(0.45, 0, 0.15, 1)";
    vehicleGroup.style.transform = `translate(${startNodeCoords.x}px, ${startNodeCoords.y}px)`;

    // Outer radar ring pulse
    const radar = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    radar.setAttribute("cx", "0");
    radar.setAttribute("cy", "0");
    radar.setAttribute("r", "9");
    radar.setAttribute("fill", "var(--signal-blue-bg)");
    radar.setAttribute("stroke", "var(--signal-blue)");
    radar.setAttribute("stroke-width", "1.5");
    radar.classList.add("vehicle-tracker-pulse");
    vehicleGroup.appendChild(radar);

    // Inner vehicle pointer
    const dot = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    dot.setAttribute("cx", "0");
    dot.setAttribute("cy", "0");
    dot.setAttribute("r", "5.5");
    dot.setAttribute("fill", "var(--accent)");
    dot.setAttribute("filter", "url(#glow)");
    vehicleGroup.appendChild(dot);

    nodeGroup.appendChild(vehicleGroup);

    // Animate transit along the selected GIS nodes sequentially
    let currentStep = 1;

    function moveStep() {
        if (currentStep >= path.length) return;

        const nextNodeName = path[currentStep];
        const nextCoords = NODE_COORDINATES[nextNodeName];

        // Smoothly slide group coordinates
        vehicleGroup.style.transform = `translate(${nextCoords.x}px, ${nextCoords.y}px)`;

        currentStep++;
        activeVehicleTimeout = setTimeout(moveStep, 1800); // 1.8s transition per junction jump
    }

    // Start delay jump
    activeVehicleTimeout = setTimeout(moveStep, 600);
}
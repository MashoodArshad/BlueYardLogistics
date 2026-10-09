const API = "http://localhost:5196/api";

document.addEventListener("DOMContentLoaded", () => {
    loadYardData();
});

async function loadYardData() {
    try {
        const [terminalsRes, containersRes] = await Promise.all([
            fetch(`${API}/terminals`),
            fetch(`${API}/containers`)
        ]);

        if (!terminalsRes.ok) throw new Error("Failed to fetch yard data.");

        const terminals = await terminalsRes.json();
        const containers = await containersRes.json();

        renderYardGrid(terminals, containers);

        document.getElementById("status-dot").className = "status-dot";
        document.getElementById("status-text").textContent = "Connected";
        document.getElementById("last-sync").textContent = "Last sync: " + new Date().toLocaleTimeString();

    } catch (error) {
        document.getElementById("status-dot").className = "status-dot offline";
        document.getElementById("status-text").textContent = "Offline";
        console.error("Yard load failed:", error);
    }
}

function renderYardGrid(terminals, containers) {
    const container = document.getElementById("terminals-grid-container");
    container.innerHTML = "";

    terminals.forEach(t => {
        const assigned = containers.filter(c => c.assignedTerminalID === t.terminalID);
        const prefix = t.terminalID.replace("T-", "T");

        const card = document.createElement("div");
        card.className = "yard-terminal";
        card.innerHTML = `
            <div class="yard-terminal-header">
                <span class="yard-terminal-name">${t.name}</span>
                <span class="badge badge-terminal">${t.type} — Load: ${t.currentLoad}/${t.capacity}</span>
            </div>
            <div class="yard-grid" style="grid-template-columns: repeat(2, 1fr);">
                ${buildSlots(prefix, assigned)}
            </div>
        `;
        container.appendChild(card);
    });

    lucide.createIcons();
}

function buildSlots(prefix, assigned) {
    let html = "";
    [1, 2].forEach(r => {
        [1, 2].forEach(c => {
            const slotId = `${prefix}-R${r}-C${c}`;
            const match = assigned.find(ct => ct.assignedYardSlot === slotId);

            if (match) {
                const cls = match.priorityLevel === "High" ? "occupied-high" : "occupied";
                html += `
                    <div class="yard-slot ${cls}">
                        <div class="yard-slot-label">${slotId}</div>
                        <div class="yard-slot-cargo">${match.containerID} — ${match.cargoType} (${match.weightKg}kg)</div>
                    </div>`;
            } else {
                html += `
                    <div class="yard-slot empty">
                        <div class="yard-slot-label">${slotId}</div>
                        <div class="yard-slot-cargo">Available</div>
                    </div>`;
            }
        });
    });
    return html;
}
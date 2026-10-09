const API = "http://localhost:5196/api";

document.addEventListener("DOMContentLoaded", () => {
    loadHistorySelector();
});

let containersCache = [];

async function loadHistorySelector() {
    try {
        const res = await fetch(`${API}/containers`);
        if (!res.ok) throw new Error("Could not retrieve containers database.");

        containersCache = await res.json();
        populateDropdown(containersCache);

        document.getElementById("status-dot").className = "status-dot";
        document.getElementById("status-text").textContent = "Connected";
        document.getElementById("last-sync").textContent = "Last sync: " + new Date().toLocaleTimeString();

    } catch (error) {
        document.getElementById("status-dot").className = "status-dot offline";
        document.getElementById("status-text").textContent = "Offline";
        console.error("Timeline setup failed:", error);
    }
}

function populateDropdown(containers) {
    const selector = document.getElementById("history-container-selector");
    selector.innerHTML = `<option value="">Select a container...</option>`;

    containers.forEach(c => {
        const opt = document.createElement("option");
        opt.value = c.containerID;
        opt.textContent = `${c.containerID} Unit (${c.cargoType})`;
        selector.appendChild(opt);
    });
}

async function onContainerSelect() {
    const selectedId = document.getElementById("history-container-selector").value;
    const metadataPanel = document.getElementById("container-metadata-panel");
    const placeholder = document.getElementById("history-placeholder-text");
    const timelineContainer = document.getElementById("timeline-container");

    if (!selectedId) {
        metadataPanel.style.display = "none";
        placeholder.style.display = "block";
        timelineContainer.innerHTML = `
            <div style="text-align:center; padding:40px; color:var(--text-tertiary); font-weight:500;">
                Select a container consignment on the left to trace its journey steps.
            </div>`;
        return;
    }

    try {
        // Fetch detailed container object with full HistoryLogs included from C# API
        const res = await fetch(`${API}/containers/${selectedId}`);
        if (!res.ok) throw new Error("Failed to load historical timeline.");

        const containerData = await res.json();

        // 1. Render Left panel detailed metadata
        placeholder.style.display = "none";
        metadataPanel.style.display = "block";

        document.getElementById("meta-cargo").textContent = containerData.cargoType;
        document.getElementById("meta-weight").textContent = `${containerData.weightKg.toLocaleString()} kg`;
        
        // Priority design
        const prioBadge = document.getElementById("meta-priority");
        prioBadge.textContent = containerData.priorityLevel;
        prioBadge.className = "badge " + (containerData.priorityLevel === "High" ? "badge-high" : containerData.priorityLevel === "Normal" ? "badge-normal" : "badge-low");

        // Status design
        const statusBadge = document.getElementById("meta-status");
        statusBadge.textContent = containerData.status;
        statusBadge.className = "badge badge-" + containerData.status.toLowerCase().replace(/\s/g, "");

        // 2. Render Right panel Chronological Timeline (Ordered descending by default)
        renderTimeline(containerData.historyLogs);

    } catch (error) {
        alert("Consignment query failed: " + error.message);
    }
}

function renderTimeline(logs) {
    const timelineContainer = document.getElementById("timeline-container");
    timelineContainer.innerHTML = "";

    if (!logs || logs.length === 0) {
        timelineContainer.innerHTML = `<div style="text-align:center; padding:20px; color:var(--text-tertiary);">No operational footprints found for this unit.</div>`;
        return;
    }

    // Sort logs descending by history ID so most recent events appear at the top
    const sortedLogs = [...logs].sort((a, b) => b.historyID - a.historyID);

    sortedLogs.forEach((log, index) => {
        const timelineItem = document.createElement("div");
        timelineItem.className = "timeline-item";

        // Highlight first dot (most recent) as pulsing active blue, and rest as green completed ticks
        const dotStatusClass = index === 0 ? "timeline-dot active" : "timeline-dot completed";

        timelineItem.innerHTML = `
            <div class="${dotStatusClass}"></div>
            <div class="timeline-status">${log.status}</div>
            <div class="timeline-location">📍 Location: ${log.location}</div>
            <div class="timeline-remarks">${log.remarks}</div>
            <div class="timeline-time">${new Date(log.timestamp).toLocaleString()}</div>
        `;

        timelineContainer.appendChild(timelineItem);
    });
}
const API = "http://localhost:5196/api";

document.addEventListener("DOMContentLoaded", () => {
    loadDashboardData();
    initCharts();
});

async function loadDashboardData() {
    try {
        const [vRes, cRes] = await Promise.all([
            fetch(`${API}/vessels`),
            fetch(`${API}/containers`)
        ]);
        if (!vRes.ok || !cRes.ok) throw new Error("API unreachable");

        const vessels = await vRes.json();
        const containers = await cRes.json();

        renderKPIs(containers);
        renderVessels(vessels);
        renderContainers(containers);
        updateCharts(containers);

        document.getElementById("status-dot").className = "status-dot";
        document.getElementById("status-text").textContent = "Connected";
        document.getElementById("last-sync").textContent = "Last sync: " + new Date().toLocaleTimeString();
    } catch (err) {
        document.getElementById("status-dot").className = "status-dot offline";
        document.getElementById("status-text").textContent = "Offline";
    }
}

function renderKPIs(containers) {
    const total = containers.length;
    const yard = containers.filter(c => c.status === "InYard").length;
    const dispatched = containers.filter(c => c.status === "Dispatched").length;
    const high = containers.filter(c => c.priorityLevel === "High").length;
    const maxBar = Math.max(total, 1);

    const strip = document.getElementById("kpi-strip");
    strip.innerHTML = `
        <div class="kpi-card">
            <div class="kpi-top">
                <div class="kpi-indicator ind-blue"><i data-lucide="package"></i></div>
                <div class="kpi-info">
                    <div class="kpi-label">Active Containers</div>
                    <div class="kpi-value">${total}</div>
                </div>
            </div>
            <div class="kpi-bar-track"><div class="kpi-bar-fill fill-blue" style="width:${(total/maxBar)*100}%"></div></div>
        </div>
        <div class="kpi-card">
            <div class="kpi-top">
                <div class="kpi-indicator ind-amber"><i data-lucide="archive"></i></div>
                <div class="kpi-info">
                    <div class="kpi-label">In Yard Storage</div>
                    <div class="kpi-value">${yard}</div>
                </div>
            </div>
            <div class="kpi-bar-track"><div class="kpi-bar-fill fill-amber" style="width:${(yard/maxBar)*100}%"></div></div>
        </div>
        <div class="kpi-card">
            <div class="kpi-top">
                <div class="kpi-indicator ind-green"><i data-lucide="truck"></i></div>
                <div class="kpi-info">
                    <div class="kpi-label">Dispatched</div>
                    <div class="kpi-value">${dispatched}</div>
                </div>
            </div>
            <div class="kpi-bar-track"><div class="kpi-bar-fill fill-green" style="width:${(dispatched/maxBar)*100}%"></div></div>
        </div>
        <div class="kpi-card">
            <div class="kpi-top">
                <div class="kpi-indicator ind-red"><i data-lucide="shield-alert"></i></div>
                <div class="kpi-info">
                    <div class="kpi-label">High Priority</div>
                    <div class="kpi-value">${high}</div>
                </div>
            </div>
            <div class="kpi-bar-track"><div class="kpi-bar-fill fill-red" style="width:${(high/maxBar)*100}%"></div></div>
        </div>
    `;
    lucide.createIcons();
}

function renderVessels(vessels) {
    document.getElementById("vessels-tbody").innerHTML = vessels.map(v => `
        <tr>
            <td class="cell-id">${v.name}</td>
            <td>${v.origin}</td>
            <td class="cell-mono">${new Date(v.arrivalTime).toLocaleString()}</td>
            <td><span class="badge badge-arrived">${v.status}</span></td>
        </tr>
    `).join("");
}

function renderContainers(containers) {
    document.getElementById("containers-tbody").innerHTML = containers.map(c => {
        const pCls = c.priorityLevel === "High" ? "badge-high" : c.priorityLevel === "Normal" ? "badge-normal" : "badge-low";
        const sCls = "badge-" + c.status.toLowerCase().replace(/\s/g,"");
        const risk = c.riskLevel ? `<span class="badge badge-${c.riskLevel.toLowerCase()}">${c.riskLevel}</span>` : '<span class="cell-muted">—</span>';
        const terminal = c.assignedTerminalID ? `<span class="cell-mono">${c.assignedTerminalID}</span>` : '<span class="cell-muted">—</span>';
        const yard = c.assignedYardSlot ? `<span class="cell-mono">${c.assignedYardSlot}</span>` : '<span class="cell-muted">—</span>';
        const action = c.status === "Manifested"
            ? `<button class="btn btn-primary btn-sm" onclick="autoProcess('${c.containerID}')"><i data-lucide="play"></i> Process</button>`
            : `<span class="cell-muted" style="font-size:11px">Completed</span>`;
        return `<tr>
            <td class="cell-id">${c.containerID}</td>
            <td>${c.cargoType}</td>
            <td class="cell-mono">${c.weightKg.toLocaleString()} kg</td>
            <td><span class="badge ${pCls}">${c.priorityLevel}</span></td>
            <td>${risk}</td>
            <td>${terminal}</td>
            <td>${yard}</td>
            <td>${c.destination}</td>
            <td><span class="badge ${sCls}">${c.status}</span></td>
            <td>${action}</td>
        </tr>`;
    }).join("");
    lucide.createIcons();
}

async function autoProcess(id) {
    if (!confirm(`Initiate optimization pipeline for ${id}?`)) return;
    try {
        const res = await fetch(`${API}/containers/${id}/auto-process`, { method: "POST" });
        if (!res.ok) throw new Error("Pipeline failed");
        const data = await res.json();
        alert(`${id} processed.\nRoute: ${data.data.optimalRoute}\nDistance: ${data.data.totalRouteDistanceKm} km`);
        loadDashboardData();
    } catch (err) { alert("Error: " + err.message); }
}

let chartTerminal, chartRisk, chartThroughput;

function initCharts() {
    Chart.defaults.color = '#627890';
    Chart.defaults.font.family = 'Inter';
    Chart.defaults.font.size = 11;

    chartTerminal = new Chart(document.getElementById("chart-terminal"), {
        type: 'doughnut',
        data: { labels: ['Alpha','Beta','Gamma'], datasets: [{ data: [1,1,1], backgroundColor: ['#0C3B6F','#1A5BA0','#4A8AD4'], borderWidth: 0, hoverOffset: 3 }] },
        options: { responsive: true, maintainAspectRatio: false, cutout: '72%', plugins: { legend: { position: 'bottom', labels: { padding: 14, usePointStyle: true, pointStyleWidth: 7, font: { size: 11, weight: '500' } } } } }
    });

    chartRisk = new Chart(document.getElementById("chart-risk"), {
        type: 'bar',
        data: { labels: ['High','Medium','Low'], datasets: [{ data: [3,2,1], backgroundColor: ['#B91C1C','#B45309','#117D3E'], borderRadius: 4, barThickness: 26 }] },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { grid: { display: false }, border: { display: false } }, y: { grid: { color: '#E0E5EC' }, border: { display: false }, beginAtZero: true, ticks: { stepSize: 1 } } } }
    });

    chartThroughput = new Chart(document.getElementById("chart-throughput"), {
        type: 'line',
        data: { labels: ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'], datasets: [{ data: [12,19,8,15,22,14,6], borderColor: '#0C3B6F', backgroundColor: 'rgba(12,59,111,0.05)', fill: true, tension: 0.4, pointRadius: 3, pointBackgroundColor: '#0C3B6F', borderWidth: 1.5 }] },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { grid: { display: false }, border: { display: false } }, y: { grid: { color: '#E0E5EC' }, border: { display: false }, beginAtZero: true } } }
    });
}

function updateCharts(containers) {
    const tA = containers.filter(c => c.assignedTerminalID === 'T-A').length || 1;
    const tB = containers.filter(c => c.assignedTerminalID === 'T-B').length || 1;
    const tC = containers.filter(c => c.assignedTerminalID === 'T-C').length || 1;
    chartTerminal.data.datasets[0].data = [tA, tB, tC];
    chartTerminal.update();
}
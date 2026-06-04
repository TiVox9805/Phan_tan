let currentScenario = "healthy";
let chart = null;

// LOAD SCENARIO

async function selectScenario(scenario) {

    currentScenario = scenario;

    document.getElementById(
        "scenarioName"
    ).innerText =
        scenario.toUpperCase();

    try {

        const response =
            await fetch(
                `/scenario/${scenario}`
            );

        const data =
            await response.json();

        renderSites(
            data.sites
        );

        resetDashboard();

    } catch (error) {

        console.error(error);

        alert(
            "Failed to load scenario"
        );
    }
}

// RUN SINGLE BENCHMARK

async function runBenchmark() {

    const status =
        document.getElementById(
            "benchmarkStatus"
        );

    status.innerText =
        "Running benchmark...";

    try {

        const response =
            await fetch(
                `/benchmark/${currentScenario}`
            );

        const data =
            await response.json();

        updateMetrics(
            data
        );

        renderLogs(
            data.logs
        );

        renderProfile(
            data.current_profile
        );

        renderChart(
            data
        );

        status.innerText =
            `Completed in ${data.benchmark_time}s`;

    } catch (error) {

        console.error(error);

        status.innerText =
            "Benchmark Failed";
    }
}

// RUN ALL BENCHMARKS

async function runAllBenchmarks() {

    const status =
        document.getElementById(
            "benchmarkStatus"
        );

    status.innerText =
        "Running all benchmarks...";

    try {

        const response =
            await fetch(
                "/benchmark/all"
            );

        const data =
            await response.json();

        renderComparisonTable(
            data
        );

        renderAnalysis(
            data
        );

        status.innerText =
            "All benchmarks completed";

    } catch (error) {

        console.error(error);

        status.innerText =
            "Run All Failed";
    }
}

// SITE STATUS

function renderSites(sites) {

    const container =
        document.getElementById(
            "sites"
        );

    let html = "";

    sites.forEach(site => {

        html += `

        <div class="bg-white rounded-lg shadow p-6">

            <h3 class="text-xl font-semibold mb-3">
                Site ${site.id}
            </h3>

            <p class="mb-2">
                Delay:
                <strong>
                    ${site.delay} ms
                </strong>
            </p>

            <p>

                ${
                    site.active

                    ?

                    `<span class="bg-green-100 text-green-700 px-3 py-1 rounded">
                        ONLINE
                    </span>`

                    :

                    `<span class="bg-red-100 text-red-700 px-3 py-1 rounded">
                        OFFLINE
                    </span>`
                }

            </p>

        </div>

        `;
    });

    container.innerHTML =
        html;
}

// UPDATE METRICS

function updateMetrics(data) {

    document.getElementById(
        "latency"
    ).innerText =
        data.latency + " ms";

    document.getElementById(
        "throughput"
    ).innerText =
        data.throughput + " tx/s";

    document.getElementById(
        "success"
    ).innerText =
        data.success_rate + "%";

    document.getElementById(
        "totalTx"
    ).innerText =
        data.total_transactions;

    document.getElementById(
        "successTx"
    ).innerText =
        data.successful_transactions;

    document.getElementById(
        "executionTime"
    ).innerText =
        data.benchmark_time + " s";
}

// PROFILE

function renderProfile(profile) {

    document.getElementById(
        "profileData"
    ).textContent =

        JSON.stringify(
            profile,
            null,
            2
        );
}

// LOGS

function renderLogs(logs) {

    const container =
        document.getElementById(
            "logs"
        );

    let html = "";

    logs.forEach(log => {

        html += `

        <div class="border-b py-1">

            ${log}

        </div>

        `;
    });

    container.innerHTML =
        html;
}

// CHART

function renderChart(data) {

    const canvas =
        document.getElementById(
            "chart"
        );

    if (chart) {

        chart.destroy();
    }

    chart = new Chart(canvas, {

        type: "bar",

        data: {

            labels: [

                "Latency (ms)",
                "Throughput (tx/s)",
                "Success Rate (%)"

            ],

            datasets: [

                {

                    label:
                        data.scenario,

                    data: [

                        data.latency || 0,
                        data.throughput || 0,
                        data.success_rate || 0

                    ]
                }

            ]
        },

        options: {

            responsive: true,

            scales: {

                y: {

                    beginAtZero: true
                }
            }
        }
    });
}

// COMPARISON TABLE

function renderComparisonTable(data) {

    const tbody =
        document.getElementById(
            "comparisonTable"
        );

    tbody.innerHTML = `

    <tr>
        <td class="border p-2">Healthy</td>
        <td class="border p-2">${data.healthy.latency}</td>
        <td class="border p-2">${data.healthy.throughput}</td>
        <td class="border p-2">${data.healthy.success_rate}%</td>
    </tr>

    <tr>
        <td class="border p-2">Slow Node</td>
        <td class="border p-2">${data.slow.latency}</td>
        <td class="border p-2">${data.slow.throughput}</td>
        <td class="border p-2">${data.slow.success_rate}%</td>
    </tr>

    <tr>
        <td class="border p-2">Node Down</td>
        <td class="border p-2">${data.down.latency}</td>
        <td class="border p-2">${data.down.throughput}</td>
        <td class="border p-2">${data.down.success_rate}%</td>
    </tr>

    <tr>
        <td class="border p-2">Quorum Fail</td>
        <td class="border p-2">${data.fail.latency}</td>
        <td class="border p-2">${data.fail.throughput}</td>
        <td class="border p-2">${data.fail.success_rate}%</td>
    </tr>

    `;
}

// ANALYSIS

function renderAnalysis(data) {

    const healthy =
        data.healthy.latency;

    const slow =
        data.slow.latency;

    const down =
        data.down.latency;

    const slowDiff =
        (slow - healthy)
        .toFixed(2);

    const downDiff =
        (down - healthy)
        .toFixed(2);

    document
        .getElementById(
            "analysisResult"
        )
        .innerHTML = `

        <p>
            Healthy Latency:
            <strong>
                ${healthy} ms
            </strong>
        </p>

        <p>
            Slow Node Difference:
            <strong>
                ${slowDiff} ms
            </strong>
        </p>

        <p>
            Node Down Difference:
            <strong>
                ${downDiff} ms
            </strong>
        </p>

        <hr class="my-3">

        <p>

            <strong>
                Conclusion:
            </strong>

            Hệ thống vẫn duy trì hiệu suất khi một bản sao trở nên chậm hoặc không khả dụng vì số lượng bản sao tối thiểu cần thiết để hoạt động đồng bộ được đảm bảo bằng cách sử dụng hai bản sao còn lại đang hoạt động tốt.

        </p>

    `;
}

// RESET DASHBOARD

function resetDashboard() {

    document.getElementById(
        "latency"
    ).innerText = "-";

    document.getElementById(
        "throughput"
    ).innerText = "-";

    document.getElementById(
        "success"
    ).innerText = "-";

    document.getElementById(
        "totalTx"
    ).innerText = "-";

    document.getElementById(
        "successTx"
    ).innerText = "-";

    document.getElementById(
        "executionTime"
    ).innerText = "-";

    document.getElementById(
        "benchmarkStatus"
    ).innerText =
        "Waiting...";

    document.getElementById(
        "logs"
    ).innerHTML = "";

    document.getElementById(
        "profileData"
    ).textContent =
        "No benchmark executed";

    resetChart();
}

// RESET CHART

function resetChart() {

    const canvas =
        document.getElementById(
            "chart"
        );

    if (chart) {

        chart.destroy();
    }

    chart = new Chart(canvas, {

        type: "bar",

        data: {

            labels: [

                "Latency (ms)",
                "Throughput (tx/s)",
                "Success Rate (%)"

            ],

            datasets: [

                {

                    label:
                        "No Data",

                    data: [

                        0,
                        0,
                        0

                    ]
                }

            ]
        },

        options: {

            responsive: true,

            scales: {

                y: {

                    beginAtZero: true
                }
            }
        }
    });
}

// INITIAL LOAD

window.onload = () => {

    selectScenario(
        "healthy"
    );

};
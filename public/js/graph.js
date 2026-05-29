document.addEventListener('DOMContentLoaded', () => {
    const usernameDisplay = document.getElementById('username-display');
    const logoutBtn = document.getElementById('logout-btn');
    const noData = document.getElementById('no-data');
    const canvas = document.getElementById('bmi-chart');

    // Check authentication
    async function checkAuth() {
        try {
            const res = await fetch('/api/me');
            if (!res.ok) {
                window.location.href = '/';
                return;
            }
            const data = await res.json();
            usernameDisplay.textContent = data.user.username;
        } catch (err) {
            window.location.href = '/';
        }
    }

    // Load graph data
    async function loadGraph() {
        try {
            const res = await fetch('/api/records/graph');
            if (res.status === 401) {
                window.location.href = '/';
                return;
            }
            const data = await res.json();

            if (!data.records || data.records.length === 0) {
                noData.style.display = 'block';
                canvas.style.display = 'none';
                return;
            }

            renderChart(data.records);
        } catch (err) {
            noData.textContent = '通信エラーが発生しました';
            noData.style.display = 'block';
        }
    }

    function renderChart(records) {
        const labels = records.map(r => r.record_date);
        const weightData = records.map(r => r.weight);
        const bmiData = records.map(r => r.bmi);

        new Chart(canvas, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: '体重 (kg)',
                        data: weightData,
                        borderColor: '#2c5f8a',
                        backgroundColor: 'rgba(44, 95, 138, 0.1)',
                        yAxisID: 'y-weight',
                        tension: 0.1,
                        pointRadius: 4
                    },
                    {
                        label: 'BMI',
                        data: bmiData,
                        borderColor: '#e67e22',
                        backgroundColor: 'rgba(230, 126, 34, 0.1)',
                        yAxisID: 'y-bmi',
                        tension: 0.1,
                        pointRadius: 4
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom'
                    },
                    title: {
                        display: true,
                        text: '過去6か月間の推移'
                    }
                },
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: '日付'
                        }
                    },
                    'y-weight': {
                        type: 'linear',
                        position: 'left',
                        title: {
                            display: true,
                            text: '体重 (kg)'
                        }
                    },
                    'y-bmi': {
                        type: 'linear',
                        position: 'right',
                        title: {
                            display: true,
                            text: 'BMI'
                        },
                        grid: {
                            drawOnChartArea: false
                        }
                    }
                }
            }
        });
    }

    // Logout
    logoutBtn.addEventListener('click', async () => {
        try {
            await fetch('/api/logout', { method: 'POST' });
        } catch (err) {
            // ignore
        }
        window.location.href = '/';
    });

    checkAuth();
    loadGraph();
});

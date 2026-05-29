document.addEventListener('DOMContentLoaded', () => {
    const bmiForm = document.getElementById('bmi-form');
    const errorArea = document.getElementById('error-area');
    const resultArea = document.getElementById('result-area');
    const bmiValue = document.getElementById('bmi-value');
    const bmiCategory = document.getElementById('bmi-category');
    const historyBody = document.getElementById('history-body');
    const noRecords = document.getElementById('no-records');
    const usernameDisplay = document.getElementById('username-display');
    const logoutBtn = document.getElementById('logout-btn');
    const dateInput = document.getElementById('record-date');

    // Set default date to today
    const today = new Date().toISOString().split('T')[0];
    dateInput.value = today;

    // BMI judgment constants
    const BMI_UNDERWEIGHT = 18.5;
    const BMI_NORMAL = 25.0;
    const BMI_OBESE_1 = 30.0;
    const BMI_OBESE_2 = 35.0;
    const BMI_OBESE_3 = 40.0;

    function getBmiCategory(bmi) {
        if (bmi < BMI_UNDERWEIGHT) return '低体重（やせ）';
        if (bmi < BMI_NORMAL) return '普通体重';
        if (bmi < BMI_OBESE_1) return '肥満（1度）';
        if (bmi < BMI_OBESE_2) return '肥満（2度）';
        if (bmi < BMI_OBESE_3) return '肥満（3度）';
        return '肥満（4度）';
    }

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

    // Load history
    async function loadHistory() {
        try {
            const res = await fetch('/api/records');
            if (res.status === 401) {
                window.location.href = '/';
                return;
            }
            const data = await res.json();
            renderHistory(data.records);
        } catch (err) {
            showError(['通信エラーが発生しました']);
        }
    }

    function renderHistory(records) {
        historyBody.innerHTML = '';
        if (!records || records.length === 0) {
            noRecords.style.display = 'block';
            document.getElementById('history-table').style.display = 'none';
            return;
        }
        noRecords.style.display = 'none';
        document.getElementById('history-table').style.display = 'table';

        records.forEach(record => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${record.record_date}</td>
                <td>${record.height}</td>
                <td>${record.weight}</td>
                <td>${record.bmi}</td>
                <td><button class="btn btn-danger btn-small" onclick="deleteRecord(${record.id})">×</button></td>
            `;
            historyBody.appendChild(tr);
        });
    }

    // BMI form submit
    bmiForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        hideError();
        resultArea.style.display = 'none';

        const record_date = dateInput.value;
        const height = document.getElementById('height').value;
        const weight = document.getElementById('weight').value;

        try {
            const res = await fetch('/api/records', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ record_date, height, weight })
            });

            if (res.status === 401) {
                window.location.href = '/';
                return;
            }

            const data = await res.json();
            if (res.ok) {
                bmiValue.textContent = data.bmi;
                bmiCategory.textContent = getBmiCategory(data.bmi);
                resultArea.style.display = 'block';
                renderHistory(data.records);
            } else {
                showError(data.errors);
            }
        } catch (err) {
            showError(['通信エラーが発生しました']);
        }
    });

    // Logout
    logoutBtn.addEventListener('click', async () => {
        try {
            await fetch('/api/logout', { method: 'POST' });
        } catch (err) {
            // ignore
        }
        window.location.href = '/';
    });

    // Delete record (global function for inline onclick)
    window.deleteRecord = async function(id) {
        if (!confirm('この記録を削除しますか？')) return;

        try {
            const res = await fetch(`/api/records/${id}`, { method: 'DELETE' });
            if (res.status === 401) {
                window.location.href = '/';
                return;
            }
            const data = await res.json();
            if (res.ok) {
                renderHistory(data.records);
            } else {
                showError(data.errors);
            }
        } catch (err) {
            showError(['通信エラーが発生しました']);
        }
    };

    function showError(errors) {
        errorArea.style.display = 'block';
        errorArea.innerHTML = errors.map(e => `<p>${e}</p>`).join('');
    }

    function hideError() {
        errorArea.style.display = 'none';
        errorArea.innerHTML = '';
    }

    checkAuth();
    loadHistory();
});

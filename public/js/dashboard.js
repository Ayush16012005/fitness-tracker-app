const DASHBOARD_API_URL = '/api';

const fetchWithTimeout = async (url, options = {}, timeout = 5000) => {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    try {
        const response = await fetch(url, { ...options, signal: controller.signal });
        clearTimeout(id);
        return response;
    } catch (e) {
        clearTimeout(id);
        console.error('Fetch error:', e.message);
        return { ok: false, json: async () => ({ error: e.message }) };
    }
};

const getAuthHeaders = () => {
    const token = localStorage.getItem('supabase_token');
    const headers = {
        'Content-Type': 'application/json',
    };
    if (token) headers.Authorization = `Bearer ${token}`;
    return headers;
};

async function fetchProfile() {
    try {
        const response = await fetch(`${DASHBOARD_API_URL}/user/profile`, {
            headers: getAuthHeaders()
        });
        const result = await response.json();
        if (result.success) {
            return result.profile;
        }
        return null;
    } catch (error) {
        console.error('Error fetching profile:', error);
        return null;
    }
}

async function updateProfile(profileData) {
    try {
        const response = await fetch(`${DASHBOARD_API_URL}/user/profile`, {
            method: 'PATCH',
            headers: getAuthHeaders(),
            body: JSON.stringify(profileData)
        });
        const result = await response.json();
        return result;
    } catch (error) {
        console.error('Error updating profile:', error);
        return { success: false };
    }
}

async function fetchWorkoutStats() {
    try {
        const response = await fetch(`${DASHBOARD_API_URL}/workouts/stats`, {
            headers: getAuthHeaders()
        });
        const result = await response.json();
        if (result.success) {
            return result.stats;
        }
        return null;
    } catch (error) {
        console.error('Error fetching stats:', error);
        return null;
    }
}

async function fetchWorkouts() {
    try {
        const response = await fetch(`${DASHBOARD_API_URL}/workouts`, {
            headers: getAuthHeaders()
        });
        const result = await response.json();
        if (result.success && Array.isArray(result.data)) {
            return result.data;
        }
        return [];
    } catch (error) {
        console.error('Error fetching workouts:', error);
        return [];
    }
}

async function fetchGoalsCount() {
    try {
        const response = await fetch(`${DASHBOARD_API_URL}/goals`, {
            headers: getAuthHeaders()
        });
        const result = await response.json();
        if (result.success && Array.isArray(result.data)) {
            return result.data.filter((g) => g.status !== 'completed').length;
        }
        return 0;
    } catch (error) {
        console.error('Error fetching goals:', error);
        return 0;
    }
}

function buildSeries(workouts, period = 'week') {
    if (!Array.isArray(workouts) || workouts.length === 0) {
        return period === 'month'
            ? { labels: ['W1', 'W2', 'W3', 'W4'], values: [0, 0, 0, 0] }
            : { labels: ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'], values: [0, 0, 0, 0, 0, 0, 0] };
    }

    const now = new Date();
    if (period === 'month') {
        const labels = ['W1', 'W2', 'W3', 'W4'];
        const values = [0, 0, 0, 0];
        workouts.forEach((w) => {
            const d = new Date(w.created_at);
            const diffDays = Math.floor((now - d) / (1000 * 60 * 60 * 24));
            if (diffDays >= 0 && diffDays < 28) {
                const idx = 3 - Math.floor(diffDays / 7);
                if (idx >= 0 && idx < 4) values[idx] += Number(w.duration || 0);
            }
        });
        return { labels, values };
    }

    const labels = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
    const values = [0, 0, 0, 0, 0, 0, 0];
    workouts.forEach((w) => {
        const d = new Date(w.created_at);
        const diffDays = Math.floor((now - d) / (1000 * 60 * 60 * 24));
        if (diffDays >= 0 && diffDays < 7) {
            let jsDay = d.getDay();
            jsDay = jsDay === 0 ? 6 : jsDay - 1;
            values[jsDay] += Number(w.duration || 0);
        }
    });
    return { labels, values };
}

function calculateStreakDays(workouts) {
    if (!Array.isArray(workouts) || workouts.length === 0) return 0;

    const toKey = (d) => {
        const dt = new Date(d);
        return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
    };

    const daySet = new Set(workouts.map((w) => toKey(w.created_at)));
    let streak = 0;
    const cursor = new Date();

    while (true) {
        const key = toKey(cursor);
        if (!daySet.has(key)) break;
        streak += 1;
        cursor.setDate(cursor.getDate() - 1);
    }

    return streak;
}

function calculateBmi(weightKg, heightCm) {
    const weight = Number(weightKg || 0);
    const heightM = Number(heightCm || 0) / 100;
    if (!weight || !heightM) return null;
    return weight / (heightM * heightM);
}

function describeBmi(bmi) {
    if (!bmi || Number.isNaN(bmi)) return 'Add profile data';
    if (bmi < 18.5) return 'Underweight';
    if (bmi < 25) return 'Healthy';
    if (bmi < 30) return 'Overweight';
    return 'Obesity';
}

function renderActivityChart(workouts, period = 'week') {
    const chartEl = document.getElementById('activity-chart');
    const weekBtn = document.getElementById('activity-week-btn');
    const monthBtn = document.getElementById('activity-month-btn');
    if (!chartEl || !weekBtn || !monthBtn) return;

    const series = buildSeries(workouts, period);

    const max = Math.max(...series.values, 1);
    chartEl.innerHTML = series.values.map((value, idx) => {
        const heightPct = value > 0 ? Math.max(8, Math.round((value / max) * 100)) : 0;
        const isPeak = value === max;
        return `
            <div class="flex flex-col items-center flex-1 gap-2">
                <div class="w-full h-40 relative flex items-end justify-center border-b border-outline-variant/25">
                    <div class="w-7 bg-surface-variant/35 rounded-md relative overflow-hidden ${isPeak ? 'shadow-[0_0_10px_rgba(255,126,234,0.25)]' : ''}" style="height:100%">
                        <div class="absolute bottom-0 left-0 right-0 bg-gradient-to-t ${isPeak ? 'from-primary/75 to-primary/95' : 'from-primary/40 to-primary/75'} rounded-sm transition-all duration-700" style="height:${heightPct}%"></div>
                    </div>
                </div>
                <span class="text-[10px] font-bold ${isPeak ? 'text-primary' : 'text-on-surface-variant'}">${series.labels[idx]}</span>
            </div>
        `;
    }).join('');

    if (period === 'month') {
        monthBtn.className = 'px-4 py-2 bg-surface-variant rounded-full text-xs font-bold';
        weekBtn.className = 'px-4 py-2 text-on-surface-variant hover:text-white rounded-full text-xs font-bold';
    } else {
        weekBtn.className = 'px-4 py-2 bg-surface-variant rounded-full text-xs font-bold';
        monthBtn.className = 'px-4 py-2 text-on-surface-variant hover:text-white rounded-full text-xs font-bold';
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('supabase_token');
    if (!token) {
        window.location.href = '/login';
        return;
    }

    const usernameEl = document.getElementById('username');
    const totalWorkoutsEl = document.getElementById('total-workouts');
    const totalCaloriesEl = document.getElementById('total-calories');
    const activeGoalsEl = document.getElementById('active-goals-count');
    const streakDaysEl = document.getElementById('streak-days');
    const bmiEl = document.getElementById('dashboard-bmi');
    const bmiLabelEl = document.getElementById('dashboard-bmi-label');

    let profile = null;
    let stats = null;
    let workouts = [];
    let activeGoalsCount = 0;

    try {
        [profile, stats, workouts, activeGoalsCount] = await Promise.all([
            fetchProfile(),
            fetchWorkoutStats(),
            fetchWorkouts(),
            fetchGoalsCount()
        ]);
    } catch (e) {
        console.error('Dashboard data error:', e);
    }

    try {
        if (profile && usernameEl) {
            usernameEl.textContent = profile.full_name || 'User';
        } else if (usernameEl) {
            const email = localStorage.getItem('user_email');
            usernameEl.textContent = email ? email.split('@')[0] : 'User';
        }
    } catch (e) {
        console.error('Profile error:', e);
        if (usernameEl) usernameEl.textContent = 'User';
    }

    try {
        const bmi = calculateBmi(profile?.weight, profile?.height);
        if (bmiEl) bmiEl.textContent = bmi ? bmi.toFixed(1) : '--';
        if (bmiLabelEl) bmiLabelEl.textContent = describeBmi(bmi);
    } catch (e) {
        if (bmiEl) bmiEl.textContent = '--';
        if (bmiLabelEl) bmiLabelEl.textContent = 'Add profile data';
    }

    try {
        if (stats) {
            if (totalWorkoutsEl) totalWorkoutsEl.textContent = stats.totalWorkouts || 0;
            if (totalCaloriesEl) totalCaloriesEl.textContent = stats.totalCalories || 0;
        } else {
            if (totalWorkoutsEl) totalWorkoutsEl.textContent = '0';
            if (totalCaloriesEl) totalCaloriesEl.textContent = '0';
        }
    } catch (e) {
        console.error('Stats error:', e);
        if (totalWorkoutsEl) totalWorkoutsEl.textContent = '0';
        if (totalCaloriesEl) totalCaloriesEl.textContent = '0';
    }

    try {
        if (activeGoalsEl) activeGoalsEl.textContent = String(activeGoalsCount || 0);
    } catch (e) {
        if (activeGoalsEl) activeGoalsEl.textContent = '0';
    }

    const xpEl = document.getElementById('user-xp');
    if (xpEl) {
        xpEl.textContent = '0 XP';
    }

    const weekBtn = document.getElementById('activity-week-btn');
    const monthBtn = document.getElementById('activity-month-btn');
    if (weekBtn && monthBtn) {
        weekBtn.addEventListener('click', () => renderActivityChart(workouts, 'week'));
        monthBtn.addEventListener('click', () => renderActivityChart(workouts, 'month'));
    }
    renderActivityChart(workouts, 'week');

    if (streakDaysEl) {
        streakDaysEl.textContent = `${calculateStreakDays(workouts)} Days`;
    }
});

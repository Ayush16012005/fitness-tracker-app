const PROGRESS_API_URL = '/api';

const getAuthHeaders = () => {
    const token = localStorage.getItem('supabase_token');
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers.Authorization = `Bearer ${token}`;
    return headers;
};

async function fetchWorkouts() {
    try {
        const response = await fetch(`${PROGRESS_API_URL}/workouts`, { headers: getAuthHeaders() });
        const result = await response.json();
        return result.success ? result.data || [] : [];
    } catch {
        return [];
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    if (!localStorage.getItem('supabase_token')) {
        window.location.href = '/login';
        return;
    }

    const workouts = await fetchWorkouts();
    const totalWorkouts = workouts.length;
    const totalDuration = workouts.reduce((sum, w) => sum + Number(w.duration || 0), 0);
    const totalCalories = workouts.reduce((sum, w) => sum + Number(w.calories || 0), 0);

    const totalWorkoutsEl = document.getElementById('progress-total-workouts');
    const totalDurationEl = document.getElementById('progress-total-duration');
    const totalCaloriesEl = document.getElementById('progress-total-calories');
    if (totalWorkoutsEl) totalWorkoutsEl.textContent = String(totalWorkouts);
    if (totalDurationEl) totalDurationEl.textContent = `${totalDuration} min`;
    if (totalCaloriesEl) totalCaloriesEl.textContent = String(totalCalories);

    const recentEl = document.getElementById('progress-recent-workouts');
    if (!recentEl) return;

    if (workouts.length === 0) {
        recentEl.textContent = 'No workouts logged yet.';
        return;
    }

    const recent = workouts.slice(0, 5);
    recentEl.innerHTML = recent.map((w) => `
        <div class="py-3 border-b border-outline-variant/15 last:border-0 flex items-center justify-between gap-4">
            <div>
                <p class="font-bold text-white">${w.name || 'Workout'}</p>
                <p class="text-xs text-on-surface-variant">${w.type || 'General'} · ${new Date(w.created_at).toLocaleDateString()}</p>
            </div>
            <p class="text-sm text-on-surface-variant">${Number(w.duration || 0)} min</p>
        </div>
    `).join('');
});

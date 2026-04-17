const PROGRESS_API_URL = '/api';

const getAuthHeaders = () => {
    const token = localStorage.getItem('supabase_token');
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers.Authorization = `Bearer ${token}`;
    return headers;
};

function formatDurationLabel(totalMinutes) {
    const minutes = Math.max(0, Math.round(Number(totalMinutes || 0)));
    if (minutes < 60) return `${minutes} min`;

    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    const hourLabel = `${hours} hr${hours === 1 ? '' : 's'}`;

    return remainingMinutes ? `${hourLabel} ${remainingMinutes} min` : hourLabel;
}

function getDayKey(dateValue) {
    const date = new Date(dateValue);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function buildActivitySeries(workouts, days = 7, referenceDate = new Date()) {
    const safeDays = Math.max(1, Number(days) || 7);
    const totalsByDay = new Map();

    workouts.forEach((workout) => {
        const dayKey = getDayKey(workout.created_at || referenceDate);
        totalsByDay.set(dayKey, (totalsByDay.get(dayKey) || 0) + Number(workout.duration || 0));
    });

    const startDate = new Date(referenceDate);
    startDate.setHours(0, 0, 0, 0);
    startDate.setDate(startDate.getDate() - (safeDays - 1));

    const series = Array.from({ length: safeDays }, (_, index) => {
        const date = new Date(startDate);
        date.setDate(startDate.getDate() + index);
        const minutes = Math.round(totalsByDay.get(getDayKey(date)) || 0);

        return {
            date,
            label: date.toLocaleDateString(undefined, { weekday: 'short' }),
            minutes,
            durationLabel: formatDurationLabel(minutes),
        };
    });

    const peakMinutes = Math.max(...series.map((entry) => entry.minutes), 0);

    return series.map((entry) => ({
        ...entry,
        isPeak: peakMinutes > 0 && entry.minutes === peakMinutes,
        heightPct: peakMinutes > 0 ? Math.max(12, Math.round((entry.minutes / peakMinutes) * 100)) : 12,
    }));
}

async function fetchWorkouts() {
    try {
        const response = await fetch(`${PROGRESS_API_URL}/workouts`, { headers: getAuthHeaders() });
        const result = await response.json();
        return result.success ? result.data || [] : [];
    } catch {
        return [];
    }
}

function renderActivityChart(workouts) {
    const chartEl = document.getElementById('progress-activity-chart');
    const summaryEl = document.getElementById('progress-activity-summary');
    const maxLabelEl = document.getElementById('progress-activity-max-label');
    const midLabelEl = document.getElementById('progress-activity-mid-label');

    if (!chartEl) return;

    const series = buildActivitySeries(workouts, 7);
    const peakMinutes = Math.max(...series.map((entry) => entry.minutes), 0);
    const midMinutes = peakMinutes > 0 ? Math.round(peakMinutes / 2) : 0;
    const activeDays = series.filter((entry) => entry.minutes > 0).length;

    if (summaryEl) {
        summaryEl.textContent = peakMinutes > 0
            ? `${activeDays} active day${activeDays === 1 ? '' : 's'} this week. Peak output ${formatDurationLabel(peakMinutes)}.`
            : 'No workouts this week yet. Start one session to light up your activity trend.';
    }
    if (maxLabelEl) maxLabelEl.textContent = formatDurationLabel(peakMinutes);
    if (midLabelEl) midLabelEl.textContent = formatDurationLabel(midMinutes);

    chartEl.innerHTML = series.map((entry) => `
        <div class="flex-1 min-w-0 h-full flex flex-col justify-end gap-3 group">
            <div class="relative flex-1 flex items-end">
                <div class="w-full rounded-[1.5rem] bg-white/[0.04] border border-white/5 px-2 pt-4 pb-2 h-full flex items-end">
                    <div class="w-full rounded-[1.2rem] transition-all duration-700 ${entry.isPeak ? 'bg-gradient-to-t from-primary via-secondary to-tertiary shadow-[0_0_24px_rgba(255,126,234,0.28)]' : 'bg-gradient-to-t from-primary/30 via-primary/55 to-secondary/70'}" style="height:${entry.heightPct}%"></div>
                </div>
                <div class="absolute -top-9 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full border border-white/10 bg-black/70 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-white opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                    ${entry.durationLabel}
                </div>
            </div>
            <div class="text-center">
                <p class="text-[10px] uppercase tracking-[0.25em] text-on-surface-variant">${entry.label}</p>
            </div>
        </div>
    `).join('');
}

function renderRecentWorkouts(workouts) {
    const recentEl = document.getElementById('progress-recent-workouts');
    if (!recentEl) return;

    if (workouts.length === 0) {
        recentEl.innerHTML = `
            <div class="py-8 text-center">
                <span class="material-symbols-outlined text-5xl text-on-surface-variant mb-3 block">history</span>
                <p class="text-on-surface-variant">No workouts logged yet.</p>
            </div>
        `;
        return;
    }

    const recent = [...workouts]
        .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
        .slice(0, 5);

    recentEl.innerHTML = recent.map((workout) => `
        <div class="py-4 border-b border-outline-variant/15 last:border-0 flex items-center justify-between gap-4">
            <div>
                <p class="font-bold text-white">${workout.name || 'Workout'}</p>
                <p class="text-xs text-on-surface-variant">${workout.type || 'General'} · ${new Date(workout.created_at).toLocaleDateString()}</p>
            </div>
            <p class="text-sm text-on-surface-variant">${formatDurationLabel(workout.duration || 0)}</p>
        </div>
    `).join('');
}

async function initProgressPage() {
    if (!localStorage.getItem('supabase_token')) {
        window.location.href = '/login';
        return;
    }

    const workouts = await fetchWorkouts();
    const totalWorkouts = workouts.length;
    const totalDuration = workouts.reduce((sum, workout) => sum + Number(workout.duration || 0), 0);
    const totalCalories = workouts.reduce((sum, workout) => sum + Number(workout.calories || 0), 0);

    const totalWorkoutsEl = document.getElementById('progress-total-workouts');
    const totalDurationEl = document.getElementById('progress-total-duration');
    const totalCaloriesEl = document.getElementById('progress-total-calories');

    if (totalWorkoutsEl) totalWorkoutsEl.textContent = String(totalWorkouts);
    if (totalDurationEl) totalDurationEl.textContent = formatDurationLabel(totalDuration);
    if (totalCaloriesEl) totalCaloriesEl.textContent = String(totalCalories);

    renderActivityChart(workouts);
    renderRecentWorkouts(workouts);
}

if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', initProgressPage);
}

if (typeof module !== 'undefined') {
    module.exports = {
        formatDurationLabel,
        buildActivitySeries,
    };
}

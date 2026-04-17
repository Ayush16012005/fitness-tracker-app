const GOALS_API_URL = '/api';

const STATUS_COMPLETED = 'completed';
const STATUS_FAILED = 'failed';
const STATUS_ONGOING = 'ongoing';

function isFinishedStatus(status) {
    return status === STATUS_COMPLETED || status === STATUS_FAILED;
}

function normalizeGoalStatus(goal) {
    return goal?.status || STATUS_ONGOING;
}

function splitGoals(goals) {
    return goals.reduce((groups, goal) => {
        if (isFinishedStatus(normalizeGoalStatus(goal))) {
            groups.completed.push(goal);
        } else {
            groups.ongoing.push(goal);
        }
        return groups;
    }, { ongoing: [], completed: [] });
}

function getGoalActions(goal) {
    if (isFinishedStatus(normalizeGoalStatus(goal))) {
        return [
            { key: 'delete', label: 'Delete', tone: 'danger' },
        ];
    }

    return [
        { key: STATUS_COMPLETED, label: 'Completed', tone: 'success' },
        { key: STATUS_FAILED, label: 'Failed', tone: 'warning' },
        { key: 'delete', label: 'Delete', tone: 'danger' },
    ];
}

const getAuthHeaders = () => {
    const token = localStorage.getItem('supabase_token');
    const headers = {
        'Content-Type': 'application/json',
    };
    if (token) headers.Authorization = `Bearer ${token}`;
    return headers;
};

async function fetchGoals() {
    try {
        const response = await fetch(`${GOALS_API_URL}/goals`, {
            headers: getAuthHeaders()
        });
        const result = await response.json();
        if (result.success) {
            return result.data;
        }
        return [];
    } catch (error) {
        console.error('Error fetching goals:', error);
        return [];
    }
}

async function createGoal(goalData) {
    try {
        const response = await fetch(`${GOALS_API_URL}/goals`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(goalData)
        });
        const result = await response.json().catch(() => ({}));
        if (!response.ok) {
            return { success: false, error: result.error || `Request failed (${response.status})` };
        }
        return result;
    } catch (error) {
        console.error('Error creating goal:', error);
        return { success: false, error: 'Failed to create goal' };
    }
}

async function updateGoalProgress(goalId, currentValue) {
    try {
        const response = await fetch(`${GOALS_API_URL}/goals/${goalId}`, {
            method: 'PATCH',
            headers: getAuthHeaders(),
            body: JSON.stringify({ current_value: currentValue })
        });
        const result = await response.json();
        return result;
    } catch (error) {
        console.error('Error updating goal:', error);
        return { success: false };
    }
}

async function updateGoalStatus(goalId, status) {
    try {
        const response = await fetch(`${GOALS_API_URL}/goals/${goalId}`, {
            method: 'PATCH',
            headers: getAuthHeaders(),
            body: JSON.stringify({ status })
        });
        const result = await response.json().catch(() => ({}));
        if (!response.ok) {
            return { success: false, error: result.error || `Request failed (${response.status})` };
        }
        return result;
    } catch (error) {
        console.error('Error updating goal status:', error);
        return { success: false, error: 'Failed to update goal status' };
    }
}

async function deleteGoal(goalId) {
    try {
        const response = await fetch(`${GOALS_API_URL}/goals/${goalId}`, {
            method: 'DELETE',
            headers: getAuthHeaders(),
        });
        const result = await response.json().catch(() => ({}));
        if (!response.ok) {
            return { success: false, error: result.error || `Request failed (${response.status})` };
        }
        return result;
    } catch (error) {
        console.error('Error deleting goal:', error);
        return { success: false, error: 'Failed to delete goal' };
    }
}

function escapeHtml(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function getStatusBadge(goal) {
    const status = normalizeGoalStatus(goal);
    if (status === STATUS_COMPLETED) {
        return '<span class="inline-flex items-center rounded-full bg-emerald-500/15 px-3 py-1 text-[0.7rem] font-bold uppercase tracking-[0.2em] text-emerald-300">Completed</span>';
    }
    if (status === STATUS_FAILED) {
        return '<span class="inline-flex items-center rounded-full bg-amber-500/15 px-3 py-1 text-[0.7rem] font-bold uppercase tracking-[0.2em] text-amber-300">Failed</span>';
    }
    return '<span class="inline-flex items-center rounded-full bg-surface-container-highest px-3 py-1 text-[0.7rem] font-bold uppercase tracking-[0.2em] text-on-surface-variant">Ongoing</span>';
}

function getActionButtonClass(tone) {
    const buttonClasses = {
        success: 'bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25',
        warning: 'bg-amber-500/15 text-amber-300 hover:bg-amber-500/25',
        danger: 'bg-rose-500/15 text-rose-300 hover:bg-rose-500/25',
    };

    return buttonClasses[tone] || 'bg-surface-container-highest text-on-surface hover:bg-surface-container-high';
}

function renderGoalCard(goal) {
    const goalType = goal.goal_type || goal.type || 'general';
    
    const typeColors = {
        'strength': 'border-primary',
        'body_composition': 'border-tertiary',
        'endurance': 'border-secondary'
    };
    
    const colorClass = typeColors[goalType] || 'border-primary';
    const actions = getGoalActions(goal).map((action) => `
        <button
            type="button"
            class="rounded-full px-4 py-2 text-[0.7rem] font-bold uppercase tracking-[0.18em] transition-all ${getActionButtonClass(action.tone)} disabled:cursor-not-allowed disabled:opacity-50"
            data-goal-action="${action.key}"
            data-goal-id="${goal.id}"
        >
            ${action.label}
        </button>
    `).join('');
    
    return `
        <div class="bg-surface-container-low p-8 rounded-xl border-l-4 ${colorClass} group hover:bg-surface-container transition-all" data-goal-card="${goal.id}">
            <div class="flex justify-between items-start mb-6">
                <div>
                    <div class="flex flex-wrap items-center gap-3">
                        <span class="label-md uppercase tracking-[0.2em] text-primary font-bold">${escapeHtml(goalType)}</span>
                        ${getStatusBadge(goal)}
                    </div>
                    <h4 class="text-2xl font-bold mt-3">${escapeHtml(goal.title)}</h4>
                </div>
                <div class="text-right">
                    <p class="text-on-surface-variant text-xs">${goal.current_value} / ${goal.target_value}</p>
                </div>
            </div>
            <div class="mt-4 flex justify-between text-xs text-on-surface-variant uppercase tracking-widest">
                <span>Started: ${new Date(goal.created_at).toLocaleDateString()}</span>
                <span>${goal.deadline ? `Deadline: ${new Date(goal.deadline).toLocaleDateString()}` : 'No deadline'}</span>
            </div>
            <div class="mt-6 flex flex-wrap gap-3">
                ${actions}
            </div>
        </div>
    `;
}

function openGoalModal() {
    const goalModal = document.getElementById('goal-modal');
    if (!goalModal) return;
    goalModal.classList.remove('hidden');
    goalModal.classList.add('flex');
}

function closeGoalModal() {
    const goalModal = document.getElementById('goal-modal');
    if (!goalModal) return;
    goalModal.classList.add('hidden');
    goalModal.classList.remove('flex');
}

if (typeof window !== 'undefined') {
    window.openGoalModal = openGoalModal;
    window.closeGoalModal = closeGoalModal;
}

if (typeof document !== 'undefined') {
document.addEventListener('DOMContentLoaded', async () => {
    if (!localStorage.getItem('supabase_token')) {
        window.location.href = '/login';
        return;
    }

    const goalForm = document.getElementById('goal-form');
    const goalsGrid = document.getElementById('goals-grid');
    const newGoalBtn = document.getElementById('new-goal-btn');
    const goalModal = document.getElementById('goal-modal');
    const closeGoalModalBtn = document.getElementById('close-goal-modal');
    const activeGoalCount = document.getElementById('active-goal-count');
    const goalFormError = document.getElementById('goal-form-error');
    const tabButtons = Array.from(document.querySelectorAll('[data-goals-tab]'));
    const goalsSectionTitle = document.getElementById('goals-section-title');
    const goalActionError = document.getElementById('goal-action-error');

    const state = {
        goals: [],
        activeTab: 'ongoing',
        pendingGoalIds: new Set(),
    };

    if (newGoalBtn && goalModal) {
        newGoalBtn.addEventListener('click', openGoalModal);
    }
    if (closeGoalModalBtn && goalModal) {
        closeGoalModalBtn.addEventListener('click', closeGoalModal);
    }
    if (goalModal) {
        goalModal.addEventListener('click', (e) => {
            if (e.target === goalModal) {
                closeGoalModal();
            }
        });
    }

    function setGoalActionError(message) {
        if (goalActionError) {
            goalActionError.textContent = message || '';
        }
    }

    function updateTabUi() {
        tabButtons.forEach((button) => {
            const isActive = button.dataset.goalsTab === state.activeTab;
            button.classList.toggle('bg-gradient-to-r', isActive);
            button.classList.toggle('from-primary', isActive);
            button.classList.toggle('to-secondary', isActive);
            button.classList.toggle('text-on-primary-fixed', isActive);
            button.classList.toggle('text-on-surface-variant', !isActive);
            button.classList.toggle('bg-surface-container-low', !isActive);
        });

        if (goalsSectionTitle) {
            goalsSectionTitle.textContent = state.activeTab === 'completed' ? 'Completed Goals' : 'Ongoing Goals';
        }
    }

    function getEmptyStateMarkup() {
        if (state.activeTab === 'completed') {
            return `
                <div class="bg-surface-container-low rounded-xl p-10 text-center">
                    <span class="material-symbols-outlined text-5xl text-on-surface-variant mb-3 block">trophy</span>
                    <p class="text-on-surface-variant">No completed or failed goals yet. Finish one to build your history.</p>
                </div>
            `;
        }

        return `
            <div class="bg-surface-container-low rounded-xl p-10 text-center">
                <span class="material-symbols-outlined text-5xl text-on-surface-variant mb-3 block">emoji_events</span>
                <p class="text-on-surface-variant">No ongoing goals yet. Set your first goal to get started.</p>
            </div>
        `;
    }

    function renderGoals() {
        if (!goalsGrid) return;

        const groupedGoals = splitGoals(state.goals);
        const visibleGoals = state.activeTab === 'completed' ? groupedGoals.completed : groupedGoals.ongoing;

        goalsGrid.innerHTML = visibleGoals.length > 0
            ? visibleGoals.map(renderGoalCard).join('')
            : getEmptyStateMarkup();

        if (activeGoalCount) activeGoalCount.textContent = String(groupedGoals.ongoing.length);

        state.pendingGoalIds.forEach((goalId) => {
            const actionButtons = goalsGrid.querySelectorAll(`[data-goal-id="${goalId}"]`);
            actionButtons.forEach((button) => {
                button.disabled = true;
            });
        });

        updateTabUi();
    }

    if (goalForm) {
        goalForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (goalFormError) goalFormError.textContent = '';
            const submitBtn = goalForm.querySelector('button[type="submit"]');
            if (submitBtn) submitBtn.disabled = true;

            const targetValue = parseFloat(document.getElementById('goal-target').value);
            if (Number.isNaN(targetValue) || targetValue <= 0) {
                if (goalFormError) goalFormError.textContent = 'Please enter a valid target value greater than 0.';
                if (submitBtn) submitBtn.disabled = false;
                return;
            }

            const deadlineRaw = document.getElementById('goal-deadline').value || '';
            let deadline = null;
            if (deadlineRaw) {
                // Support dd-mm-yyyy fallback from non-standard inputs/locales
                const ddmmyyyy = /^(\d{2})-(\d{2})-(\d{4})$/;
                const m = deadlineRaw.match(ddmmyyyy);
                deadline = m ? `${m[3]}-${m[2]}-${m[1]}` : deadlineRaw;
            }

            const goalData = {
                title: document.getElementById('goal-title').value,
                type: document.getElementById('goal-type').value,
                target_value: targetValue,
                current_value: 0,
                deadline
            };
            
            const result = await createGoal(goalData);
            if (result.success) {
                goalForm.reset();
                closeGoalModal();
                await loadGoals();
            } else if (goalFormError) {
                goalFormError.textContent = result.error || 'Could not save goal. Please try again.';
            }
            if (submitBtn) submitBtn.disabled = false;
        });
    }

    tabButtons.forEach((button) => {
        button.addEventListener('click', () => {
            state.activeTab = button.dataset.goalsTab || 'ongoing';
            setGoalActionError('');
            renderGoals();
        });
    });

    if (goalsGrid) {
        goalsGrid.addEventListener('click', async (event) => {
            const actionButton = event.target.closest('[data-goal-action]');
            if (!actionButton) return;

            const { goalAction, goalId } = actionButton.dataset;
            if (!goalId || state.pendingGoalIds.has(goalId)) return;

            setGoalActionError('');
            state.pendingGoalIds.add(goalId);
            renderGoals();

            let result;
            if (goalAction === 'delete') {
                result = await deleteGoal(goalId);
            } else {
                result = await updateGoalStatus(goalId, goalAction);
            }

            state.pendingGoalIds.delete(goalId);

            if (!result?.success) {
                setGoalActionError(result?.error || 'Could not update this goal. Please try again.');
                renderGoals();
                return;
            }

            await loadGoals();
        });
    }

    async function loadGoals() {
        state.goals = await fetchGoals();
        renderGoals();
    }

    loadGoals();
});
}

if (typeof module !== 'undefined') {
    module.exports = {
        STATUS_COMPLETED,
        STATUS_FAILED,
        STATUS_ONGOING,
        isFinishedStatus,
        splitGoals,
        getGoalActions,
        normalizeGoalStatus,
    };
}

const GOALS_API_URL = '/api';

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

function renderGoalCard(goal) {
    const goalType = goal.goal_type || goal.type || 'general';
    const progress = goal.target_value > 0 
        ? Math.round((goal.current_value / goal.target_value) * 100) 
        : 0;
    
    const typeColors = {
        'strength': 'border-primary',
        'body_composition': 'border-tertiary',
        'endurance': 'border-secondary'
    };
    
    const colorClass = typeColors[goalType] || 'border-primary';
    
    return `
        <div class="bg-surface-container-low p-8 rounded-xl border-l-4 ${colorClass} group hover:bg-surface-container transition-all">
            <div class="flex justify-between items-start mb-6">
                <div>
                    <span class="label-md uppercase tracking-[0.2em] text-primary font-bold">${goalType}</span>
                    <h4 class="text-2xl font-bold mt-1">${goal.title}</h4>
                </div>
                <div class="text-right">
                    <span class="text-3xl font-black italic">${progress}%</span>
                    <p class="text-on-surface-variant text-xs">${goal.current_value} / ${goal.target_value}</p>
                </div>
            </div>
            <div class="h-3 bg-surface-container-highest rounded-full overflow-hidden">
                <div class="h-full bg-primary w-[${progress}%] rounded-full transition-all duration-1000" style="width: ${progress}%"></div>
            </div>
            <div class="mt-4 flex justify-between text-xs text-on-surface-variant uppercase tracking-widest">
                <span>Started: ${new Date(goal.created_at).toLocaleDateString()}</span>
                <span>${goal.deadline ? `Deadline: ${new Date(goal.deadline).toLocaleDateString()}` : 'No deadline'}</span>
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

window.openGoalModal = openGoalModal;
window.closeGoalModal = closeGoalModal;

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
                loadGoals();
            } else if (goalFormError) {
                goalFormError.textContent = result.error || 'Could not save goal. Please try again.';
            }
            if (submitBtn) submitBtn.disabled = false;
        });
    }

    async function loadGoals() {
        if (!goalsGrid) return;
        const goals = await fetchGoals();
        
        if (goals.length > 0) {
            goalsGrid.innerHTML = goals.map(renderGoalCard).join('');
        } else {
            goalsGrid.innerHTML = '<p class="text-on-surface-variant">No goals yet. Set your first goal!</p>';
        }
        if (activeGoalCount) activeGoalCount.textContent = String(goals.filter((g) => g.status !== 'completed').length);
    }

    loadGoals();
});

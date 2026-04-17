const PROFILE_API_URL = '/api';
const PROFILE_UNIT_KEY = 'profile_unit_preference';

const getAuthHeaders = () => {
    const token = localStorage.getItem('supabase_token');
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers.Authorization = `Bearer ${token}`;
    return headers;
};

async function fetchProfile() {
    try {
        const response = await fetch(`${PROFILE_API_URL}/user/profile`, { headers: getAuthHeaders() });
        const result = await response.json();
        return result.success ? result.profile : null;
    } catch {
        return null;
    }
}

async function fetchWorkoutStats() {
    try {
        const response = await fetch(`${PROFILE_API_URL}/workouts/stats`, { headers: getAuthHeaders() });
        const result = await response.json();
        return result.success ? result.stats : null;
    } catch {
        return null;
    }
}

async function fetchWorkoutsForStreak() {
    try {
        const response = await fetch(`${PROFILE_API_URL}/workouts`, { headers: getAuthHeaders() });
        const result = await response.json();
        return result.success ? result.data || [] : [];
    } catch {
        return [];
    }
}

async function saveProfile(profileData, hasExistingProfile) {
    try {
        const response = await fetch(`${PROFILE_API_URL}/user/profile`, {
            method: hasExistingProfile ? 'PATCH' : 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(profileData)
        });
        const result = await response.json();
        return result;
    } catch {
        return { success: false, error: 'Unable to save profile right now.' };
    }
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

function kgToLbs(kg) {
    return Number(kg || 0) * 2.2046226218;
}

function lbsToKg(lbs) {
    return Number(lbs || 0) / 2.2046226218;
}

function cmToImperial(cm) {
    const totalInches = Number(cm || 0) / 2.54;
    const feet = Math.floor(totalInches / 12);
    const inches = Math.round(totalInches - feet * 12);
    if (inches === 12) {
        return { feet: feet + 1, inches: 0 };
    }
    return { feet, inches };
}

function imperialToCm(feet, inches) {
    return ((Number(feet || 0) * 12) + Number(inches || 0)) * 2.54;
}

function calculateBmi(weightKg, heightCm) {
    const weight = Number(weightKg || 0);
    const heightM = Number(heightCm || 0) / 100;
    if (!weight || !heightM) return null;
    return weight / (heightM * heightM);
}

function formatBmi(bmi) {
    if (!bmi || Number.isNaN(bmi)) return '--';
    return bmi.toFixed(1);
}

function formatDuration(totalMinutes) {
    const minutes = Number(totalMinutes || 0);
    if (minutes < 60) return `${minutes} min`;

    const hours = minutes / 60;
    if (Number.isInteger(hours)) {
        return `${hours} hr${hours === 1 ? '' : 's'}`;
    }

    return `${hours.toFixed(1)} hrs`;
}

document.addEventListener('DOMContentLoaded', async () => {
    if (!localStorage.getItem('supabase_token')) {
        window.location.href = '/login';
        return;
    }

    const email = localStorage.getItem('user_email') || '';
    const storedUnit = localStorage.getItem(PROFILE_UNIT_KEY);
    let unitMode = storedUnit === 'imperial' ? 'imperial' : 'metric';
    let currentProfile = null;

    const [
        profile,
        stats,
        workouts
    ] = await Promise.all([
        fetchProfile(),
        fetchWorkoutStats(),
        fetchWorkoutsForStreak()
    ]);

    currentProfile = profile;

    const profileName = document.getElementById('profile-name');
    const profileEmail = document.getElementById('profile-email');
    const profileStreak = document.getElementById('profile-streak');
    const profileSidebarName = document.getElementById('profile-sidebar-name');
    const profileSidebarBmi = document.getElementById('profile-sidebar-bmi');
    const setText = (id, value) => {
        const el = document.getElementById(id);
        if (el) el.textContent = value;
    };

    const nameInput = document.getElementById('full-name');
    const unitMetricBtn = document.getElementById('unit-metric-btn');
    const unitImperialBtn = document.getElementById('unit-imperial-btn');
    const metricFields = document.getElementById('metric-fields');
    const imperialFields = document.getElementById('imperial-fields');
    const weightKgInput = document.getElementById('weight-kg');
    const heightCmInput = document.getElementById('height-cm');
    const weightLbsInput = document.getElementById('weight-lbs');
    const heightFeetInput = document.getElementById('height-feet');
    const heightInchesInput = document.getElementById('height-inches');
    const feetValue = document.getElementById('feet-value');
    const inchesValue = document.getElementById('inches-value');
    const bmiValue = document.getElementById('profile-bmi');
    const bmiStatus = document.getElementById('profile-bmi-status');
    const form = document.getElementById('profile-form');
    const formError = document.getElementById('profile-form-error');
    const formSuccess = document.getElementById('profile-form-success');
    const saveBtn = document.getElementById('profile-save-btn');

    function updateBmiPreview() {
        let weightKg = null;
        let heightCm = null;

        if (unitMode === 'imperial') {
            weightKg = lbsToKg(weightLbsInput?.value);
            heightCm = imperialToCm(heightFeetInput?.value, heightInchesInput?.value);
        } else {
            weightKg = Number(weightKgInput?.value || 0);
            heightCm = Number(heightCmInput?.value || 0);
        }

        const bmi = calculateBmi(weightKg, heightCm);
        if (bmiValue) bmiValue.textContent = formatBmi(bmi);
        if (profileSidebarBmi) profileSidebarBmi.textContent = formatBmi(bmi);
        if (bmiStatus) {
            if (!bmi) {
                bmiStatus.textContent = 'Add your height and weight to calculate BMI.';
            } else if (bmi < 18.5) {
                bmiStatus.textContent = 'BMI range: underweight';
            } else if (bmi < 25) {
                bmiStatus.textContent = 'BMI range: healthy';
            } else if (bmi < 30) {
                bmiStatus.textContent = 'BMI range: overweight';
            } else {
                bmiStatus.textContent = 'BMI range: obesity';
            }
        }
    }

    function syncImperialLabels() {
        if (feetValue && heightFeetInput) feetValue.textContent = `${heightFeetInput.value} ft`;
        if (inchesValue && heightInchesInput) inchesValue.textContent = `${heightInchesInput.value} in`;
    }

    function fillFormFromProfile() {
        const fullName = currentProfile?.full_name || email.split('@')[0] || '';
        const weightKg = Number(currentProfile?.weight || 0);
        const heightCm = Number(currentProfile?.height || 0);
        const imperial = cmToImperial(heightCm);

        if (nameInput) nameInput.value = fullName;
        if (weightKgInput) weightKgInput.value = weightKg || '';
        if (heightCmInput) heightCmInput.value = heightCm || '';
        if (weightLbsInput) weightLbsInput.value = weightKg ? kgToLbs(weightKg).toFixed(1) : '';
        if (heightFeetInput) heightFeetInput.value = imperial.feet || 0;
        if (heightInchesInput) heightInchesInput.value = imperial.inches || 0;
        syncImperialLabels();
        updateBmiPreview();
    }

    function setUnitMode(nextMode) {
        unitMode = nextMode;
        localStorage.setItem(PROFILE_UNIT_KEY, unitMode);
        if (metricFields) metricFields.classList.toggle('hidden', unitMode !== 'metric');
        if (imperialFields) imperialFields.classList.toggle('hidden', unitMode !== 'imperial');

        if (unitMetricBtn) {
            unitMetricBtn.className = unitMode === 'metric'
                ? 'px-4 py-2 rounded-full bg-primary text-on-primary-fixed font-bold text-xs uppercase tracking-widest'
                : 'px-4 py-2 rounded-full bg-surface-container-high text-on-surface-variant font-bold text-xs uppercase tracking-widest';
        }
        if (unitImperialBtn) {
            unitImperialBtn.className = unitMode === 'imperial'
                ? 'px-4 py-2 rounded-full bg-primary text-on-primary-fixed font-bold text-xs uppercase tracking-widest'
                : 'px-4 py-2 rounded-full bg-surface-container-high text-on-surface-variant font-bold text-xs uppercase tracking-widest';
        }

        updateBmiPreview();
    }

    if (profileName) profileName.textContent = currentProfile?.full_name || email.split('@')[0] || 'Profile';
    if (profileSidebarName) profileSidebarName.textContent = currentProfile?.full_name || email.split('@')[0] || 'Profile';
    if (profileEmail) profileEmail.textContent = email || 'No email available';
    if (profileStreak) profileStreak.textContent = String(calculateStreakDays(workouts));

    setText('profile-total-workouts', String(stats?.totalWorkouts || 0));
    setText('profile-total-duration', formatDuration(stats?.totalDuration || 0));
    setText('profile-total-calories', String(stats?.totalCalories || 0));
    setText('profile-bmi', formatBmi(calculateBmi(currentProfile?.weight, currentProfile?.height)));

    fillFormFromProfile();
    setUnitMode(unitMode);

    if (unitMetricBtn) unitMetricBtn.addEventListener('click', () => setUnitMode('metric'));
    if (unitImperialBtn) unitImperialBtn.addEventListener('click', () => setUnitMode('imperial'));

    [weightKgInput, heightCmInput, weightLbsInput, heightFeetInput, heightInchesInput].forEach((input) => {
        if (!input) return;
        input.addEventListener('input', () => {
            syncImperialLabels();
            updateBmiPreview();
            if (formError) formError.textContent = '';
            if (formSuccess) formSuccess.textContent = '';
        });
    });

    if (nameInput) {
        nameInput.addEventListener('input', () => {
            if (formError) formError.textContent = '';
            if (formSuccess) formSuccess.textContent = '';
        });
    }

    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            if (formError) formError.textContent = '';
            if (formSuccess) formSuccess.textContent = '';

            const fullName = (nameInput?.value || '').trim();
            let weightKg = unitMode === 'imperial' ? lbsToKg(weightLbsInput?.value) : Number(weightKgInput?.value || 0);
            let heightCm = unitMode === 'imperial'
                ? imperialToCm(heightFeetInput?.value, heightInchesInput?.value)
                : Number(heightCmInput?.value || 0);

            weightKg = Number(weightKg.toFixed(2));
            heightCm = Number(heightCm.toFixed(2));

            if (!fullName) {
                if (formError) formError.textContent = 'Please enter your name.';
                return;
            }
            if (!weightKg || weightKg <= 0) {
                if (formError) formError.textContent = 'Please enter a valid weight.';
                return;
            }
            if (!heightCm || heightCm < 80 || heightCm > 260) {
                if (formError) formError.textContent = 'Please enter a valid height.';
                return;
            }

            if (saveBtn) {
                saveBtn.disabled = true;
                saveBtn.textContent = 'Saving...';
            }

            const result = await saveProfile({
                full_name: fullName,
                weight: weightKg,
                height: heightCm
            }, Boolean(currentProfile));

            if (saveBtn) {
                saveBtn.disabled = false;
                saveBtn.textContent = 'Save Changes';
            }

            if (!result.success) {
                if (formError) formError.textContent = result.error || 'Failed to save profile.';
                return;
            }

            currentProfile = result.profile || {
                ...(currentProfile || {}),
                full_name: fullName,
                weight: weightKg,
                height: heightCm
            };

            if (profileName) profileName.textContent = currentProfile.full_name || fullName;
            if (profileSidebarName) profileSidebarName.textContent = currentProfile.full_name || fullName;
            fillFormFromProfile();
            setUnitMode(unitMode);
            if (formSuccess) formSuccess.textContent = 'Profile updated.';
        });
    }
});

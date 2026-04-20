const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const { supabaseRestFetch } = require('../lib/supabase');

const WORKOUTS_TABLE = 'workouts';
const SETS_TABLE = 'workout_sets';

router.get('/', requireAuth, async (req, res) => {
    const userId = req.user.id;
    try {
        const response = await supabaseRestFetch(
            `${WORKOUTS_TABLE}?user_id=eq.${userId}&order=created_at.desc`,
            { admin: true },
            req.accessToken
        );
        
        const data = await response.json();
        res.json({ success: true, data });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

router.post('/', requireAuth, async (req, res) => {
    const userId = req.user.id;
    const { name, type, duration, calories, notes } = req.body;
    
    try {
        const response = await supabaseRestFetch(
            WORKOUTS_TABLE,
            {
                method: 'POST',
                admin: true,
                headers: {
                    'Content-Type': 'application/json',
                    'Prefer': 'return=representation'
                },
                body: JSON.stringify({
                    user_id: userId,
                    name,
                    type,
                    duration,
                    calories,
                    notes,
                    created_at: new Date().toISOString()
                })
            },
            req.accessToken
        );
        
        const data = await response.json();
        
        if (response.ok) {
            res.json({ success: true, data: data[0] });
        } else {
            res.status(400).json({ error: 'Failed to create workout' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

router.post('/sets', requireAuth, async (req, res) => {
    const { workout_id, exercise, weight, reps, rpe } = req.body;
    
    try {
        const response = await supabaseRestFetch(
            SETS_TABLE,
            {
                method: 'POST',
                admin: true,
                headers: {
                    'Content-Type': 'application/json',
                    'Prefer': 'return=representation'
                },
                body: JSON.stringify({
                    workout_id,
                    exercise,
                    weight,
                    reps,
                    rpe,
                    created_at: new Date().toISOString()
                })
            },
            req.accessToken
        );
        
        const data = await response.json();
        
        if (response.ok) {
            res.json({ success: true, data: data[0] });
        } else {
            res.status(400).json({ error: 'Failed to log set' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

router.get('/stats', requireAuth, async (req, res) => {
    const userId = req.user.id;
    try {
        const response = await supabaseRestFetch(
            `${WORKOUTS_TABLE}?user_id=eq.${userId}`,
            { admin: true },
            req.accessToken
        );
        
        const workouts = await response.json();
        
        const totalWorkouts = workouts.length;
        const totalCalories = workouts.reduce((sum, w) => sum + (w.calories || 0), 0);
        const totalDuration = workouts.reduce((sum, w) => sum + (w.duration || 0), 0);
        
        res.json({
            success: true,
            stats: {
                totalWorkouts,
                totalCalories,
                totalDuration,
                workoutsThisWeek: workouts.filter(w => {
                    const weekAgo = new Date();
                    weekAgo.setDate(weekAgo.getDate() - 7);
                    return new Date(w.created_at) > weekAgo;
                }).length
            }
        });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;

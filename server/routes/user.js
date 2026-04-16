const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const { supabaseRestFetch } = require('../lib/supabase');

const PROFILES_TABLE = 'profiles';

router.get('/profile', requireAuth, async (req, res) => {
    const userId = req.user.id;
    try {
        const response = await supabaseRestFetch(
            `${PROFILES_TABLE}?user_id=eq.${userId}`,
            { admin: true },
            req.accessToken
        );
        
        const data = await response.json();
        
        if (response.ok && data.length > 0) {
            res.json({ success: true, profile: data[0] });
        } else {
            res.json({ success: true, profile: null });
        }
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

router.post('/profile', requireAuth, async (req, res) => {
    const userId = req.user.id;
    const { full_name, height, weight, experience_level } = req.body;
    
    try {
        const response = await supabaseRestFetch(
            PROFILES_TABLE,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Prefer': 'return=representation'
                },
                body: JSON.stringify({
                    user_id: userId,
                    full_name,
                    height,
                    weight,
                    experience_level,
                    xp: 0,
                    created_at: new Date().toISOString()
                })
            },
            req.accessToken
        );
        
        const data = await response.json();
        
        if (response.ok) {
            res.json({ success: true, profile: data[0] });
        } else {
            res.status(400).json({ error: 'Failed to create profile' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

router.patch('/profile', requireAuth, async (req, res) => {
    const userId = req.user.id;
    const { full_name, height, weight, experience_level, xp } = req.body;
    
    try {
        const updates = {};
        if (full_name !== undefined) updates.full_name = full_name;
        if (height !== undefined) updates.height = height;
        if (weight !== undefined) updates.weight = weight;
        if (experience_level !== undefined) updates.experience_level = experience_level;
        if (xp !== undefined) updates.xp = xp;
        
        const response = await supabaseRestFetch(
            `${PROFILES_TABLE}?user_id=eq.${userId}`,
            {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Prefer': 'return=representation'
                },
                body: JSON.stringify(updates)
            },
            req.accessToken
        );
        
        const data = await response.json();
        
        if (response.ok) {
            res.json({ success: true, profile: data[0] });
        } else {
            res.status(400).json({ error: 'Failed to update profile' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;

const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const { supabaseRestFetch } = require('../lib/supabase');

const GOALS_TABLE = 'goals';
const ALLOWED_STATUSES = new Set(['ongoing', 'completed', 'failed']);

router.get('/', requireAuth, async (req, res) => {
    const userId = req.user.id;
    try {
        const response = await supabaseRestFetch(
            `${GOALS_TABLE}?user_id=eq.${userId}&order=created_at.desc`,
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
    const { title, type, target_value, current_value, deadline } = req.body;
    
    try {
        const basePayload = {
            user_id: userId,
            title,
            target_value,
            current_value: current_value ?? 0
        };
        if (type) basePayload.goal_type = type;
        if (deadline) basePayload.deadline = deadline;

        const attemptPayloads = [
            { ...basePayload },
            { ...basePayload, goal_type: undefined, type },
            (() => {
                const minimal = { ...basePayload };
                delete minimal.goal_type;
                return minimal;
            })()
        ];

        let lastError = null;
        for (const payload of attemptPayloads) {
            const response = await supabaseRestFetch(
                GOALS_TABLE,
                {
                    method: 'POST',
                    admin: true,
                    headers: {
                        'Content-Type': 'application/json',
                        'Prefer': 'return=representation'
                    },
                    body: JSON.stringify(payload)
                },
                req.accessToken
            );

            const data = await response.json().catch(() => ({}));
            if (response.ok) {
                return res.json({ success: true, data: data[0] });
            }

            const msg = data?.message || data?.details || data?.hint || data?.error || 'Failed to create goal';
            lastError = msg;
            const lower = String(msg).toLowerCase();
            const knownColumnError =
                (lower.includes('type') && lower.includes('column')) ||
                (lower.includes('goal_type') && lower.includes('column'));
            if (!knownColumnError) break;
        }

        res.status(400).json({ error: lastError || 'Failed to create goal' });
    } catch (error) {
        res.status(500).json({ error: error.message || 'Server error' });
    }
});

router.patch('/:id', requireAuth, async (req, res) => {
    const userId = req.user.id;
    const { id } = req.params;
    const { current_value, status } = req.body;
    
    try {
        const updates = {};
        if (current_value !== undefined) updates.current_value = current_value;
        if (status !== undefined) {
            if (!ALLOWED_STATUSES.has(status)) {
                return res.status(400).json({ error: 'Invalid goal status' });
            }
            updates.status = status;
        }
        
        const response = await supabaseRestFetch(
            `${GOALS_TABLE}?id=eq.${id}&user_id=eq.${userId}`,
            {
                method: 'PATCH',
                admin: true,
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
            res.json({ success: true, data: data[0] });
        } else {
            res.status(400).json({ error: 'Failed to update goal' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

router.delete('/:id', requireAuth, async (req, res) => {
    const userId = req.user.id;
    const { id } = req.params;

    try {
        const response = await supabaseRestFetch(
            `${GOALS_TABLE}?id=eq.${id}&user_id=eq.${userId}`,
            {
                method: 'DELETE',
                admin: true,
                headers: {
                    'Prefer': 'return=representation'
                }
            },
            req.accessToken
        );

        const data = await response.json().catch(() => ([]));

        if (response.ok) {
            return res.json({ success: true, data: data[0] || null });
        }

        return res.status(400).json({ error: 'Failed to delete goal' });
    } catch (error) {
        return res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;

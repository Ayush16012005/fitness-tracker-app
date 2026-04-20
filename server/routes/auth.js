const express = require('express');
const router = express.Router();
const { SUPABASE_URL, SUPABASE_ANON_KEY } = require('../lib/supabase');

function getSupabaseErrorPayload(data, fallbackMessage) {
    return {
        error: data?.msg || data?.error_description || data?.error || fallbackMessage,
        ...(data?.error_code ? { code: data.error_code } : {}),
        ...(data?.error_id ? { error_id: data.error_id } : {})
    };
}

router.post('/signup', async (req, res) => {
    const { email, password, fullName } = req.body;

    try {
        const response = await fetch(`${SUPABASE_URL}/auth/v1/signup`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                apikey: SUPABASE_ANON_KEY
            },
            body: JSON.stringify({ email, password, data: { full_name: fullName } })
        });

        const data = await response.json();

        if (response.ok) {
            res.json({ success: true, data });
        } else {
            if (response.status >= 500) {
                console.error('Supabase signup failed', data);
            }
            res.status(response.status).json(getSupabaseErrorPayload(data, 'Signup failed'));
        }
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const response = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                apikey: SUPABASE_ANON_KEY
            },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (response.ok) {
            res.json({
                success: true,
                data: {
                    access_token: data.access_token,
                    refresh_token: data.refresh_token,
                    expires_in: data.expires_in,
                    user: data.user
                }
            });
        } else {
            const rawError = data.msg || data.error_description || data.error || 'Login failed';
            const errorMessage = String(rawError).toLowerCase().includes('email not confirmed')
                ? 'Please confirm your email first, then log in.'
                : rawError;
            res.status(400).json({ error: errorMessage });
        }
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

router.post('/logout', (req, res) => {
    res.json({ success: true });
});

module.exports = router;

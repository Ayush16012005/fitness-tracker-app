const getRequiredEnv = (name) => {
    const value = process.env[name];
    if (!value) {
        throw new Error(`Missing required environment variable: ${name}`);
    }
    return value;
};

const SUPABASE_URL = getRequiredEnv('SUPABASE_URL');
const SUPABASE_ANON_KEY = getRequiredEnv('SUPABASE_ANON_KEY');

const getAccessToken = (req) => {
    const auth = req.headers.authorization || '';
    if (!auth.startsWith('Bearer ')) {
        return null;
    }
    return auth.slice(7).trim();
};

const getUserFromToken = async (accessToken) => {
    if (!accessToken) {
        return null;
    }

    const response = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
        headers: {
            apikey: SUPABASE_ANON_KEY,
            Authorization: `Bearer ${accessToken}`
        }
    });

    if (!response.ok) {
        return null;
    }

    return response.json();
};

const supabaseRestFetch = (path, options = {}, accessToken) => {
    const headers = {
        apikey: SUPABASE_ANON_KEY,
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        ...(options.headers || {})
    };

    return fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
        ...options,
        headers
    });
};

module.exports = {
    SUPABASE_URL,
    SUPABASE_ANON_KEY,
    getAccessToken,
    getUserFromToken,
    supabaseRestFetch
};

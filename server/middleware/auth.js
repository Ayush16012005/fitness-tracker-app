const { getAccessToken, getUserFromToken } = require('../lib/supabase');

function requireAuth(req, res, next) {
    const accessToken = getAccessToken(req);

    if (!accessToken) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    getUserFromToken(accessToken)
        .then((user) => {
            if (!user || !user.id) {
                return res.status(401).json({ error: 'Unauthorized' });
            }

            req.accessToken = accessToken;
            req.user = user;
            next();
        })
        .catch(() => res.status(500).json({ error: 'Server error' }));
}

module.exports = { requireAuth };

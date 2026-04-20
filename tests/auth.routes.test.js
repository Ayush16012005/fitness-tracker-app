const assert = require('node:assert/strict');

process.env.SUPABASE_URL = process.env.SUPABASE_URL || 'https://example.supabase.co';
process.env.SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'test-anon-key';

const router = require('../server/routes/auth');

function runTest(name, fn) {
    Promise.resolve()
        .then(fn)
        .then(() => {
            console.log(`PASS ${name}`);
        })
        .catch((error) => {
            console.error(`FAIL ${name}`);
            console.error(error);
            process.exitCode = 1;
        });
}

function getRouteHandler(path, method) {
    const layer = router.stack.find((entry) => entry.route?.path === path && entry.route.methods?.[method]);
    if (!layer) {
        throw new Error(`Route ${method.toUpperCase()} ${path} not found`);
    }
    return layer.route.stack[0].handle;
}

function createResponse() {
    return {
        statusCode: 200,
        body: undefined,
        status(code) {
            this.statusCode = code;
            return this;
        },
        json(payload) {
            this.body = payload;
            return this;
        }
    };
}

runTest('signup preserves upstream Supabase status and error details', async () => {
    const signupHandler = getRouteHandler('/signup', 'post');
    const originalFetch = global.fetch;

    global.fetch = async () => ({
        ok: false,
        status: 500,
        async json() {
            return {
                msg: 'Database error saving new user',
                error_code: 'unexpected_failure',
                error_id: 'abc123'
            };
        }
    });

    const req = {
        body: {
            email: 'test@example.com',
            password: 'Password123!',
            fullName: 'Test User'
        }
    };
    const res = createResponse();

    try {
        await signupHandler(req, res);
    } finally {
        global.fetch = originalFetch;
    }

    assert.equal(res.statusCode, 500);
    assert.deepEqual(res.body, {
        error: 'Database error saving new user',
        code: 'unexpected_failure',
        error_id: 'abc123'
    });
});

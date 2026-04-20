const assert = require('node:assert/strict');

const {
    formatDurationLabel,
    buildActivitySeries,
} = require('../public/js/progress.js');

function runTest(name, fn) {
    try {
        fn();
        console.log(`PASS ${name}`);
    } catch (error) {
        console.error(`FAIL ${name}`);
        throw error;
    }
}

runTest('formatDurationLabel keeps minutes under one hour', () => {
    assert.equal(formatDurationLabel(45), '45 min');
});

runTest('formatDurationLabel converts long durations into hours and minutes', () => {
    assert.equal(formatDurationLabel(60), '1 hr');
    assert.equal(formatDurationLabel(125), '2 hrs 5 min');
});

runTest('buildActivitySeries groups recent workouts by day and marks peak day', () => {
    const now = new Date();
    const oneDayMs = 24 * 60 * 60 * 1000;
    const workouts = [
        { duration: 30, created_at: new Date(now.getTime() - oneDayMs).toISOString() },
        { duration: 20, created_at: new Date(now.getTime() - oneDayMs).toISOString() },
        { duration: 75, created_at: now.toISOString() },
    ];

    const series = buildActivitySeries(workouts, 3, now);

    assert.equal(series.length, 3);
    assert.deepEqual(series.map((entry) => entry.minutes), [0, 50, 75]);
    assert.deepEqual(series.map((entry) => entry.durationLabel), ['0 min', '50 min', '1 hr 15 min']);
    assert.equal(series[2].isPeak, true);
    assert.equal(series[1].isPeak, false);
});

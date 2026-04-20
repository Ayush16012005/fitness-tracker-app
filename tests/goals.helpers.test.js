const assert = require('node:assert/strict');

const {
    splitGoals,
    isFinishedStatus,
    getGoalActions,
} = require('../public/js/goals.js');

function runTest(name, fn) {
    try {
        fn();
        console.log(`PASS ${name}`);
    } catch (error) {
        console.error(`FAIL ${name}`);
        throw error;
    }
}

runTest('splitGoals separates ongoing from finished goals', () => {
    const goals = [
        { id: 1, status: 'ongoing' },
        { id: 2, status: 'completed' },
        { id: 3, status: 'failed' },
        { id: 4 },
    ];

    const grouped = splitGoals(goals);

    assert.deepEqual(grouped.ongoing.map((goal) => goal.id), [1, 4]);
    assert.deepEqual(grouped.completed.map((goal) => goal.id), [2, 3]);
});

runTest('isFinishedStatus matches completed history statuses', () => {
    assert.equal(isFinishedStatus('completed'), true);
    assert.equal(isFinishedStatus('failed'), true);
    assert.equal(isFinishedStatus('ongoing'), false);
    assert.equal(isFinishedStatus(undefined), false);
});

runTest('getGoalActions returns full actions for ongoing goals and delete-only for finished goals', () => {
    assert.deepEqual(
        getGoalActions({ status: 'ongoing' }).map((action) => action.key),
        ['completed', 'failed', 'delete']
    );

    assert.deepEqual(
        getGoalActions({ status: 'completed' }).map((action) => action.key),
        ['delete']
    );
});

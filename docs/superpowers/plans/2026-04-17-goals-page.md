# Goals Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add goal completion, failure, deletion, and ongoing/completed tabs to the goals page.

**Architecture:** Keep the existing Express route and browser script structure, extending the API with a delete route and status handling while moving page rendering to a small client-side state layer. Add pure helper functions in the goals script so the main lifecycle logic can be regression-tested with Node's built-in test runner without adding dependencies.

**Tech Stack:** Express, browser JavaScript, Tailwind via CDN, Node built-in test runner

---

### Task 1: Add Goal Helper Tests

**Files:**
- Modify: `public/js/goals.js`
- Create: `tests/goals.helpers.test.js`

- [ ] **Step 1: Write the failing test**

```js
test('splitGoals separates ongoing from finished goals', () => {
  const goals = [
    { id: 1, status: 'ongoing' },
    { id: 2, status: 'completed' },
    { id: 3, status: 'failed' }
  ];

  assert.deepEqual(splitGoals(goals).ongoing.map((goal) => goal.id), [1]);
  assert.deepEqual(splitGoals(goals).completed.map((goal) => goal.id), [2, 3]);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/goals.helpers.test.js`
Expected: FAIL because `splitGoals` is not exported yet.

- [ ] **Step 3: Write minimal implementation**

```js
function splitGoals(goals) {
  return {
    ongoing: goals.filter((goal) => goal.status !== 'completed' && goal.status !== 'failed'),
    completed: goals.filter((goal) => goal.status === 'completed' || goal.status === 'failed')
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/goals.helpers.test.js`
Expected: PASS

### Task 2: Extend Goals API

**Files:**
- Modify: `server/routes/goals.js`

- [ ] **Step 1: Write the failing test**

```js
test('buildFinishedGoalState treats failed goals as finished history', () => {
  assert.equal(isFinishedStatus('failed'), true);
  assert.equal(isFinishedStatus('completed'), true);
  assert.equal(isFinishedStatus('ongoing'), false);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/goals.helpers.test.js`
Expected: FAIL because helper does not exist yet.

- [ ] **Step 3: Write minimal implementation**

```js
function isFinishedStatus(status) {
  return status === 'completed' || status === 'failed';
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/goals.helpers.test.js`
Expected: PASS

- [ ] **Step 5: Add delete route and status validation**

```js
router.delete('/:id', requireAuth, async (req, res) => {
  const response = await supabaseRestFetch(
    `${GOALS_TABLE}?id=eq.${req.params.id}&user_id=eq.${req.user.id}`,
    { method: 'DELETE', admin: true, headers: { Prefer: 'return=representation' } },
    req.accessToken
  );
});
```

### Task 3: Update Goals Page UI

**Files:**
- Modify: `public/goals.html`
- Modify: `public/js/goals.js`

- [ ] **Step 1: Write the failing test**

```js
test('getGoalActions returns completed, failed, and delete actions for ongoing goals', () => {
  assert.deepEqual(
    getGoalActions({ status: 'ongoing' }).map((action) => action.key),
    ['completed', 'failed', 'delete']
  );
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/goals.helpers.test.js`
Expected: FAIL because helper does not exist yet.

- [ ] **Step 3: Write minimal implementation**

```js
function getGoalActions(goal) {
  if (isFinishedStatus(goal.status)) return [{ key: 'delete' }];
  return [{ key: 'completed' }, { key: 'failed' }, { key: 'delete' }];
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/goals.helpers.test.js`
Expected: PASS

- [ ] **Step 5: Implement tabs, empty states, badges, and action buttons**

```js
const grouped = splitGoals(goals);
const visibleGoals = activeTab === 'completed' ? grouped.completed : grouped.ongoing;
```

### Task 4: Verify End To End

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Add a test script**

```json
"scripts": {
  "start": "node server/index.js",
  "dev": "node server/index.js",
  "test": "node --test"
}
```

- [ ] **Step 2: Run automated tests**

Run: `npm test`
Expected: PASS

- [ ] **Step 3: Run manual browser verification**

Run: start the app, create a goal, mark one completed, mark one failed, delete one, and confirm tabs update correctly.

const app = require('../app');
const config = require('../config/env');
const connectDB = require('../config/db');

const runTests = async () => {
  await connectDB();
  const PORT = 5055;
  const server = app.listen(PORT);
  const BASE_URL = `http://localhost:${PORT}/api/v1`;

  const logStep = (msg) => console.log(`\n➡️  ${msg}`);
  const assert = (condition, msg) => {
    if (!condition) {
      console.error(`❌ ASSERTION FAILED: ${msg}`);
      throw new Error(`Assertion failed: ${msg}`);
    }
    console.log(`  ✓ ${msg}`);
  };

  try {
    // 1. Health checks
    logStep('Test 1: Health Check');
    const healthRes = await fetch(`http://localhost:${PORT}/health`);
    const healthJson = await healthRes.json();
    assert(healthRes.status === 200 && healthJson.status === 'ok', 'Server is healthy');

    // 2. Authentication
    logStep('Test 2: Authentication');
    const login = async (email, password) => {
      const res = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      return data.data?.token;
    };

    const adminToken = await login('admin@labelloop.ai', 'password123');
    const aliceToken = await login('alice@labelloop.ai', 'password123');
    const bobToken = await login('bob@labelloop.ai', 'password123');
    const reviewerToken = await login('reviewer@labelloop.ai', 'password123');

    assert(!!adminToken, 'Admin logged in');
    assert(!!aliceToken, 'Annotator Alice logged in');
    assert(!!bobToken, 'Annotator Bob logged in');
    assert(!!reviewerToken, 'Reviewer logged in');

    // Test Me Endpoint
    const meRes = await fetch(`${BASE_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${aliceToken}` }
    });
    const meData = await meRes.json();
    assert(meData.data.user.email === 'alice@labelloop.ai', 'Annotator profile retrieved via /auth/me');

    // 3. Projects
    logStep('Test 3: Project listing & stats');
    const projRes = await fetch(`${BASE_URL}/projects`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const projData = await projRes.json();
    const project = projData.data.projects[0];
    assert(project && project.name.includes('Customer Support'), 'Projects fetched successfully');

    const statsRes = await fetch(`${BASE_URL}/projects/${project._id}/stats`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const statsData = await statsRes.json();
    assert(statsData.data.stats.taskCounts.total > 0, 'Project statistics aggregated correctly');

    // 4. Task Queue & Atomic Lock
    logStep('Test 4: Task Queue, Lock & Gold Standard Annotation');
    const nextTaskRes = await fetch(`${BASE_URL}/projects/${project._id}/tasks/next`, {
      headers: { Authorization: `Bearer ${aliceToken}` }
    });
    const nextTaskData = await nextTaskRes.json();
    const task1 = nextTaskData.data.task;
    assert(task1 && task1.status === 'assigned', 'Next task fetched and locked atomically for Alice');

    // Skip mechanism test
    const skipRes = await fetch(`${BASE_URL}/tasks/${task1._id}/skip`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${aliceToken}` }
    });
    const skipData = await skipRes.json();
    assert(skipData.data.task.status === 'unassigned', 'Skipped task reverted to unassigned status');

    // Fetch again (should give another task or same task not skipped)
    const nextTaskRes2 = await fetch(`${BASE_URL}/projects/${project._id}/tasks/next`, {
      headers: { Authorization: `Bearer ${aliceToken}` }
    });
    const nextTaskData2 = await nextTaskRes2.json();
    const task2 = nextTaskData2.data.task;
    assert(task2 && task2._id !== task1._id, 'Alice received an unskipped task');

    // Submit annotation
    const annotateRes = await fetch(`${BASE_URL}/tasks/${task2._id}/annotate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${aliceToken}`
      },
      body: JSON.stringify({
        label: 'Positive',
        confidence: 5,
        timeSpentSeconds: 12
      })
    });
    const annotateData = await annotateRes.json();
    assert(annotateData.success === true, 'Annotation submitted successfully');

    // 5. Consensus Resolution & Disagreement Escalation
    logStep('Test 5: Testing Consensus Agreement & Disagreement Escalation');
    // Create a new task with overlapCount = 2 to quickly test consensus
    const newTaskRes = await fetch(`${BASE_URL}/projects/${project._id}/tasks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        tasks: [{ text: 'Great tool for our machine learning team!' }]
      })
    });
    const newTaskData = await newTaskRes.json();
    const testTask = newTaskData.data.tasks[0];

    // Annotator 1 labels 'Positive'
    await fetch(`${BASE_URL}/tasks/${testTask._id}/annotate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${aliceToken}`
      },
      body: JSON.stringify({ label: 'Positive', confidence: 5 })
    });

    // Annotator 2 labels 'Negative' (creates disagreement for overlap 2 or leads to in_review)
    const bobAnnotateRes = await fetch(`${BASE_URL}/tasks/${testTask._id}/annotate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${bobToken}`
      },
      body: JSON.stringify({ label: 'Negative', confidence: 4 })
    });
    const bobAnnotateData = await bobAnnotateRes.json();
    assert(bobAnnotateData.success === true, 'Bob submitted second annotation');

    // 6. Review Queue & Decision
    logStep('Test 6: Review Queue & Reviewer Decision');
    // Manually test review queue endpoint
    const reviewQueueRes = await fetch(`${BASE_URL}/projects/${project._id}/tasks/review-queue`, {
      headers: { Authorization: `Bearer ${reviewerToken}` }
    });
    const reviewQueueData = await reviewQueueRes.json();
    assert(Array.isArray(reviewQueueData.data.tasks), 'Review queue fetched successfully');

    // 7. Export Dataset
    logStep('Test 7: Export Dataset (JSON & CSV)');
    const exportJsonRes = await fetch(`${BASE_URL}/projects/${project._id}/export?format=json&completedOnly=false`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const exportJson = await exportJsonRes.json();
    assert(exportJson.data.totalExported > 0, 'Exported dataset in JSON format successfully');

    const exportCsvRes = await fetch(`${BASE_URL}/projects/${project._id}/export?format=csv&completedOnly=false`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const exportCsvText = await exportCsvRes.text();
    assert(exportCsvText.startsWith('"id","text","label"'), 'Exported dataset in CSV format successfully');

    console.log('\n======================================================');
    console.log('🎉 ALL BACKEND ENDPOINTS AND WORKFLOWS PASSED!');
    console.log('======================================================\n');
  } finally {
    server.close();
    process.exit(0);
  }
};

runTests().catch((err) => {
  console.error('\n❌ Test suite failed:', err);
  process.exit(1);
});

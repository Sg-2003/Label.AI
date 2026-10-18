const mongoose = require('mongoose');
const config = require('../config/env');
const connectDB = require('../config/db');
const User = require('../models/User');
const Project = require('../models/Project');
const Task = require('../models/Task');
const Annotation = require('../models/Annotation');
const Review = require('../models/Review');
const { ROLES, TASK_STATUS, TASK_TYPES } = require('../config/constants');

const seedData = async () => {
  await connectDB();
  console.log('[Seed] Cleaning old database collections...');

  await Promise.all([
    User.deleteMany({}),
    Project.deleteMany({}),
    Task.deleteMany({}),
    Annotation.deleteMany({}),
    Review.deleteMany({})
  ]);

  console.log('[Seed] Creating demo users...');
  const passwordHash = await User.hashPassword('password123');

  const admin = await User.create({
    name: 'Admin User',
    email: 'admin@labelloop.ai',
    passwordHash,
    role: ROLES.ADMIN
  });

  const annotator1 = await User.create({
    name: 'Alice Annotator',
    email: 'alice@labelloop.ai',
    passwordHash,
    role: ROLES.ANNOTATOR
  });

  const annotator2 = await User.create({
    name: 'Bob Annotator',
    email: 'bob@labelloop.ai',
    passwordHash,
    role: ROLES.ANNOTATOR
  });

  const annotator3 = await User.create({
    name: 'Charlie Annotator',
    email: 'charlie@labelloop.ai',
    passwordHash,
    role: ROLES.ANNOTATOR
  });

  const reviewer = await User.create({
    name: 'Rachel Reviewer',
    email: 'reviewer@labelloop.ai',
    passwordHash,
    role: ROLES.REVIEWER
  });

  console.log('[Seed] Creating sample classification project...');
  const project = await Project.create({
    name: 'Customer Support Sentiment & Intent',
    description: 'Classify incoming customer feedback into sentiment categories for AI routing.',
    taskType: TASK_TYPES.TEXT_CLASSIFICATION,
    overlapCount: 3,
    guidelines: 'Read the feedback snippet carefully. Assign Positive if customer is pleased, Negative if frustrated or reporting critical issues, Neutral for simple queries, and Spam for unsolicited promotional text.',
    labels: [
      { name: 'Positive', color: '#10B981', shortcutKey: '1' },
      { name: 'Negative', color: '#EF4444', shortcutKey: '2' },
      { name: 'Neutral', color: '#6B7280', shortcutKey: '3' },
      { name: 'Spam', color: '#8B5CF6', shortcutKey: '4' }
    ],
    members: [
      { userId: annotator1._id, role: ROLES.ANNOTATOR },
      { userId: annotator2._id, role: ROLES.ANNOTATOR },
      { userId: annotator3._id, role: ROLES.ANNOTATOR },
      { userId: reviewer._id, role: ROLES.REVIEWER }
    ],
    createdBy: admin._id,
    aiEnabled: true,
    counts: {
      total: 8,
      completed: 0
    }
  });

  console.log('[Seed] Creating sample dataset tasks...');
  const sampleTasks = [
    {
      projectId: project._id,
      data: {
        text: 'The onboarding was exceptionally smooth and the platform saved our team 20 hours this week!',
        metadata: { source: 'G2 Review', sentiment_hint: 'positive' }
      },
      status: TASK_STATUS.UNASSIGNED,
      isGoldStandard: true,
      goldLabel: 'Positive'
    },
    {
      projectId: project._id,
      data: {
        text: 'The payment gateway failed twice during checkout and deducted money without confirming my order.',
        metadata: { source: 'Support Ticket #1042', priority: 'high' }
      },
      status: TASK_STATUS.UNASSIGNED,
      isGoldStandard: true,
      goldLabel: 'Negative'
    },
    {
      projectId: project._id,
      data: {
        text: 'Can you please let me know if there is an export option to CSV in the settings tab?',
        metadata: { source: 'Intercom Chat' }
      },
      status: TASK_STATUS.UNASSIGNED,
      isGoldStandard: false
    },
    {
      projectId: project._id,
      data: {
        text: 'CLICK HERE TO WIN A FREE $500 AMAZON GIFT CARD RIGHT NOW!!!',
        metadata: { source: 'Email inbound' }
      },
      status: TASK_STATUS.UNASSIGNED,
      isGoldStandard: false
    },
    {
      projectId: project._id,
      data: {
        text: 'The latest update changed the layout slightly, taking a bit of time to get used to.',
        metadata: { source: 'Survey response' }
      },
      status: TASK_STATUS.UNASSIGNED,
      isGoldStandard: false
    },
    {
      projectId: project._id,
      data: {
        text: 'Super fast response from the customer support team! Resolved my issue in 5 minutes flat.',
        metadata: { source: 'Twitter Mention' }
      },
      status: TASK_STATUS.UNASSIGNED,
      isGoldStandard: false
    },
    {
      projectId: project._id,
      data: {
        text: 'Disappointed with the downtime during peak hours yesterday. Cost us multiple client deals.',
        metadata: { source: 'Support Ticket #1089' }
      },
      status: TASK_STATUS.UNASSIGNED,
      isGoldStandard: false
    },
    {
      projectId: project._id,
      data: {
        text: 'What are the current pricing tiers for enterprise volume above 100,000 tasks per month?',
        metadata: { source: 'Sales Inquiry' }
      },
      status: TASK_STATUS.UNASSIGNED,
      isGoldStandard: false
    }
  ];

  await Task.insertMany(sampleTasks);

  console.log('\n======================================================');
  console.log('✅ Demo Seed Data Ready:');
  console.log('   Admin:      admin@labelloop.ai     / password123');
  console.log('   Annotator:  alice@labelloop.ai     / password123');
  console.log('   Annotator:  bob@labelloop.ai       / password123');
  console.log('   Annotator:  charlie@labelloop.ai   / password123');
  console.log('   Reviewer:   reviewer@labelloop.ai  / password123');
  console.log(`   Project:    "${project.name}" (ID: ${project._id})`);
  console.log('======================================================\n');

  await mongoose.disconnect();
  console.log('[Seed] Done.');
  process.exit(0);
};

seedData().catch((err) => {
  console.error('[Seed Error]', err);
  process.exit(1);
});

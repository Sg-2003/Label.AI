const mongoose = require('mongoose');
const { PROJECT_STATUS, TASK_TYPES, ROLES } = require('../config/constants');

const labelSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    color: {
      type: String,
      default: '#3B82F6'
    },
    shortcutKey: {
      type: String,
      default: ''
    }
  },
  { _id: false }
);

const memberSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    role: {
      type: String,
      enum: Object.values(ROLES),
      default: ROLES.ANNOTATOR
    }
  },
  { _id: false }
);

const projectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Project name is required'],
      trim: true
    },
    description: {
      type: String,
      default: ''
    },
    taskType: {
      type: String,
      enum: Object.values(TASK_TYPES),
      default: TASK_TYPES.TEXT_CLASSIFICATION
    },
    labels: {
      type: [labelSchema],
      default: []
    },
    guidelines: {
      type: String,
      default: ''
    },
    overlapCount: {
      type: Number,
      default: 3,
      min: [1, 'Overlap count must be at least 1']
    },
    members: {
      type: [memberSchema],
      default: []
    },
    aiEnabled: {
      type: Boolean,
      default: false
    },
    status: {
      type: String,
      enum: Object.values(PROJECT_STATUS),
      default: PROJECT_STATUS.ACTIVE
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    counts: {
      total: {
        type: Number,
        default: 0
      },
      completed: {
        type: Number,
        default: 0
      }
    }
  },
  {
    timestamps: true
  }
);

projectSchema.index({ createdBy: 1 });
projectSchema.index({ status: 1 });
projectSchema.index({ 'members.userId': 1 });

const Project = mongoose.model('Project', projectSchema);

module.exports = Project;

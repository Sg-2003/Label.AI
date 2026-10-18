const mongoose = require('mongoose');
const { TASK_STATUS } = require('../config/constants');

const taskSchema = new mongoose.Schema(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: [true, 'Project ID is required'],
      index: true
    },
    data: {
      text: {
        type: String,
        required: [true, 'Task text content is required']
      },
      metadata: {
        type: Map,
        of: mongoose.Schema.Types.Mixed,
        default: {}
      }
    },
    status: {
      type: String,
      enum: Object.values(TASK_STATUS),
      default: TASK_STATUS.UNASSIGNED,
      index: true
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true
    },
    lockedAt: {
      type: Date,
      default: null
    },
    consensusLabel: {
      type: String,
      default: null
    },
    consensusScore: {
      type: Number,
      default: null
    },
    isGoldStandard: {
      type: Boolean,
      default: false
    },
    goldLabel: {
      type: String,
      default: null
    },
    skippedBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    ],
    aiSuggestion: {
      label: { type: String, default: null },
      confidence: { type: Number, default: null },
      reasoning: { type: String, default: null }
    },
    flags: [
      {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        reason: { type: String },
        createdAt: { type: Date, default: Date.now }
      }
    ]
  },
  {
    timestamps: true
  }
);

taskSchema.index({ projectId: 1, status: 1 });
taskSchema.index({ assignedTo: 1, lockedAt: 1 });

const Task = mongoose.model('Task', taskSchema);

module.exports = Task;

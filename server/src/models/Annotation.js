const mongoose = require('mongoose');

const annotationSchema = new mongoose.Schema(
  {
    taskId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Task',
      required: [true, 'Task ID is required'],
      index: true
    },
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: [true, 'Project ID is required'],
      index: true
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true
    },
    label: {
      type: String,
      required: [true, 'Label is required'],
      trim: true
    },
    confidence: {
      type: Number,
      min: 1,
      max: 5,
      default: 5
    },
    timeSpentSeconds: {
      type: Number,
      default: 0
    },
    isGoldCheck: {
      type: Boolean,
      default: false
    },
    isGoldCorrect: {
      type: Boolean,
      default: null
    }
  },
  {
    timestamps: true
  }
);

// Ensure one annotation per user per task
annotationSchema.index({ taskId: 1, userId: 1 }, { unique: true });
annotationSchema.index({ projectId: 1, label: 1 });

const Annotation = mongoose.model('Annotation', annotationSchema);

module.exports = Annotation;

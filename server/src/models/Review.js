const mongoose = require('mongoose');
const { REVIEW_DECISION } = require('../config/constants');

const reviewSchema = new mongoose.Schema(
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
    reviewerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Reviewer ID is required'],
      index: true
    },
    decision: {
      type: String,
      enum: Object.values(REVIEW_DECISION),
      required: [true, 'Review decision is required']
    },
    finalLabel: {
      type: String,
      trim: true,
      default: null
    },
    comments: {
      type: String,
      default: ''
    }
  },
  {
    timestamps: true
  }
);

reviewSchema.index({ projectId: 1, decision: 1 });

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;

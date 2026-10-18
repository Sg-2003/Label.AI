const Task = require('../models/Task');
const Project = require('../models/Project');

/**
 * Perform zero-shot classification heuristic or LLM inference for tasks
 * Matches project labels based on text semantics and assigns confidence
 */
const generateAISuggestion = (text, labels) => {
  if (!labels || labels.length === 0) return null;

  const lowerText = text.toLowerCase();
  const labelScores = labels.map((l) => {
    const name = l.name.toLowerCase();
    let score = 0.5; // baseline

    // Positive sentiment cues
    if (['positive', 'good', 'praise', 'satisfied'].includes(name)) {
      if (/great|smooth|fast|love|saved|excellent|pleased|awesome|recommend|super/i.test(lowerText)) {
        score += 0.42;
      } else if (/slow|failed|bad|broken|terrible|disappointed|issue|error/i.test(lowerText)) {
        score -= 0.35;
      }
    }

    // Negative sentiment cues
    if (['negative', 'bad', 'complaint', 'dissatisfied', 'toxic'].includes(name)) {
      if (/failed|crashed|bug|downtime|error|disappointed|cost us|broke|horrible|deducted/i.test(lowerText)) {
        score += 0.44;
      } else if (/smooth|love|great|excellent|saved/i.test(lowerText)) {
        score -= 0.35;
      }
    }

    // Spam cues
    if (['spam', 'promotional', 'unsolicited'].includes(name)) {
      if (/click here|free|gift card|win|\$500|deal|promo|subscribe/i.test(lowerText)) {
        score += 0.46;
      }
    }

    // Neutral / Inquiry cues
    if (['neutral', 'question', 'inquiry', 'general'].includes(name)) {
      if (/how|what|can you|pricing|tiers|option|where|when/i.test(lowerText)) {
        score += 0.38;
      }
    }

    return {
      label: l.name,
      score: Math.min(0.98, Math.max(0.45, score))
    };
  });

  // Sort descending by score
  labelScores.sort((a, b) => b.score - a.score);
  const bestMatch = labelScores[0];

  return {
    label: bestMatch.label,
    confidence: Math.round(bestMatch.score * 100) / 100,
    reasoning: `Zero-shot classification matched semantic keywords in "${bestMatch.label}".`
  };
};

/**
 * Generate AI pre-labels for all unassigned tasks in a project
 */
const prelabelProjectTasks = async (projectId) => {
  const project = await Project.findById(projectId);
  if (!project) throw new Error('Project not found');

  const tasks = await Task.find({
    projectId,
    'aiSuggestion.label': null
  });

  let count = 0;
  for (const task of tasks) {
    const suggestion = generateAISuggestion(task.data.text, project.labels);
    if (suggestion) {
      task.aiSuggestion = suggestion;
      await task.save();
      count++;
    }
  }

  return { count, totalEligible: tasks.length };
};

module.exports = {
  generateAISuggestion,
  prelabelProjectTasks
};

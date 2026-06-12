/**
 * K-Points award constants
 */
export const K_POINT_VALUES = {
  UPLOAD_FEEDBACK: 10,
  COMPLETE_DIAGNOSIS: 15,
  COMPLETE_PRACTICE_TASK: 20,
  BOOK_TUTOR: 25,
};

export const K_POINT_LABELS = {
  UPLOAD_FEEDBACK: 'Uploaded feedback for analysis',
  COMPLETE_DIAGNOSIS: 'Completed diagnosis review',
  COMPLETE_PRACTICE_TASK: 'Completed a practice task',
  BOOK_TUTOR: 'Followed tutor booking prompt',
};

export const MILESTONES = [
  { points: 50, label: 'Getting Started', emoji: '🌱' },
  { points: 100, label: 'Building Momentum', emoji: '🚀' },
  { points: 250, label: 'Dedicated Learner', emoji: '📚' },
  { points: 500, label: 'Growth Champion', emoji: '🏆' },
  { points: 1000, label: 'Zen Master', emoji: '🧘' },
];

export function getCurrentMilestone(points) {
  let current = MILESTONES[0];
  for (const m of MILESTONES) {
    if (points >= m.points) current = m;
  }
  return current;
}

export function getNextMilestone(points) {
  for (const m of MILESTONES) {
    if (points < m.points) return m;
  }
  return null; // All milestones achieved
}

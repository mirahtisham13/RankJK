export const CATEGORIES = [
  { value: 'General', label: 'General', color: '#6366f1' },
  { value: 'OBC', label: 'OBC', color: '#f59e0b' },
  { value: 'SC', label: 'SC', color: '#10b981' },
  { value: 'ST', label: 'ST', color: '#ef4444' },
  { value: 'EWS', label: 'EWS', color: '#8b5cf6' },
  { value: 'PWD', label: 'PWD', color: '#06b6d4' },
  { value: 'RBA', label: 'RBA', color: '#f97316', jkOnly: true },
  { value: 'ALC', label: 'ALC', color: '#ec4899', jkOnly: true },
];

export const CONDUCTING_BODIES = ['JKSSB', 'JKPSC', 'SSC', 'UPSC', 'OTHER'];

export const CONDUCTING_BODY_COLORS = {
  JKSSB: { bg: '#1e3a5f', accent: '#3b82f6', text: 'J&K SSB' },
  JKPSC: { bg: '#1a3a2a', accent: '#22c55e', text: 'J&K PSC' },
  SSC: { bg: '#3b1f5e', accent: '#a855f7', text: 'SSC' },
  UPSC: { bg: '#5e1f1f', accent: '#ef4444', text: 'UPSC' },
  OTHER: { bg: '#1f2937', accent: '#6b7280', text: 'Other' },
};

export const CONFIDENCE_LEVELS = {
  LOW: { min: 0, max: 50, label: 'Low Confidence', color: '#ef4444', desc: 'Less than 50 submissions' },
  MEDIUM: { min: 50, max: 200, label: 'Medium Confidence', color: '#f59e0b', desc: '50–200 submissions' },
  HIGH: { min: 200, max: Infinity, label: 'High Confidence', color: '#22c55e', desc: 'More than 200 submissions' },
};

export function getConfidenceLevel(count) {
  if (count < 50) return CONFIDENCE_LEVELS.LOW;
  if (count < 200) return CONFIDENCE_LEVELS.MEDIUM;
  return CONFIDENCE_LEVELS.HIGH;
}

export function getCategoryInfo(value) {
  return CATEGORIES.find(c => c.value === value) || { value, label: value, color: '#6b7280' };
}

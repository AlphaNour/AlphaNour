// The Stufen ladder and fade schedule from docs/01-method-spec.md, as data.

import type { Case, FadeLevel, Gender, GrammarTag, Stufe, Task } from './types';

export interface StufeRule {
  stufe: Stufe;
  cefr: string;
  germanDensity: string;
  unlocks: GrammarTag[];
  maxNewItems: number;
  wordBankTarget: number | null;
}

export const STUFEN: readonly StufeRule[] = [
  { stufe: 1, cefr: 'A0', germanDensity: '3-5 nouns woven into English', unlocks: ['gender'], maxNewItems: 3, wordBankTarget: null },
  { stufe: 2, cefr: 'A0+', germanDensity: 'nouns + fixed chunks', unlocks: ['chunk'], maxNewItems: 4, wordBankTarget: 60 },
  { stufe: 3, cefr: 'A1.1', germanDensity: '1-2 full German sentences', unlocks: ['present'], maxNewItems: 4, wordBankTarget: null },
  { stufe: 4, cefr: 'A1.2', germanDensity: '~50% German', unlocks: ['akk', 'negation', 'v2'], maxNewItems: 5, wordBankTarget: 250 },
  { stufe: 5, cefr: 'A2.1', germanDensity: 'mostly German', unlocks: ['perfekt', 'separable'], maxNewItems: 5, wordBankTarget: null },
  { stufe: 6, cefr: 'A2.2', germanDensity: 'fully German', unlocks: ['dat', 'modal'], maxNewItems: 6, wordBankTarget: 600 },
  { stufe: 7, cefr: 'B1.1', germanDensity: 'fully German, longer', unlocks: ['subordinate'], maxNewItems: 6, wordBankTarget: null },
  { stufe: 8, cefr: 'B1.2', germanDensity: 'fully German, retold unaided', unlocks: ['praeteritum', 'gen', 'relative'], maxNewItems: 7, wordBankTarget: 1200 },
];

/** All grammar the learner may see at a Stufe (cumulative). */
export function unlockedGrammar(stufe: Stufe): Set<GrammarTag> {
  return new Set(STUFEN.filter((s) => s.stufe <= stufe).flatMap((s) => s.unlocks));
}

/** Whether case role icons for a given case are visible at a Stufe. */
export function caseVisible(c: Case, stufe: Stufe): boolean {
  const unlockAt: Record<Case, Stufe> = { nom: 3, akk: 4, dat: 6, gen: 8 };
  return stufe >= unlockAt[c];
}

export const GENDER_COLOR: Record<Gender, string> = {
  m: '#2F6FEB', // der: blue
  f: '#E5484D', // die: red
  n: '#30A46C', // das: green
  pl: '#8B8D98', // plural: gray
};

export const GENDER_ARTICLE: Record<Gender, string> = { m: 'der', f: 'die', n: 'das', pl: 'die' };

export const CASE_ROLE: Record<Case, { icon: string; role: string; question: string }> = {
  nom: { icon: '🎭', role: 'actor', question: 'Who does it?' },
  akk: { icon: '🎯', role: 'target', question: 'What/whom is hit by the action?' },
  dat: { icon: '🎁', role: 'receiver', question: 'To/for whom?' },
  gen: { icon: '🔑', role: 'owner', question: 'Whose?' },
};

export interface FadeStep {
  level: FadeLevel;
  name: string;
  dayOffset: number; // days after the story was told
  task: Task | null;
}

export const FADE_SCHEDULE: readonly FadeStep[] = [
  { level: 0, name: 'Mirror', dayOffset: 0, task: null },
  { level: 1, name: 'Recognise', dayOffset: 1, task: 'choose' },
  { level: 2, name: 'Recall', dayOffset: 3, task: 'recall' },
  { level: 3, name: 'Produce', dayOffset: 7, task: 'produce' },
  { level: 4, name: 'Retell', dayOffset: 14, task: 'retell' },
];

export const LEVEL_UP = {
  minMasteryShare: 0.8, // share of the Stufe's items with mastery >= 3
  minMastery: 3,
  grammarWindow: 10, // last N F3/F4 attempts needing the Stufe's grammar
  grammarCorrectMin: 8,
  minDaysAtStufe: 7,
} as const;

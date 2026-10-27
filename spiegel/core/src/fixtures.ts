// The worked example from the method spec (§9), as real data.
// Used as test data until the AI engine produces stories.

import type { Item, Segment } from './types';

const t = '2026-10-27T08:00:00Z';
const base = { learnerId: 'learner-1', firstStoryId: 'story-1', mastery: 0, createdAt: t } as const;

export const exampleItems: Item[] = [
  { ...base, id: 'item-kaffee', kind: 'lemma', german: 'Kaffee', pos: 'noun', gender: 'm', plural: 'Kaffees', english: 'coffee', introducedStufe: 1 },
  { ...base, id: 'item-brot', kind: 'lemma', german: 'Brot', pos: 'noun', gender: 'n', plural: 'Brote', english: 'bread', introducedStufe: 1 },
  { ...base, id: 'item-lieferant', kind: 'lemma', german: 'Lieferant', pos: 'noun', gender: 'm', plural: 'Lieferanten', english: 'supplier', introducedStufe: 1 },
];

export const exampleSourceText =
  'This morning I woke up late. I drank coffee and ate bread. The supplier called me. I was tired.';

/** Stufe 1: German nouns woven into English, gender only. */
export const exampleStufe1: { englishText: string; segments: Segment[] }[] = [
  {
    englishText: 'This morning I woke up late.',
    segments: [{ kind: 'en', text: 'This morning I woke up late.' }],
  },
  {
    englishText: 'I drank coffee and ate bread.',
    segments: [
      { kind: 'en', text: 'I drank ' },
      { kind: 'de', text: 'Kaffee', itemId: 'item-kaffee', english: 'coffee', gender: 'm', isNew: true },
      { kind: 'en', text: ' and ate ' },
      { kind: 'de', text: 'Brot', itemId: 'item-brot', english: 'bread', gender: 'n', isNew: true },
      { kind: 'en', text: '.' },
    ],
  },
  {
    englishText: 'The supplier called me.',
    segments: [
      { kind: 'en', text: 'The ' },
      { kind: 'de', text: 'Lieferant', itemId: 'item-lieferant', english: 'supplier', gender: 'm', isNew: true },
      { kind: 'en', text: ' called me.' },
    ],
  },
  {
    englishText: 'I was tired.',
    segments: [{ kind: 'en', text: 'I was tired.' }],
  },
];

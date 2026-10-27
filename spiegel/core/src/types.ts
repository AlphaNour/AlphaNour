// Shared types for the Spiegel app and backend. Mirrors schema.sql.

export type ISODate = string; // YYYY-MM-DD
export type ISODateTime = string; // ISO 8601

export type Stufe = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
export type FadeLevel = 0 | 1 | 2 | 3 | 4;
export type Mastery = 0 | 1 | 2 | 3 | 4 | 5;

export type Gender = 'm' | 'f' | 'n' | 'pl';
export type Case = 'nom' | 'akk' | 'dat' | 'gen';
export type PartOfSpeech = 'noun' | 'verb' | 'adj' | 'adv' | 'pron' | 'prep' | 'other';

export type GrammarTag =
  | 'gender'
  | 'chunk'
  | 'present'
  | 'akk'
  | 'negation'
  | 'v2'
  | 'perfekt'
  | 'separable'
  | 'dat'
  | 'modal'
  | 'subordinate'
  | 'praeteritum'
  | 'gen'
  | 'relative';

export interface Learner {
  id: string;
  helperLanguage: 'en';
  stufe: Stufe;
  stufeStartedAt: ISODateTime;
  createdAt: ISODateTime;
}

export interface Story {
  id: string;
  learnerId: string;
  toldOn: ISODate;
  sourceText: string;
  audioUri: string | null;
  fadeLevel: FadeLevel;
  nextFadeAt: ISODateTime | null;
  createdAt: ISODateTime;
}

export interface StoryVersion {
  id: string;
  storyId: string;
  stufe: Stufe;
  isCurrent: boolean;
  createdAt: ISODateTime;
}

/** A piece of a woven sentence. English stays plain; German carries grammar. */
export type Segment = EnglishSegment | GermanSegment;

export interface EnglishSegment {
  kind: 'en';
  text: string;
}

export interface GermanSegment {
  kind: 'de';
  text: string; // surface form as shown, e.g. 'den Kaffee'
  itemId: string; // word-bank item this segment teaches
  english: string; // meaning in context
  gender?: Gender; // nouns: drives the color
  case?: Case; // drives the role icon, only once unlocked
  bracketId?: string; // two verb parts sharing an id form a Satzklammer
  isNew?: boolean; // first time the learner meets this item
}

export interface Sentence {
  id: string;
  versionId: string;
  position: number;
  englishText: string;
  segments: Segment[];
}

export interface Item {
  id: string;
  learnerId: string;
  kind: 'lemma' | 'chunk';
  german: string;
  pos: PartOfSpeech | null;
  gender: Gender | null;
  plural: string | null;
  english: string;
  introducedStufe: Stufe;
  firstStoryId: string | null;
  mastery: Mastery;
  createdAt: ISODateTime;
}

export interface Occurrence {
  itemId: string;
  sentenceId: string;
  segmentIndex: number;
  surfaceForm: string;
}

export interface ReviewState {
  itemId: string;
  state: 'new' | 'learning' | 'review' | 'relearning';
  stability: number;
  difficulty: number;
  reps: number;
  lapses: number;
  dueAt: ISODateTime;
  lastReviewAt: ISODateTime | null;
}

export type Task = 'choose' | 'recall' | 'produce' | 'retell' | 'speak';

export interface Attempt {
  id: string;
  learnerId: string;
  storyId: string | null;
  itemId: string | null;
  task: Task;
  fadeLevel: FadeLevel | null;
  grammarTag: GrammarTag | null;
  expected: string;
  given: string;
  correct: boolean;
  createdAt: ISODateTime;
}

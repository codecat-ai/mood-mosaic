import { describe, expect, it } from 'vitest';
import {
  DEFAULT_REFLECTION_PROMPT_ID,
  REFLECTION_PROMPTS,
  createPromptNoteStarter,
  getReflectionPrompt
} from './notePrompts';

describe('note prompts', () => {
  it('provides a neutral default plus a curated reflection prompt set', () => {
    expect(REFLECTION_PROMPTS[0]).toMatchObject({
      id: DEFAULT_REFLECTION_PROMPT_ID,
      label: 'No prompt',
      text: ''
    });
    expect(REFLECTION_PROMPTS.map((prompt) => prompt.id)).toEqual([
      'none',
      'energy-shift',
      'focus-support',
      'mood-context',
      'next-step'
    ]);
  });

  it('looks up prompts deterministically and falls back to the default for unknown values', () => {
    expect(getReflectionPrompt(' focus-support ')).toMatchObject({
      id: 'focus-support',
      text: 'What helped or interrupted your focus?'
    });
    expect(getReflectionPrompt('FOCUS-SUPPORT')).toMatchObject({ id: 'focus-support' });
    expect(getReflectionPrompt('missing')).toMatchObject({ id: DEFAULT_REFLECTION_PROMPT_ID });
    expect(getReflectionPrompt(undefined)).toMatchObject({ id: DEFAULT_REFLECTION_PROMPT_ID });
  });

  it('creates a starter for empty notes without forcing the neutral option into the note', () => {
    expect(createPromptNoteStarter('', 'energy-shift')).toBe(
      'What changed your energy today?\n'
    );
    expect(createPromptNoteStarter('Already typed', 'none')).toBe('Already typed');
  });

  it('appends prompt starters while preserving existing note text', () => {
    expect(createPromptNoteStarter('Keep this detail  ', 'next-step')).toBe(
      'Keep this detail\n\nWhat is one small next step?\n'
    );
  });
});

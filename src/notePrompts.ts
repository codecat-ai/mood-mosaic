export interface ReflectionPrompt {
  id: string;
  label: string;
  text: string;
}

export const DEFAULT_REFLECTION_PROMPT_ID = 'none';

export const REFLECTION_PROMPTS: readonly ReflectionPrompt[] = [
  {
    id: DEFAULT_REFLECTION_PROMPT_ID,
    label: 'No prompt',
    text: ''
  },
  {
    id: 'energy-shift',
    label: 'Energy shift',
    text: 'What changed your energy today?'
  },
  {
    id: 'focus-support',
    label: 'Focus support',
    text: 'What helped or interrupted your focus?'
  },
  {
    id: 'mood-context',
    label: 'Mood context',
    text: 'What situation best explains this mood?'
  },
  {
    id: 'next-step',
    label: 'Next step',
    text: 'What is one small next step?'
  }
];

export function getReflectionPrompt(id: string | undefined): ReflectionPrompt {
  const normalizedId = id?.trim().toLowerCase() ?? DEFAULT_REFLECTION_PROMPT_ID;

  return (
    REFLECTION_PROMPTS.find((prompt) => prompt.id === normalizedId) ?? REFLECTION_PROMPTS[0]
  );
}

export function createPromptNoteStarter(note: string, promptId: string | undefined): string {
  const prompt = getReflectionPrompt(promptId);

  if (!prompt.text) {
    return note;
  }

  if (note.trim().length === 0) {
    return `${prompt.text}\n`;
  }

  return `${note.trimEnd()}\n\n${prompt.text}\n`;
}

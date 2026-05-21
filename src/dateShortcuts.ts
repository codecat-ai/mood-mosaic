export type DateShortcutAction = 'today' | 'previous' | 'next';

export interface DateShortcutTarget {
  tagName?: string;
  isContentEditable?: boolean;
}

export interface DateShortcutInput {
  key: string;
  ctrlKey?: boolean;
  metaKey?: boolean;
  altKey?: boolean;
  target?: DateShortcutTarget | null;
}

export function resolveDateShortcut(input: DateShortcutInput): DateShortcutAction | null {
  if (input.ctrlKey || input.metaKey || input.altKey || isEditableTarget(input.target)) {
    return null;
  }

  if (input.key.toLowerCase() === 't') {
    return 'today';
  }

  if (input.key === '[') {
    return 'previous';
  }

  if (input.key === ']') {
    return 'next';
  }

  return null;
}

export function resolveShortcutDate(
  action: DateShortcutAction,
  selectedDate: string,
  savedDates: readonly string[],
  today: string
): string {
  if (action === 'today') {
    return today;
  }

  const sortedDates = [...new Set(savedDates)].sort((left, right) => left.localeCompare(right));

  if (action === 'previous') {
    return [...sortedDates].reverse().find((date) => date < selectedDate) ?? selectedDate;
  }

  return sortedDates.find((date) => date > selectedDate) ?? selectedDate;
}

function isEditableTarget(target: DateShortcutTarget | null | undefined): boolean {
  if (!target) {
    return false;
  }

  const tagName = target.tagName?.toLowerCase();
  return (
    target.isContentEditable === true ||
    tagName === 'input' ||
    tagName === 'textarea' ||
    tagName === 'select'
  );
}

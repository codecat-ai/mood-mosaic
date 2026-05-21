import { describe, expect, it } from 'vitest';
import { resolveDateShortcut, resolveShortcutDate } from './dateShortcuts';

describe('date shortcuts', () => {
  it('resolves today, previous, and next actions from unmodified keys', () => {
    expect(resolveDateShortcut({ key: 't' })).toBe('today');
    expect(resolveDateShortcut({ key: 'T' })).toBe('today');
    expect(resolveDateShortcut({ key: '[' })).toBe('previous');
    expect(resolveDateShortcut({ key: ']' })).toBe('next');
  });

  it('ignores shortcuts with command modifiers or editable targets', () => {
    expect(resolveDateShortcut({ key: 't', ctrlKey: true })).toBeNull();
    expect(resolveDateShortcut({ key: '[', metaKey: true })).toBeNull();
    expect(resolveDateShortcut({ key: ']', altKey: true })).toBeNull();
    expect(resolveDateShortcut({ key: 't', target: { tagName: 'input' } })).toBeNull();
    expect(resolveDateShortcut({ key: '[', target: { tagName: 'textarea' } })).toBeNull();
    expect(resolveDateShortcut({ key: ']', target: { tagName: 'select' } })).toBeNull();
    expect(resolveDateShortcut({ key: 't', target: { isContentEditable: true } })).toBeNull();
  });

  it('moves between sorted saved entry dates relative to the selected date', () => {
    const savedDates = ['2026-05-21', '2026-05-18', '2026-05-20'];

    expect(resolveShortcutDate('previous', '2026-05-21', savedDates, '2026-05-22')).toBe(
      '2026-05-20'
    );
    expect(resolveShortcutDate('next', '2026-05-18', savedDates, '2026-05-22')).toBe(
      '2026-05-20'
    );
  });

  it('jumps to today and keeps the current date when no neighbor is available', () => {
    const savedDates = ['2026-05-18', '2026-05-20'];

    expect(resolveShortcutDate('today', '2026-05-18', savedDates, '2026-05-22')).toBe(
      '2026-05-22'
    );
    expect(resolveShortcutDate('previous', '2026-05-18', savedDates, '2026-05-22')).toBe(
      '2026-05-18'
    );
    expect(resolveShortcutDate('next', '2026-05-20', savedDates, '2026-05-22')).toBe(
      '2026-05-20'
    );
  });
});

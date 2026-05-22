import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import App from './App';

describe('App', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('saves, exports, previews imports, confirms replacement, and updates status text', () => {
    render(<App storageTarget={window.localStorage} today="2026-05-21" />);

    fireEvent.change(screen.getByLabelText(/^mood$/i), { target: { value: 'calm' } });
    fireEvent.change(screen.getByLabelText(/^energy$/i), { target: { value: '4' } });
    fireEvent.change(screen.getByLabelText(/^focus$/i), { target: { value: '5' } });
    fireEvent.change(screen.getByLabelText(/^note$/i), { target: { value: 'Good writing block' } });
    fireEvent.click(screen.getByRole('button', { name: /save/i }));

    expect(screen.getByRole('status')).toHaveTextContent(/saved/i);
    expect(screen.getByText(/1 day streak/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /export json/i }));
    expect(screen.getByRole('status')).toHaveTextContent(/exported/i);

    fireEvent.change(screen.getByLabelText(/import json/i), {
      target: {
        value: JSON.stringify({
          entries: [
            { date: '2026-05-21', mood: 'steady', energy: 3, focus: 3, note: 'Imported' }
          ]
        })
      }
    });
    fireEvent.click(screen.getByRole('button', { name: /preview import/i }));

    expect(screen.getByRole('status')).toHaveTextContent(/ready to import 1 entry/i);
    expect(
      within(screen.getByLabelText(/import preview/i)).getByText(/1 existing date will be replaced/i)
    ).toBeInTheDocument();
    expect(screen.queryByTitle(/2026-05-21: steady/i)).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /confirm import/i }));

    expect(screen.getByRole('status')).toHaveTextContent(/imported/i);
    expect(screen.getByTitle(/2026-05-21: steady/i)).toBeInTheDocument();
  });

  it('blocks import confirmation when preview cannot proceed', () => {
    render(<App storageTarget={window.localStorage} today="2026-05-21" />);

    fireEvent.change(screen.getByLabelText(/^note$/i), { target: { value: 'Keep me' } });
    fireEvent.click(screen.getByRole('button', { name: /save entry for 2026-05-21/i }));

    fireEvent.change(screen.getByLabelText(/import json/i), {
      target: { value: '{nope' }
    });
    fireEvent.click(screen.getByRole('button', { name: /preview import/i }));

    expect(screen.getByRole('status')).toHaveTextContent(/import cannot proceed/i);
    expect(screen.queryByRole('button', { name: /confirm import/i })).not.toBeInTheDocument();
    expect(screen.getByTitle(/2026-05-21: calm/i)).toBeInTheDocument();
  });

  it('defaults the editable entry date to today and announces the selected date', () => {
    render(<App storageTarget={window.localStorage} today="2026-05-21" />);

    expect(screen.getByLabelText(/entry date/i)).toHaveValue('2026-05-21');
    expect(screen.getByText(/editing entry for 2026-05-21/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /save entry for 2026-05-21/i })).toBeInTheDocument();
  });

  it('prefills mood, energy, focus, and note when an existing date is selected', () => {
    window.localStorage.setItem(
      'mood-mosaic:journal',
      JSON.stringify({
        schemaVersion: 1,
        entries: [
          {
            date: '2026-05-19',
            mood: 'steady',
            energy: 2,
            focus: 4,
            note: 'Retrospective note',
            schemaVersion: 1
          },
          {
            date: '2026-05-21',
            mood: 'calm',
            energy: 3,
            focus: 3,
            note: 'Today note',
            schemaVersion: 1
          }
        ]
      })
    );

    render(<App storageTarget={window.localStorage} today="2026-05-21" />);

    fireEvent.change(screen.getByLabelText(/entry date/i), { target: { value: '2026-05-19' } });

    expect(screen.getByLabelText(/^mood$/i)).toHaveValue('steady');
    expect(screen.getByLabelText(/^energy$/i)).toHaveValue(2);
    expect(screen.getByLabelText(/^focus$/i)).toHaveValue(4);
    expect(screen.getByLabelText(/^note$/i)).toHaveValue('Retrospective note');
    expect(screen.getByRole('status')).toHaveTextContent(/loaded entry for 2026-05-19/i);
  });

  it('resets unsaved edits to the selected date saved values without changing storage', () => {
    seedEntries([
      {
        date: '2026-05-21',
        mood: 'steady',
        energy: 4,
        focus: 2,
        note: 'Saved baseline',
        schemaVersion: 1
      }
    ]);

    render(<App storageTarget={window.localStorage} today="2026-05-21" />);

    fireEvent.change(screen.getByLabelText(/^mood$/i), { target: { value: 'bright' } });
    fireEvent.change(screen.getByLabelText(/^energy$/i), { target: { value: '5' } });
    fireEvent.change(screen.getByLabelText(/^focus$/i), { target: { value: '5' } });
    fireEvent.change(screen.getByLabelText(/^note$/i), { target: { value: 'Unsaved draft' } });
    fireEvent.click(screen.getByRole('button', { name: /reset form/i }));

    expect(screen.getByLabelText(/^mood$/i)).toHaveValue('steady');
    expect(screen.getByLabelText(/^energy$/i)).toHaveValue(4);
    expect(screen.getByLabelText(/^focus$/i)).toHaveValue(2);
    expect(screen.getByLabelText(/^note$/i)).toHaveValue('Saved baseline');
    expect(screen.getByRole('status', { name: /^app status$/i })).toHaveTextContent(
      /reset form to the saved entry for 2026-05-21/i
    );
    expect(screen.getByText(/reset only changes the form/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /reset form/i })).toHaveAccessibleDescription(
      /restores the current form from saved data/i
    );

    const saved = JSON.parse(window.localStorage.getItem('mood-mosaic:journal') ?? '{}');
    expect(saved.entries[0]).toMatchObject({
      date: '2026-05-21',
      mood: 'steady',
      energy: 4,
      focus: 2,
      note: 'Saved baseline'
    });
  });

  it('resets unsaved edits to defaults when the selected date has no saved entry', () => {
    render(<App storageTarget={window.localStorage} today="2026-05-22" />);

    fireEvent.change(screen.getByLabelText(/^mood$/i), { target: { value: 'stressed' } });
    fireEvent.change(screen.getByLabelText(/^energy$/i), { target: { value: '1' } });
    fireEvent.change(screen.getByLabelText(/^focus$/i), { target: { value: '2' } });
    fireEvent.change(screen.getByLabelText(/^note$/i), { target: { value: 'Unsaved new day' } });
    fireEvent.click(screen.getByRole('button', { name: /reset form/i }));

    expect(screen.getByLabelText(/^mood$/i)).toHaveValue('calm');
    expect(screen.getByLabelText(/^energy$/i)).toHaveValue(3);
    expect(screen.getByLabelText(/^focus$/i)).toHaveValue(3);
    expect(screen.getByLabelText(/^note$/i)).toHaveValue('');
    expect(screen.getByRole('status', { name: /^app status$/i })).toHaveTextContent(
      /reset form to defaults for 2026-05-22/i
    );
    expect(window.localStorage.getItem('mood-mosaic:journal')).toBeNull();
  });

  it('saves an older selected date without replacing today and keeps the mosaic sorted', () => {
    render(<App storageTarget={window.localStorage} today="2026-05-21" />);

    fireEvent.change(screen.getByLabelText(/entry date/i), { target: { value: '2026-05-21' } });
    fireEvent.change(screen.getByLabelText(/^mood$/i), { target: { value: 'bright' } });
    fireEvent.change(screen.getByLabelText(/^energy$/i), { target: { value: '5' } });
    fireEvent.change(screen.getByLabelText(/^focus$/i), { target: { value: '4' } });
    fireEvent.change(screen.getByLabelText(/^note$/i), { target: { value: 'Current day' } });
    fireEvent.click(screen.getByRole('button', { name: /save entry for 2026-05-21/i }));

    fireEvent.change(screen.getByLabelText(/entry date/i), { target: { value: '2026-05-19' } });
    fireEvent.change(screen.getByLabelText(/^mood$/i), { target: { value: 'reflective' } });
    fireEvent.change(screen.getByLabelText(/^energy$/i), { target: { value: '2' } });
    fireEvent.change(screen.getByLabelText(/^focus$/i), { target: { value: '3' } });
    fireEvent.change(screen.getByLabelText(/^note$/i), { target: { value: 'Older note' } });
    fireEvent.click(screen.getByRole('button', { name: /save entry for 2026-05-19/i }));

    const cells = screen.getAllByTitle(/2026-05-(19|21):/i);
    expect(cells.map((cell) => cell.getAttribute('title'))).toEqual([
      '2026-05-19: reflective, energy 2, focus 3',
      '2026-05-21: bright, energy 5, focus 4'
    ]);
    expect(screen.getByLabelText(/journal snapshot/i)).toHaveTextContent(/2 entries/i);
  });

  it('rejects an empty selected date without corrupting saved entries', () => {
    render(<App storageTarget={window.localStorage} today="2026-05-21" />);

    fireEvent.change(screen.getByLabelText(/^note$/i), { target: { value: 'Keep me' } });
    fireEvent.click(screen.getByRole('button', { name: /save entry for 2026-05-21/i }));

    fireEvent.change(screen.getByLabelText(/entry date/i), { target: { value: '' } });
    fireEvent.click(screen.getByRole('button', { name: /save entry/i }));

    expect(screen.getByRole('status', { name: /^app status$/i })).toHaveTextContent(
      /choose a valid date/i
    );
    expect(screen.getByTitle(/2026-05-21: calm/i)).toBeInTheDocument();
    expect(screen.queryByTitle(/^: /i)).not.toBeInTheDocument();
  });

  it('renders accessible entry validation hints before save validation fails', () => {
    render(<App storageTarget={window.localStorage} today="2026-05-21" />);

    expect(screen.queryByText(/choose energy from 1 to 5/i)).not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/^energy$/i), { target: { value: '' } });
    fireEvent.change(screen.getByLabelText(/^focus$/i), { target: { value: '6' } });
    fireEvent.change(screen.getByLabelText(/^note$/i), {
      target: { value: 'x'.repeat(470) }
    });

    const hintRegion = screen.getByRole('status', { name: /entry validation hints/i });
    expect(hintRegion).toHaveTextContent(/choose energy from 1 to 5/i);
    expect(hintRegion).toHaveTextContent(/choose focus from 1 to 5/i);
    expect(hintRegion).toHaveTextContent(/note is almost full: 10 characters left/i);
    expect(screen.getByLabelText(/^energy$/i)).toHaveAccessibleDescription(
      /choose energy from 1 to 5/i
    );
    expect(screen.getByLabelText(/^focus$/i)).toHaveAccessibleDescription(
      /choose focus from 1 to 5/i
    );
    expect(screen.getByLabelText(/^note$/i)).toHaveAccessibleDescription(
      /note is almost full: 10 characters left/i
    );
    expect(screen.getByRole('status', { name: /^app status$/i })).toHaveTextContent(/ready/i);
  });

  it('renders a compact recent entries list newest-first with note previews', () => {
    seedEntries([
      {
        date: '2026-05-19',
        mood: 'steady',
        energy: 2,
        focus: 4,
        note: 'Older note should appear last',
        schemaVersion: 1
      },
      {
        date: '2026-05-21',
        mood: 'focused',
        energy: 5,
        focus: 5,
        note: 'Finished the keyboard review workflow with enough detail to preview',
        schemaVersion: 1
      },
      {
        date: '2026-05-20',
        mood: 'calm',
        energy: 3,
        focus: 2,
        note: '',
        schemaVersion: 1
      }
    ]);

    render(<App storageTarget={window.localStorage} today="2026-05-21" />);

    const recentEntries = within(
      screen.getByRole('region', { name: /recent entries/i })
    ).getAllByRole('listitem');

    expect(recentEntries).toHaveLength(3);
    expect(recentEntries.map((item) => within(item).getByText(/2026-05-/i).textContent)).toEqual([
      '2026-05-21',
      '2026-05-20',
      '2026-05-19'
    ]);
    expect(recentEntries[0]).toHaveTextContent(/focused/i);
    expect(recentEntries[0]).toHaveTextContent(/energy 5/i);
    expect(recentEntries[0]).toHaveTextContent(/focus 5/i);
    expect(recentEntries[0]).toHaveTextContent(
      /finished the keyboard review workflow with enough detail to preview/i
    );
    expect(recentEntries[1]).not.toHaveTextContent(/note preview/i);
  });

  it('shows a helpful recent entries empty state', () => {
    render(<App storageTarget={window.localStorage} today="2026-05-21" />);

    expect(screen.getByRole('region', { name: /recent entries/i })).toHaveTextContent(
      /save an entry to review and edit recent days here/i
    );
  });

  it('shows optional note prompts and displays the selected prompt text', () => {
    render(<App storageTarget={window.localStorage} today="2026-05-21" />);

    expect(screen.getByLabelText(/reflection prompt/i)).toHaveAccessibleDescription(
      /optional structure for your note/i
    );
    expect(screen.getByText(/choose a prompt if useful/i)).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/reflection prompt/i), {
      target: { value: 'focus-support' }
    });

    expect(screen.getByText(/what helped or interrupted your focus/i)).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /use prompt as note starter/i })
    ).toBeInTheDocument();
  });

  it('appends a selected prompt starter without replacing an existing note', () => {
    render(<App storageTarget={window.localStorage} today="2026-05-21" />);

    fireEvent.change(screen.getByLabelText(/^note$/i), {
      target: { value: 'Deep work before lunch' }
    });
    fireEvent.change(screen.getByLabelText(/reflection prompt/i), {
      target: { value: 'energy-shift' }
    });
    fireEvent.click(screen.getByRole('button', { name: /use prompt as note starter/i }));

    expect(screen.getByLabelText(/^note$/i)).toHaveValue(
      'Deep work before lunch\n\nWhat changed your energy today?\n'
    );
    expect(screen.getByRole('status', { name: /^app status$/i })).toHaveTextContent(
      /added prompt to note without replacing existing text/i
    );
  });

  it('guides first-time backup and restore flows before any entries exist', () => {
    render(<App storageTarget={window.localStorage} today="2026-05-21" />);

    expect(screen.getByRole('region', { name: 'Backup' })).toHaveTextContent(
      /save an entry before exporting a meaningful json backup/i
    );
    expect(screen.getByLabelText(/exported json/i)).toHaveAccessibleDescription(
      /save an entry before exporting a meaningful json backup/i
    );
    expect(screen.getByRole('region', { name: 'Import' })).toHaveTextContent(
      /preview import safely before replacement/i
    );
    expect(screen.getByRole('region', { name: 'Import' })).toHaveTextContent(
      /browser data is not changed until you confirm/i
    );
    expect(screen.getByLabelText(/import json/i)).toHaveAccessibleDescription(
      /browser data is not changed until you confirm/i
    );
  });

  it('exposes an import dry-run example without changing saved data', () => {
    render(<App storageTarget={window.localStorage} today="2026-05-21" />);

    const importRegion = screen.getByRole('region', { name: 'Import' });
    const example = within(importRegion).getByRole('region', { name: /import dry-run example/i });

    expect(example).toHaveTextContent(/example dry run/i);
    expect(example).toHaveTextContent(/2026-05-20/i);
    expect(example).toHaveTextContent(/2026-05-21/i);
    expect(example).toHaveTextContent(/2 entries from 2026-05-20 to 2026-05-21/i);
    expect(example).toHaveTextContent(/1 existing date will be replaced/i);
    expect(example).toHaveTextContent(/1 new date will be added/i);
    const exampleJson = within(example).getByLabelText(/example dry-run json/i);
    expect((exampleJson as HTMLTextAreaElement).value).toContain('"date": "2026-05-20"');
    expect(screen.getByRole('status', { name: /^app status$/i })).toHaveTextContent(/ready/i);
    expect(screen.queryByTitle(/2026-05-20:/i)).not.toBeInTheDocument();
  });

  it('shows backup export readiness after entries exist while keeping concise import safety guidance', () => {
    seedEntries([
      {
        date: '2026-05-21',
        mood: 'focused',
        energy: 5,
        focus: 4,
        note: 'Ready to back up',
        schemaVersion: 1
      }
    ]);

    render(<App storageTarget={window.localStorage} today="2026-05-21" />);

    const backup = screen.getByRole('region', { name: 'Backup' });
    expect(backup).toHaveTextContent(/1 entry ready to export/i);
    expect(backup).not.toHaveTextContent(
      /save an entry before exporting a meaningful json backup/i
    );
    expect(screen.getByRole('region', { name: 'Import' })).toHaveTextContent(
      /browser data is not changed until you confirm/i
    );
  });

  it('filters trend artifacts by the selected week and keeps copied summaries aligned', async () => {
    const clipboardWrite = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText: clipboardWrite } });
    seedEntries([
      {
        date: '2026-05-17',
        mood: 'stressed',
        energy: 1,
        focus: 1,
        note: 'Previous week',
        schemaVersion: 1
      },
      {
        date: '2026-05-18',
        mood: 'steady',
        energy: 2,
        focus: 2,
        note: 'Week start',
        schemaVersion: 1
      },
      {
        date: '2026-05-21',
        mood: 'focused',
        energy: 5,
        focus: 4,
        note: 'Anchor week',
        schemaVersion: 1
      },
      {
        date: '2026-05-25',
        mood: 'bright',
        energy: 5,
        focus: 5,
        note: 'Next week',
        schemaVersion: 1
      }
    ]);

    render(<App storageTarget={window.localStorage} today="2026-05-21" />);
    fireEvent.change(screen.getByLabelText(/trend range/i), { target: { value: 'week' } });

    expect(screen.getByLabelText(/journal snapshot/i)).toHaveTextContent(/2 entries/i);
    expect(screen.getByText(/this week: 2026-05-18 to 2026-05-24/i)).toBeInTheDocument();
    expect(screen.getByTitle(/2026-05-18: steady/i)).toBeInTheDocument();
    expect(screen.getByTitle(/2026-05-21: focused/i)).toBeInTheDocument();
    expect(screen.queryByTitle(/2026-05-17: stressed/i)).not.toBeInTheDocument();
    expect(screen.queryByTitle(/2026-05-25: bright/i)).not.toBeInTheDocument();
    expect(screen.getByRole('region', { name: /recent entries/i })).toHaveTextContent(
      /anchor week/i
    );
    expect(screen.getByRole('region', { name: /recent entries/i })).not.toHaveTextContent(
      /next week/i
    );

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /copy summary/i }));
    });
    expect(clipboardWrite).toHaveBeenCalled();
    expect(clipboardWrite.mock.calls[0][0]).toContain('2 entries');
    expect(clipboardWrite.mock.calls[0][0]).toContain('Top moods: focused (1), steady (1)');
    expect(clipboardWrite.mock.calls[0][0]).not.toContain('Previous week');
    expect(clipboardWrite.mock.calls[0][0]).not.toContain('Next week');
    await screen.findByText(/copied reflection summary/i);
  });

  it('shows useful empty trend labels when the selected window has no entries', () => {
    seedEntries([
      {
        date: '2026-05-21',
        mood: 'focused',
        energy: 5,
        focus: 4,
        note: 'May entry',
        schemaVersion: 1
      }
    ]);

    render(<App storageTarget={window.localStorage} today="2026-06-10" />);
    fireEvent.change(screen.getByLabelText(/trend range/i), { target: { value: 'month' } });

    expect(screen.getByLabelText(/journal snapshot/i)).toHaveTextContent(/0 entries/i);
    expect(screen.getByText(/this month: june 2026/i)).toBeInTheDocument();
    expect(screen.getByText(/no entries in this month window/i)).toBeInTheDocument();
    expect(screen.getByRole('region', { name: /recent entries/i })).toHaveTextContent(
      /no entries in this month window/i
    );
  });

  it('loads an entry into the form and announces status from the recent edit button', () => {
    seedEntries([
      {
        date: '2026-05-20',
        mood: 'reflective',
        energy: 2,
        focus: 4,
        note: 'Follow-up edits',
        schemaVersion: 1
      },
      {
        date: '2026-05-21',
        mood: 'bright',
        energy: 5,
        focus: 3,
        note: 'Today note',
        schemaVersion: 1
      }
    ]);

    render(<App storageTarget={window.localStorage} today="2026-05-21" />);

    fireEvent.click(screen.getByRole('button', { name: /edit 2026-05-20/i }));

    expect(screen.getByLabelText(/entry date/i)).toHaveValue('2026-05-20');
    expect(screen.getByLabelText(/^mood$/i)).toHaveValue('reflective');
    expect(screen.getByLabelText(/^energy$/i)).toHaveValue(2);
    expect(screen.getByLabelText(/^focus$/i)).toHaveValue(4);
    expect(screen.getByLabelText(/^note$/i)).toHaveValue('Follow-up edits');
    expect(screen.getByRole('status')).toHaveTextContent(/loaded entry for 2026-05-20/i);
  });

  it('shows date shortcut help and announces a shortcut date change', () => {
    seedEntries([
      {
        date: '2026-05-19',
        mood: 'reflective',
        energy: 2,
        focus: 4,
        note: 'Earlier note',
        schemaVersion: 1
      },
      {
        date: '2026-05-21',
        mood: 'bright',
        energy: 5,
        focus: 3,
        note: 'Today note',
        schemaVersion: 1
      }
    ]);

    render(<App storageTarget={window.localStorage} today="2026-05-21" />);

    expect(screen.getByText(/shortcuts/i)).toBeInTheDocument();
    expect(screen.getByText(/t: today/i)).toBeInTheDocument();
    expect(screen.getByText(/\[: previous saved date/i)).toBeInTheDocument();
    expect(screen.getByText(/\]: next saved date/i)).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/entry date/i), { target: { value: '2026-05-21' } });
    fireEvent.keyDown(window, { key: '[' });

    expect(screen.getByLabelText(/entry date/i)).toHaveValue('2026-05-19');
    expect(screen.getByRole('status')).toHaveTextContent(
      /shortcut moved to previous saved date, 2026-05-19/i
    );
  });
});

function seedEntries(entries: unknown[]) {
  window.localStorage.setItem(
    'mood-mosaic:journal',
    JSON.stringify({
      schemaVersion: 1,
      entries
    })
  );
}

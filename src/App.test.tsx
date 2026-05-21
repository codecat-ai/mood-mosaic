import { fireEvent, render, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
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
    expect(screen.getByText(/2 entries/i)).toBeInTheDocument();
  });

  it('rejects an empty selected date without corrupting saved entries', () => {
    render(<App storageTarget={window.localStorage} today="2026-05-21" />);

    fireEvent.change(screen.getByLabelText(/^note$/i), { target: { value: 'Keep me' } });
    fireEvent.click(screen.getByRole('button', { name: /save entry for 2026-05-21/i }));

    fireEvent.change(screen.getByLabelText(/entry date/i), { target: { value: '' } });
    fireEvent.click(screen.getByRole('button', { name: /save entry/i }));

    expect(screen.getByRole('status')).toHaveTextContent(/choose a valid date/i);
    expect(screen.getByTitle(/2026-05-21: calm/i)).toBeInTheDocument();
    expect(screen.queryByTitle(/^: /i)).not.toBeInTheDocument();
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

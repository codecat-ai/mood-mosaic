import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import App from './App';

describe('App', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('saves, exports, imports, and updates status text', () => {
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
            { date: '2026-05-20', mood: 'steady', energy: 3, focus: 3, note: 'Imported' }
          ]
        })
      }
    });
    fireEvent.click(screen.getByRole('button', { name: /import/i }));

    expect(screen.getByRole('status')).toHaveTextContent(/imported/i);
    expect(screen.getByTitle(/2026-05-20: steady/i)).toBeInTheDocument();
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
});

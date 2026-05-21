import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import App from './App';

describe('App', () => {
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
});

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { MoodScale } from './MoodScale';

describe('MoodScale', () => {
  it('exposes an accessible radiogroup with five labelled options', async () => {
    const onChange = vi.fn();
    const { rerender } = render(<MoodScale value={null} onChange={onChange} legend="Mood today" />);
    const group = screen.getByRole('radiogroup', { name: 'Mood today' });
    expect(group).toBeInTheDocument();
    const options = screen.getAllByRole('radio');
    expect(options).toHaveLength(5);
    expect(options[0]).toHaveAttribute('aria-checked', 'false');

    await userEvent.click(options[3]);
    expect(onChange).toHaveBeenCalledWith(4);

    rerender(<MoodScale value={4} onChange={onChange} legend="Mood today" />);
    expect(screen.getAllByRole('radio')[3]).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByRole('radio', { name: /4.*dobrze/i })).toBeInTheDocument();
  });
});

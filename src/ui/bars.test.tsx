import { fireEvent, render, screen } from '@testing-library/preact';
import { describe, expect, it, vi } from 'vitest';
import { makeAppData, renderWithApp } from '../test/renderWithApp';
import { BottomBar } from './BottomBar';
import { TabBar } from './TabBar';

describe('BottomBar', () => {
  it('shows just the action when neutral', () => {
    const onAction = vi.fn();
    const { container } = render(<BottomBar actionLabel="检查" onAction={onAction} />);
    expect(container.querySelector('.bottombar--neutral')).toBeTruthy();
    expect(container.querySelector('[role="status"]')).toBeNull();
    fireEvent.click(screen.getByText('检查'));
    expect(onAction).toHaveBeenCalledTimes(1);
  });
  it('does nothing while disabled', () => {
    const onAction = vi.fn();
    render(<BottomBar actionLabel="继续" onAction={onAction} disabled />);
    fireEvent.click(screen.getByText('继续'));
    expect(onAction).not.toHaveBeenCalled();
  });
  it('becomes a feedback sheet with a title and detail', () => {
    const { container } = render(<BottomBar tone="oops" title="没关系，再来！" detail={<span>正确答案：河</span>} actionLabel="继续" onAction={vi.fn()} />);
    expect(container.querySelector('.bottombar--oops')).toBeTruthy();
    expect(container.querySelector('[role="status"]')).toBeTruthy();
    expect(screen.getByText('没关系，再来！')).toBeTruthy();
    expect(screen.getByText('正确答案：河')).toBeTruthy();
    expect(container.querySelector('.btn--oops')).toBeTruthy();
  });
});

describe('TabBar', () => {
  it('marks the active tab and navigates', async () => {
    const app = await makeAppData();
    renderWithApp(<TabBar active="home" />, app);
    expect(screen.getAllByRole('button')).toHaveLength(4);
    expect(screen.getByText('首页').closest('button')!.getAttribute('aria-current')).toBe('page');
    fireEvent.click(screen.getByText('贴纸'));
    expect(app.go).toHaveBeenCalledWith({ name: 'stickers' });
    fireEvent.click(screen.getByText('家长'));
    expect(app.go).toHaveBeenCalledWith({ name: 'parent' });
  });
});

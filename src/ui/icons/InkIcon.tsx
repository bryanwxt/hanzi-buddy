import { ICONS, type IconName } from './icons';

/** An ink-style icon (the app's own art, used instead of emoji). Decorative unless labelled. */
export function InkIcon({ name, size = 32, label }: { name: IconName; size?: number; label?: string }) {
  const art = ICONS[name];
  if (!art) return null;
  const a11y = label ? { role: 'img' as const, 'aria-label': label } : { 'aria-hidden': 'true' as const };
  return <svg class="inkicon" data-icon={name} viewBox="0 0 48 48" width={size} height={size} dangerouslySetInnerHTML={{ __html: art }} {...a11y} />;
}

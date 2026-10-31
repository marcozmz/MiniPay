import { useEffect } from 'react';

// iOS does not always resize the layout viewport when the keyboard opens.
// Keep mobile dialogs inside the visible area without moving or clearing fields.
export function useVisibleViewport() {
  useEffect(() => {
    const viewport = window.visualViewport;
    const root = document.documentElement;
    const sync = () => {
      root.style.setProperty('--visible-viewport-height', `${viewport?.height ?? window.innerHeight}px`);
      root.style.setProperty('--visible-viewport-top', `${viewport?.offsetTop ?? 0}px`);
    };
    sync();
    viewport?.addEventListener('resize', sync);viewport?.addEventListener('scroll', sync);
    window.addEventListener('resize', sync);
    return () => {
      viewport?.removeEventListener('resize', sync);viewport?.removeEventListener('scroll', sync);
      window.removeEventListener('resize', sync);
      root.style.removeProperty('--visible-viewport-height');root.style.removeProperty('--visible-viewport-top');
    };
  }, []);
}

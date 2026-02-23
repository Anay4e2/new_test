import { useEffect } from 'react';

/**
 * Adds keyboard shortcut support for accessibility.
 * - Alt+1: Go to home
 * - Alt+2: Go to explore
 * - Alt+3: Go to plan
 * - Alt+4: Go to dashboard
 * - /: Focus search input (if visible)
 * - Escape: Close modals / blur active element
 */
export function useKeyboardShortcuts(navigate: (path: string) => void) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Don't intercept when typing in inputs
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        if (e.key === 'Escape') {
          target.blur();
        }
        return;
      }

      if (e.altKey) {
        switch (e.key) {
          case '1':
            e.preventDefault();
            navigate('/');
            break;
          case '2':
            e.preventDefault();
            navigate('/explore');
            break;
          case '3':
            e.preventDefault();
            navigate('/plan');
            break;
          case '4':
            e.preventDefault();
            navigate('/dashboard');
            break;
        }
      }

      if (e.key === '/' && !e.ctrlKey && !e.metaKey) {
        const searchInput = document.querySelector<HTMLInputElement>('[data-search-input]');
        if (searchInput) {
          e.preventDefault();
          searchInput.focus();
        }
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [navigate]);
}

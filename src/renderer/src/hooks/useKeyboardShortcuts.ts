import { useEffect, useCallback } from 'react';

interface KeyboardShortcut {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  meta?: boolean;
  action: () => void;
  description: string;
}

export const useKeyboardShortcuts = (shortcuts: KeyboardShortcut[]) => {
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    shortcuts.forEach(({ key, ctrl, shift, alt, meta, action }) => {
      const isCtrl = ctrl ? event.ctrlKey : !event.ctrlKey;
      const isShift = shift ? event.shiftKey : !event.shiftKey;
      const isAlt = alt ? event.altKey : !event.altKey;
      const isMeta = meta ? event.metaKey : !event.metaKey;
      
      if (
        event.key.toLowerCase() === key.toLowerCase() &&
        isCtrl &&
        isShift &&
        isAlt &&
        isMeta
      ) {
        event.preventDefault();
        action();
      }
    });
  }, [shortcuts]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
};

// Common shortcuts for the app
export const useAppShortcuts = (actions: {
  newJob: () => void;
  save: () => void;
  delete: () => void;
  search: () => void;
  settings: () => void;
  darkMode: () => void;
}) => {
  const shortcuts: KeyboardShortcut[] = [
    {
      key: 'n',
      ctrl: true,
      action: actions.newJob,
      description: 'New Job (Ctrl+N)'
    },
    {
      key: 's',
      ctrl: true,
      action: actions.save,
      description: 'Save (Ctrl+S)'
    },
    {
      key: 'Delete',
      action: actions.delete,
      description: 'Delete (Delete)'
    },
    {
      key: 'f',
      ctrl: true,
      action: actions.search,
      description: 'Search (Ctrl+F)'
    },
    {
      key: ',',
      ctrl: true,
      action: actions.settings,
      description: 'Settings (Ctrl+,)'
    },
    {
      key: 'd',
      ctrl: true,
      shift: true,
      action: actions.darkMode,
      description: 'Toggle Dark Mode (Ctrl+Shift+D)'
    }
  ];

  useKeyboardShortcuts(shortcuts);
};

export default useKeyboardShortcuts;

import { useState, useEffect, useRef, useCallback } from "react";
import { Player } from "../types/player";
import { SavedEvent } from "../types/event";
import {
  saveEventToStorage,
  loadEventFromStorage,
  clearEventFromStorage,
} from "../utils/storage";
import { createDefaultEvent } from "../utils/defaultEvent";

// Rapid-fire changes (e.g. every pixel of a drag, every keystroke) are
// coalesced into a single undo step if they land within this window.
const HISTORY_COALESCE_MS = 600;
const MAX_HISTORY = 40;

export function useEventManager() {
  const [event, setEvent] = useState<SavedEvent | null>(null);
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);

  const [undoStack, setUndoStack] = useState<SavedEvent[]>([]);
  const [redoStack, setRedoStack] = useState<SavedEvent[]>([]);
  const lastHistoryPushRef = useRef(0);

  // Load event from localStorage on mount
  useEffect(() => {
    const savedEvent = loadEventFromStorage();
    if (savedEvent) {
      setEvent(savedEvent);
      setSelectedPlayerId(savedEvent.selectedPlayerId || null);
    } else {
      const defaultEvent = createDefaultEvent();
      setEvent(defaultEvent);
    }
  }, []);

  // Auto-save to localStorage whenever event changes
  useEffect(() => {
    if (event) {
      const updatedEvent = {
        ...event,
        updatedAt: new Date().toISOString(),
        selectedPlayerId: selectedPlayerId || undefined,
      };
      saveEventToStorage(updatedEvent);
    }
  }, [event, selectedPlayerId]);

  const selectedPlayer =
    event?.players.find((p) => p.id === selectedPlayerId) || null;

  // Record a pre-change snapshot onto the undo stack. Snapshots taken within
  // HISTORY_COALESCE_MS of each other are treated as one edit (so dragging an
  // element, or typing into a field, produces one undo step, not hundreds).
  // `force` bypasses coalescing for standalone destructive actions (reset,
  // import) so they're always their own undo step.
  const pushHistorySnapshot = useCallback(
    (snapshot: SavedEvent, force: boolean) => {
      const now = Date.now();
      const shouldPush =
        force || now - lastHistoryPushRef.current > HISTORY_COALESCE_MS;

      if (shouldPush) {
        setUndoStack((stack) => {
          if (stack[stack.length - 1] === snapshot) return stack;
          return [...stack, snapshot].slice(-MAX_HISTORY);
        });
        setRedoStack([]);
      }
      lastHistoryPushRef.current = now;
    },
    [],
  );

  const updateEvent = useCallback(
    (updates: Partial<SavedEvent>) => {
      setEvent((prev) => {
        if (!prev) return prev;
        pushHistorySnapshot(prev, false);
        return { ...prev, ...updates };
      });
    },
    [pushHistorySnapshot],
  );

  const undo = useCallback(() => {
    if (!event || undoStack.length === 0) return;
    const previous = undoStack[undoStack.length - 1];
    setUndoStack((stack) => stack.slice(0, -1));
    setRedoStack((stack) => [...stack, event]);
    lastHistoryPushRef.current = 0;
    setEvent(previous);
  }, [event, undoStack]);

  const redo = useCallback(() => {
    if (!event || redoStack.length === 0) return;
    const next = redoStack[redoStack.length - 1];
    setRedoStack((stack) => stack.slice(0, -1));
    setUndoStack((stack) => [...stack, event]);
    lastHistoryPushRef.current = 0;
    setEvent(next);
  }, [event, redoStack]);

  // Global Ctrl/Cmd+Z / Ctrl/Cmd+Shift+Z (or +Y) shortcuts, skipped while the
  // user is typing in a text input/textarea so native field-level undo wins.
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName;
      const isEditableTarget =
        tag === "INPUT" || tag === "TEXTAREA" || !!target?.isContentEditable;
      if (isEditableTarget) return;

      const key = e.key.toLowerCase();
      const isUndo = (e.ctrlKey || e.metaKey) && !e.shiftKey && key === "z";
      const isRedo =
        (e.ctrlKey || e.metaKey) &&
        ((e.shiftKey && key === "z") || key === "y");

      if (isUndo) {
        e.preventDefault();
        undo();
      } else if (isRedo) {
        e.preventDefault();
        redo();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [undo, redo]);

  const canUndo = undoStack.length > 0;
  const canRedo = redoStack.length > 0;

  const addPlayer = useCallback(
    (playerData: Omit<Player, "id">) => {
      if (!event) return;

      const newPlayer: Player = {
        ...playerData,
        id: crypto.randomUUID(),
      };

      updateEvent({
        players: [...event.players, newPlayer],
      });

      setSelectedPlayerId(newPlayer.id);
    },
    [event, updateEvent],
  );

  const updatePlayer = useCallback(
    (updatedPlayer: Player) => {
      if (!event) return;

      updateEvent({
        players: event.players.map((p) =>
          p.id === updatedPlayer.id ? updatedPlayer : p,
        ),
      });
    },
    [event, updateEvent],
  );

  const deletePlayer = useCallback(
    (playerId: string) => {
      if (!event) return;

      const updatedPlayers = event.players.filter((p) => p.id !== playerId);
      updateEvent({
        players: updatedPlayers,
      });

      if (selectedPlayerId === playerId) {
        setSelectedPlayerId(
          updatedPlayers.length > 0 ? updatedPlayers[0].id : null,
        );
      }
    },
    [event, selectedPlayerId, updateEvent],
  );

  const removeAllPlayers = useCallback(() => {
    if (!event || event.players.length === 0) return;

    pushHistorySnapshot(event, true);
    setEvent({ ...event, players: [], selectedPlayerId: undefined });
    setSelectedPlayerId(null);
  }, [event, pushHistorySnapshot]);

  const duplicatePlayer = useCallback(
    (player: Player) => {
      if (!event) return;

      const duplicatedPlayer: Player = {
        ...player,
        id: crypto.randomUUID(),
        values: {
          ...player.values,
          handle: `${player.values.handle || "Player"} (Copy)`,
        },
      };

      updateEvent({
        players: [...event.players, duplicatedPlayer],
      });

      setSelectedPlayerId(duplicatedPlayer.id);
    },
    [event, updateEvent],
  );

  const importPlayers = useCallback(
    (importedPlayers: Player[]) => {
      if (!event) return;

      updateEvent({
        players: [...event.players, ...importedPlayers],
      });

      if (importedPlayers.length > 0 && !selectedPlayerId) {
        setSelectedPlayerId(importedPlayers[0].id);
      }
    },
    [event, selectedPlayerId, updateEvent],
  );

  const importPlayerPhotos = useCallback(
    (updates: { playerId: string; dataUrl: string }[], fieldId: string) => {
      if (!event || updates.length === 0) return;

      const updateByPlayerId = new Map(
        updates.map((u) => [u.playerId, u.dataUrl]),
      );

      updateEvent({
        players: event.players.map((p) => {
          const dataUrl = updateByPlayerId.get(p.id);
          if (dataUrl === undefined) return p;
          return { ...p, values: { ...p.values, [fieldId]: dataUrl } };
        }),
      });
    },
    [event, updateEvent],
  );

  const importEvent = useCallback(
    (importedEvent: SavedEvent) => {
      if (event) pushHistorySnapshot(event, true);
      setEvent(importedEvent);
      setSelectedPlayerId(
        importedEvent.selectedPlayerId ||
          (importedEvent.players.length > 0
            ? importedEvent.players[0].id
            : null),
      );
    },
    [event, pushHistorySnapshot],
  );

  const updateEventName = useCallback(
    (name: string) => {
      updateEvent({ name });
    },
    [updateEvent],
  );

  const resetEvent = useCallback(() => {
    if (
      window.confirm(
        "Are you sure you want to reset the event? This will clear all data. You can undo this with Ctrl+Z.",
      )
    ) {
      if (event) pushHistorySnapshot(event, true);
      clearEventFromStorage();
      const defaultEvent = createDefaultEvent();
      setEvent(defaultEvent);
      setSelectedPlayerId(null);
    }
  }, [event, pushHistorySnapshot]);

  const clearForm = useCallback(() => {
    setSelectedPlayerId(null);
  }, []);

  return {
    event,
    selectedPlayer,
    selectedPlayerId,
    setSelectedPlayerId,
    addPlayer,
    updatePlayer,
    deletePlayer,
    removeAllPlayers,
    duplicatePlayer,
    importPlayers,
    importPlayerPhotos,
    importEvent,
    updateEvent,
    updateEventName,
    resetEvent,
    clearForm,
    undo,
    redo,
    canUndo,
    canRedo,
  };
}

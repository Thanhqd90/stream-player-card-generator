import { useState, useEffect, useCallback } from "react";
import { Player } from "../types/player";
import { SavedEvent } from "../types/event";
import {
  saveEventToStorage,
  loadEventFromStorage,
  clearEventFromStorage,
} from "../utils/storage";
import { createDefaultEvent } from "../utils/defaultEvent";

export function useEventManager() {
  const [event, setEvent] = useState<SavedEvent | null>(null);
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);

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

  const updateEvent = useCallback((updates: Partial<SavedEvent>) => {
    setEvent((prev) => (prev ? { ...prev, ...updates } : null));
  }, []);

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

  const importEvent = useCallback((importedEvent: SavedEvent) => {
    setEvent(importedEvent);
    setSelectedPlayerId(
      importedEvent.selectedPlayerId ||
        (importedEvent.players.length > 0 ? importedEvent.players[0].id : null),
    );
  }, []);

  const updateEventName = useCallback(
    (name: string) => {
      updateEvent({ name });
    },
    [updateEvent],
  );

  const resetEvent = useCallback(() => {
    if (
      window.confirm(
        "Are you sure you want to reset the event? This will clear all data and cannot be undone.",
      )
    ) {
      clearEventFromStorage();
      const defaultEvent = createDefaultEvent();
      setEvent(defaultEvent);
      setSelectedPlayerId(null);
    }
  }, []);

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
    duplicatePlayer,
    importPlayers,
    importEvent,
    updateEvent,
    updateEventName,
    resetEvent,
    clearForm,
  };
}

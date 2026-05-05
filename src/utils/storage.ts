import { SavedEvent } from "../types/event";
import { createDefaultEvent } from "./defaultEvent";

const STORAGE_KEY = "player-card-generator:saved-event";

export function saveEventToStorage(event: SavedEvent): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(event));
  } catch (error) {
    console.error("Failed to save event to localStorage:", error);
  }
}

export function loadEventFromStorage(): SavedEvent | null {
  if (typeof window === "undefined") return null;

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;

    const parsed = JSON.parse(stored);

    // Check if this is an old format event (version 1 or missing version)
    if (!parsed.version || parsed.version === 1) {
      return migrateEventToVersion2(parsed);
    }

    return parsed;
  } catch (error) {
    console.error("Failed to load event from localStorage:", error);
    return null;
  }
}

function migrateEventToVersion2(oldEvent: any): SavedEvent {
  // Create new event structure
  const newEvent = createDefaultEvent();

  // Copy over basic properties
  newEvent.id = oldEvent.id || newEvent.id;
  newEvent.name = oldEvent.name || newEvent.name;
  newEvent.createdAt = oldEvent.createdAt || newEvent.createdAt;
  newEvent.updatedAt = oldEvent.updatedAt || new Date().toISOString();
  newEvent.selectedPlayerId = oldEvent.selectedPlayerId;

  // Convert old players to new format
  newEvent.players = (oldEvent.players || []).map((oldPlayer: any) => ({
    id: oldPlayer.id,
    values: {
      handle: oldPlayer.handle || "",
      pronouns: oldPlayer.pronouns || "",
      seed: oldPlayer.seed || "",
      location: oldPlayer.location || "",
      achievement1: oldPlayer.achievement1 || "",
      achievement2: oldPlayer.achievement2 || "",
      achievement3: oldPlayer.achievement3 || "",
      funFact: oldPlayer.funFact || "",
      playerPhoto: oldPlayer.playerPhoto || "",
    },
  }));

  // If there's a background image in the old template, preserve it
  if (oldEvent.template?.backgroundImage) {
    newEvent.template.backgroundImage = oldEvent.template.backgroundImage;
  }

  return newEvent;
}

export function clearEventFromStorage(): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error("Failed to clear event from localStorage:", error);
  }
}

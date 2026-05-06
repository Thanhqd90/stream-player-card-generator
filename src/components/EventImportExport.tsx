import React, { useState, useRef } from "react";
import { SavedEvent } from "../types/event";
import { generateEventJsonFileName } from "../utils/fileNames";
import { saveAs } from "file-saver";
import { themeClasses } from "../utils/themeClasses";

interface EventImportExportProps {
  event: SavedEvent;
  onImportEvent: (event: SavedEvent) => void;
  onUpdateEventName: (name: string) => void;
}

const EventImportExport: React.FC<EventImportExportProps> = ({
  event,
  onImportEvent,
  onUpdateEventName,
}) => {
  const [isImporting, setIsImporting] = useState(false);
  const [importMessage, setImportMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExportJson = () => {
    try {
      const jsonContent = JSON.stringify(event, null, 2);
      const blob = new Blob([jsonContent], { type: "application/json" });
      saveAs(blob, generateEventJsonFileName(event));
    } catch (error) {
      alert(
        `Export failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  };

  const handleImportJson = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    setImportMessage(null);

    try {
      const jsonContent = await file.text();
      const importedEvent = JSON.parse(jsonContent) as SavedEvent;

      // Validate required properties
      const requiredProps: (keyof SavedEvent)[] = [
        "version",
        "name",
        "fields",
        "template",
        "players",
      ];
      const missingProps = requiredProps.filter(
        (prop) => !(prop in importedEvent),
      );

      if (missingProps.length > 0) {
        throw new Error(
          `Invalid event file: missing required properties: ${missingProps.join(", ")}`,
        );
      }

      // Ensure imported fonts exist for older event versions
      if (!Array.isArray(importedEvent.fonts)) {
        (importedEvent as any).fonts = [];
      }

      // Validate structure
      if (
        !Array.isArray(importedEvent.fields) ||
        !Array.isArray(importedEvent.players)
      ) {
        throw new Error(
          "Invalid event file: fields and players must be arrays",
        );
      }

      if (
        typeof importedEvent.template !== "object" ||
        !importedEvent.template.elements
      ) {
        throw new Error("Invalid event file: invalid template structure");
      }

      onImportEvent(importedEvent as SavedEvent);
      setImportMessage("Event imported successfully!");
    } catch (error) {
      setImportMessage(
        `Import failed: ${error instanceof Error ? error.message : "Invalid JSON file"}`,
      );
    } finally {
      setIsImporting(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleEventNameChange = (newName: string) => {
    onUpdateEventName(newName);
  };

  return (
    <div className={`${themeClasses.panel} rounded-lg shadow-md p-6`}>
      <h3 className="text-lg font-semibold mb-4 text-slate-950 dark:text-slate-100">
        Event Management
      </h3>

      <div className="space-y-4">
        {/* Event Name */}
        <div>
          <label
            htmlFor="event-name"
            className={`block text-sm font-medium mb-1 ${themeClasses.label}`}
          >
            Event Name
          </label>
          <input
            type="text"
            id="event-name"
            value={event.name}
            onChange={(e) => handleEventNameChange(e.target.value)}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${themeClasses.input}`}
            placeholder="Enter event name"
          />
        </div>

        {/* Export JSON */}
        <div>
          <button
            onClick={handleExportJson}
            className={`w-full px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors ${themeClasses.button.primary.replace("bg-blue-600", "bg-green-600").replace("hover:bg-blue-700", "hover:bg-green-700").replace("focus:ring-blue-500", "focus:ring-green-500")}`}
          >
            Export Event JSON
          </button>
          <p className={`mt-1 text-sm ${themeClasses.muted}`}>
            Downloads the complete event data as a JSON file for backup or
            sharing
          </p>
        </div>

        {/* Import JSON */}
        <div>
          <label
            htmlFor="import-json"
            className={`block text-sm font-medium mb-2 ${themeClasses.label}`}
          >
            Import Event JSON
          </label>
          <input
            ref={fileInputRef}
            type="file"
            id="import-json"
            accept=".json"
            onChange={handleImportJson}
            disabled={isImporting}
            className={`block w-full text-sm text-slate-500 dark:text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 dark:file:bg-blue-900/20 file:text-blue-700 dark:file:text-blue-300 hover:file:bg-blue-100 dark:hover:file:bg-blue-800/30 disabled:opacity-50 ${themeClasses.input}`}
          />
          <p className={`mt-1 text-sm ${themeClasses.muted}`}>
            Select a previously exported event JSON file to restore
          </p>
        </div>

        {isImporting && (
          <div className={`flex items-center text-blue-600 dark:text-blue-400`}>
            <svg
              className="animate-spin -ml-1 mr-3 h-5 w-5"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            Importing event...
          </div>
        )}

        {importMessage && (
          <div
            className={`p-3 rounded-md ${
              importMessage.includes("failed") ||
              importMessage.includes("error")
                ? "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800"
                : "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800"
            }`}
          >
            {importMessage}
          </div>
        )}
      </div>
    </div>
  );
};

export default EventImportExport;

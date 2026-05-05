import React, { useState, useRef } from "react";
import { parseCsvToPlayers } from "../utils/csv";
import { Player, FieldDefinition } from "../types/player";
import { themeClasses } from "../utils/themeClasses";

interface CsvImporterProps {
  fields: FieldDefinition[];
  onImportPlayers: (players: Player[]) => void;
}

const CsvImporter: React.FC<CsvImporterProps> = ({
  fields,
  onImportPlayers,
}) => {
  const [isImporting, setIsImporting] = useState(false);
  const [importMessage, setImportMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    setImportMessage(null);

    try {
      const csvContent = await file.text();
      const { players, errors } = parseCsvToPlayers(csvContent, fields);

      if (errors.length > 0) {
        setImportMessage(`Import failed: ${errors.join("; ")}`);
      } else if (players.length === 0) {
        setImportMessage("No valid players found in CSV file.");
      } else {
        onImportPlayers(players);
        setImportMessage(
          `Successfully imported ${players.length} player${players.length === 1 ? "" : "s"}.`,
        );
      }
    } catch (error) {
      setImportMessage(
        `Import failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    } finally {
      setIsImporting(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const downloadSampleCsv = () => {
    const headers = fields.map((f) => f.label);
    const sampleRow = fields.map((f) => {
      switch (f.id) {
        case "handle":
          return "PlayerOne";
        case "pronouns":
          return "they/them";
        case "seed":
          return "01";
        case "location":
          return "New York";
        case "achievement1":
          return "Champion 2023";
        case "achievement2":
          return "Speedrunner";
        case "achievement3":
          return "Community Favorite";
        case "funFact":
          return "Loves rhythm games!\nPlays every day.";
        case "playerPhoto":
          return ""; // Empty for images
        default:
          if (f.type === "number") {
            return "1";
          } else if (f.type === "image") {
            return "";
          } else if (f.type === "textarea") {
            return "Sample text content";
          } else {
            return `Sample ${f.label}`;
          }
      }
    });

    const sampleData = [headers, sampleRow];

    const csvContent = sampleData
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = "sample-players.csv";
    link.click();

    URL.revokeObjectURL(url);
  };

  return (
    <div className={`${themeClasses.panel} rounded-lg shadow-md p-6`}>
      <h3 className="text-lg font-semibold mb-4 text-slate-950 dark:text-slate-100">
        Import Players from CSV
      </h3>

      <div className="space-y-4">
        <div>
          <label
            htmlFor="csv-file"
            className={`block text-sm font-medium mb-2 ${themeClasses.label}`}
          >
            Select CSV File
          </label>
          <input
            ref={fileInputRef}
            type="file"
            id="csv-file"
            accept=".csv"
            onChange={handleFileSelect}
            disabled={isImporting}
            className={`block w-full text-sm text-slate-500 dark:text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 dark:file:bg-blue-900/20 file:text-blue-700 dark:file:text-blue-300 hover:file:bg-blue-100 dark:hover:file:bg-blue-800/30 disabled:opacity-50 ${themeClasses.input}`}
          />
          <p className={`mt-1 text-sm ${themeClasses.muted}`}>
            CSV should have columns matching your field definitions
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
            Importing players...
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

        <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
          <button
            onClick={downloadSampleCsv}
            className={`text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-sm font-medium underline`}
          >
            Download sample CSV file
          </button>
        </div>
      </div>
    </div>
  );
};

export default CsvImporter;

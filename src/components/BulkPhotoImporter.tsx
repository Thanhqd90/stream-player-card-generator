import React, { useState, useRef } from "react";
import { Player, FieldDefinition } from "../types/player";
import { themeClasses } from "../utils/themeClasses";
import { compressImageDataUrl } from "../utils/imageCompression";

interface BulkPhotoImporterProps {
  players: Player[];
  fields: FieldDefinition[];
  onImportPhotos: (
    updates: { playerId: string; dataUrl: string }[],
    fieldId: string,
  ) => void;
}

const stripExtension = (fileName: string): string =>
  fileName.replace(/\.[^./]+$/, "");

const readFileAsDataUrl = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error(`Failed to read ${file.name}`));
    reader.readAsDataURL(file);
  });

const BulkPhotoImporter: React.FC<BulkPhotoImporterProps> = ({
  players,
  fields,
  onImportPhotos,
}) => {
  const [isImporting, setIsImporting] = useState(false);
  const [resultMessage, setResultMessage] = useState<string | null>(null);
  const [unmatchedFiles, setUnmatchedFiles] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const photoFieldId = fields.find((f) => f.type === "image")?.id;

  const handleFilesSelect = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    if (!photoFieldId) {
      setResultMessage(
        "Import failed: this event has no photo field configured.",
      );
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setIsImporting(true);
    setResultMessage(null);
    setUnmatchedFiles([]);

    try {
      const handleToPlayer = new Map(
        players.map((p) => [
          (p.values.handle || "").trim().toLowerCase(),
          p,
        ]),
      );

      const updates: { playerId: string; dataUrl: string }[] = [];
      const unmatched: string[] = [];

      for (const file of Array.from(files)) {
        const key = stripExtension(file.name).trim().toLowerCase();
        const player = handleToPlayer.get(key);

        if (!player) {
          unmatched.push(file.name);
          continue;
        }

        try {
          const rawDataUrl = await readFileAsDataUrl(file);
          const compressed = await compressImageDataUrl(rawDataUrl);
          updates.push({ playerId: player.id, dataUrl: compressed });
        } catch {
          unmatched.push(file.name);
        }
      }

      if (updates.length > 0) {
        onImportPhotos(updates, photoFieldId);
      }

      const matchedCount = updates.length;
      const parts = [
        `Matched and updated ${matchedCount} photo${matchedCount === 1 ? "" : "s"}.`,
      ];
      if (unmatched.length > 0) {
        parts.push(
          `${unmatched.length} file${unmatched.length === 1 ? "" : "s"} had no matching handle.`,
        );
      }
      setResultMessage(parts.join(" "));
      setUnmatchedFiles(unmatched);
    } catch (error) {
      setResultMessage(
        `Import failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className={`${themeClasses.panel} rounded-lg shadow-md p-6`}>
      <h3 className="text-lg font-semibold mb-4 text-slate-950 dark:text-slate-100">
        Bulk Upload Photos
      </h3>

      <div className="space-y-4">
        <div>
          <label
            htmlFor="bulk-photo-files"
            className={`block text-sm font-medium mb-2 ${themeClasses.label}`}
          >
            Select Photo Files
          </label>
          <input
            ref={fileInputRef}
            type="file"
            id="bulk-photo-files"
            accept="image/*"
            multiple
            onChange={handleFilesSelect}
            disabled={isImporting}
            className={`block w-full text-sm text-slate-500 dark:text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 dark:file:bg-blue-900/20 file:text-blue-700 dark:file:text-blue-300 hover:file:bg-blue-100 dark:hover:file:bg-blue-800/30 disabled:opacity-50 ${themeClasses.input}`}
          />
          <p className={`mt-1 text-sm ${themeClasses.muted}`}>
            Select every photo in a folder at once — each file is matched to
            a player by filename (e.g. &quot;JaneDoe.png&quot; matches handle
            &quot;JaneDoe&quot;, not case-sensitive).
          </p>
        </div>

        {isImporting && (
          <div className="flex items-center text-blue-600 dark:text-blue-400">
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
            Uploading photos...
          </div>
        )}

        {resultMessage && (
          <div
            className={`p-3 rounded-md ${
              resultMessage.includes("failed")
                ? "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800"
                : "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800"
            }`}
          >
            <p>{resultMessage}</p>
            {unmatchedFiles.length > 0 && (
              <ul className="mt-2 text-sm list-disc list-inside">
                {unmatchedFiles.map((name) => (
                  <li key={name}>{name}</li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default BulkPhotoImporter;

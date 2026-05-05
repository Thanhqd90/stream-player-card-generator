import Papa from "papaparse";
import { Player, FieldDefinition } from "../types/player";

export function parseCsvToPlayers(
  csvContent: string,
  fields: FieldDefinition[],
): {
  players: Player[];
  errors: string[];
} {
  const players: Player[] = [];
  const errors: string[] = [];

  Papa.parse(csvContent, {
    header: true,
    skipEmptyLines: true,
    complete: (results) => {
      const data = results.data as any[];

      if (data.length === 0) {
        errors.push("CSV file appears to be empty");
        return;
      }

      // Check for required headers (case-insensitive)
      const headers = Object.keys(data[0] || {});
      const normalizedHeaders = headers.map((h) => h.toLowerCase().trim());

      const requiredFields = fields.filter((f) => f.required);
      const missingHeaders = requiredFields.filter(
        (field) => !normalizedHeaders.includes(field.id.toLowerCase()),
      );

      if (missingHeaders.length > 0) {
        errors.push(
          `Missing required columns: ${missingHeaders.map((f) => f.label).join(", ")}. ` +
            `Found columns: ${headers.join(", ")}. ` +
            `Expected: ${fields.map((f) => f.label).join(", ")}`,
        );
        return;
      }

      // Create a mapping for case-insensitive column access using field labels
      const headerMap: Record<string, string> = {};
      headers.forEach((header) => {
        headerMap[header.toLowerCase().trim()] = header;
      });

      data.forEach((row, index) => {
        try {
          // Skip rows where all required fields are empty
          const isEmptyRow = requiredFields.every((field) => {
            // Match on field label (what's in the CSV header) instead of field.id
            const actualHeader = headerMap[field.label.toLowerCase().trim()];
            return (
              !row[actualHeader] || String(row[actualHeader]).trim() === ""
            );
          });

          if (isEmptyRow) {
            return;
          }

          const playerValues: Record<string, string> = {};

          fields.forEach((field) => {
            // Skip image fields in CSV import - they require manual upload
            if (field.type === "image") {
              playerValues[field.id] = "";
              return;
            }

            // Match on field label (what's in the CSV header) instead of field.id
            const actualHeader = headerMap[field.label.toLowerCase().trim()];
            let value = String(row[actualHeader] || "").trim();

            // Handle special cases
            if (field.type === "textarea") {
              value = value.replace(/\\n/g, "\n"); // Preserve line breaks
            }

            playerValues[field.id] = value;
          });

          const player: Player = {
            id: crypto.randomUUID(),
            values: playerValues,
          };

          players.push(player);
        } catch (error) {
          errors.push(`Error parsing row ${index + 1}: ${error}`);
        }
      });
    },
    error: (error: any) => {
      errors.push(`CSV parsing error: ${error.message}`);
    },
  });

  return { players, errors };
}

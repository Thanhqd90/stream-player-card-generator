import React, { useState, useEffect } from "react";
import { Player, FieldDefinition } from "../types/player";
import { themeClasses } from "../utils/themeClasses";
import { compressImageDataUrl } from "../utils/imageCompression";
import ImageCropper from "./ImageCropper";

interface DynamicPlayerFormProps {
  player: Player | null;
  fields: FieldDefinition[];
  onSave: (player: Player) => void;
  onCancel: () => void;
}

const DynamicPlayerForm: React.FC<DynamicPlayerFormProps> = ({
  player,
  fields,
  onSave,
  onCancel,
}) => {
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [croppingField, setCroppingField] = useState<{
    fieldId: string;
    src: string;
  } | null>(null);

  useEffect(() => {
    if (player) {
      setFormData({ ...player.values });
    } else {
      // Initialize with empty values for all fields
      const initialData: Record<string, string> = {};
      fields.forEach((field) => {
        initialData[field.id] = "";
      });
      setFormData(initialData);
    }
  }, [player, fields]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate required fields
    const missingRequired = fields
      .filter((field) => field.required)
      .filter((field) => !formData[field.id]?.trim());

    if (missingRequired.length > 0) {
      alert(
        `Please fill in required fields: ${missingRequired.map((f) => f.label).join(", ")}`,
      );
      return;
    }

    const newPlayer: Player = {
      id: player?.id || crypto.randomUUID(),
      values: { ...formData },
    };

    onSave(newPlayer);
  };

  const handleFileUpload = (fieldId: string, file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setCroppingField({ fieldId, src: result });
    };
    reader.readAsDataURL(file);
  };

  const handleCropComplete = async (dataUrl: string) => {
    if (!croppingField) return;
    const fieldId = croppingField.fieldId;
    try {
      const compressed = await compressImageDataUrl(dataUrl);
      setFormData((prev) => ({ ...prev, [fieldId]: compressed }));
    } catch {
      setFormData((prev) => ({ ...prev, [fieldId]: dataUrl }));
    } finally {
      setCroppingField(null);
    }
  };

  const renderField = (field: FieldDefinition) => {
    const value = formData[field.id] || "";

    switch (field.type) {
      case "textarea":
        return (
          <textarea
            id={field.id}
            value={value}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, [field.id]: e.target.value }))
            }
            className={`w-full border rounded px-3 py-2 min-h-24 ${themeClasses.input}`}
            placeholder={`Enter ${field.label.toLowerCase()}`}
            required={field.required}
          />
        );

      case "number":
        return (
          <input
            type="number"
            id={field.id}
            value={value}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, [field.id]: e.target.value }))
            }
            className={`w-full border rounded px-3 py-2 ${themeClasses.input}`}
            placeholder={`Enter ${field.label.toLowerCase()}`}
            required={field.required}
          />
        );

      case "image":
        return (
          <div>
            <input
              type="file"
              id={field.id}
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  handleFileUpload(field.id, file);
                }
              }}
              className={`w-full border rounded px-3 py-2 ${themeClasses.input}`}
              required={field.required && !value}
            />
            {value && (
              <div className="mt-2">
                <img
                  src={value}
                  alt={field.label}
                  className="max-w-32 max-h-32 border rounded border-slate-300 dark:border-slate-600"
                />
                <button
                  type="button"
                  onClick={() =>
                    setCroppingField({ fieldId: field.id, src: value })
                  }
                  className={`ml-2 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-sm`}
                >
                  Edit Crop
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setFormData((prev) => ({ ...prev, [field.id]: "" }))
                  }
                  className={`ml-2 text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 text-sm`}
                >
                  Remove
                </button>
              </div>
            )}
          </div>
        );

      default: // text
        return (
          <input
            type="text"
            id={field.id}
            value={value}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, [field.id]: e.target.value }))
            }
            className={`w-full border rounded px-3 py-2 ${themeClasses.input}`}
            placeholder={`Enter ${field.label.toLowerCase()}`}
            required={field.required}
          />
        );
    }
  };

  return (
    <div className={`${themeClasses.panel} rounded-lg shadow-md p-6`}>
      <h3 className="text-lg font-semibold mb-4 text-slate-950 dark:text-slate-100">
        {player ? "Edit Player" : "Add New Player"}
      </h3>

      <form onSubmit={handleSubmit} className="space-y-4">
        {fields.map((field) => (
          <div key={field.id}>
            <label
              htmlFor={field.id}
              className={`block font-medium mb-1 ${themeClasses.label}`}
            >
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            {renderField(field)}
          </div>
        ))}

        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            className={`px-4 py-2 rounded transition-colors ${themeClasses.button.primary}`}
          >
            {player ? "Update Player" : "Add Player"}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className={`px-4 py-2 rounded transition-colors ${themeClasses.button.secondary}`}
          >
            Cancel
          </button>
        </div>
      </form>

      {croppingField && (
        <ImageCropper
          imageSrc={croppingField.src}
          aspectRatio={1}
          onCancel={() => setCroppingField(null)}
          onCropComplete={handleCropComplete}
        />
      )}
    </div>
  );
};

export default DynamicPlayerForm;

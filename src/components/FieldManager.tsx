import React, { useState } from "react";
import { FieldDefinition } from "../types/player";
import { themeClasses } from "../utils/themeClasses";

interface FieldManagerProps {
  fields: FieldDefinition[];
  onFieldsChange: (fields: FieldDefinition[]) => void;
}

const FieldManager: React.FC<FieldManagerProps> = ({
  fields,
  onFieldsChange,
}) => {
  const [newField, setNewField] = useState<Partial<FieldDefinition>>({
    label: "",
    type: "text",
    required: false,
  });

  const handleAddField = () => {
    if (!newField.label?.trim()) return;

    const field: FieldDefinition = {
      id: newField.label.toLowerCase().replace(/\s+/g, "_"),
      label: newField.label.trim(),
      type: newField.type || "text",
      required: newField.required || false,
    };

    onFieldsChange([...fields, field]);
    setNewField({ label: "", type: "text", required: false });
  };

  const handleDeleteField = (fieldId: string) => {
    onFieldsChange(fields.filter((f) => f.id !== fieldId));
  };

  const handleUpdateField = (
    fieldId: string,
    updates: Partial<FieldDefinition>,
  ) => {
    onFieldsChange(
      fields.map((f) => (f.id === fieldId ? { ...f, ...updates } : f)),
    );
  };

  return (
    <div className={`${themeClasses.panel} rounded-lg shadow-md p-6`}>
      <h3 className="text-lg font-semibold mb-4 text-slate-950 dark:text-slate-100">
        Field Manager
      </h3>

      {/* Existing Fields */}
      <div className="space-y-3 mb-6">
        <h4 className={`font-medium ${themeClasses.label}`}>Existing Fields</h4>
        {fields.map((field) => (
          <div
            key={field.id}
            className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-md"
          >
            <div className="flex-1">
              <div className="font-medium text-slate-950 dark:text-slate-100">
                {field.label}
              </div>
              <div className={`text-sm ${themeClasses.muted}`}>
                Type: {field.type} {field.required && "(Required)"}
              </div>
            </div>
            <div className="flex gap-2">
              <select
                value={field.type}
                onChange={(e) =>
                  handleUpdateField(field.id, {
                    type: e.target.value as FieldDefinition["type"],
                  })
                }
                className={`text-sm border rounded px-2 py-1 ${themeClasses.input}`}
              >
                <option value="text">Text</option>
                <option value="textarea">Textarea</option>
                <option value="number">Number</option>
                <option value="image">Image</option>
              </select>
              <label
                className={`flex items-center gap-1 text-sm ${themeClasses.label}`}
              >
                <input
                  type="checkbox"
                  checked={field.required}
                  onChange={(e) =>
                    handleUpdateField(field.id, { required: e.target.checked })
                  }
                />
                Required
              </label>
              <button
                onClick={() => handleDeleteField(field.id)}
                className={`text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 text-sm px-2 py-1 border border-red-300 dark:border-red-600 rounded hover:bg-red-50 dark:hover:bg-red-900/20`}
                disabled={field.id === "handle"} // Don't allow deleting handle
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add New Field */}
      <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
        <h4 className={`font-medium ${themeClasses.label} mb-3`}>
          Add New Field
        </h4>
        <div className="flex gap-3">
          <input
            type="text"
            placeholder="Field Label"
            value={newField.label || ""}
            onChange={(e) =>
              setNewField({ ...newField, label: e.target.value })
            }
            className={`flex-1 border rounded px-3 py-2 ${themeClasses.input}`}
          />
          <select
            value={newField.type || "text"}
            onChange={(e) =>
              setNewField({
                ...newField,
                type: e.target.value as FieldDefinition["type"],
              })
            }
            className={`border rounded px-3 py-2 ${themeClasses.input}`}
          >
            <option value="text">Text</option>
            <option value="textarea">Textarea</option>
            <option value="number">Number</option>
            <option value="image">Image</option>
          </select>
          <label className={`flex items-center gap-1 ${themeClasses.label}`}>
            <input
              type="checkbox"
              checked={newField.required || false}
              onChange={(e) =>
                setNewField({ ...newField, required: e.target.checked })
              }
            />
            Required
          </label>
          <button
            onClick={handleAddField}
            className={`px-4 py-2 rounded transition-colors ${themeClasses.button.primary}`}
          >
            Add Field
          </button>
        </div>
      </div>
    </div>
  );
};

export default FieldManager;

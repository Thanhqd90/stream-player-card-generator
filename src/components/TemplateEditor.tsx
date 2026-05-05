import React, { useState, useRef, useCallback } from "react";
import { CardTemplate, TemplateElement } from "../types/template";
import { FieldDefinition } from "../types/player";
import { themeClasses } from "../utils/themeClasses";

interface TemplateEditorProps {
  template: CardTemplate;
  fields: FieldDefinition[];
  onTemplateChange: (template: CardTemplate) => void;
}

const TemplateEditor: React.FC<TemplateEditorProps> = ({
  template,
  fields,
  onTemplateChange,
}) => {
  const [selectedElementId, setSelectedElementId] = useState<string | null>(
    null,
  );
  const [dragging, setDragging] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const canvasRef = useRef<HTMLDivElement>(null);

  const selectedElement = selectedElementId
    ? template.elements.find((e) => e.id === selectedElementId)
    : null;

  const handleAddElement = (fieldId: string) => {
    const field = fields.find((f) => f.id === fieldId);
    if (!field) return;

    const newElement: TemplateElement = {
      id: `${fieldId}-element-${Date.now()}`,
      fieldId,
      type:
        field.type === "textarea"
          ? "textarea"
          : field.type === "image"
            ? "image"
            : "text",
      x: 20,
      y: 20,
      width: 200,
      height:
        field.type === "textarea" ? 80 : field.type === "image" ? 100 : 40,
      fontSize: 16,
      color: "#000000",
      visible: true,
    };

    onTemplateChange({
      ...template,
      elements: [...template.elements, newElement],
    });
    setSelectedElementId(newElement.id);
  };

  const handleElementUpdate = (
    elementId: string,
    updates: Partial<TemplateElement>,
  ) => {
    onTemplateChange({
      ...template,
      elements: template.elements.map((el) =>
        el.id === elementId ? { ...el, ...updates } : el,
      ),
    });
  };

  const handleDeleteElement = (elementId: string) => {
    onTemplateChange({
      ...template,
      elements: template.elements.filter((el) => el.id !== elementId),
    });
    if (selectedElementId === elementId) {
      setSelectedElementId(null);
    }
  };

  const handleMouseDown = useCallback(
    (e: React.MouseEvent, elementId: string) => {
      const element = template.elements.find((el) => el.id === elementId);
      if (!element) return;

      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;

      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      setDragOffset({ x: x - element.x, y: y - element.y });
      setDragging(elementId);
    },
    [template.elements],
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!dragging || !canvasRef.current) return;

      const rect = canvasRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left - dragOffset.x;
      const y = e.clientY - rect.top - dragOffset.y;

      // Constrain to canvas bounds
      const constrainedX = Math.max(0, Math.min(x, template.width - 50));
      const constrainedY = Math.max(0, Math.min(y, template.height - 30));

      handleElementUpdate(dragging, { x: constrainedX, y: constrainedY });
    },
    [
      dragging,
      dragOffset,
      template.width,
      template.height,
      handleElementUpdate,
    ],
  );

  const handleMouseUp = useCallback(() => {
    setDragging(null);
  }, []);

  const availableFields = fields; // Allow adding any field multiple times

  return (
    <div className={`${themeClasses.panel} rounded-lg shadow-md p-6`}>
      <h3 className="text-lg font-semibold mb-4 text-slate-950 dark:text-slate-100">
        Template Editor
      </h3>

      <div className="flex gap-6">
        {/* Canvas */}
        <div className="flex-1">
          <div
            ref={canvasRef}
            className="relative border-2 border-slate-300 dark:border-slate-600 bg-slate-100 dark:bg-slate-800 mx-auto"
            style={{
              width: template.width,
              height: template.height,
              backgroundImage: template.backgroundImage
                ? `url(${template.backgroundImage})`
                : undefined,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            {template.elements
              .filter((el) => el.visible)
              .map((element) => (
                <div
                  key={element.id}
                  className={`absolute border-2 cursor-move ${
                    selectedElementId === element.id
                      ? "border-blue-500 dark:border-blue-400"
                      : "border-transparent hover:border-slate-400 dark:hover:border-slate-500"
                  }`}
                  style={{
                    left: element.x,
                    top: element.y,
                    width: element.width,
                    height: element.height,
                    fontSize: element.fontSize,
                    color: element.color,
                    backgroundColor: element.backgroundColor,
                    borderColor: element.borderColor,
                    borderWidth: element.borderWidth,
                    borderRadius: element.borderRadius,
                    padding: element.padding,
                    fontWeight: element.fontWeight,
                    textAlign: element.textAlign,
                    lineHeight: element.lineHeight,
                    fontFamily: element.fontFamily,
                  }}
                  onMouseDown={(e) => handleMouseDown(e, element.id)}
                  onClick={() => setSelectedElementId(element.id)}
                >
                  {element.fieldId ? (
                    element.type === "image" ? (
                      <div className="w-full h-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-xs text-slate-500 dark:text-slate-400">
                        [Image: {element.fieldId}]
                      </div>
                    ) : (
                      <div className="whitespace-pre-line">
                        {element.type === "textarea"
                          ? "Sample\nText"
                          : "Sample Text"}
                      </div>
                    )
                  ) : (
                    // Static text elements
                    <div>
                      {element.id.includes("location") && "Location"}
                      {element.id.includes("achievements") && "Achievements"}
                      {element.id.includes("funfact") && "Fun Fact"}
                    </div>
                  )}
                </div>
              ))}
          </div>

          {/* Add Element Controls */}
          <div className="mt-4">
            <h4 className={`font-medium mb-2 ${themeClasses.label}`}>
              Add Field to Template
            </h4>
            <select
              onChange={(e) => {
                if (e.target.value) {
                  handleAddElement(e.target.value);
                  e.target.value = "";
                }
              }}
              className={`border rounded px-3 py-2 mr-2 ${themeClasses.input}`}
              defaultValue=""
            >
              <option value="">Select a field...</option>
              {availableFields.map((field) => (
                <option key={field.id} value={field.id}>
                  {field.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Element Inspector */}
        <div className="w-80">
          {selectedElement ? (
            <div className="space-y-4">
              <h4 className={`font-medium ${themeClasses.label}`}>
                Element Properties
              </h4>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label
                    className={`block text-sm font-medium mb-1 ${themeClasses.label}`}
                  >
                    X Position
                  </label>
                  <input
                    type="number"
                    value={selectedElement.x}
                    onChange={(e) =>
                      handleElementUpdate(selectedElement.id, {
                        x: Number(e.target.value),
                      })
                    }
                    className={`w-full border rounded px-2 py-1 ${themeClasses.input}`}
                  />
                </div>
                <div>
                  <label
                    className={`block text-sm font-medium mb-1 ${themeClasses.label}`}
                  >
                    Y Position
                  </label>
                  <input
                    type="number"
                    value={selectedElement.y}
                    onChange={(e) =>
                      handleElementUpdate(selectedElement.id, {
                        y: Number(e.target.value),
                      })
                    }
                    className={`w-full border rounded px-2 py-1 ${themeClasses.input}`}
                  />
                </div>
                <div>
                  <label
                    className={`block text-sm font-medium mb-1 ${themeClasses.label}`}
                  >
                    Width
                  </label>
                  <input
                    type="number"
                    value={selectedElement.width}
                    onChange={(e) =>
                      handleElementUpdate(selectedElement.id, {
                        width: Number(e.target.value),
                      })
                    }
                    className={`w-full border rounded px-2 py-1 ${themeClasses.input}`}
                  />
                </div>
                <div>
                  <label
                    className={`block text-sm font-medium mb-1 ${themeClasses.label}`}
                  >
                    Height
                  </label>
                  <input
                    type="number"
                    value={selectedElement.height}
                    onChange={(e) =>
                      handleElementUpdate(selectedElement.id, {
                        height: Number(e.target.value),
                      })
                    }
                    className={`w-full border rounded px-2 py-1 ${themeClasses.input}`}
                  />
                </div>
              </div>

              {selectedElement.type !== "image" && (
                <>
                  <div>
                    <label
                      className={`block text-sm font-medium mb-1 ${themeClasses.label}`}
                    >
                      Font Size
                    </label>
                    <input
                      type="number"
                      value={selectedElement.fontSize || 16}
                      onChange={(e) =>
                        handleElementUpdate(selectedElement.id, {
                          fontSize: Number(e.target.value),
                        })
                      }
                      className={`w-full border rounded px-2 py-1 ${themeClasses.input}`}
                    />
                  </div>

                  <div>
                    <label
                      className={`block text-sm font-medium mb-1 ${themeClasses.label}`}
                    >
                      Text Color
                    </label>
                    <input
                      type="color"
                      value={selectedElement.color || "#000000"}
                      onChange={(e) =>
                        handleElementUpdate(selectedElement.id, {
                          color: e.target.value,
                        })
                      }
                      className={`w-full border rounded px-2 py-1 h-9 ${themeClasses.input}`}
                    />
                  </div>

                  <div>
                    <label
                      className={`block text-sm font-medium mb-1 ${themeClasses.label}`}
                    >
                      Text Align
                    </label>
                    <select
                      value={selectedElement.textAlign || "left"}
                      onChange={(e) =>
                        handleElementUpdate(selectedElement.id, {
                          textAlign: e.target.value as any,
                        })
                      }
                      className={`w-full border rounded px-2 py-1 ${themeClasses.input}`}
                    >
                      <option value="left">Left</option>
                      <option value="center">Center</option>
                      <option value="right">Right</option>
                    </select>
                  </div>
                </>
              )}

              <div>
                <label
                  className={`block text-sm font-medium mb-1 ${themeClasses.label}`}
                >
                  Background Color
                </label>
                <input
                  type="color"
                  value={selectedElement.backgroundColor || "#ffffff"}
                  onChange={(e) =>
                    handleElementUpdate(selectedElement.id, {
                      backgroundColor: e.target.value,
                    })
                  }
                  className={`w-full border rounded px-2 py-1 h-9 ${themeClasses.input}`}
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="visible"
                  checked={selectedElement.visible}
                  onChange={(e) =>
                    handleElementUpdate(selectedElement.id, {
                      visible: e.target.checked,
                    })
                  }
                />
                <label
                  htmlFor="visible"
                  className={`text-sm ${themeClasses.label}`}
                >
                  Visible
                </label>
              </div>

              <button
                onClick={() => handleDeleteElement(selectedElement.id)}
                className={`w-full px-3 py-2 rounded transition-colors ${themeClasses.button.danger}`}
              >
                Delete Element
              </button>
            </div>
          ) : (
            <div className={`text-center py-8 ${themeClasses.muted}`}>
              Select an element to edit its properties
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TemplateEditor;

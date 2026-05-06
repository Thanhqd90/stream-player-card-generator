import React, { useState, useRef, useCallback, useEffect } from "react";
import { CardTemplate, TemplateElement } from "../types/template";
import { FieldDefinition } from "../types/player";
import { themeClasses } from "../utils/themeClasses";

interface TemplateEditorProps {
  template: CardTemplate;
  fields: FieldDefinition[];
  onTemplateChange: (template: CardTemplate) => void;
}

type ResizeHandle = "nw" | "n" | "ne" | "w" | "e" | "sw" | "s" | "se";

interface DragState {
  elementId: string;
  startX: number;
  startY: number;
  startElementX: number;
  startElementY: number;
  scale: number;
}

interface ResizeState {
  elementId: string;
  handle: ResizeHandle;
  startX: number;
  startY: number;
  startElement: TemplateElement;
  scale: number;
}

const TemplateEditor: React.FC<TemplateEditorProps> = ({
  template,
  fields,
  onTemplateChange,
}) => {
  const [selectedElementId, setSelectedElementId] = useState<string | null>(
    null,
  );
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [resizeState, setResizeState] = useState<ResizeState | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  const selectedElement = selectedElementId
    ? template.elements.find((e) => e.id === selectedElementId)
    : null;

  // Calculate canvas scale if it's scaled to fit
  const getCanvasScale = useCallback(() => {
    if (!canvasRef.current) return 1;
    const rect = canvasRef.current.getBoundingClientRect();
    return rect.width / template.width;
  }, [template.width]);

  // Clamp element position and size
  const clampElement = (element: TemplateElement): TemplateElement => {
    return {
      ...element,
      x: Math.max(0, Math.min(element.x, template.width - element.width)),
      y: Math.max(0, Math.min(element.y, template.height - element.height)),
      width: Math.max(20, Math.min(element.width, template.width - element.x)),
      height: Math.max(
        20,
        Math.min(element.height, template.height - element.y),
      ),
    };
  };

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
      visible: true,
      locked: false,
      zIndex: 0,
      opacity: 1,
      backgroundColor: undefined,
      backgroundOpacity: 1,
      borderColor: undefined,
      borderWidth: 0,
      borderStyle: "solid",
      borderRadius: 0,
      padding: 0,
      fontSize: 16,
      fontFamily: "Arial",
      fontWeight: "400",
      fontStyle: "normal",
      color: "#000000",
      textAlign: "left",
      lineHeight: 1.5,
      letterSpacing: 0,
      textTransform: "none",
      objectFit: "cover",
      objectPosition: "center",
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
        el.id === elementId ? clampElement({ ...el, ...updates }) : el,
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

  // Handle canvas click to deselect
  const handleCanvasClick = useCallback((e: React.MouseEvent) => {
    if (e.target === canvasRef.current) {
      setSelectedElementId(null);
    }
  }, []);

  // Handle element selection
  const handleElementClick = useCallback(
    (e: React.MouseEvent, elementId: string) => {
      e.stopPropagation();
      setSelectedElementId(elementId);
    },
    [],
  );

  // Handle drag start
  const handleMouseDown = useCallback(
    (e: React.MouseEvent, elementId: string, handle?: ResizeHandle) => {
      e.stopPropagation();
      const element = template.elements.find((el) => el.id === elementId);
      if (!element || element.locked) return; // Don't allow drag/resize if locked

      const scale = getCanvasScale();

      if (handle) {
        // Resize mode
        setResizeState({
          elementId,
          handle,
          startX: e.clientX,
          startY: e.clientY,
          startElement: element,
          scale,
        });
      } else {
        // Drag mode
        setDragState({
          elementId,
          startX: e.clientX,
          startY: e.clientY,
          startElementX: element.x,
          startElementY: element.y,
          scale,
        });
      }
    },
    [template.elements, getCanvasScale],
  );

  // Handle mouse move for dragging and resizing
  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (dragState) {
        const deltaX = (e.clientX - dragState.startX) / dragState.scale;
        const deltaY = (e.clientY - dragState.startY) / dragState.scale;

        handleElementUpdate(dragState.elementId, {
          x: dragState.startElementX + deltaX,
          y: dragState.startElementY + deltaY,
        });
      } else if (resizeState) {
        const element = resizeState.startElement;
        const deltaX = (e.clientX - resizeState.startX) / resizeState.scale;
        const deltaY = (e.clientY - resizeState.startY) / resizeState.scale;

        const updates: Partial<TemplateElement> = {};

        // Handle corners and edges
        switch (resizeState.handle) {
          case "nw":
            updates.x = element.x + deltaX;
            updates.y = element.y + deltaY;
            updates.width = element.width - deltaX;
            updates.height = element.height - deltaY;
            break;
          case "n":
            updates.y = element.y + deltaY;
            updates.height = element.height - deltaY;
            break;
          case "ne":
            updates.y = element.y + deltaY;
            updates.width = element.width + deltaX;
            updates.height = element.height - deltaY;
            break;
          case "w":
            updates.x = element.x + deltaX;
            updates.width = element.width - deltaX;
            break;
          case "e":
            updates.width = element.width + deltaX;
            break;
          case "sw":
            updates.x = element.x + deltaX;
            updates.width = element.width - deltaX;
            updates.height = element.height + deltaY;
            break;
          case "s":
            updates.height = element.height + deltaY;
            break;
          case "se":
            updates.width = element.width + deltaX;
            updates.height = element.height + deltaY;
            break;
        }

        handleElementUpdate(resizeState.elementId, updates);
      }
    },
    [dragState, resizeState, handleElementUpdate],
  );

  // Handle mouse up
  const handleMouseUp = useCallback(() => {
    setDragState(null);
    setResizeState(null);
  }, []);

  // Handle keyboard input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selectedElementId) return;
      const element = template.elements.find(
        (el) => el.id === selectedElementId,
      );
      if (!element) return;

      const step = e.shiftKey ? 10 : 1;

      switch (e.key) {
        case "Delete":
        case "Backspace":
          e.preventDefault();
          handleDeleteElement(selectedElementId);
          break;
        case "ArrowUp":
          e.preventDefault();
          handleElementUpdate(selectedElementId, { y: element.y - step });
          break;
        case "ArrowDown":
          e.preventDefault();
          handleElementUpdate(selectedElementId, { y: element.y + step });
          break;
        case "ArrowLeft":
          e.preventDefault();
          handleElementUpdate(selectedElementId, { x: element.x - step });
          break;
        case "ArrowRight":
          e.preventDefault();
          handleElementUpdate(selectedElementId, { x: element.x + step });
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    selectedElementId,
    template.elements,
    handleElementUpdate,
    handleDeleteElement,
  ]);

  const ResizeHandle: React.FC<{
    handle: ResizeHandle;
    elementId: string;
  }> = ({ handle, elementId }) => {
    const cursorMap: Record<ResizeHandle, string> = {
      nw: "nw-resize",
      n: "n-resize",
      ne: "ne-resize",
      w: "w-resize",
      e: "e-resize",
      sw: "sw-resize",
      s: "s-resize",
      se: "se-resize",
    };

    const positionMap: Record<ResizeHandle, string> = {
      nw: "top-0 left-0 -translate-x-1/2 -translate-y-1/2",
      n: "top-0 left-1/2 -translate-x-1/2 -translate-y-1/2",
      ne: "top-0 right-0 translate-x-1/2 -translate-y-1/2",
      w: "top-1/2 left-0 -translate-x-1/2 -translate-y-1/2",
      e: "top-1/2 right-0 translate-x-1/2 -translate-y-1/2",
      sw: "bottom-0 left-0 -translate-x-1/2 translate-y-1/2",
      s: "bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2",
      se: "bottom-0 right-0 translate-x-1/2 translate-y-1/2",
    };

    return (
      <div
        className={`absolute w-4 h-4 bg-blue-500 border-2 border-white dark:border-slate-900 rounded-full pointer-events-auto hover:scale-125 transition-transform ${
          positionMap[handle]
        }`}
        style={{ cursor: cursorMap[handle] }}
        onMouseDown={(e) => handleMouseDown(e, elementId, handle)}
      />
    );
  };

  // Get fields that haven't been added to template yet
  const usedFieldIds = new Set(
    template.elements.map((el) => el.fieldId).filter(Boolean),
  );
  const availableFields = fields.filter((f) => !usedFieldIds.has(f.id));

  return (
    <div className={`${themeClasses.panel} rounded-lg shadow-md p-6`}>
      <h3 className="text-lg font-semibold mb-4 text-slate-950 dark:text-slate-100">
        Template Editor
      </h3>

      <div className="flex gap-6">
        {/* Canvas */}
        <div className="flex-1">
          <div className="text-xs text-slate-500 dark:text-slate-400 mb-2">
            Click to select • Drag to move • Use handles to resize • Delete key
            to remove • Arrow keys to nudge (Shift for 10px)
          </div>
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
            onClick={handleCanvasClick}
          >
            {template.elements
              .filter((el) => el.visible !== false)
              .sort((a, b) => (a.zIndex ?? 0) - (b.zIndex ?? 0))
              .map((element) => (
                <div
                  key={element.id}
                  className={`absolute border-2 transition-colors ${
                    element.locked ? "opacity-60" : "cursor-move"
                  } ${
                    selectedElementId === element.id
                      ? "border-blue-500 dark:border-blue-400 shadow-lg"
                      : "border-transparent hover:border-slate-400 dark:hover:border-slate-500"
                  }`}
                  style={{
                    left: element.x,
                    top: element.y,
                    width: element.width,
                    height: element.height,
                    zIndex: element.zIndex ?? 0,
                    opacity: element.opacity !== undefined ? element.opacity : 1,
                    fontSize: element.fontSize,
                    color: element.color,
                    backgroundColor: element.backgroundColor,
                    borderColor: element.borderColor,
                    borderWidth: element.borderWidth ? element.borderWidth : 0,
                    borderStyle: element.borderStyle || "solid",
                    borderRadius: element.borderRadius,
                    padding: element.padding,
                    fontWeight: element.fontWeight,
                    fontStyle: element.fontStyle || "normal",
                    textAlign: element.textAlign,
                    lineHeight: element.lineHeight,
                    letterSpacing: element.letterSpacing,
                    textTransform: element.textTransform || "none",
                    fontFamily: element.fontFamily,
                  }}
                  onMouseDown={(e) => handleMouseDown(e, element.id)}
                  onClick={(e) => handleElementClick(e, element.id)}
                >
                  {element.type === "image" ? (
                    <div className="w-full h-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-xs text-slate-500 dark:text-slate-400">
                      [Image: {element.fieldId}]
                    </div>
                  ) : (
                    <div className="whitespace-pre-line overflow-hidden">
                      {element.type === "textarea"
                        ? "Sample\nText"
                        : "Sample Text"}
                    </div>
                  )}

                  {/* Resize handles - only show when selected and not locked */}
                  {selectedElementId === element.id && !element.locked && (
                    <>
                      <ResizeHandle handle="nw" elementId={element.id} />
                      <ResizeHandle handle="n" elementId={element.id} />
                      <ResizeHandle handle="ne" elementId={element.id} />
                      <ResizeHandle handle="w" elementId={element.id} />
                      <ResizeHandle handle="e" elementId={element.id} />
                      <ResizeHandle handle="sw" elementId={element.id} />
                      <ResizeHandle handle="s" elementId={element.id} />
                      <ResizeHandle handle="se" elementId={element.id} />
                    </>
                  )}

                  {/* Locked indicator */}
                  {element.locked && selectedElementId === element.id && (
                    <div className="absolute bottom-1 right-1 text-xs bg-yellow-500 text-slate-900 px-2 py-1 rounded pointer-events-none">
                      🔒 Locked
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
        <div className="w-96 max-h-[80vh] overflow-y-auto">
          {selectedElement ? (
            <div className="space-y-4">
              <div>
                <h4 className={`font-semibold mb-4 ${themeClasses.label}`}>
                  Element Properties
                </h4>
              </div>

              {/* Position & Dimensions */}
              <div className="border-t pt-4">
                <h5 className={`text-xs font-semibold uppercase mb-3 ${themeClasses.muted}`}>
                  Position & Size
                </h5>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className={`block text-xs font-medium mb-1 ${themeClasses.label}`}>
                      X
                    </label>
                    <input
                      type="number"
                      value={selectedElement.x}
                      onChange={(e) =>
                        handleElementUpdate(selectedElement.id, {
                          x: Number(e.target.value),
                        })
                      }
                      className={`w-full border rounded px-2 py-1 text-sm ${themeClasses.input}`}
                    />
                  </div>
                  <div>
                    <label className={`block text-xs font-medium mb-1 ${themeClasses.label}`}>
                      Y
                    </label>
                    <input
                      type="number"
                      value={selectedElement.y}
                      onChange={(e) =>
                        handleElementUpdate(selectedElement.id, {
                          y: Number(e.target.value),
                        })
                      }
                      className={`w-full border rounded px-2 py-1 text-sm ${themeClasses.input}`}
                    />
                  </div>
                  <div>
                    <label className={`block text-xs font-medium mb-1 ${themeClasses.label}`}>
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
                      className={`w-full border rounded px-2 py-1 text-sm ${themeClasses.input}`}
                    />
                  </div>
                  <div>
                    <label className={`block text-xs font-medium mb-1 ${themeClasses.label}`}>
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
                      className={`w-full border rounded px-2 py-1 text-sm ${themeClasses.input}`}
                    />
                  </div>
                </div>
              </div>

              {/* Visibility & Layering */}
              <div className="border-t pt-4">
                <h5 className={`text-xs font-semibold uppercase mb-3 ${themeClasses.muted}`}>
                  Visibility & Layering
                </h5>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="visible"
                      checked={selectedElement.visible !== false}
                      onChange={(e) =>
                        handleElementUpdate(selectedElement.id, {
                          visible: e.target.checked,
                        })
                      }
                    />
                    <label htmlFor="visible" className={`text-sm ${themeClasses.label}`}>
                      Visible
                    </label>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="locked"
                      checked={selectedElement.locked ?? false}
                      onChange={(e) =>
                        handleElementUpdate(selectedElement.id, {
                          locked: e.target.checked,
                        })
                      }
                    />
                    <label htmlFor="locked" className={`text-sm ${themeClasses.label}`}>
                      Locked
                    </label>
                  </div>

                  <div>
                    <label className={`block text-xs font-medium mb-1 ${themeClasses.label}`}>
                      Z-Index
                    </label>
                    <input
                      type="number"
                      value={selectedElement.zIndex ?? 0}
                      onChange={(e) =>
                        handleElementUpdate(selectedElement.id, {
                          zIndex: Number(e.target.value),
                        })
                      }
                      className={`w-full border rounded px-2 py-1 text-sm ${themeClasses.input}`}
                    />
                  </div>

                  <div>
                    <label className={`block text-xs font-medium mb-1 ${themeClasses.label}`}>
                      Opacity: {Math.round((selectedElement.opacity ?? 1) * 100)}%
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={selectedElement.opacity ?? 1}
                      onChange={(e) =>
                        handleElementUpdate(selectedElement.id, {
                          opacity: Number(e.target.value),
                        })
                      }
                      className="w-full"
                    />
                  </div>
                </div>
              </div>

              {/* Background */}
              <div className="border-t pt-4">
                <h5 className={`text-xs font-semibold uppercase mb-3 ${themeClasses.muted}`}>
                  Background
                </h5>
                <div className="space-y-2">
                  <div>
                    <label className={`block text-xs font-medium mb-1 ${themeClasses.label}`}>
                      Color
                    </label>
                    <input
                      type="color"
                      value={selectedElement.backgroundColor || "#ffffff"}
                      onChange={(e) =>
                        handleElementUpdate(selectedElement.id, {
                          backgroundColor: e.target.value,
                        })
                      }
                      className={`w-full border rounded px-2 py-1 h-8 ${themeClasses.input}`}
                    />
                  </div>
                  <div>
                    <label className={`block text-xs font-medium mb-1 ${themeClasses.label}`}>
                      Opacity: {Math.round((selectedElement.backgroundOpacity ?? 1) * 100)}%
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={selectedElement.backgroundOpacity ?? 1}
                      onChange={(e) =>
                        handleElementUpdate(selectedElement.id, {
                          backgroundOpacity: Number(e.target.value),
                        })
                      }
                      className="w-full"
                    />
                  </div>
                </div>
              </div>

              {/* Border */}
              <div className="border-t pt-4">
                <h5 className={`text-xs font-semibold uppercase mb-3 ${themeClasses.muted}`}>
                  Border
                </h5>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className={`block text-xs font-medium mb-1 ${themeClasses.label}`}>
                      Color
                    </label>
                    <input
                      type="color"
                      value={selectedElement.borderColor || "#000000"}
                      onChange={(e) =>
                        handleElementUpdate(selectedElement.id, {
                          borderColor: e.target.value,
                        })
                      }
                      className={`w-full border rounded px-2 py-1 h-8 ${themeClasses.input}`}
                    />
                  </div>
                  <div>
                    <label className={`block text-xs font-medium mb-1 ${themeClasses.label}`}>
                      Width
                    </label>
                    <input
                      type="number"
                      value={selectedElement.borderWidth ?? 0}
                      onChange={(e) =>
                        handleElementUpdate(selectedElement.id, {
                          borderWidth: Number(e.target.value),
                        })
                      }
                      min="0"
                      className={`w-full border rounded px-2 py-1 text-sm ${themeClasses.input}`}
                    />
                  </div>
                  <div>
                    <label className={`block text-xs font-medium mb-1 ${themeClasses.label}`}>
                      Style
                    </label>
                    <select
                      value={selectedElement.borderStyle || "solid"}
                      onChange={(e) =>
                        handleElementUpdate(selectedElement.id, {
                          borderStyle: e.target.value as any,
                        })
                      }
                      className={`w-full border rounded px-2 py-1 text-sm ${themeClasses.input}`}
                    >
                      <option value="solid">Solid</option>
                      <option value="dashed">Dashed</option>
                      <option value="dotted">Dotted</option>
                    </select>
                  </div>
                  <div>
                    <label className={`block text-xs font-medium mb-1 ${themeClasses.label}`}>
                      Radius
                    </label>
                    <input
                      type="number"
                      value={selectedElement.borderRadius ?? 0}
                      onChange={(e) =>
                        handleElementUpdate(selectedElement.id, {
                          borderRadius: Number(e.target.value),
                        })
                      }
                      min="0"
                      className={`w-full border rounded px-2 py-1 text-sm ${themeClasses.input}`}
                    />
                  </div>
                </div>
              </div>

              {/* Padding */}
              <div className="border-t pt-4">
                <h5 className={`text-xs font-semibold uppercase mb-3 ${themeClasses.muted}`}>
                  Spacing
                </h5>
                <div>
                  <label className={`block text-xs font-medium mb-1 ${themeClasses.label}`}>
                    Padding
                  </label>
                  <input
                    type="number"
                    value={selectedElement.padding ?? 0}
                    onChange={(e) =>
                      handleElementUpdate(selectedElement.id, {
                        padding: Number(e.target.value),
                      })
                    }
                    min="0"
                    className={`w-full border rounded px-2 py-1 text-sm ${themeClasses.input}`}
                  />
                </div>
              </div>

              {/* Text Controls */}
              {(selectedElement.type === "text" || selectedElement.type === "textarea") && (
                <div className="border-t pt-4">
                  <h5 className={`text-xs font-semibold uppercase mb-3 ${themeClasses.muted}`}>
                    Text
                  </h5>
                  <div className="grid grid-cols-2 gap-2 space-y-2">
                    <div>
                      <label className={`block text-xs font-medium mb-1 ${themeClasses.label}`}>
                        Font Size
                      </label>
                      <input
                        type="number"
                        value={selectedElement.fontSize ?? 16}
                        onChange={(e) =>
                          handleElementUpdate(selectedElement.id, {
                            fontSize: Number(e.target.value),
                          })
                        }
                        className={`w-full border rounded px-2 py-1 text-sm ${themeClasses.input}`}
                      />
                    </div>
                    <div>
                      <label className={`block text-xs font-medium mb-1 ${themeClasses.label}`}>
                        Font Family
                      </label>
                      <select
                        value={selectedElement.fontFamily || "Arial"}
                        onChange={(e) =>
                          handleElementUpdate(selectedElement.id, {
                            fontFamily: e.target.value,
                          })
                        }
                        className={`w-full border rounded px-2 py-1 text-sm ${themeClasses.input}`}
                      >
                        <option value="Arial">Arial</option>
                        <option value="Helvetica">Helvetica</option>
                        <option value="Times New Roman">Times New Roman</option>
                        <option value="Courier New">Courier New</option>
                        <option value="Georgia">Georgia</option>
                        <option value="Verdana">Verdana</option>
                      </select>
                    </div>
                    <div>
                      <label className={`block text-xs font-medium mb-1 ${themeClasses.label}`}>
                        Font Weight
                      </label>
                      <select
                        value={selectedElement.fontWeight || "400"}
                        onChange={(e) =>
                          handleElementUpdate(selectedElement.id, {
                            fontWeight: e.target.value,
                          })
                        }
                        className={`w-full border rounded px-2 py-1 text-sm ${themeClasses.input}`}
                      >
                        <option value="400">Normal</option>
                        <option value="600">Semi Bold</option>
                        <option value="700">Bold</option>
                      </select>
                    </div>
                    <div>
                      <label className={`block text-xs font-medium mb-1 ${themeClasses.label}`}>
                        Style
                      </label>
                      <select
                        value={selectedElement.fontStyle || "normal"}
                        onChange={(e) =>
                          handleElementUpdate(selectedElement.id, {
                            fontStyle: e.target.value as any,
                          })
                        }
                        className={`w-full border rounded px-2 py-1 text-sm ${themeClasses.input}`}
                      >
                        <option value="normal">Normal</option>
                        <option value="italic">Italic</option>
                      </select>
                    </div>
                    <div className="col-span-2">
                      <label className={`block text-xs font-medium mb-1 ${themeClasses.label}`}>
                        Color
                      </label>
                      <input
                        type="color"
                        value={selectedElement.color || "#000000"}
                        onChange={(e) =>
                          handleElementUpdate(selectedElement.id, {
                            color: e.target.value,
                          })
                        }
                        className={`w-full border rounded px-2 py-1 h-8 ${themeClasses.input}`}
                      />
                    </div>
                    <div>
                      <label className={`block text-xs font-medium mb-1 ${themeClasses.label}`}>
                        Align
                      </label>
                      <select
                        value={selectedElement.textAlign || "left"}
                        onChange={(e) =>
                          handleElementUpdate(selectedElement.id, {
                            textAlign: e.target.value as any,
                          })
                        }
                        className={`w-full border rounded px-2 py-1 text-sm ${themeClasses.input}`}
                      >
                        <option value="left">Left</option>
                        <option value="center">Center</option>
                        <option value="right">Right</option>
                      </select>
                    </div>
                    <div>
                      <label className={`block text-xs font-medium mb-1 ${themeClasses.label}`}>
                        Line Height
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        value={selectedElement.lineHeight ?? 1.5}
                        onChange={(e) =>
                          handleElementUpdate(selectedElement.id, {
                            lineHeight: Number(e.target.value),
                          })
                        }
                        className={`w-full border rounded px-2 py-1 text-sm ${themeClasses.input}`}
                      />
                    </div>
                    <div>
                      <label className={`block text-xs font-medium mb-1 ${themeClasses.label}`}>
                        Letter Spacing
                      </label>
                      <input
                        type="number"
                        step="0.5"
                        value={selectedElement.letterSpacing ?? 0}
                        onChange={(e) =>
                          handleElementUpdate(selectedElement.id, {
                            letterSpacing: Number(e.target.value),
                          })
                        }
                        className={`w-full border rounded px-2 py-1 text-sm ${themeClasses.input}`}
                      />
                    </div>
                    <div className="col-span-2">
                      <label className={`block text-xs font-medium mb-1 ${themeClasses.label}`}>
                        Transform
                      </label>
                      <select
                        value={selectedElement.textTransform || "none"}
                        onChange={(e) =>
                          handleElementUpdate(selectedElement.id, {
                            textTransform: e.target.value as any,
                          })
                        }
                        className={`w-full border rounded px-2 py-1 text-sm ${themeClasses.input}`}
                      >
                        <option value="none">None</option>
                        <option value="uppercase">Uppercase</option>
                        <option value="lowercase">Lowercase</option>
                        <option value="capitalize">Capitalize</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Image Controls */}
              {selectedElement.type === "image" && (
                <div className="border-t pt-4">
                  <h5 className={`text-xs font-semibold uppercase mb-3 ${themeClasses.muted}`}>
                    Image
                  </h5>
                  <div className="space-y-2">
                    <div>
                      <label className={`block text-xs font-medium mb-1 ${themeClasses.label}`}>
                        Object Fit
                      </label>
                      <select
                        value={selectedElement.objectFit || "cover"}
                        onChange={(e) =>
                          handleElementUpdate(selectedElement.id, {
                            objectFit: e.target.value as any,
                          })
                        }
                        className={`w-full border rounded px-2 py-1 text-sm ${themeClasses.input}`}
                      >
                        <option value="cover">Cover</option>
                        <option value="contain">Contain</option>
                        <option value="fill">Fill</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="border-t pt-4 flex gap-2">
                <button
                  onClick={() => handleDeleteElement(selectedElement.id)}
                  className={`flex-1 px-3 py-2 rounded transition-colors text-sm ${themeClasses.button.danger}`}
                >
                  Delete
                </button>
              </div>
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

import React, { useState, useRef, useCallback, useEffect } from "react";
import { CardTemplate, TemplateElement } from "../types/template";
import { FieldDefinition, Player } from "../types/player";
import { ImportedFont } from "../types/event";
import { BUILTIN_FONTS, isValidFontUrl } from "../utils/fonts";
import { themeClasses } from "../utils/themeClasses";
import { CardElementContent, getElementBoxStyle } from "../utils/renderCardElement";
import { compressImageDataUrl } from "../utils/imageCompression";
import { clampElementToBounds, resizeTemplateCanvas } from "../utils/templateSize";

interface TemplateEditorProps {
  template: CardTemplate;
  fields: FieldDefinition[];
  fonts: ImportedFont[];
  players: Player[];
  onTemplateChange: (template: CardTemplate) => void;
  onFontsChange: (fonts: ImportedFont[]) => void;
}

const SIZE_PRESETS: { label: string; width: number; height: number }[] = [
  { label: "Portrait (500 × 700)", width: 500, height: 700 },
  { label: "Story (1080 × 1920)", width: 1080, height: 1920 },
  { label: "Landscape (1920 × 1080)", width: 1920, height: 1080 },
  { label: "Square (1080 × 1080)", width: 1080, height: 1080 },
  { label: "Widescreen banner (1200 × 630)", width: 1200, height: 630 },
];

const ZOOM_OPTIONS = [0.25, 0.5, 0.75, 1] as const;

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
  fonts,
  players,
  onTemplateChange,
  onFontsChange,
}) => {
  const [selectedElementId, setSelectedElementId] = useState<string | null>(
    null,
  );
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [resizeState, setResizeState] = useState<ResizeState | null>(null);
  const [fontName, setFontName] = useState("");
  const [fontUrl, setFontUrl] = useState("");
  const [fontManagerMessage, setFontManagerMessage] = useState<string | null>(
    null,
  );
  const [zoom, setZoom] = useState<number | "fit">(1);
  const [fitZoom, setFitZoom] = useState(1);
  const [previewPlayerId, setPreviewPlayerId] = useState<string | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const canvasWrapperRef = useRef<HTMLDivElement>(null);

  const selectedElement = selectedElementId
    ? template.elements.find((e) => e.id === selectedElementId)
    : null;

  const previewPlayer =
    players.find((p) => p.id === previewPlayerId) || players[0] || null;

  const effectiveZoom = zoom === "fit" ? fitZoom : zoom;

  // Recompute "fit" zoom whenever the canvas size or wrapper size can change
  useEffect(() => {
    const computeFit = () => {
      if (!canvasWrapperRef.current) return;
      const availableWidth = canvasWrapperRef.current.clientWidth;
      if (availableWidth > 0) {
        setFitZoom(Math.min(1, availableWidth / template.width));
      }
    };
    computeFit();
    window.addEventListener("resize", computeFit);
    return () => window.removeEventListener("resize", computeFit);
  }, [template.width]);

  const availableFontFamilies = Array.from(
    new Set([
      ...BUILTIN_FONTS,
      ...fonts.map((font) => font.name),
      ...(selectedElement?.fontFamily ? [selectedElement.fontFamily] : []),
    ]),
  );

  // Calculate canvas scale if it's scaled to fit
  const getCanvasScale = useCallback(() => {
    if (!canvasRef.current) return 1;
    const rect = canvasRef.current.getBoundingClientRect();
    return rect.width / template.width;
  }, [template.width]);

  // Clamp element position and size to the given canvas bounds (defaults to
  // the current template size)
  const clampElement = (
    element: TemplateElement,
    boundsWidth: number = template.width,
    boundsHeight: number = template.height,
  ): TemplateElement => clampElementToBounds(element, boundsWidth, boundsHeight);

  const handleTemplateSizeChange = (width: number, height: number) => {
    onTemplateChange(resizeTemplateCanvas(template, width, height));
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

  const handleDuplicateElement = useCallback(() => {
    if (!selectedElement) return;
    const duplicate: TemplateElement = {
      ...selectedElement,
      id: `${selectedElement.fieldId || selectedElement.id}-duplicate-${Date.now()}`,
      x: selectedElement.x + 10,
      y: selectedElement.y + 10,
      zIndex: (selectedElement.zIndex ?? 0) + 1,
    };
    onTemplateChange({
      ...template,
      elements: [...template.elements, duplicate],
    });
    setSelectedElementId(duplicate.id);
  }, [selectedElement, template, onTemplateChange]);

  const handleAddFont = useCallback(() => {
    const normalizedFontName = fontName.trim();
    const normalizedFontUrl = fontUrl.trim();

    if (!normalizedFontName || !normalizedFontUrl) {
      setFontManagerMessage("Font name and URL are required.");
      return;
    }

    if (!isValidFontUrl(normalizedFontUrl)) {
      setFontManagerMessage(
        "Please enter a valid Google Fonts or CSS font URL.",
      );
      return;
    }

    // Prevent duplicates by URL or font name
    const duplicateFont = fonts.some(
      (font) =>
        font.url === normalizedFontUrl ||
        font.name.toLowerCase() === normalizedFontName.toLowerCase(),
    );

    if (duplicateFont) {
      setFontManagerMessage("This font is already imported.");
      return;
    }

    onFontsChange([
      ...fonts,
      {
        name: normalizedFontName,
        url: normalizedFontUrl,
      },
    ]);
    setFontName("");
    setFontUrl("");
    setFontManagerMessage("Imported font added successfully.");
  }, [fontName, fontUrl, fonts, onFontsChange, template.elements]);

  const handleRemoveFont = useCallback(
    (fontUrlToRemove: string) => {
      onFontsChange(fonts.filter((font) => font.url !== fontUrlToRemove));
      setFontManagerMessage("Imported font removed.");
    },
    [fonts, onFontsChange],
  );

  const handleBringForward = useCallback(() => {
    if (!selectedElement) return;
    handleElementUpdate(selectedElement.id, {
      zIndex: (selectedElement.zIndex ?? 0) + 1,
    });
  }, [selectedElement, handleElementUpdate]);

  const handleSendBackward = useCallback(() => {
    if (!selectedElement) return;
    handleElementUpdate(selectedElement.id, {
      zIndex: (selectedElement.zIndex ?? 0) - 1,
    });
  }, [selectedElement, handleElementUpdate]);

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

  // Fields can be placed on the canvas more than once (e.g. the same photo
  // shown twice at different sizes) - just annotate how many times each
  // field is already used so the dropdown stays informative.
  const fieldPlacementCounts = new Map<string, number>();
  template.elements.forEach((el) => {
    if (!el.fieldId) return;
    fieldPlacementCounts.set(
      el.fieldId,
      (fieldPlacementCounts.get(el.fieldId) ?? 0) + 1,
    );
  });

  const handleAddStaticImage = (file: File) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      const result = e.target?.result as string;
      const compressed = await compressImageDataUrl(result);
      const newElement: TemplateElement = {
        id: `static-image-${Date.now()}`,
        fieldId: "",
        type: "image",
        x: 20,
        y: 20,
        width: 150,
        height: 150,
        visible: true,
        locked: false,
        zIndex: 0,
        opacity: 1,
        objectFit: "cover",
        objectPosition: "center",
        staticImageSrc: compressed,
      };
      onTemplateChange({
        ...template,
        elements: [...template.elements, newElement],
      });
      setSelectedElementId(newElement.id);
    };
    reader.readAsDataURL(file);
  };

  const handleAddShape = (shapeType: "rectangle" | "ellipse" | "line") => {
    const shapeDefaults: Record<
      "rectangle" | "ellipse" | "line",
      Partial<TemplateElement>
    > = {
      rectangle: { width: 160, height: 100, borderRadius: 0 },
      ellipse: { width: 120, height: 120 },
      line: { width: 200, height: 4 },
    };

    const newElement: TemplateElement = {
      id: `shape-${shapeType}-${Date.now()}`,
      fieldId: "",
      type: "shape",
      shapeType,
      x: 20,
      y: 20,
      width: 160,
      height: 100,
      visible: true,
      locked: false,
      zIndex: 0,
      opacity: 1,
      backgroundColor: "#a855f7",
      backgroundOpacity: 1,
      borderWidth: 0,
      ...shapeDefaults[shapeType],
    };

    onTemplateChange({
      ...template,
      elements: [...template.elements, newElement],
    });
    setSelectedElementId(newElement.id);
  };

  return (
    <div className={`${themeClasses.panel} rounded-lg shadow-md p-6`}>
      <h3 className="text-lg font-semibold mb-4 text-slate-950 dark:text-slate-100">
        Template Editor
      </h3>

      <div className="flex gap-6">
        {/* Canvas */}
        <div className="flex-1">
          {/* Canvas Size */}
          <div className="mb-4 flex flex-wrap items-end gap-3">
            <div>
              <label
                className={`block text-xs font-medium mb-1 ${themeClasses.label}`}
              >
                Width
              </label>
              <input
                type="number"
                value={template.width}
                onChange={(e) =>
                  handleTemplateSizeChange(
                    Number(e.target.value),
                    template.height,
                  )
                }
                className={`w-24 border rounded px-2 py-1 text-sm ${themeClasses.input}`}
              />
            </div>
            <div>
              <label
                className={`block text-xs font-medium mb-1 ${themeClasses.label}`}
              >
                Height
              </label>
              <input
                type="number"
                value={template.height}
                onChange={(e) =>
                  handleTemplateSizeChange(
                    template.width,
                    Number(e.target.value),
                  )
                }
                className={`w-24 border rounded px-2 py-1 text-sm ${themeClasses.input}`}
              />
            </div>
            <div>
              <label
                className={`block text-xs font-medium mb-1 ${themeClasses.label}`}
              >
                Preset
              </label>
              <select
                onChange={(e) => {
                  const preset = SIZE_PRESETS[Number(e.target.value)];
                  if (preset) {
                    handleTemplateSizeChange(preset.width, preset.height);
                  }
                  e.target.value = "";
                }}
                defaultValue=""
                className={`border rounded px-2 py-1 text-sm ${themeClasses.input}`}
              >
                <option value="">Choose a size...</option>
                {SIZE_PRESETS.map((preset, i) => (
                  <option key={preset.label} value={i}>
                    {preset.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label
                className={`block text-xs font-medium mb-1 ${themeClasses.label}`}
              >
                Zoom
              </label>
              <select
                value={zoom}
                onChange={(e) =>
                  setZoom(
                    e.target.value === "fit" ? "fit" : Number(e.target.value),
                  )
                }
                className={`border rounded px-2 py-1 text-sm ${themeClasses.input}`}
              >
                <option value="fit">Fit</option>
                {ZOOM_OPTIONS.map((z) => (
                  <option key={z} value={z}>
                    {Math.round(z * 100)}%
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label
                className={`block text-xs font-medium mb-1 ${themeClasses.label}`}
              >
                Preview data
              </label>
              <select
                value={previewPlayer?.id || ""}
                onChange={(e) => setPreviewPlayerId(e.target.value || null)}
                className={`border rounded px-2 py-1 text-sm ${themeClasses.input}`}
              >
                {players.length === 0 && (
                  <option value="">Sample placeholders</option>
                )}
                {players.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.values[fields[0]?.id] || p.id}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="text-xs text-slate-500 dark:text-slate-400 mb-2">
            Click to select • Drag to move • Use handles to resize • Delete key
            to remove • Arrow keys to nudge (Shift for 10px)
          </div>
          <div ref={canvasWrapperRef} className="w-full overflow-auto">
            <div
              style={{
                width: template.width * effectiveZoom,
                height: template.height * effectiveZoom,
              }}
            >
              <div
                ref={canvasRef}
                className="relative border-2 border-slate-300 dark:border-slate-600 bg-slate-100 dark:bg-slate-800"
                style={{
                  width: template.width,
                  height: template.height,
                  transform: `scale(${effectiveZoom})`,
                  transformOrigin: "top left",
                  backgroundImage: template.backgroundImage
                    ? `url(${template.backgroundImage})`
                    : template.backgroundColor,
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
                      style={getElementBoxStyle(element)}
                      onMouseDown={(e) => handleMouseDown(e, element.id)}
                      onClick={(e) => handleElementClick(e, element.id)}
                    >
                      <CardElementContent
                        element={element}
                        player={previewPlayer}
                        placeholder={!previewPlayer}
                      />

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
            </div>
          </div>

          {/* Add Element Controls */}
          <div className="mt-4 flex flex-wrap items-end gap-3">
            <div>
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
                className={`border rounded px-3 py-2 ${themeClasses.input}`}
                defaultValue=""
              >
                <option value="">Select a field...</option>
                {fields.map((field) => {
                  const count = fieldPlacementCounts.get(field.id) ?? 0;
                  return (
                    <option key={field.id} value={field.id}>
                      {field.label}
                      {count > 0 ? ` (placed ${count}x)` : ""}
                    </option>
                  );
                })}
              </select>
            </div>
            <div>
              <h4 className={`font-medium mb-2 ${themeClasses.label}`}>
                Add Static Image
              </h4>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    handleAddStaticImage(file);
                  }
                  e.target.value = "";
                }}
                className={`border rounded px-3 py-2 text-sm ${themeClasses.input}`}
              />
            </div>
            <div>
              <h4 className={`font-medium mb-2 ${themeClasses.label}`}>
                Add Shape
              </h4>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => handleAddShape("rectangle")}
                  className={`px-3 py-2 rounded text-sm ${themeClasses.button.secondary}`}
                >
                  ▭ Rectangle
                </button>
                <button
                  type="button"
                  onClick={() => handleAddShape("ellipse")}
                  className={`px-3 py-2 rounded text-sm ${themeClasses.button.secondary}`}
                >
                  ◯ Ellipse
                </button>
                <button
                  type="button"
                  onClick={() => handleAddShape("line")}
                  className={`px-3 py-2 rounded text-sm ${themeClasses.button.secondary}`}
                >
                  ─ Line
                </button>
              </div>
            </div>
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
                <h5
                  className={`text-xs font-semibold uppercase mb-3 ${themeClasses.muted}`}
                >
                  Position & Size
                </h5>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label
                      className={`block text-xs font-medium mb-1 ${themeClasses.label}`}
                    >
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
                    <label
                      className={`block text-xs font-medium mb-1 ${themeClasses.label}`}
                    >
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
                    <label
                      className={`block text-xs font-medium mb-1 ${themeClasses.label}`}
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
                      className={`w-full border rounded px-2 py-1 text-sm ${themeClasses.input}`}
                    />
                  </div>
                  <div>
                    <label
                      className={`block text-xs font-medium mb-1 ${themeClasses.label}`}
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
                      className={`w-full border rounded px-2 py-1 text-sm ${themeClasses.input}`}
                    />
                  </div>
                </div>
              </div>

              {/* Visibility & Layering */}
              <div className="border-t pt-4">
                <h5
                  className={`text-xs font-semibold uppercase mb-3 ${themeClasses.muted}`}
                >
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
                    <label
                      htmlFor="visible"
                      className={`text-sm ${themeClasses.label}`}
                    >
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
                    <label
                      htmlFor="locked"
                      className={`text-sm ${themeClasses.label}`}
                    >
                      Locked
                    </label>
                  </div>

                  <div>
                    <label
                      className={`block text-xs font-medium mb-1 ${themeClasses.label}`}
                    >
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
                    <label
                      className={`block text-xs font-medium mb-1 ${themeClasses.label}`}
                    >
                      Opacity:{" "}
                      {Math.round((selectedElement.opacity ?? 1) * 100)}%
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
                <h5
                  className={`text-xs font-semibold uppercase mb-3 ${themeClasses.muted}`}
                >
                  Background
                </h5>
                <div className="space-y-2">
                  <div>
                    <label
                      className={`block text-xs font-medium mb-1 ${themeClasses.label}`}
                    >
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
                    <label
                      className={`block text-xs font-medium mb-1 ${themeClasses.label}`}
                    >
                      Opacity:{" "}
                      {Math.round(
                        (selectedElement.backgroundOpacity ?? 1) * 100,
                      )}
                      %
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
                <h5
                  className={`text-xs font-semibold uppercase mb-3 ${themeClasses.muted}`}
                >
                  Border
                </h5>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label
                      className={`block text-xs font-medium mb-1 ${themeClasses.label}`}
                    >
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
                    <label
                      className={`block text-xs font-medium mb-1 ${themeClasses.label}`}
                    >
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
                    <label
                      className={`block text-xs font-medium mb-1 ${themeClasses.label}`}
                    >
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
                    <label
                      className={`block text-xs font-medium mb-1 ${themeClasses.label}`}
                    >
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
                <h5
                  className={`text-xs font-semibold uppercase mb-3 ${themeClasses.muted}`}
                >
                  Spacing
                </h5>
                <div>
                  <label
                    className={`block text-xs font-medium mb-1 ${themeClasses.label}`}
                  >
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
              {(selectedElement.type === "text" ||
                selectedElement.type === "textarea") && (
                <div className="border-t pt-4">
                  <h5
                    className={`text-xs font-semibold uppercase mb-3 ${themeClasses.muted}`}
                  >
                    Text
                  </h5>
                  <div className="grid grid-cols-2 gap-2 space-y-2">
                    <div>
                      <label
                        className={`block text-xs font-medium mb-1 ${themeClasses.label}`}
                      >
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
                      <label
                        className={`block text-xs font-medium mb-1 ${themeClasses.label}`}
                      >
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
                        {availableFontFamilies.map((fontFamily) => (
                          <option key={fontFamily} value={fontFamily}>
                            {fontFamily}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label
                        className={`block text-xs font-medium mb-1 ${themeClasses.label}`}
                      >
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
                      <label
                        className={`block text-xs font-medium mb-1 ${themeClasses.label}`}
                      >
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
                      <label
                        className={`block text-xs font-medium mb-1 ${themeClasses.label}`}
                      >
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
                      <label
                        className={`block text-xs font-medium mb-1 ${themeClasses.label}`}
                      >
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
                      <label
                        className={`block text-xs font-medium mb-1 ${themeClasses.label}`}
                      >
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
                      <label
                        className={`block text-xs font-medium mb-1 ${themeClasses.label}`}
                      >
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
                      <label
                        className={`block text-xs font-medium mb-1 ${themeClasses.label}`}
                      >
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

              {/* Font Manager */}
              <div className="border-t pt-4">
                <h5
                  className={`text-xs font-semibold uppercase mb-3 ${themeClasses.muted}`}
                >
                  Font Manager
                </h5>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label
                        className={`block text-xs font-medium mb-1 ${themeClasses.label}`}
                      >
                        Font Name
                      </label>
                      <input
                        type="text"
                        value={fontName}
                        onChange={(e) => setFontName(e.target.value)}
                        placeholder="Roboto"
                        className={`w-full border rounded px-2 py-1 text-sm ${themeClasses.input}`}
                      />
                    </div>
                    <div>
                      <label
                        className={`block text-xs font-medium mb-1 ${themeClasses.label}`}
                      >
                        Font CSS URL
                      </label>
                      <input
                        type="url"
                        value={fontUrl}
                        onChange={(e) => setFontUrl(e.target.value)}
                        placeholder="https://fonts.googleapis.com/css2?family=Roboto:wght@400;700&display=swap"
                        className={`w-full border rounded px-2 py-1 text-sm ${themeClasses.input}`}
                      />
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddFont}
                    className={`w-full px-3 py-2 rounded text-sm ${themeClasses.button.primary}`}
                  >
                    Add Imported Font
                  </button>
                  {fontManagerMessage && (
                    <div className="text-sm text-slate-700 dark:text-slate-200">
                      {fontManagerMessage}
                    </div>
                  )}

                  {fonts.length > 0 && (
                    <div className="space-y-2">
                      <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                        Imported Fonts
                      </div>
                      <div className="space-y-2">
                        {fonts.map((font) => (
                          <div
                            key={font.url}
                            className="flex items-center justify-between gap-3 rounded border border-slate-200 dark:border-slate-700 p-3"
                          >
                            <div>
                              <div className="font-medium text-sm text-slate-900 dark:text-slate-100">
                                {font.name}
                              </div>
                              <div className="text-xs text-slate-500 dark:text-slate-400 break-all">
                                {font.url}
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemoveFont(font.url)}
                              className={`px-2 py-1 rounded text-xs ${themeClasses.button.danger}`}
                            >
                              Remove
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Image Controls */}
              {selectedElement.type === "image" && (
                <div className="border-t pt-4">
                  <h5
                    className={`text-xs font-semibold uppercase mb-3 ${themeClasses.muted}`}
                  >
                    Image
                  </h5>
                  <div className="space-y-2">
                    <div>
                      <label
                        className={`block text-xs font-medium mb-1 ${themeClasses.label}`}
                      >
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
                    <div>
                      <label
                        className={`block text-xs font-medium mb-1 ${themeClasses.label}`}
                      >
                        Object Position
                      </label>
                      <select
                        value={selectedElement.objectPosition || "center"}
                        onChange={(e) =>
                          handleElementUpdate(selectedElement.id, {
                            objectPosition: e.target
                              .value as TemplateElement["objectPosition"],
                          })
                        }
                        className={`w-full border rounded px-2 py-1 text-sm ${themeClasses.input}`}
                      >
                        <option value="center">Center</option>
                        <option value="top">Top</option>
                        <option value="bottom">Bottom</option>
                        <option value="left">Left</option>
                        <option value="right">Right</option>
                        <option value="top left">Top Left</option>
                        <option value="top right">Top Right</option>
                        <option value="bottom left">Bottom Left</option>
                        <option value="bottom right">Bottom Right</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Shape Controls */}
              {selectedElement.type === "shape" && (
                <div className="border-t pt-4">
                  <h5
                    className={`text-xs font-semibold uppercase mb-3 ${themeClasses.muted}`}
                  >
                    Shape
                  </h5>
                  <div>
                    <label
                      className={`block text-xs font-medium mb-1 ${themeClasses.label}`}
                    >
                      Shape Type
                    </label>
                    <select
                      value={selectedElement.shapeType || "rectangle"}
                      onChange={(e) =>
                        handleElementUpdate(selectedElement.id, {
                          shapeType: e.target
                            .value as TemplateElement["shapeType"],
                        })
                      }
                      className={`w-full border rounded px-2 py-1 text-sm ${themeClasses.input}`}
                    >
                      <option value="rectangle">Rectangle</option>
                      <option value="ellipse">Ellipse</option>
                      <option value="line">Line</option>
                    </select>
                  </div>
                  <p className={`text-xs mt-2 ${themeClasses.muted}`}>
                    Use the Background section for fill color and the Border
                    section for stroke.
                  </p>
                </div>
              )}

              {/* Actions */}
              <div className="border-t pt-4 space-y-2">
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={handleSendBackward}
                    className={`px-3 py-2 rounded text-sm ${themeClasses.button.secondary}`}
                    type="button"
                  >
                    Backward
                  </button>
                  <button
                    onClick={handleDuplicateElement}
                    className={`px-3 py-2 rounded text-sm ${themeClasses.button.secondary}`}
                    type="button"
                  >
                    Duplicate
                  </button>
                  <button
                    onClick={handleBringForward}
                    className={`px-3 py-2 rounded text-sm ${themeClasses.button.secondary}`}
                    type="button"
                  >
                    Forward
                  </button>
                </div>
                <button
                  onClick={() => handleDeleteElement(selectedElement.id)}
                  className={`w-full px-3 py-2 rounded transition-colors text-sm ${themeClasses.button.danger}`}
                  type="button"
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

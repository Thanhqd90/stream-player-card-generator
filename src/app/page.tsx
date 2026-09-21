"use client";

import React, { useState } from "react";
import PlayerCard from "../components/PlayerCard";
import DynamicPlayerForm from "../components/DynamicPlayerForm";
import PlayerList from "../components/PlayerList";
import CsvImporter from "../components/CsvImporter";
import BulkPhotoImporter from "../components/BulkPhotoImporter";
import EventImportExport from "../components/EventImportExport";
import ExportButtons from "../components/ExportButtons";
import FieldManager from "../components/FieldManager";
import TemplateEditor from "../components/TemplateEditor";
import BackgroundUploader from "../components/BackgroundUploader";
import ThemeToggle from "../components/ThemeToggle";
import { ThemeProvider } from "../contexts/ThemeContext";
import { themeClasses } from "../utils/themeClasses";
import { useEventManager } from "../hooks/useEventManager";
import { ensureImportedFontsLoaded } from "../utils/fonts";
import { resizeTemplateCanvas } from "../utils/templateSize";

type TabType = "setup" | "template" | "players";

export default function Home() {
  const {
    event,
    selectedPlayer,
    selectedPlayerId,
    setSelectedPlayerId,
    addPlayer,
    updatePlayer,
    deletePlayer,
    duplicatePlayer,
    importPlayers,
    importPlayerPhotos,
    importEvent,
    updateEventName,
    resetEvent,
    updateEvent,
    undo,
    redo,
    canUndo,
    canRedo,
  } = useEventManager();

  const [activeTab, setActiveTab] = useState<TabType>("setup");
  const [editingPlayer, setEditingPlayer] = useState<string | null>(null);

  React.useEffect(() => {
    if (event?.fonts?.length) {
      ensureImportedFontsLoaded(event.fonts).catch((error) => {
        console.error("Failed to load imported fonts:", error);
      });
    }
  }, [event?.fonts]);

  if (!event) {
    return (
      <ThemeProvider>
        <div
          className={`min-h-screen ${themeClasses.page} flex items-center justify-center`}
        >
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400 mx-auto"></div>
            <p className={`mt-4 ${themeClasses.muted}`}>Loading...</p>
          </div>
        </div>
      </ThemeProvider>
    );
  }

  const tabs = [
    { id: "setup" as TabType, label: "Setup", icon: "⚙️" },
    { id: "template" as TabType, label: "Template Editor", icon: "🎨" },
    { id: "players" as TabType, label: "Players & Export", icon: "👥" },
  ];

  const handlePlayerSave = (player: any) => {
    if (editingPlayer) {
      updatePlayer(player);
    } else {
      addPlayer(player);
    }
    setEditingPlayer(null);
  };

  const handlePlayerCancel = () => {
    setEditingPlayer(null);
  };

  const handleFieldsChange = (fields: any) => {
    updateEvent({ fields });
  };

  const handleTemplateChange = (template: any) => {
    updateEvent({ template });
  };

  const handleBackgroundChange = (backgroundImage: string | undefined) => {
    updateEvent({
      template: { ...event.template, backgroundImage },
    });
  };

  const handleBackgroundColorChange = (backgroundColor: string | undefined) => {
    updateEvent({
      template: { ...event.template, backgroundColor },
    });
  };

  const handleMatchCanvasSize = (width: number, height: number) => {
    updateEvent({
      template: resizeTemplateCanvas(event.template, width, height),
    });
  };

  return (
    <ThemeProvider>
      <div className={`min-h-screen ${themeClasses.page}`}>
        {/* Header */}
        <header
          className={`${themeClasses.panel} shadow-sm border-b border-slate-200 dark:border-slate-800`}
        >
          <div className="mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex justify-between items-center">
              <h1 className="text-2xl font-bold text-slate-950 dark:text-slate-100">
                Player Card Generator
              </h1>
              <div className="flex items-center gap-4">
                <ThemeToggle />
                <div className="flex items-center gap-1">
                  <button
                    onClick={undo}
                    disabled={!canUndo}
                    title="Undo (Ctrl+Z)"
                    className={`px-3 py-1 rounded text-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${themeClasses.button.secondary}`}
                  >
                    ↶ Undo
                  </button>
                  <button
                    onClick={redo}
                    disabled={!canRedo}
                    title="Redo (Ctrl+Shift+Z)"
                    className={`px-3 py-1 rounded text-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${themeClasses.button.secondary}`}
                  >
                    ↷ Redo
                  </button>
                </div>
                <span className={`text-sm ${themeClasses.muted}`}>
                  Last saved: {new Date(event.updatedAt).toLocaleString()}
                </span>
                <button
                  onClick={resetEvent}
                  className={`px-3 py-1 rounded text-sm transition-colors ${themeClasses.button.danger}`}
                >
                  Reset Event
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Navigation Tabs */}
        <nav
          className={`${themeClasses.panel} border-b border-slate-200 dark:border-slate-800`}
        >
          <div className="mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex space-x-8">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? "border-blue-500 text-blue-600 dark:text-blue-400"
                      : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:border-slate-300 dark:hover:border-slate-600"
                  }`}
                >
                  <span className="mr-2">{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <main className="mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {activeTab === "setup" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Left Column - Event Management */}
              <div className="space-y-6">
                <EventImportExport
                  event={event}
                  onImportEvent={importEvent}
                  onUpdateEventName={updateEventName}
                />
                <BackgroundUploader
                  backgroundImage={event.template.backgroundImage}
                  backgroundColor={event.template.backgroundColor}
                  templateSize={{
                    width: event.template.width,
                    height: event.template.height,
                  }}
                  onBackgroundChange={handleBackgroundChange}
                  onBackgroundColorChange={handleBackgroundColorChange}
                  onMatchCanvasSize={handleMatchCanvasSize}
                />
              </div>

              {/* Right Column - Field Manager */}
              <div>
                <FieldManager
                  fields={event.fields}
                  onFieldsChange={handleFieldsChange}
                />
              </div>
            </div>
          )}

          {activeTab === "template" && (
            <TemplateEditor
              template={event.template}
              fields={event.fields}
              fonts={event.fonts}
              players={event.players}
              onTemplateChange={handleTemplateChange}
              onFontsChange={(fonts) => updateEvent({ fonts })}
            />
          )}

          {activeTab === "players" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Column - Player List (visible on desktop alongside form) */}
              <div className="lg:order-1 space-y-4">
                <div
                  className={`${themeClasses.panel} rounded-lg shadow-md p-6 sticky top-20`}
                >
                  <h3 className="text-lg font-semibold mb-4 text-slate-950 dark:text-slate-100">
                    Players ({event.players.length})
                  </h3>
                  <div className="max-h-96 overflow-y-auto">
                    <PlayerList
                      players={event.players}
                      selectedPlayerId={selectedPlayerId}
                      onSelectPlayer={(player) => {
                        setSelectedPlayerId(player.id);
                        setEditingPlayer(player.id);
                      }}
                      onDeletePlayer={deletePlayer}
                      onDuplicatePlayer={duplicatePlayer}
                    />
                  </div>
                  <button
                    onClick={() => {
                      setEditingPlayer(null);
                      setSelectedPlayerId(null);
                    }}
                    className={`w-full px-3 py-2 rounded text-sm transition-colors ${themeClasses.button.primary}`}
                  >
                    + Add New Player
                  </button>
                </div>
              </div>

              {/* Middle Column - Player Management Form */}
              <div className="lg:order-2 space-y-6">
                <DynamicPlayerForm
                  player={
                    editingPlayer
                      ? event.players.find((p) => p.id === editingPlayer) ||
                        null
                      : null
                  }
                  fields={event.fields}
                  onSave={handlePlayerSave}
                  onCancel={handlePlayerCancel}
                />
                <CsvImporter
                  fields={event.fields}
                  onImportPlayers={importPlayers}
                />
                <BulkPhotoImporter
                  players={event.players}
                  fields={event.fields}
                  onImportPhotos={importPlayerPhotos}
                />
              </div>

              {/* Right Column - Card Preview and Export */}
              <div className="lg:order-3 space-y-6">
                <div
                  className={`${themeClasses.panel} rounded-lg shadow-md p-6`}
                >
                  <h3 className="text-lg font-semibold mb-4 text-slate-950 dark:text-slate-100">
                    Card Preview
                  </h3>
                  <div className="flex justify-center">
                    {selectedPlayer ? (
                      <PlayerCard
                        player={selectedPlayer}
                        template={event.template}
                      />
                    ) : (
                      <div className="w-[500px] h-[700px] bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center border-2 border-dashed border-slate-300 dark:border-slate-600">
                        <div className="text-center text-slate-500 dark:text-slate-400">
                          <svg
                            className="mx-auto h-12 w-12 text-slate-400 dark:text-slate-500"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                            />
                          </svg>
                          <p className="mt-2 text-sm">
                            Select a player to preview their card
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <ExportButtons
                  selectedPlayer={selectedPlayer}
                  players={event.players}
                  template={event.template}
                  event={event}
                />
              </div>
            </div>
          )}
        </main>
      </div>
    </ThemeProvider>
  );
}

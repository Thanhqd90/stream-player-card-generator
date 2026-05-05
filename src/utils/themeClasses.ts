// Theme utility classes for consistent styling

export const themeClasses = {
  // Page background
  page: "bg-slate-100 dark:bg-slate-950 text-slate-950 dark:text-slate-100",

  // Panels/cards
  panel:
    "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-950 dark:text-slate-100",

  // Inputs
  input:
    "bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-950 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500",

  // Labels
  label: "text-slate-950 dark:text-slate-100",

  // Buttons
  button: {
    primary:
      "bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900",
    secondary:
      "bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900",
    danger:
      "bg-red-600 text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900",
  },

  // Tabs/navigation
  tab: {
    active: "bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-950",
    inactive:
      "text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800",
  },

  // Secondary text
  muted: "text-slate-600 dark:text-slate-400",

  // Focus states (already included in buttons)
  focus:
    "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900",
};

# Player Card Generator

A Next.js application for generating customizable player cards for rhythm game events and streams. This template-based card editor allows you to design beautiful player cards with drag-and-drop elements, custom fields, and background images.

## Features

- **Template-Based Design**: Create custom card layouts with drag-and-drop elements
- **Background Images**: Upload and manage card background images
- **Custom Fields**: Define flexible player data fields (text, textarea, number, image)
- **Element Styling**: Customize fonts, colors, borders, and positioning for each element
- **Event Management**: Create and manage events with customizable player fields
- **Player Management**: Add, edit, delete, and duplicate players with dynamic forms
- **CSV Import**: Import players from CSV files with automatic field mapping
- **Card Preview**: Live preview of player cards with template rendering
- **PNG Export**: Export individual player cards as PNG images
- **ZIP Export**: Export all player cards as a ZIP archive
- **Preview in New Tab**: View full-size card previews in new browser tabs
- **Event Persistence**: Auto-save events to localStorage
- **Event Import/Export**: Import and export complete events as JSON files
- **Responsive Design**: Works on desktop and mobile devices

## Tech Stack

- **Framework**: Next.js 16 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: React useState/useEffect hooks
- **CSV Parsing**: Papa Parse
- **Image Export**: html-to-image
- **ZIP Creation**: JSZip
- **File Downloads**: file-saver
- **Deployment**: Vercel-ready

## Getting Started

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd stream-player-card-generator
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Run the development server**

   ```bash
   npm run dev
   ```

4. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000) (or the port shown in your terminal)

## Project Structure

```
src/
├── app/
│   └── page.tsx              # Main application with tabbed interface
├── components/
│   ├── PlayerCard.tsx        # Template-based card renderer
│   ├── DynamicPlayerForm.tsx # Form that adapts to field definitions
│   ├── PlayerList.tsx        # List of players with actions
│   ├── CsvImporter.tsx       # CSV file import with dynamic fields
│   ├── EventImportExport.tsx # Event JSON import/export
│   ├── ExportButtons.tsx     # PNG and ZIP export with preview
│   ├── FieldManager.tsx      # CRUD interface for field definitions
│   ├── TemplateEditor.tsx    # Drag-and-drop template designer
│   └── BackgroundUploader.tsx # Background image management
├── types/
│   ├── player.ts             # Player and FieldDefinition types
│   ├── event.ts              # SavedEvent type
│   └── template.ts           # CardTemplate and TemplateElement types
└── utils/
    ├── storage.ts            # localStorage with migration support
    ├── csv.ts                # CSV parsing with dynamic fields
    ├── exportCard.ts         # PNG export utilities
    ├── fileNames.ts          # File naming utilities
    └── defaultEvent.ts       # Default event with template elements
```

## Usage

### Event Settings Tab

- **Event Name**: Change the event name (used for file naming)
- **Background Upload**: Upload background images for cards
- **Event Import/Export**: Save and load complete events as JSON

### Field Manager Tab

- **Default Fields**: handle, pronouns, seed, location, achievement1-3, funFact, playerPhoto
- **Add Custom Fields**: Create additional fields for your event
- **Field Types**: Text, Textarea, Number, Image
- **Required Fields**: Mark fields as required for validation

### Template Editor Tab

- **Canvas**: 500x700 pixel card design area
- **Add Elements**: Select fields to add to the template
- **Drag & Drop**: Move elements around the canvas
- **Element Inspector**: Edit styling properties in the side panel
- **Visual Feedback**: See live preview of element positioning

### Players Tab

- **Dynamic Forms**: Forms adapt to your field definitions
- **Image Upload**: Support for player photos (stored as data URLs)
- **CSV Import**: Import players with custom field mapping
- **Player Management**: Edit, duplicate, and delete players

### Preview & Export Tab

- **Card Preview**: See how cards look with current template
- **PNG Preview**: Open full-size preview in new tab
- **Individual Export**: Download single player cards
- **Batch Export**: Download all cards as ZIP archive

## Template Element Properties

Each template element supports:

- **Positioning**: X, Y coordinates
- **Dimensions**: Width, height
- **Typography**: Font family, size, weight, color
- **Layout**: Text align, line height
- **Styling**: Background color, borders, border radius, padding
- **Visibility**: Show/hide elements

## CSV Import Format

CSV files should include headers matching your field IDs:

```
handle,pronouns,seed,location,achievement1,achievement2,achievement3,funFact,playerPhoto
PlayerOne,they/them,01,New York,Champion 2023,Speedrunner,Community Favorite,"Loves rhythm games!
Plays every day.",data:image/jpeg;base64,...
```

## Data Storage

- **localStorage**: Events auto-save to browser storage
- **Migration**: Automatic upgrade from old format to new template system
- **Images**: Backgrounds and player photos stored as data URLs
- **JSON Export**: Complete event data for backup/sharing

## Limitations

- **Storage Quota**: Large background images may exceed localStorage limits
- **Browser Only**: No server-side processing or database
- **Image Size**: Recommended background images under 2MB
- **No Undo**: Template changes are immediate (consider exporting before major changes)

## Deployment

Deploy to Vercel with zero configuration:

```bash
npm run build
# Deploy the .next folder to Vercel
```

The app is fully client-side and requires no backend services.

### Event Management

- **Export Event**: Download the complete event as JSON for backup
- **Import Event**: Load a previously exported event JSON file
- **Reset Event**: Clear all data and start fresh

## CSV Format

Your CSV file should have these columns (case-sensitive):

- `handle` - Player's display name
- `pronouns` - Player's pronouns (optional)
- `seed` - Tournament seed number
- `location` - Player's location
- `achievement1` - First achievement (optional)
- `achievement2` - Second achievement (optional)
- `achievement3` - Third achievement (optional)
- `funFact` - Fun fact about the player (supports line breaks)

## Card Design

The default card template features:

- 500x700px vertical layout
- Dark gradient background
- Purple/blue accent colors
- Player handle prominently displayed
- Pronouns and seed in badges
- Location section
- Achievement list with colored borders
- Fun fact section (preserves line breaks)
- Clean, professional appearance suitable for streams

## Deployment

This app is designed to be deployed on Vercel:

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Deploy automatically

The app works entirely client-side with localStorage, so no database configuration is needed.

## Future Enhancements (Not Included in MVP)

- User authentication
- Database integration
- Drag-and-drop card designer
- Google Sheets integration
- start.gg API integration
- OBS browser source mode
- Multi-user collaboration

## License

This project is open source and available under the [MIT License](LICENSE).

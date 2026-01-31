# Hoagie Media Planner

**The media planning toolkit that lives inside Excel.**

Hoagie is an Excel Add-in built for media agency planners who need UTM generation, impression forecasting, and spend pacing — all without leaving their spreadsheet. It writes live Excel formulas so your numbers stay in sync when plans change.

---

## Features

### UTM Builder
- Generate campaign UTMs from a standardized naming convention
- Auto-populates source from your channel config
- Queue multiple UTMs and batch-write them to Excel in one click
- Copy individual UTM strings to clipboard

### Impression Forecasting
- Set a total budget, pick your channels, and allocate percentages across a channel mix
- Choose from 5 flighting patterns: Even, Front-loaded, Back-loaded, Seasonal, Custom
- Configure agency fees (percentage, flat per-period, or hybrid)
- Preview per-channel and per-period breakdowns before writing
- Writes a 13-column Excel table with **live formulas** — edit a CPM in Excel and Impressions, Fees, and Total recalculate automatically

### Spend Pacing
- Track actual vs. planned spend and impressions
- Color-coded status badges (on-track, under-pacing, over-pacing)
- Performance vs. benchmark comparison

### Pre-configured Channels
12 channels across 3 categories with default CPMs, buy types, and tactics:

| Category | Channels |
|----------|----------|
| **Video** | Local Linear TV, CTV (Hallux), OLV (Hallux), YouTube Reservation, YouTube Auction |
| **Digital** | Display Premium, Display Standard, Native Premium, Native Standard |
| **Social** | Meta Reach, Meta Video Views, Meta Traffic |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| UI | React 18, Tailwind CSS (dark theme) |
| State | Zustand |
| Excel API | Office.js |
| Build | Vite, TypeScript (strict) |
| Tests | Vitest |

---

## Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) v18+
- Microsoft Excel (desktop or web)

### Install

```bash
git clone https://github.com/ChristopherLandaverde/hoagie.git
cd hoagie/media-planner-addin
npm install
```

### Development

```bash
# Generate HTTPS certs for Office.js (first time only)
npx office-addin-dev-certs install

# Start dev server on https://localhost:3000
npm run dev
```

### Sideload into Excel

```bash
# Opens Excel with the add-in loaded for testing
npm run sideload
```

Or manually sideload `manifest.xml` via Excel > Insert > My Add-ins > Upload My Add-in.

### Run Tests

```bash
npm test           # single run
npm run test:watch # watch mode
```

### Type Check

```bash
npx tsc --noEmit
```

---

## Deployment

### Option 1: Static Hosting (Azure, Vercel, Netlify)

Build the production bundle and deploy the `dist/` folder to any static host.

```bash
npm run build
```

Then update `manifest.xml` — replace every `https://localhost:3000` with your production URL:

```xml
<!-- Before -->
<SourceLocation DefaultValue="https://localhost:3000/src/taskpane/index.html" />

<!-- After -->
<SourceLocation DefaultValue="https://your-domain.com/src/taskpane/index.html" />
```

**Azure Static Web Apps** (recommended for Office Add-ins):
```bash
npm run build
# Install Azure SWA CLI
npm install -g @azure/static-web-apps-cli
swa deploy dist/ --env production
```

**Vercel:**
```bash
npm i -g vercel
vercel --prod
```

**Netlify:**
```bash
# Drop the dist/ folder into Netlify dashboard, or:
npm i -g netlify-cli
netlify deploy --prod --dir=dist
```

### Option 2: SharePoint / OneDrive (Enterprise)

1. Build: `npm run build`
2. Upload `dist/` contents to a SharePoint document library or OneDrive folder
3. Update `manifest.xml` URLs to point to the SharePoint/OneDrive hosted files
4. Deploy the manifest through the Microsoft 365 Admin Center > Integrated Apps

### Option 3: Centralized Deployment (IT Admin)

For org-wide rollout via the Microsoft 365 Admin Center:

1. Build and host the app (see Option 1)
2. Go to [admin.microsoft.com](https://admin.microsoft.com) > Settings > Integrated Apps
3. Click **Upload custom apps** and upload `manifest.xml`
4. Assign to users or groups
5. Users will see **Hoagie** in the Home tab ribbon automatically

### Manifest Validation

```bash
npm run validate
```

This checks `manifest.xml` against the Office Add-in schema before deployment.

---

## Project Structure

```
src/
├── components/
│   ├── forecasting/          # Forecasting panel (4 accordion sections)
│   │   ├── CampaignSetupSection.tsx
│   │   ├── ChannelMixSection.tsx
│   │   ├── FeeConfigSection.tsx
│   │   ├── ForecastPreviewSection.tsx
│   │   └── ForecastingPanel.tsx
│   ├── pacing/               # Spend pacing dashboard
│   └── utm/                  # UTM builder
├── constants/
│   └── channels.ts           # 12 pre-configured media channels
├── lib/
│   ├── calculations.ts       # Media math (CPM, TRP, flighting, fees)
│   ├── excel.ts              # Office.js wrappers (batch write, formulas)
│   └── validation.ts         # UTM + numeric validation
├── store/
│   └── index.ts              # Zustand state (channels, forecast config, mix)
├── types/
│   └── index.ts              # TypeScript interfaces
├── taskpane/                 # Main app entry point
└── utm/                      # Standalone UTM entry point
```

---

## Excel Table Schema

The Forecasting sheet writes a `ForecastTable` with 13 columns. Each row is one period for one channel.

| Column | Field | Type |
|--------|-------|------|
| A | Period | Static (1, 2, 3...) |
| B | Channel | Static |
| C | Tactic | Static |
| D | Buy_Type | Static |
| E | Budget | Static (editable) |
| F | CPM | Static (editable) |
| G | Impressions | **Formula:** `=IF(F>0,(E/F)*1000,0)` |
| H | Universe | Static |
| I | TRPs | **Formula:** `=IF(H>0,(G/H)*100,0)` |
| J | Fee_Pct | Static |
| K | Fee_Flat | Static |
| L | Fees | **Formula:** `=E*J+K` |
| M | Total | **Formula:** `=E+L` |

A summary row below the table uses `=SUM(ForecastTable[Budget])` etc.

---

## License

MIT

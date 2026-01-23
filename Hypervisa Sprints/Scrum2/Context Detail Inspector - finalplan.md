# Context Detail Inspector - Tab 1 Final Implementation Guide

## 1. Header Wijzigingen

### Bovenste header bar:
- **Vervang "CHAT WITH CONTEXT"** door **repository naam** ("panopticon-core")
- Positioneer waar nu "CHAT WITH CONTEXT" staat

### Agent identificatie:
- **Vervang "panopticon-core"** (met icoon) door **"Kijko"**
- **Behoud het chatbot icoon** (🤖) voor "Kijko"
- Dit wordt: `🤖 Kijko`

**Resultaat**:
Bovenaan: panopticon-core (waar nu "CHAT WITH CONTEXT" staat)
Eronder: 🤖 Kijko (waar nu "panopticon-core" staat)
AI-generated summary (blijft zoals het is)

text

---

## 2. AI-Generated Summary Aanpassingen

- **Verwijder de volledige "KEY COMPONENTS" sectie**
  - Inclusief alle bullet points onder KEY COMPONENTS
  - Inclusief de heading "KEY COMPONENTS" zelf
- **Behoud alleen de eerste alinea** van de summary
- De summary eindigt dus na: "...Tailwind CSS for styling."

---

## 3. Linker Paneel: Source Files

### Terminologie:
- **"Bronnen"** → **"Source Files"**

### Header layout (blijft zoals nu):
Source Files (10/12 geselecteerd) 2.4 MB

text

### "Alle bronnen selecteren" wijziging:
- **Verwijder de huidige "Alle bronnen selecteren" rij compleet**
- **Vervang door een checkbox icoon** op de positie waar nu het 📁 folder icoon staat
- Dit checkbox icoon fungeert als "select all/deselect all" toggle
- Geen tekst "Alle bronnen selecteren" meer tonen
- Visueel: gewoon een standaard checkbox icoon bovenaan de lijst

**Voor**:
☑️ Alle bronnen selecteren

text

**Na**:
[☑️] (alleen checkbox icoon, geen tekst)

text

---

## 4. Drag & Drop Functionaliteit

### Drop zone:
- De **volledige Source Files lijst** is een drop zone
- Visuele feedback bij dragover:
  - Lichte border highlight (bijv. blauwe rand)
  - Opacity change of achtergrondkleur wijziging
  - "Drop files here" overlay/indicator

### File handling:
- Accepteer alle relevante bestandstypes (bijv. .ts, .tsx, .js, .json, .md, etc.)
- Na drop: voeg bestanden toe aan de lijst
- Markeer nieuwe bestanden visueel anders (bijv. oranje/gele tint of ⚠️ icoon)
- Toon deze bestanden met indicator dat ze "uncompressed" zijn

### Toast notificatie:
- **Positie**: Centrum van het scherm
- **Trigger**: Direct na het droppen van bestanden
- **Inhoud**: "⚠️ Deze bestanden zijn nog niet gecomprimeerd"
- **Styling**: 
  - Semi-transparante achtergrond
  - Oranje/geel accent kleur voor waarschuwing
  - Geen knoppen
- **Interactie**: 
  - Klikken naast de notificatie = sluiten
  - Auto-dismiss na 3-4 seconden
  - Fade in/out animatie

---

## 5. Add Files Knop

### Positie:
- **Onderaan de Source Files lijst**

### Styling:
- Subtiel, niet prominent
- Format: `+ Add files` of `+ Add source files`
- Lichtere kleur dan andere UI elementen
- Smaller/minder bold font
- Mogelijk icoon + tekst combinatie

### Functionaliteit:
- Click → open file picker dialog
- Na selectie: zelfde flow als drag & drop
- Toon ook de toast notificatie voor "niet gecomprimeerd"

---

## 6. Inklapbaar Paneel

### Collapse knop:
- **Positie**: Rechtsboven in het linker paneel, naast "Source Files" header
- **Icoon**: `◀` (ingeklapt) / `▶` (uitgeklapt) of `«` / `»`
- Subtiel maar duidelijk klikbaar

### Gedrag:
- **Ingeklapt**: 
  - Paneel width: ~40-50px (alleen verticale balk met expand icoon)
  - Chat window neemt extra ruimte in
  - Alleen `▶` icoon zichtbaar om uit te klappen
  
- **Uitgeklapt**:
  - Normale width zoals nu
  - `◀` icoon zichtbaar om in te klappen

### Animatie:
- Smooth CSS transition: 300-400ms ease-in-out
- Geen abrupte wijzigingen
- Chat window past responsive aan

### State persistence:
- Onthoud collapsed/expanded state tijdens sessie
- Optioneel: save in localStorage voor tussen sessies

### Keyboard shortcut (optioneel):
- Bijv. `Ctrl+B` of `Cmd+B` om te togglen

---

## 7. Linker Onderhoek: Update Timestamp

**Blijft zoals gepland**:
- Positie: Linker onderhoek van het paneel
- Formaat: "Updated: Just now"
- Geen container/border - plain text
- Zichtbaar in **alle tabs** (persistent footer)
- Subtiele, lichte kleur

---

## Technische Implementatie Details

### State management:
```typescript
interface SourceFile {
  id: string;
  name: string;
  size: string;
  selected: boolean;
  compressed: boolean; // nieuw
  type: string;
}

interface PanelState {
  collapsed: boolean;
  files: SourceFile[];
  selectAllToggle: boolean;
}
Drag & Drop events:
typescript
// Pseudo-code
onDragOver: (e) => {
  e.preventDefault();
  // Show visual feedback
}

onDrop: (e) => {
  const files = e.dataTransfer.files;
  // Process files
  // Add to list with compressed: false
  // Show toast notification
}
Toast component:
typescript
interface ToastProps {
  message: string;
  duration?: number; // default 3000ms
  type: 'warning' | 'info' | 'success';
}
Collapse logic:
typescript
const togglePanel = () => {
  setCollapsed(!collapsed);
  // Animate width change
  // Adjust chat window width
}
UI/UX Checklist
 Header: "CHAT WITH CONTEXT" → "panopticon-core"

 Agent: "panopticon-core" → "🤖 Kijko"

 Summary: Verwijder KEY COMPONENTS, behoud alleen eerste alinea

 "Bronnen" → "Source Files"

 Vervang "Alle bronnen selecteren" rij door checkbox icoon

 Drag & drop zone actief op hele lijst

 Visual feedback tijdens drag

 Toast notificatie centrum, auto-dismiss, klik-om-te-sluiten

 "+ Add files" knop onderaan lijst, subtiel

 Collapse knop rechtsboven bij "Source Files"

 Smooth animatie bij in/uitklappen (300-400ms)

 Chat window past responsive aan

 Update timestamp blijft in linker onderhoek

 Timestamp zichtbaar in alle tabs

 Nieuwe bestanden hebben "uncompressed" indicator

 Consistent met bestaande styling/design system

Prioriteit van Implementatie
Phase 1 - Quick wins (30 min):

Header tekstwijzigingen

Summary cleanup (KEY COMPONENTS weg)

"Bronnen" → "Source Files"

Timestamp in alle tabs persistent

Phase 2 - Medium complexity (1-2 uur):
5. "Alle bronnen selecteren" → checkbox icoon
6. Collapse functionaliteit paneel
7. "+ Add files" knop onderaan

Phase 3 - Complex features (2-3 uur):
8. Drag & drop implementatie
9. Toast notificatie systeem
10. Visual feedback tijdens drag
11. "Uncompressed" state en styling

Testing Checklist
 Repository naam toont correct in header

 Kijko agent naam + icoon correct

 Summary toont alleen eerste alinea

 Checkbox icoon select all/deselect all werkt

 Drag & drop accepteert juiste bestandstypes

 Visual feedback tijdens drag duidelijk

 Toast verschijnt centrum, dismiss werkt

 Add files knop opent file picker

 Collapse knop togglet paneel smooth

 Chat window past aan bij collapse

 Timestamp persistent in alle tabs

 Nieuwe bestanden krijgen "uncompressed" indicator

 Responsive gedrag werkt op verschillende schermgroottes
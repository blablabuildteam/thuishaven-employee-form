# Thuishaven — Design Direction

## Brand Analysis (from thuishaven.nl)

Thuishaven is an outdoor festival/club venue in Amsterdam. The brand aesthetic is **warm, organic, and festival-forward** — not corporate or sterile.

### Visual Identity

| Element | Detail |
|---------|--------|
| **Logo** | "THUISHAVEN" in bold uppercase display typeface, paired with an ornamental crest/emblem |
| **Vibe** | Warm, inviting, festival culture, slightly vintage but modern |
| **Layout** | Clean and content-focused, generous whitespace, clear hierarchy |

### Color Palette

| Role | Color | Hex | Usage |
|------|-------|-----|-------|
| **Background** | Warm off-white / cream | `#F5F0EB` | Page backgrounds — NOT pure white |
| **Foreground** | Near-black | `#1A1A1A` | Body text, headings |
| **Primary / Accent** | Warm orange | `#E8651A` | CTA buttons (tickets), highlights |
| **Secondary accent** | Festival gold/yellow | `#D4A843` | Event badges, diagonal stripe backgrounds |
| **Muted text** | Warm grey | `#6B6460` | Secondary text, timestamps |
| **Border** | Light warm grey | `#DDD5CC` | Dividers, card borders |
| **Card surface** | White | `#FFFFFF` | Cards sitting on the cream background |
| **Destructive / Alert** | Deep red | `#C41E3A` | Warnings, blocked status |
| **Success** | Forest green | `#2D6A4F` | Confirmed, active states |

### Typography

| Use | Approach |
|-----|----------|
| **Headings** | Bold uppercase, wide letter-spacing — matches the "THUISHAVEN" masthead feel |
| **Body** | Clean sans-serif (Geist fits well as a modern neutral) |
| **Monospace** | Used for BSN, IBAN, timestamps, shift counts |

### Design Patterns (from the website)

1. **Event listings**: Use diagonal gold-striped backgrounds for agenda items — but for the employee form, translate this into subtle warm accents, not literal stripes
2. **Buttons**: Solid fill with rounded corners, warm orange for primary CTAs, outlined for secondary
3. **Sections**: Clear visual separation with generous spacing, light dividers
4. **Cards**: Clean white cards on warm cream backgrounds, subtle shadow or border
5. **Badges**: Small, rounded, color-coded status indicators

---

## Application to Employee Form & Dashboard

### Public Form (`/form`)

- **Background**: Warm cream `#F5F0EB`
- **Form card**: White `#FFFFFF` on cream, subtle border or soft shadow
- **Header**: "THUISHAVEN" in bold display style, can include the crest logo
- **Section headers**: Uppercase, letter-spaced, warm grey
- **Inputs**: Clean borders, warm-toned focus rings (orange)
- **Submit button**: Solid warm orange `#E8651A`, white text
- **Validation errors**: Deep red text
- **Pay calculation section**: Highlighted with a warm gold/yellow background tint
- **Disclaimer section**: Muted, smaller text, warm grey

### HR Dashboard

- **Mode**: Light mode (not dark — HR staff need readability for data work)
- **Sidebar/nav**: Dark background `#1A1A1A` with warm off-white text and orange active indicators
- **Main content area**: Cream background `#F5F0EB`
- **Stat cards**: White with subtle shadow, warm accent colors for icons
- **Tables**: Clean, alternating warm cream/white rows
- **Status badges**:
  - Active/Actief: Forest green `#2D6A4F`
  - Blocked/Geblokkeerd: Deep red `#C41E3A`
  - Warning: Festival gold `#D4A843`
  - Pending: Warm grey `#6B6460`
- **Action buttons**: Orange primary, outlined secondary
- **Alert banner**: Gold background for warnings, red for urgent/blocked

### PDF Output

- Replicate the physical form layout
- "THUISHAVEN" header in bold
- Clean label-value pairs
- Include signature
- Disclaimer text in smaller type
- Branding assets (logo, exact fonts) TBD from client

---

## CSS Custom Properties

```css
:root {
  /* Thuishaven brand */
  --th-cream: #F5F0EB;
  --th-black: #1A1A1A;
  --th-orange: #E8651A;
  --th-gold: #D4A843;
  --th-muted: #6B6460;
  --th-border: #DDD5CC;
  --th-white: #FFFFFF;
  --th-red: #C41E3A;
  --th-green: #2D6A4F;
}
```

---

## Do's and Don'ts

### Do
- Use warm tones throughout — cream, gold, orange
- Keep generous whitespace (the venue brand feels spacious and breathable)
- Use uppercase + letter-spacing for section headers
- Make the form feel inviting and easy (staff fill this on their phone before a shift)
- Use the orange accent sparingly for key actions

### Don't
- Don't use cold blues or greys — doesn't match the brand
- Don't make it feel corporate or clinical
- Don't use pure white (#FFF) as the page background — always warm cream
- Don't overcrowd the form — generous spacing between sections
- Don't use dark mode for the public form (it's used outdoors/in bright environments)

# PAI Statusline Themes

Themeable color schemes for the PAI statusline.

## Quick Start

Change theme in `settings.json`:

```json
{
  "theme": "eldritch/dark"
}
```

Available themes:
- `default/tailwind` - Original PAI colors (Tailwind-based)
- `eldritch/dark` - Vibrant dark theme with cyan/green/purple
- `rosepine/main` - Elegant dark theme with muted pastels
- `rosepine/moon` - Darker variant of Rosé Pine
- `rosepine/dawn` - Light theme for daytime

## Creating a New Theme

1. Copy the template:
   ```bash
   mkdir -p ~/.claude/skills/CORE/USER/STATUSLINE/themes/mytheme
   cp ~/.claude/skills/CORE/USER/STATUSLINE/themes/_template.sh ~/.claude/skills/CORE/USER/STATUSLINE/themes/mytheme/dark.sh
   ```

2. Edit the color values in your new theme file

3. Update `settings.json`:
   ```json
   {
     "theme": "mytheme/dark"
   }
   ```

4. Restart Claude Code to see changes

## Theme Structure

```
themes/
├── _template.sh          # Copy this to create new themes
├── README.md
├── default/
│   └── tailwind.sh       # Original PAI colors
├── eldritch/
│   └── dark.sh
└── rosepine/
    ├── main.sh           # Dark
    ├── moon.sh           # Darker
    └── dawn.sh           # Light
```

## Color Variable Reference

Themes export `SL_*` variables used by the statusline:

### Structural
- `SL_TEXT` - Primary text
- `SL_SUBTLE` - Secondary text
- `SL_MUTED` - Tertiary/disabled text
- `SL_SEPARATOR` - Line separators

### Semantic
- `SL_SUCCESS` - Positive states (green)
- `SL_ERROR` - Negative states (red)
- `SL_WARNING` - Caution states (yellow/orange)
- `SL_INFO` - Informational (blue/cyan)

### PAI Branding
- `SL_PAI_P` - First letter color
- `SL_PAI_A` - Second letter color
- `SL_PAI_I` - Third letter color

### Sections
See `_template.sh` for full list of section-specific variables.

## Color Format

Colors use ANSI 24-bit RGB escape sequences:
```bash
'\033[38;2;R;G;Bm'  # where R,G,B are 0-255
```

Helper to convert hex to ANSI (for use in editor):
```bash
hex_to_ansi() {
  printf "\\033[38;2;%d;%d;%dm" 0x${1:1:2} 0x${1:3:2} 0x${1:5:2}
}
hex_to_ansi "#eb6f92"  # → \033[38;2;235;111;146m
```

## Theme Sources

- **Eldritch**: https://github.com/eldritch-theme
- **Rosé Pine**: https://rosepinetheme.com

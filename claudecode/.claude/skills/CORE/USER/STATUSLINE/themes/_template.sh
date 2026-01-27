#!/bin/bash
# ═══════════════════════════════════════════════════════════════════════════════
# PAI Statusline Theme Template
# ═══════════════════════════════════════════════════════════════════════════════
#
# Copy this file to create a new theme:
#   cp _template.sh mytheme/dark.sh
#
# Then update settings.json:
#   "theme": "mytheme/dark"
#
# Color format: ANSI 24-bit RGB escape sequences
#   '\033[38;2;R;G;Bm' where R,G,B are 0-255
#
# Helper function to convert hex to ANSI (use in your editor, not at runtime):
#   hex_to_ansi() { printf '\033[38;2;%d;%d;%dm' 0x${1:1:2} 0x${1:3:2} 0x${1:5:2}; }
#
# ═══════════════════════════════════════════════════════════════════════════════

# Theme metadata
THEME_NAME="Template"
THEME_VARIANT="dark"  # dark | light
THEME_URL=""
THEME_AUTHOR=""

# ─────────────────────────────────────────────────────────────────────────────
# BASE PALETTE (define your theme's colors here)
# ─────────────────────────────────────────────────────────────────────────────

# Backgrounds (for reference, statusline doesn't use bg colors)
# BASE=""
# SURFACE=""
# OVERLAY=""

# Foreground tones (light to dark for dark themes, dark to light for light themes)
TEXT=''           # Primary text
SUBTLE=''         # Secondary text
MUTED=''          # Tertiary/disabled text

# Accent colors
PRIMARY=''        # Main accent (used for branding, key UI elements)
SECONDARY=''      # Secondary accent
TERTIARY=''       # Third accent color

# Semantic colors
SUCCESS=''        # Positive states (git add, verified, etc.)
ERROR=''          # Negative states (errors, deletions)
WARNING=''        # Warnings, caution states
INFO=''           # Informational

# Extended palette
ACCENT1=''        # Additional accent colors for variety
ACCENT2=''
ACCENT3=''
ACCENT4=''
ACCENT5=''

# ─────────────────────────────────────────────────────────────────────────────
# SEMANTIC MAPPINGS (statusline uses these)
# ─────────────────────────────────────────────────────────────────────────────

# Reset
SL_RESET='\033[0m'

# Structural (chrome, labels, separators)
SL_TEXT="$TEXT"
SL_SUBTLE="$SUBTLE"
SL_MUTED="$MUTED"
SL_SEPARATOR="$MUTED"

# Semantic
SL_SUCCESS="$SUCCESS"
SL_ERROR="$ERROR"
SL_WARNING="$WARNING"
SL_INFO="$INFO"

# PAI Branding (3-color gradient: dark → medium → light)
SL_PAI_P="$PRIMARY"
SL_PAI_A="$SECONDARY"
SL_PAI_I="$TERTIARY"

# Section: Header/Environment
SL_HEADER_LABEL="$MUTED"
SL_HEADER_VALUE="$TEXT"
SL_LOCATION="$TERTIARY"
SL_TIME="$SECONDARY"
SL_WEATHER="$INFO"

# Section: Context bar
SL_CTX_PRIMARY="$PRIMARY"
SL_CTX_SECONDARY="$SECONDARY"
SL_CTX_EMPTY="$MUTED"
# Context gradient colors (green → yellow → orange → red)
SL_CTX_LOW="$SUCCESS"
SL_CTX_MED='\033[38;2;250;204;21m'      # Yellow
SL_CTX_HIGH='\033[38;2;251;146;60m'     # Orange
SL_CTX_CRITICAL="$ERROR"

# Section: Git/PWD
SL_GIT_PRIMARY="$SECONDARY"
SL_GIT_VALUE="$TERTIARY"
SL_GIT_DIR="$TEXT"
SL_GIT_CLEAN="$SUCCESS"
SL_GIT_MODIFIED="$WARNING"
SL_GIT_ADDED="$INFO"
SL_GIT_STASH="$ACCENT1"
SL_GIT_AGE_FRESH="$SUCCESS"
SL_GIT_AGE_RECENT="$SECONDARY"
SL_GIT_AGE_STALE="$WARNING"
SL_GIT_AGE_OLD="$ERROR"

# Section: Memory
SL_MEM_PRIMARY="$ACCENT1"
SL_MEM_SECONDARY="$ACCENT2"
SL_MEM_WORK="$ACCENT3"
SL_MEM_SIGNALS="$ACCENT4"
SL_MEM_SESSIONS="$ACCENT5"
SL_MEM_RESEARCH="$PRIMARY"

# Section: Learning/Ratings
SL_LEARN_LABEL="$SUCCESS"
SL_LEARN_PERIOD="$MUTED"

# Rating gradient (1-10 scale)
SL_RATING_10="$SUCCESS"
SL_RATING_8='\033[38;2;163;230;53m'     # Lime
SL_RATING_7='\033[38;2;250;204;21m'     # Yellow
SL_RATING_6='\033[38;2;251;191;36m'     # Amber
SL_RATING_5='\033[38;2;251;146;60m'     # Orange
SL_RATING_4='\033[38;2;248;113;113m'    # Light red
SL_RATING_LOW="$ERROR"

# Section: Quote
SL_QUOTE_PRIMARY="$WARNING"
SL_QUOTE_AUTHOR="$MUTED"

# Export all SL_ variables
export SL_RESET SL_TEXT SL_SUBTLE SL_MUTED SL_SEPARATOR
export SL_SUCCESS SL_ERROR SL_WARNING SL_INFO
export SL_PAI_P SL_PAI_A SL_PAI_I
export SL_HEADER_LABEL SL_HEADER_VALUE SL_LOCATION SL_TIME SL_WEATHER
export SL_CTX_PRIMARY SL_CTX_SECONDARY SL_CTX_EMPTY
export SL_CTX_LOW SL_CTX_MED SL_CTX_HIGH SL_CTX_CRITICAL
export SL_GIT_PRIMARY SL_GIT_VALUE SL_GIT_DIR SL_GIT_CLEAN SL_GIT_MODIFIED
export SL_GIT_ADDED SL_GIT_STASH SL_GIT_AGE_FRESH SL_GIT_AGE_RECENT
export SL_GIT_AGE_STALE SL_GIT_AGE_OLD
export SL_MEM_PRIMARY SL_MEM_SECONDARY SL_MEM_WORK SL_MEM_SIGNALS
export SL_MEM_SESSIONS SL_MEM_RESEARCH
export SL_LEARN_LABEL SL_LEARN_PERIOD
export SL_RATING_10 SL_RATING_8 SL_RATING_7 SL_RATING_6
export SL_RATING_5 SL_RATING_4 SL_RATING_LOW
export SL_QUOTE_PRIMARY SL_QUOTE_AUTHOR

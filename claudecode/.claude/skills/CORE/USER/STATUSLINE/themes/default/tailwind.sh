#!/bin/bash
# ═══════════════════════════════════════════════════════════════════════════════
# Default Theme - Tailwind
# ═══════════════════════════════════════════════════════════════════════════════
# The original PAI statusline colors based on Tailwind CSS palette
# This is the fallback/default theme
# ═══════════════════════════════════════════════════════════════════════════════

THEME_NAME="Tailwind"
THEME_VARIANT="dark"
THEME_URL="https://tailwindcss.com/docs/customizing-colors"

# ─────────────────────────────────────────────────────────────────────────────
# BASE PALETTE (Tailwind-inspired)
# ─────────────────────────────────────────────────────────────────────────────

# Slate tones (structural)
SLATE_300='\033[38;2;203;213;225m'      # Light text/values
SLATE_400='\033[38;2;148;163;184m'      # Labels
SLATE_500='\033[38;2;100;116;139m'      # Muted text
SLATE_600='\033[38;2;71;85;105m'        # Separators

# Semantic colors
EMERALD='\033[38;2;74;222;128m'         # Success/positive
ROSE='\033[38;2;251;113;133m'           # Error/negative

# Blues (PAI branding)
BLUE_900='\033[38;2;30;58;138m'         # Navy (P)
BLUE_500='\033[38;2;59;130;246m'        # Medium blue (A)
BLUE_300='\033[38;2;147;197;253m'       # Light blue (I)
BLUE_400='\033[38;2;96;165;250m'        # Time
SKY_300='\033[38;2;125;211;252m'        # Weather/fresh
SKY_400='\033[38;2;56;189;248m'         # Primary accent

# Purples (violet theme)
VIOLET_400='\033[38;2;167;139;250m'     # Primary violet
VIOLET_500='\033[38;2;139;92;246m'      # Secondary violet
VIOLET_300='\033[38;2;196;181;253m'     # Light violet

# Cyans (wielding theme)
CYAN_400='\033[38;2;34;211;238m'        # Primary cyan
TEAL_400='\033[38;2;45;212;191m'        # Secondary teal
CYAN_300='\033[38;2;103;232;249m'       # Light cyan
TEAL_300='\033[38;2;94;234;212m'        # Workflows
CYAN_500='\033[38;2;6;182;212m'         # Hooks
TEAL_500='\033[38;2;20;184;166m'        # Learnings

# Indigo (context theme)
INDIGO_400='\033[38;2;129;140;248m'     # Context primary
INDIGO_300='\033[38;2;165;180;252m'     # Context secondary

# Yellows/Golds
YELLOW_300='\033[38;2;252;211;77m'      # Quote
AMBER_600='\033[38;2;180;140;60m'       # Quote author

# Greens
GREEN_700='\033[38;2;21;128;61m'        # Learning label

# ─────────────────────────────────────────────────────────────────────────────
# SEMANTIC MAPPINGS
# ─────────────────────────────────────────────────────────────────────────────

SL_RESET='\033[0m'

# Structural
SL_TEXT="$SLATE_300"
SL_SUBTLE="$SLATE_400"
SL_MUTED="$SLATE_500"
SL_SEPARATOR="$SLATE_600"

# Semantic
SL_SUCCESS="$EMERALD"
SL_ERROR="$ROSE"
SL_WARNING='\033[38;2;251;191;36m'      # Amber
SL_INFO="$SKY_400"

# PAI Branding
SL_PAI_P="$BLUE_900"
SL_PAI_A="$BLUE_500"
SL_PAI_I="$BLUE_300"

# Header/Environment
SL_HEADER_LABEL="$SLATE_500"
SL_HEADER_VALUE="$SLATE_300"
SL_LOCATION="$BLUE_300"
SL_TIME="$BLUE_400"
SL_WEATHER='\033[38;2;135;206;235m'     # Sky blue

# Context bar
SL_CTX_PRIMARY="$INDIGO_400"
SL_CTX_SECONDARY="$INDIGO_300"
SL_CTX_EMPTY='\033[38;2;75;82;95m'      # Dark slate
SL_CTX_LOW="$EMERALD"
SL_CTX_MED='\033[38;2;250;204;21m'      # Yellow
SL_CTX_HIGH='\033[38;2;251;146;60m'     # Orange
SL_CTX_CRITICAL="$ROSE"

# Git/PWD
SL_GIT_PRIMARY="$SKY_400"
SL_GIT_VALUE='\033[38;2;186;230;253m'   # Sky 200
SL_GIT_DIR="$BLUE_300"
SL_GIT_CLEAN="$SKY_300"
SL_GIT_MODIFIED="$BLUE_400"
SL_GIT_ADDED="$BLUE_500"
SL_GIT_STASH="$INDIGO_300"
SL_GIT_AGE_FRESH="$SKY_300"
SL_GIT_AGE_RECENT="$BLUE_400"
SL_GIT_AGE_STALE="$BLUE_500"
SL_GIT_AGE_OLD='\033[38;2;99;102;241m'  # Indigo

# Memory
SL_MEM_PRIMARY="$VIOLET_400"
SL_MEM_SECONDARY="$VIOLET_300"
SL_MEM_WORK='\033[38;2;192;132;252m'    # Purple 400
SL_MEM_SIGNALS="$VIOLET_500"
SL_MEM_SESSIONS='\033[38;2;99;102;241m' # Indigo 500
SL_MEM_RESEARCH="$INDIGO_400"

# Learning/Ratings
SL_LEARN_LABEL="$GREEN_700"
SL_LEARN_PERIOD="$SLATE_400"
SL_RATING_10="$EMERALD"
SL_RATING_8='\033[38;2;163;230;53m'     # Lime
SL_RATING_7='\033[38;2;250;204;21m'     # Yellow
SL_RATING_6='\033[38;2;251;191;36m'     # Amber
SL_RATING_5='\033[38;2;251;146;60m'     # Orange
SL_RATING_4='\033[38;2;248;113;113m'    # Light red
SL_RATING_LOW='\033[38;2;239;68;68m'    # Red

# Quote
SL_QUOTE_PRIMARY="$YELLOW_300"
SL_QUOTE_AUTHOR="$AMBER_600"

# ─────────────────────────────────────────────────────────────────────────────
# EXPORTS
# ─────────────────────────────────────────────────────────────────────────────

export THEME_NAME THEME_VARIANT THEME_URL
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

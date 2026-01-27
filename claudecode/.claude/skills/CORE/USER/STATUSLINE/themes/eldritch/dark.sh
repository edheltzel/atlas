#!/bin/bash
# ═══════════════════════════════════════════════════════════════════════════════
# Eldritch Theme - Dark
# ═══════════════════════════════════════════════════════════════════════════════
# A dark, vibrant theme inspired by Lovecraftian horror
# https://github.com/eldritch-theme
# ═══════════════════════════════════════════════════════════════════════════════

THEME_NAME="Eldritch"
THEME_VARIANT="dark"
THEME_URL="https://github.com/eldritch-theme"

# ─────────────────────────────────────────────────────────────────────────────
# BASE PALETTE
# ─────────────────────────────────────────────────────────────────────────────
# bg:          #212337
# bg_dark:     #171928
# fg:          #ebfafa
# fg_dark:     #ABB4DA

# Primary colors
# cyan:        #04d1f9
# green:       #37f499
# purple:      #a48cf2
# pink:        #f265b5
# orange:      #f7c67f
# yellow:      #f1fc79
# red:         #f16c75
# comment:     #7081d0

# ─────────────────────────────────────────────────────────────────────────────
# ANSI COLOR DEFINITIONS
# ─────────────────────────────────────────────────────────────────────────────

# Foreground tones
TEXT='\033[38;2;235;250;250m'           # #ebfafa - Primary text
SUBTLE='\033[38;2;171;180;218m'         # #ABB4DA - Secondary text
MUTED='\033[38;2;112;129;208m'          # #7081d0 - Comment/muted

# Accent colors
CYAN='\033[38;2;4;209;249m'             # #04d1f9 - Primary cyan
BRIGHT_CYAN='\033[38;2;57;221;253m'     # #39DDFD - Bright cyan
GREEN='\033[38;2;55;244;153m'           # #37f499 - Primary green
PURPLE='\033[38;2;164;140;242m'         # #a48cf2 - Primary purple
PINK='\033[38;2;242;101;181m'           # #f265b5 - Pink
ORANGE='\033[38;2;247;198;127m'         # #f7c67f - Orange
YELLOW='\033[38;2;241;252;121m'         # #f1fc79 - Yellow
RED='\033[38;2;241;108;117m'            # #f16c75 - Red
BRIGHT_RED='\033[38;2;240;49;62m'       # #f0313e - Bright red

# Dark variants
DARK_CYAN='\033[38;2;16;161;189m'       # #10A1BD
DARK_GREEN='\033[38;2;51;197;127m'      # #33C57F
DARK_PURPLE='\033[38;2;100;115;183m'    # #6473B7
GUTTER='\033[38;2;59;66;97m'            # #3b4261

# ─────────────────────────────────────────────────────────────────────────────
# SEMANTIC MAPPINGS
# ─────────────────────────────────────────────────────────────────────────────

SL_RESET='\033[0m'

# Structural
SL_TEXT="$TEXT"
SL_SUBTLE="$SUBTLE"
SL_MUTED="$MUTED"
SL_SEPARATOR="$GUTTER"

# Semantic
SL_SUCCESS="$GREEN"
SL_ERROR="$RED"
SL_WARNING="$YELLOW"
SL_INFO="$CYAN"

# PAI Branding (purple → cyan → bright cyan)
SL_PAI_P="$PURPLE"
SL_PAI_A="$CYAN"
SL_PAI_I="$BRIGHT_CYAN"

# Header/Environment
SL_HEADER_LABEL="$MUTED"
SL_HEADER_VALUE="$TEXT"
SL_LOCATION="$BRIGHT_CYAN"
SL_TIME="$CYAN"
SL_WEATHER="$ORANGE"

# Context bar
SL_CTX_PRIMARY="$PURPLE"
SL_CTX_SECONDARY="$PINK"
SL_CTX_EMPTY="$GUTTER"
SL_CTX_LOW="$GREEN"
SL_CTX_MED="$YELLOW"
SL_CTX_HIGH="$ORANGE"
SL_CTX_CRITICAL="$RED"

# Git/PWD
SL_GIT_PRIMARY="$CYAN"
SL_GIT_VALUE="$BRIGHT_CYAN"
SL_GIT_DIR="$TEXT"
SL_GIT_CLEAN="$GREEN"
SL_GIT_MODIFIED="$YELLOW"
SL_GIT_ADDED="$CYAN"
SL_GIT_STASH="$PURPLE"
SL_GIT_AGE_FRESH="$GREEN"
SL_GIT_AGE_RECENT="$CYAN"
SL_GIT_AGE_STALE="$ORANGE"
SL_GIT_AGE_OLD="$RED"

# Memory
SL_MEM_PRIMARY="$PURPLE"
SL_MEM_SECONDARY="$PINK"
SL_MEM_WORK="$ORANGE"
SL_MEM_SIGNALS="$YELLOW"
SL_MEM_SESSIONS="$CYAN"
SL_MEM_RESEARCH="$GREEN"

# Learning/Ratings
SL_LEARN_LABEL="$GREEN"
SL_LEARN_PERIOD="$MUTED"
SL_RATING_10="$GREEN"
SL_RATING_8='\033[38;2;163;230;53m'     # Lime (between green and yellow)
SL_RATING_7="$YELLOW"
SL_RATING_6="$ORANGE"
SL_RATING_5='\033[38;2;251;146;60m'     # Orange-red
SL_RATING_4='\033[38;2;248;113;113m'    # Light red
SL_RATING_LOW="$BRIGHT_RED"

# Quote
SL_QUOTE_PRIMARY="$YELLOW"
SL_QUOTE_AUTHOR="$MUTED"

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

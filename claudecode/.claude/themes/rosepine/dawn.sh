#!/bin/bash
# ═══════════════════════════════════════════════════════════════════════════════
# Rosé Pine Theme - Dawn (Light)
# ═══════════════════════════════════════════════════════════════════════════════
# All natural pine, faux fur and a bit of soho vibes for the classy minimalist
# Dawn variant - light theme for daytime use
# https://rosepinetheme.com
# ═══════════════════════════════════════════════════════════════════════════════

THEME_NAME="Rosé Pine Dawn"
THEME_VARIANT="light"
THEME_URL="https://rosepinetheme.com"

# ─────────────────────────────────────────────────────────────────────────────
# BASE PALETTE (Dawn - Light)
# ─────────────────────────────────────────────────────────────────────────────
# Base:    #faf4ed (light cream)
# Surface: #fffaf3 (lighter)
# Overlay: #f2e9e1 (warm gray)
# Muted:   #9893a5 (medium gray)
# Subtle:  #797593 (darker gray)
# Text:    #464261 (dark purple-gray)
# Highlight: #dfdad9 (light gray)
#
# Love:    #b4637a (muted red)
# Gold:    #ea9d34 (orange)
# Rose:    #d7827e (coral)
# Pine:    #286983 (teal)
# Foam:    #56949f (cyan)
# Iris:    #907aa9 (purple)

# ─────────────────────────────────────────────────────────────────────────────
# ANSI COLOR DEFINITIONS
# ─────────────────────────────────────────────────────────────────────────────

# Foreground tones (inverted for light theme - dark text on light bg)
TEXT='\033[38;2;70;66;97m'      # #464261 - Primary text (dark)
SUBTLE='\033[38;2;121;117;147m' # #797593 - Secondary text
MUTED='\033[38;2;152;147;165m'  # #9893a5 - Muted text

# Surface tones
OVERLAY='\033[38;2;242;233;225m'   # #f2e9e1
HIGHLIGHT='\033[38;2;223;218;217m' # #dfdad9

# Accent colors (all darker/more saturated for light backgrounds)
LOVE='\033[38;2;180;99;122m'  # #b4637a - Muted red
GOLD='\033[38;2;234;157;52m'  # #ea9d34 - Orange
ROSE='\033[38;2;215;130;126m' # #d7827e - Coral
PINE='\033[38;2;40;105;131m'  # #286983 - Teal
FOAM='\033[38;2;86;148;159m'  # #56949f - Cyan
IRIS='\033[38;2;144;122;169m' # #907aa9 - Purple

# ─────────────────────────────────────────────────────────────────────────────
# SEMANTIC MAPPINGS
# ─────────────────────────────────────────────────────────────────────────────

SL_RESET='\033[0m'

# Structural (darker values for light theme)
SL_TEXT="$TEXT"
SL_SUBTLE="$SUBTLE"
SL_MUTED="$MUTED"
SL_SEPARATOR="$OVERLAY"

# Semantic
SL_SUCCESS="$FOAM"
SL_ERROR="$LOVE"
SL_WARNING="$GOLD"
SL_INFO="$PINE"

# PAI Branding (pine → foam → rose)
SL_PAI_P="$PINE"
SL_PAI_A="$FOAM"
SL_PAI_I="$ROSE"

# Header/Environment
SL_HEADER_LABEL="$MUTED"
SL_HEADER_VALUE="$TEXT"
SL_LOCATION="$ROSE"
SL_TIME="$FOAM"
SL_WEATHER="$GOLD"

# Context bar
SL_CTX_PRIMARY="$IRIS"
SL_CTX_SECONDARY="$ROSE"
SL_CTX_EMPTY="$HIGHLIGHT"
SL_CTX_LOW="$FOAM"
SL_CTX_MED="$GOLD"
SL_CTX_HIGH='\033[38;2;200;130;60m' # Darker gold/orange
SL_CTX_CRITICAL="$LOVE"

# Git/PWD
SL_GIT_PRIMARY="$PINE"
SL_GIT_VALUE="$FOAM"
SL_GIT_DIR="$TEXT"
SL_GIT_CLEAN="$FOAM"
SL_GIT_MODIFIED="$GOLD"
SL_GIT_ADDED="$PINE"
SL_GIT_STASH="$IRIS"
SL_GIT_AGE_FRESH="$FOAM"
SL_GIT_AGE_RECENT="$PINE"
SL_GIT_AGE_STALE="$GOLD"
SL_GIT_AGE_OLD="$LOVE"

# Memory
SL_MEM_PRIMARY="$IRIS"
SL_MEM_SECONDARY="$ROSE"
SL_MEM_WORK="$GOLD"
SL_MEM_SIGNALS="$LOVE"
SL_MEM_SESSIONS="$PINE"
SL_MEM_RESEARCH="$FOAM"

# Learning/Ratings
SL_LEARN_LABEL="$PINE"
SL_LEARN_PERIOD="$MUTED"
SL_RATING_10="$FOAM"
SL_RATING_8='\033[38;2;86;148;130m' # Foam-ish green
SL_RATING_7="$GOLD"
SL_RATING_6='\033[38;2;210;140;80m'  # Gold-orange
SL_RATING_5='\033[38;2;200;120;110m' # Rose-orange
SL_RATING_4='\033[38;2;190;100;115m' # Rose-love
SL_RATING_LOW="$LOVE"

# Quote
SL_QUOTE_PRIMARY="$GOLD"
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

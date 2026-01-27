#!/bin/bash
# ═══════════════════════════════════════════════════════════════════════════════
# Rosé Pine Theme - Main (Dark)
# ═══════════════════════════════════════════════════════════════════════════════
# All natural pine, faux fur and a bit of soho vibes for the classy minimalist
# https://rosepinetheme.com
# ═══════════════════════════════════════════════════════════════════════════════

THEME_NAME="Rosé Pine"
THEME_VARIANT="dark"
THEME_URL="https://rosepinetheme.com"

# ─────────────────────────────────────────────────────────────────────────────
# BASE PALETTE
# ─────────────────────────────────────────────────────────────────────────────
# Base:    #191724
# Surface: #1f1d2e
# Overlay: #26233a
# Muted:   #6e6a86
# Subtle:  #908caa
# Text:    #e0def4
#
# Love:    #eb6f92 (red/pink)
# Gold:    #f6c177 (yellow/orange)
# Rose:    #ebbcba (pink/salmon)
# Pine:    #31748f (teal/cyan)
# Foam:    #9ccfd8 (light cyan)
# Iris:    #c4a7e7 (purple)

# ─────────────────────────────────────────────────────────────────────────────
# ANSI COLOR DEFINITIONS
# ─────────────────────────────────────────────────────────────────────────────

# Foreground tones
TEXT='\033[38;2;224;222;244m'           # #e0def4 - Primary text
SUBTLE='\033[38;2;144;140;170m'         # #908caa - Secondary text
MUTED='\033[38;2;110;106;134m'          # #6e6a86 - Muted text

# Surface tones (for reference)
OVERLAY='\033[38;2;38;35;58m'           # #26233a

# Accent colors
LOVE='\033[38;2;235;111;146m'           # #eb6f92 - Red/Pink
GOLD='\033[38;2;246;193;119m'           # #f6c177 - Yellow/Orange
ROSE='\033[38;2;235;188;186m'           # #ebbcba - Pink/Salmon
PINE='\033[38;2;49;116;143m'            # #31748f - Teal
FOAM='\033[38;2;156;207;216m'           # #9ccfd8 - Light cyan
IRIS='\033[38;2;196;167;231m'           # #c4a7e7 - Purple

# ─────────────────────────────────────────────────────────────────────────────
# SEMANTIC MAPPINGS
# ─────────────────────────────────────────────────────────────────────────────

SL_RESET='\033[0m'

# Structural
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
SL_CTX_EMPTY="$OVERLAY"
SL_CTX_LOW="$FOAM"
SL_CTX_MED="$GOLD"
SL_CTX_HIGH='\033[38;2;234;154;72m'     # Darker gold/orange
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
SL_RATING_8='\033[38;2;156;207;180m'    # Foam-ish green
SL_RATING_7="$GOLD"
SL_RATING_6='\033[38;2;240;170;100m'    # Gold-orange
SL_RATING_5='\033[38;2;235;140;130m'    # Rose-orange
SL_RATING_4='\033[38;2;235;120;140m'    # Rose-love
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

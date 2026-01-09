#!/bin/bash
# Status Line Style Configuration - Eldritch Theme
# https://github.com/eldritch-theme

# Reset
COLOR_RESET=$'\e[0m'

# Segment colors (Eldritch palette - true color)
VERSION_FG=$'\e[38;2;112;129;208m'    # The Old One Purple #7081d0
MODEL_FG=$'\e[38;2;4;209;249m'        # Watery Tomb Blue #04d1f9
CACHE_FG=$'\e[38;2;164;140;242m'      # Lovecraft Purple #a48cf2
CWD_FG=$'\e[38;2;242;101;181m'        # Pustule Pink #f265b5

# Context colors (dynamic)
CONTEXT_OK_FG=$'\e[38;2;55;244;153m'    # Great Old One Green #37f499
CONTEXT_WARN_FG=$'\e[38;2;247;198;127m' # Dreaming Orange #f7c67f
CONTEXT_CRIT_FG=$'\e[38;2;241;108;117m' # R'lyeh Red #f16c75

# Separator
SEP_FG=$'\e[38;2;50;52;73m'        # Shallow Depths Grey #323449
SEP="│"

# Nerd Font Icons
ICON_MODEL="󰚩"
ICON_FOLDER=""
ICON_CONTEXT=""
ICON_VERSION=""
ICON_CACHE=""

# Cycle usage colors (reuse context colors for consistency)
CYCLE_OK_FG=$'\e[38;2;55;244;153m'      # Great Old One Green #37f499
CYCLE_WARN_FG=$'\e[38;2;247;198;127m'   # Dreaming Orange #f7c67f
CYCLE_CRIT_FG=$'\e[38;2;241;108;117m'   # R'lyeh Red #f16c75
CYCLE_RESET_FG=$'\e[38;2;235;250;250m'  # Lighthouse White #ebfafa

# Cycle icons
ICON_CYCLE="󱀋"
ICON_RESET="󰔟"

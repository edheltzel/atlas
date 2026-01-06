#!/bin/bash
# Status Line Style Configuration - Minimal Theme

# Reset
COLOR_RESET=$'\e[0m'

# Segment colors (text only, no backgrounds)
VERSION_FG=$'\e[38;5;244m'    # Gray
MODEL_FG=$'\e[38;5;69m'       # Blue
CACHE_FG=$'\e[38;5;80m'       # Cyan
CWD_FG=$'\e[38;5;176m'        # Magenta

# Context colors (dynamic)
CONTEXT_OK_FG=$'\e[38;5;114m'    # Green
CONTEXT_WARN_FG=$'\e[38;5;215m'  # Orange
CONTEXT_CRIT_FG=$'\e[38;5;203m'  # Red

# Separator
SEP_FG=$'\e[38;5;240m'        # Dim gray
SEP="│"

# Nerd Font Icons
ICON_MODEL="󰚩"
ICON_FOLDER=""
ICON_CONTEXT=""
ICON_VERSION=""
ICON_CACHE=""

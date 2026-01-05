#!/bin/bash
# Status Line Style Configuration - Powerline Theme

# Reset
COLOR_RESET=$'\e[0m'

# Foreground colors
FG_WHITE=$'\e[97m'
FG_BLACK=$'\e[30m'
FG_CYAN=$'\e[96m'

# Background colors (256-color)
BG_DARK=$'\e[48;5;236m'
BG_BLUE=$'\e[48;5;69m'
BG_GREEN=$'\e[48;5;114m'
BG_ORANGE=$'\e[48;5;215m'
BG_RED=$'\e[48;5;203m'
BG_CYAN=$'\e[48;5;80m'
BG_MAGENTA=$'\e[48;5;176m'

# Foreground for transitions
FG_DARK=$'\e[38;5;236m'
FG_BLUE_BG=$'\e[38;5;69m'
FG_GREEN_BG=$'\e[38;5;114m'
FG_ORANGE_BG=$'\e[38;5;215m'
FG_RED_BG=$'\e[38;5;203m'
FG_CYAN_BG=$'\e[38;5;80m'
FG_MAGENTA_BG=$'\e[38;5;176m'

# Powerline separator (U+E0B0)
PL_SEP=""

# Nerd Font Icons
ICON_MODEL="󰚩"    # U+F06A9 - robot
ICON_FOLDER=""   # U+F07C - folder open
ICON_CONTEXT="" # U+F0E7 - lightning bolt
ICON_VERSION=""  # U+F412 - tag
ICON_CACHE=""   # U+F0C7 - save/cache

# Segment colors
VERSION_BG="$BG_DARK"
VERSION_FG="$FG_CYAN"
VERSION_SEP_FG="$FG_DARK"

MODEL_BG="$BG_BLUE"
MODEL_FG="$FG_BLACK"
MODEL_SEP_FG="$FG_BLUE_BG"

CACHE_BG="$BG_CYAN"
CACHE_FG="$FG_BLACK"
CACHE_SEP_FG="$FG_CYAN_BG"

CWD_BG="$BG_MAGENTA"
CWD_FG="$FG_BLACK"
CWD_SEP_FG="$FG_MAGENTA_BG"

# Context colors (dynamic)
CONTEXT_OK_BG="$BG_GREEN"
CONTEXT_OK_FG="$FG_BLACK"
CONTEXT_OK_SEP="$FG_GREEN_BG"

CONTEXT_WARN_BG="$BG_ORANGE"
CONTEXT_WARN_FG="$FG_BLACK"
CONTEXT_WARN_SEP="$FG_ORANGE_BG"

CONTEXT_CRIT_BG="$BG_RED"
CONTEXT_CRIT_FG="$FG_WHITE"
CONTEXT_CRIT_SEP="$FG_RED_BG"

#!/usr/bin/env bash
# Phase 5: Build script for compiling voice hooks to native binaries
#
# Usage:
#   ./build.sh          # Build all hooks
#   ./build.sh clean    # Remove binaries
#   ./build.sh test     # Build and run tests
#
# Benefits:
#   - Faster cold starts (no TypeScript parsing)
#   - Self-contained executables
#   - Distributable without Bun installed

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BIN_DIR="$SCRIPT_DIR/bin"

# Hooks to compile
HOOKS=(
  "stop-hook-voice"
  "subagent-stop-hook-voice"
)

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

build_hook() {
  local hook=$1
  local source="$SCRIPT_DIR/${hook}.ts"
  local output="$BIN_DIR/${hook}"

  if [[ ! -f "$source" ]]; then
    echo -e "${RED}Error: Source file not found: $source${NC}"
    return 1
  fi

  echo -e "${YELLOW}Building: ${hook}${NC}"
  bun build --compile "$source" --outfile "$output"

  if [[ -f "$output" ]]; then
    local size=$(du -h "$output" | cut -f1)
    echo -e "${GREEN}✓ Built: $output ($size)${NC}"
  else
    echo -e "${RED}✗ Failed to build: $hook${NC}"
    return 1
  fi
}

build_all() {
  echo "🔨 Building voice hook binaries..."
  echo ""

  mkdir -p "$BIN_DIR"

  for hook in "${HOOKS[@]}"; do
    build_hook "$hook"
    echo ""
  done

  echo -e "${GREEN}✅ All hooks built successfully${NC}"
  echo ""
  echo "Binary location: $BIN_DIR"
  echo ""
  echo "To use compiled binaries, update your hooks config:"
  echo "  Stop:         $BIN_DIR/stop-hook-voice"
  echo "  SubagentStop: $BIN_DIR/subagent-stop-hook-voice"
}

clean() {
  echo "🧹 Cleaning build artifacts..."

  if [[ -d "$BIN_DIR" ]]; then
    rm -rf "$BIN_DIR"
    echo -e "${GREEN}✓ Removed: $BIN_DIR${NC}"
  else
    echo "Nothing to clean"
  fi
}

test_binaries() {
  echo "🧪 Testing compiled binaries..."
  echo ""

  local failed=0

  for hook in "${HOOKS[@]}"; do
    local binary="$BIN_DIR/${hook}"

    if [[ ! -f "$binary" ]]; then
      echo -e "${YELLOW}Building $hook first...${NC}"
      build_hook "$hook"
    fi

    echo -n "Testing $hook: "

    # Test that binary runs and exits cleanly
    if echo '{}' | timeout 5 "$binary" > /dev/null 2>&1; then
      # Measure startup time
      local start=$(date +%s%N)
      echo '{}' | "$binary" > /dev/null 2>&1
      local end=$(date +%s%N)
      local duration=$(( (end - start) / 1000000 ))

      if [[ $duration -lt 50 ]]; then
        echo -e "${GREEN}✓ ${duration}ms (target <50ms)${NC}"
      else
        echo -e "${YELLOW}⚠ ${duration}ms (target <50ms)${NC}"
      fi
    else
      echo -e "${RED}✗ Failed to execute${NC}"
      ((failed++))
    fi
  done

  echo ""
  if [[ $failed -eq 0 ]]; then
    echo -e "${GREEN}✅ All tests passed${NC}"
  else
    echo -e "${RED}❌ $failed test(s) failed${NC}"
    return 1
  fi
}

benchmark() {
  echo "📊 Benchmarking: interpreted vs compiled"
  echo ""

  for hook in "${HOOKS[@]}"; do
    local source="$SCRIPT_DIR/${hook}.ts"
    local binary="$BIN_DIR/${hook}"

    if [[ ! -f "$binary" ]]; then
      build_hook "$hook" > /dev/null 2>&1
    fi

    echo "Hook: $hook"

    # Interpreted
    local int_total=0
    for i in {1..5}; do
      local start=$(date +%s%N)
      echo '{}' | bun run "$source" > /dev/null 2>&1
      local end=$(date +%s%N)
      int_total=$((int_total + (end - start) / 1000000))
    done
    local int_avg=$((int_total / 5))

    # Compiled
    local bin_total=0
    for i in {1..5}; do
      local start=$(date +%s%N)
      echo '{}' | "$binary" > /dev/null 2>&1
      local end=$(date +%s%N)
      bin_total=$((bin_total + (end - start) / 1000000))
    done
    local bin_avg=$((bin_total / 5))

    echo "  Interpreted: ${int_avg}ms (avg of 5)"
    echo "  Compiled:    ${bin_avg}ms (avg of 5)"

    if [[ $bin_avg -lt $int_avg ]]; then
      local improvement=$((int_avg - bin_avg))
      echo -e "  ${GREEN}Improvement: ${improvement}ms faster${NC}"
    else
      echo -e "  ${YELLOW}No significant improvement${NC}"
    fi
    echo ""
  done
}

# Main
case "${1:-build}" in
  build)
    build_all
    ;;
  clean)
    clean
    ;;
  test)
    test_binaries
    ;;
  benchmark)
    benchmark
    ;;
  *)
    echo "Usage: $0 {build|clean|test|benchmark}"
    exit 1
    ;;
esac

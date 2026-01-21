STOW_PACKAGES := claudecode opencode
YELLOW := \033[33m
GREEN := \033[32m
WHITE := \033[37m
CYAN := \033[36m
CLR := \033[0m

.PHONY: default
default: help

.PHONY: help
help: ## Show this help message (default)
	@awk 'BEGIN {FS = ":.*?## "}; \
		/^[^\t][a-zA-Z0-9_-]+:.*?##/ \
		{ printf "$(CYAN)%-24s$(CLR) %s\n", $$1, $$2 } \
		/^##/ { printf "$(YELLOW)%s$(CLR)\n", substr($$0, 4) }' $(MAKEFILE_LIST)

.PHONY: install
install: ## Bootstrap Atlas (symlinks + dependencies)
	@echo "$(YELLOW)Running Atlas installer...$(CLR)"
	@./install.sh
	@echo "$(GREEN)Atlas installation complete!$(CLR)"

.PHONY: run
run: ## Symlink all packages w/Stow
	@for pkg in $(STOW_PACKAGES); do \
		stow $$pkg; \
	done
	@echo "$(GREEN)Atlas packages stowed successfully$(CLR)"

.PHONY: stow add
stow: ## Add individual package w/Stow (pkg=claudecode|opencode)
	@if [ -z "${pkg}" ]; then \
		echo "Error: Please specify a package to stow. \n$(YELLOW)ie: make stow pkg=<packageName>$(CLR) \n$(WHITE)Available packages:$(CLR) $(STOW_PACKAGES)"; \
		exit 1; \
	fi
	@if [[ ! " ${STOW_PACKAGES} " =~ " ${pkg} " ]]; then \
		echo "Error: Package '${pkg}' not found in STOW_PACKAGES: $(STOW_PACKAGES)"; \
		exit 1; \
	fi
	stow ${pkg}
	@echo "$(GREEN)${pkg} was added$(CLR)"

.PHONY: unstow remove
unstow: ## Remove individual package w/Stow (pkg=claudecode|opencode)
	@if [ -z "${pkg}" ]; then \
		echo "Error: Please specify a package to unstow. \n$(YELLOW)ie: make unstow pkg=<packageName>$(CLR) \n$(WHITE)Available packages:$(CLR) $(STOW_PACKAGES)"; \
		exit 1; \
	fi
	@if [[ ! " ${STOW_PACKAGES} " =~ " ${pkg} " ]]; then \
		echo "Error: Package '${pkg}' not found in STOW_PACKAGES: $(STOW_PACKAGES)"; \
		exit 1; \
	fi
	stow --delete ${pkg}
	@echo "$(WHITE)${pkg} was removed$(CLR)"

.PHONY: update up
update: ## Update all Atlas packages (restow)
	@for pkg in $(STOW_PACKAGES); do \
		stow --restow $$pkg; \
	done
	@echo "$(GREEN)Atlas packages updated successfully$(CLR)"

.PHONY: delete
delete: ## Delete all symlinks w/Stow
	@for pkg in $(STOW_PACKAGES); do \
		stow --delete $$pkg; \
	done
	@echo "$(WHITE)Atlas symlinks removed$(CLR)"

.PHONY: deps
deps: ## Install dependencies (voice server, browser skill)
	@echo "$(YELLOW)Installing dependencies...$(CLR)"
	@if [ -f ".claude/voice/package.json" ]; then \
		cd .claude/voice && bun install; \
		echo "  $(GREEN)Voice server dependencies$(CLR)"; \
	fi
	@if [ -f ".claude/skills/Browser/package.json" ]; then \
		cd .claude/skills/Browser && bun install; \
		echo "  $(GREEN)Browser skill dependencies$(CLR)"; \
	fi
	@echo "$(GREEN)Dependencies installed$(CLR)"

.PHONY: status
status: ## Show current stow status
	@echo "$(YELLOW)Checking symlink status...$(CLR)"
	@if [ -L "$$HOME/.claude" ]; then \
		echo "  $(GREEN)~/.claude$(CLR) -> $$(readlink $$HOME/.claude)"; \
	elif [ -d "$$HOME/.claude" ]; then \
		echo "  $(WHITE)~/.claude$(CLR) exists as directory (not stowed)"; \
	else \
		echo "  $(WHITE)~/.claude$(CLR) does not exist"; \
	fi
	@if [ -L "$$HOME/.config/opencode" ]; then \
		echo "  $(GREEN)~/.config/opencode$(CLR) -> $$(readlink $$HOME/.config/opencode)"; \
	elif [ -d "$$HOME/.config/opencode" ]; then \
		echo "  $(WHITE)~/.config/opencode$(CLR) exists as directory (not stowed)"; \
	else \
		echo "  $(WHITE)~/.config/opencode$(CLR) does not exist"; \
	fi

up: update ## Alias for update
add: stow ## Alias for stow
remove: unstow ## Alias for unstow

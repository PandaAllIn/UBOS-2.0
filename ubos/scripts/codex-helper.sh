#!/bin/bash
# EUFM Codex Helper - Non-interactive automation
set -e

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
LOG_DIR="$REPO_ROOT/logs"
mkdir -p "$LOG_DIR"

# Function to run Codex non-interactively
run_codex_task() {
    local task="$1"
    local timestamp=$(date +"%Y%m%d_%H%M%S")
    local log_file="$LOG_DIR/codex_${timestamp}.log"
    
    echo "Running Codex task: $task"
    echo "Logs: $log_file"
    
    cd "$REPO_ROOT"
    codex exec \
        --dangerously-bypass-approvals-and-sandbox \
        "$task" 2>&1 | tee "$log_file"
    
    echo "Task completed. Check $log_file for details."
}

# Usage examples:
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    if [[ $# -eq 0 ]]; then
        echo "Usage: $0 'your codex task here'"
        echo "Example: $0 'Add unit tests for src/adapters/'"
        exit 1
    fi
    
    run_codex_task "$1"
fi

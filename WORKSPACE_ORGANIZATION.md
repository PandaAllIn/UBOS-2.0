# UBOS Workspace Organization

This repository is organized as an npm workspace monorepo with multiple projects and services.

## Repository Structure

```
UBOS/
├── src/                     # Core EUFM implementation
├── ubos/                    # UBOS kernel & digital nation-state
├── dashboard-react/         # React dashboard UI
├── consultant-portal/       # Business platform
├── packages/                # Shared packages
├── demos/                   # HTML demos & prototypes
├── scripts/                 # Utility scripts
├── specs/                   # Specification files
├── logs/                    # System logs
├── docs/                    # Documentation
└── templates/               # Code templates

```

## Workspaces Configuration

The root `package.json` defines these workspaces:
- `ubos` - UBOS kernel and constitutional governance
- `dashboard-react` - React dashboard application  
- `consultant-portal` - Business platform services
- `packages/*` - Shared utility packages

## Key Features

### 1. CodeRabbit Integration
- Configuration: `.coderabbit.yaml`
- Automatic code reviews on GitHub PRs
- AI-powered code quality analysis

### 2. Organized File Structure
- **Demos**: HTML files moved to `demos/`  
- **Scripts**: Utility scripts organized in `scripts/`
- **Context Files**: Project-specific CLAUDE.md files maintained

### 3. Improved .gitignore
- Comprehensive IDE and build artifact exclusions
- TypeScript build info exclusions
- OS-specific file exclusions

## Development Commands

### Root Level
```bash
npm run dev                    # Start main development server
npm run typecheck             # TypeScript checking
npm run test:integration      # Integration tests
npm run dev:dashboard         # Mission control dashboard
```

### Workspace Commands
```bash
npm run -C ubos cli          # UBOS kernel commands
npm run -C dashboard-react dev # React dashboard dev server
cd ubos && npm test          # UBOS-specific tests
```

## Project-Specific Context

Each major component has its own CLAUDE.md context file:

- **`/CLAUDE.md`**: Main project context, founding citizen identity
- **`eufm/CLAUDE.md`**: EU funding programs, Agent Summoner
- **`src/CLAUDE.md`**: Core implementation, action logging
- **`ubos/CLAUDE.md`**: UBOS kernel, constitutional governance

## Node Modules Management

The workspace configuration enables:
- Shared dependencies at root level
- Workspace-specific dependencies in sub-projects  
- Reduced duplication through npm workspace hoisting
- Cleaner dependency management

## Next Steps

1. **Install dependencies**: `npm install` (installs for all workspaces)
2. **Run health check**: `npm run typecheck && npm run test:integration`
3. **Start development**: `npm run dev:dashboard` for mission control
4. **GitHub Integration**: CodeRabbit will automatically review PRs

This organization maintains the proven €6M+ track record while improving code maintainability and collaboration efficiency.
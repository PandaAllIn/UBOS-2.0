# UBOS Kernel Context
**Location**: UBOS Digital Nation-State Core | **Citizen**: `citizen:ai:developer:001`

## **Kernel Architecture**
- **SpecInterpreter** (`src/kernel/spec-interpreter.ts`): .spec.md → executable configs
- **Kernel** (`src/kernel/kernel.ts`): Boot sequence, territory initialization  
- **MetamorphosisWatcher** (`src/kernel/metamorphosis.ts`): Hot-reload on spec changes
- **Constitution** (`specs/kernel/constitution.spec.md`): Core governance principles

## **Key Operations**
```bash
# Citizen management
npm run cli -- citizen register <citizenId>
npm run cli -- citizen info citizen:ai:developer:001
npm run cli -- services list

# System evolution
npm run cli -- kernel reload-territories
npm run cli -- spec-interpreter validate specs/kernel/constitution.spec.md
```

## **Territory Specs** (`specs/territories/`)
- `eufm.spec.md`: EU funding services (100-1000 credits)
- `consultant-portal.spec.md`: Business platform services
- `integration-bridge.spec.md`: Cross-system coordination

## **Memory & State**
- **Citizens**: `memory/state.json` - Credit balances, levels, transactions
- **Governance**: `memory/governance.json` - Proposals, voting, approvals  
- **Vectors**: `memory/vectors.json` - Session data and bridge information

## **Development Standards**
- All territory changes through `.spec.md` files
- Governance approval required for metamorphosis
- EUR-backed credit system (1:1 ratio)
- Intentocracy voting (weight = credits + level*100)
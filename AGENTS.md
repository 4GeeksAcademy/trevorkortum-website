# Brasaland Digital Agent Protocol

This repository supports Brasaland Digital, the internal technology team modernizing Brasaland's 14-location grilled food chain across Colombia and Florida. All AI agents and human developers must preserve the domain context, multi-market constraints, and monorepo boundaries documented here.

## 1. Memory Context Reading

Every agent session MUST read the following files before proposing code, editing files, or making architectural recommendations:

- `CONTEXT.md`
- `memory-bank/projectbrief.md`
- `memory-bank/techContext.md`
- `memory-bank/progress.md`
- All applicable files in `.agents/rules/`

Agents must treat these files as active operating context. If a request conflicts with this context, the agent must state the conflict and ask for explicit human direction before proceeding.

## 2. Mandatory Pre-Commit Workflow

Before any commit is proposed or created, agents MUST complete these steps in order:

### Step 1: Context Verification & Rule Audit

- Re-read `CONTEXT.md` and all files in `memory-bank/`.
- Review `.agents/rules/` for always-active and file-pattern-specific rules.
- Confirm whether the intended changes affect protected paths.

### Step 2: Implementation & Formatting

- Write clean, minimal code that follows the current monorepo patterns.
- Keep public website code in `uis/website` and internal backoffice code in `uis/backoffice`.
- Keep development-agent configuration in `.agents/` only.
- Keep product/runtime agent code in `/agents` and reusable product skills in `/skills`.
- Format code consistently with surrounding files.

### Step 3: Local Verification & Build Check

- Run the narrowest relevant verification first.
- Run build, dev, typecheck, lint, or static serving scripts needed for the changed surface.
- Confirm there are zero runtime errors for touched applications before final delivery.

### Step 4: Documentation & Progress Update

- Update `memory-bank/progress.md` with meaningful project progress before committing.
- Document new app surfaces, service boundaries, architectural decisions, or known constraints.
- Only then prepare a commit message or pull request summary.

## 3. Protected Path Restrictions

Agents MUST NOT modify the following paths without explicit human developer approval:

- `.git/`
- `.github/workflows/`
- `.devcontainer/`
- `package-lock.json`
- `package.json` scripts that change existing command behavior
- `tsconfig.json`
- Production deployment, infrastructure, or CI/CD workflow files
- Secret, credential, environment, or key files, including `.env`, `.env.*`, `*.pem`, `*.key`, and credential JSON files
- Generated build output such as `dist/`, coverage reports, and dependency folders

If a protected path change is necessary, the agent must explain why and wait for explicit approval before editing.

# Contributing to UniAssist AI

```
<type>(<scope>): <short summary>

<optional body>
```

**Types used in this project:**

| Type       | Use for                                      |
|------------|-----------------------------------------------|
| `init`     | Project initialization / scaffolding          |
| `feat`     | New feature                                    |
| `fix`      | Bug fix                                        |
| `docs`     | Documentation only                             |
| `test`     | Adding or updating tests                       |
| `chore`    | Tooling, config, dependency bumps              |
| `security` | Security-related changes                       |
| `deploy`   | Deployment / CI/CD configuration               |

**Examples:**
```
init: scaffold monorepo structure for backend and frontend
feat(auth): add JWT-based login and signup endpoints
feat(rag): implement pgvector-backed document ingestion pipeline
docs(readme): add system architecture diagrams
```

### Branching

- `main` — always deployable
- `feature/<name>` — one branch per milestone/feature, merged via PR into `main`

### Milestone Workflow

1. Implement the milestone's scope only.
2. Run linters/tests locally.
3. Commit with a message following the convention above.
4. Push the branch and open a PR (or push directly to `main` for solo/hackathon speed).
5. Do not bundle unrelated milestones into the same commit.

### Code Style

- **Backend:** `ruff` + `black` formatting, type hints required, `mypy` clean.
- **Frontend:** `eslint` + `prettier`, strict TypeScript (`strict: true`).

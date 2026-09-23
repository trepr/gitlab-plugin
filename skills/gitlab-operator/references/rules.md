# GitLab Operator Rules: Do's, Don'ts & Safety

Safety constraints, conventions, and security policies for interacting with the TRE-PR GitLab instance (`gitlab.tre-pr.jus.br`).

---

## 1. Project Reference Conventions

- **Full Namespace Mandatory:** Always specify projects using the full namespace path: `group/subgroup/project` (e.g. `sds/sistemas/meu-projeto`).
- **Personal Projects:** Use `username/project-name` (e.g. `joao.silva/meu-experimento`).
- **No Guessing on Ambiguity:** If a user mentions a bare project name (e.g. `meu-projeto`) without a `/`, **do not guess** the group. Prompt the user:
  > "Could you provide the full project path including the namespace? For example: `group/subgroup/project-name`"

---

## 2. Read-Only Mode Enforcement

1. Before invoking any operation that creates, updates, or deletes a resource, inspect `GITLAB_READ_ONLY_MODE` in `mcp.json`.
2. If `GITLAB_READ_ONLY_MODE` is `"true"`:
   - Decline write operation immediately.
   - Explain to the user:
     > "Write operations are unavailable because the plugin is configured in read-only mode. To enable write access, set `GITLAB_READ_ONLY_MODE` to `false` in `mcp.json`."
3. Proactively suggest `GITLAB_READ_ONLY_MODE=true` when the user's task only involves read operations (inspection, code review, log viewing).

---

## 3. Destructive Operations & Confirmation Protocol

Before executing any destructive or irreversible operation, request explicit user confirmation:

### Operations Requiring Confirmation
| Category | Operations |
| :--- | :--- |
| **Branches** | Delete branch, force push |
| **Issues** | Close issue, delete issue |
| **Wiki** | Delete wiki page |
| **Tags / Releases** | Delete tag, delete release |
| **Pipelines** | Retry pipeline (consumes CI runner resources) |

### Confirmation Prompt Format
1. **Specific Action:** State exactly what will be performed.
2. **Target Project:** Specify the project path (`group/subgroup/project`).
3. **Impact:** State ref deletion, affected open MRs, or re-run consequences.

### Abort on Non-Response
If confirmation is not received in the same conversation turn, **abort** the operation:
> "The action was not performed because confirmation was not received."

---

## 4. Credential Safety

- **Never** output OAuth client secrets, OAuth tokens, personal access tokens, or authorization codes in responses, terminal output, or commit logs.
- Refer to credentials by name only (e.g., "the configured OAuth token", "GITLAB_OAUTH_CLIENT_SECRET").
- Never persist credentials or `.env` files with secrets in version-controlled files.

---

## 5. Issue Creation & Management Rules

### Title Rules
- **Do NOT use Conventional Commits prefixes** (`feat:`, `fix:`, `chore:`, etc.) in the issue title.
- The title must be a clear, concise description of the problem or feature — in plain language.
- Use **labels** to classify the issue type (e.g., `bug`, `enhancement`, `documentation`, `maintenance`).

### Assignment
All newly created issues **must** be assigned to the current git user:
1. Determine the current user's email via local git configuration:
   ```shell
   git config user.email
   ```
2. Pass the retrieved email in the `assignee_ids` argument when invoking `create_issue`.

### Label Mapping
Classify the issue nature using standardized labels:

| Issue nature | Label |
|:---|:---|
| New feature | `enhancement` |
| Bug fix | `bug` |
| Documentation | `documentation` |
| Maintenance / tooling | `maintenance` |
| Test-related | `test` |
| Code style / formatting | `style` |

### Label Creation at Root Group Level
- When creating an issue, apply the appropriate label via the `labels` argument.
- If no suitable label exists in the project, create it at the **root group** level (not at the project level).
- **Determine Root Group:** Extract the first path segment from the project's namespace:
  - Example: for `sds/lib/project`, the root group is `sds`.
  - Example: for `sds/sistemas/meu-projeto`, the root group is `sds`.
- Use `create_label` with the root group path as `project_id`.


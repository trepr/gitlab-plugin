---
name: gitlab-operator
description: >-
  Operates the gitlab MCP server to manage GitLab projects, merge request workflows,
  pipeline monitoring, issue tracking, wiki pages, release management, and milestone planning on the TRE-PR internal GitLab instance.
  Use when the user asks to list projects, inspect/review merge requests, create/close issues, check pipeline logs, manage wiki, releases, or milestones.
version: 1
---

# GitLab Operator Skill

This skill provides standardized procedures, safety constraints, and MCP tool usage patterns for interacting with the TRE-PR internal GitLab instance (`gitlab.tre-pr.jus.br`) via the `gitlab` MCP server.

> [!IMPORTANT]
> All project references require the **full namespace path** (`group/subgroup/project` or `user/project`). Never guess ambiguous references.

---

## 1. Decision Matrix: GitLab Operations

| Operation | MCP Tool | Key Constraints / Inputs | Details |
| :--- | :--- | :--- | :--- |
| **List Projects** | `list_projects` | Filter/paginate projects | [View Guide](./references/operations-guide.md#11-list-projects) |
| **List Merge Requests** | `list_merge_requests` | `project_id`, `state` ("opened") | [View Guide](./references/operations-guide.md#12-list-merge-requests) |
| **Code Review** | `list_merge_request_changes` + `get_merge_request_diff` | 2-step review, max 5 files at a time | [View Guide](./references/operations-guide.md#2-code-review) |
| **List Issues** | `list_issues` | `project_id`, `state` ("opened") | [View Guide](./references/operations-guide.md#31-list-issues) |
| **Create Issue** | `create_issue` | Requires `READ_ONLY=false`, plain title, assign to git user, mapped label | [View Guide](./references/operations-guide.md#32-create-issue-write-operation) |
| **Close Issue** | `update_issue` | Requires `READ_ONLY=false`, `state_event: close` | [View Guide](./references/operations-guide.md#33-close-issue-write-operation) |
| **Create Label** | `create_label` | Root group as `project_id`, `name`, `color` | [View Guide](./references/operations-guide.md#34-create-label-at-root-group-level-write-operation) |
| **Pipeline Status** | `list_pipelines` / `get_pipeline` | `project_id`, optional `pipeline_id` | [View Guide](./references/operations-guide.md#41-check-pipeline-status) |
| **View Job Log** | `get_pipeline_job_log` | `project_id`, `job_id` | [View Guide](./references/operations-guide.md#42-view-job-logs) |
| **Retry Pipeline** | `retry_pipeline` | Destructive confirmation, `READ_ONLY=false` | [View Guide](./references/operations-guide.md#43-retry-pipeline-write-operation) |
| **Wiki Pages** | `list_wiki_pages` / `create_wiki_page` / `update_wiki_page` | `title`, `content`, `slug` | [View Guide](./references/operations-guide.md#5-wiki) |
| **Releases & Tags** | `list_releases` / `create_release` / `list_tags` | `tag_name`, `name`, `description` | [View Guide](./references/operations-guide.md#6-releases--tags) |
| **Milestones** | `list_milestones` / `create_milestone` | `title`, `due_date`, `description` | [View Guide](./references/operations-guide.md#7-milestones) |

---

## 2. Core Principles & Workflow

1. **Full Namespace Path**: Always provide `group/subgroup/project`. If ambiguous (no `/`), prompt the user instead of guessing.
2. **Read-Only Mode Enforcement**: Before performing any mutation (create, update, delete, retry), check `GITLAB_READ_ONLY_MODE` in `mcp.json`. If `true`, refuse write operations.
3. **Structured Code Review**: Follow the 2-step process (list changes -> fetch diffs one by one if > 5 files -> produce structured summary with Issues, Suggestions, Recommendation).
4. **Destructive Operations**: Require explicit confirmation specifying action, target project, and impact before proceeding.
5. **Credential Safety**: Never echo or leak OAuth tokens or credentials into outputs, logs, or commit messages.
6. **Issue & Label Standards**: Plain language titles (no Conventional Commits prefixes), assign to current git user (`git config user.email`), and map standardized labels (created at root group level if missing). See [Rules](./references/rules.md#5-issue-creation--management-rules).

---

## 3. Quick Execution & Tool Invocation

Tools are invoked directly via the `gitlab` MCP server. Depending on the client environment, tool names may be called as `<tool>` or `gitlab:<tool>`:

```json
// Example: List projects
Tool: list_projects (or gitlab:list_projects)
Arguments: {}

// Example: List open MRs for a project
Tool: list_merge_requests (or gitlab:list_merge_requests)
Arguments: { "project_id": "sds/sistemas/meu-projeto", "state": "opened" }
```

---

## 4. References & Specialized Resources

To maintain a lightweight context, consult detailed resources on demand:

- **[Operations Guide](./references/operations-guide.md):** Complete step-by-step procedures, tool arguments, JSON payloads, and example prompts for each workflow.
- **[Rules: Do's, Don'ts & Safety](./references/rules.md):** Namespace conventions, read-only mode, destructive confirmation protocol, credential safety, and issue creation/labeling rules.
- **[Error Handling Guide](./references/error-handling.md):** Pattern matching and resolution for 401 Unauthorized, 404 Not Found, SSL CA errors, and missing tools.

---

## 5. Validation Checklist

Before executing or finalizing any GitLab operation:
- [ ] Project path includes full namespace (`group/subgroup/project`).
- [ ] `GITLAB_READ_ONLY_MODE` verified before any write operation.
- [ ] Destructive actions confirmed explicitly by the user in the current turn.
- [ ] Large MR reviews (> 5 files) processed file-by-file to preserve context.
- [ ] No tokens, secrets, or internal credentials logged or returned.
- [ ] Issue title in plain language without Conventional Commits prefix.
- [ ] Issue assigned to current git user email (`assignee_ids` from `git config user.email`).
- [ ] Issue label mapped and verified (created at root group level if missing).
- [ ] Error patterns matched against the Error Handling Guide before reporting failures.


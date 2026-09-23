# GitLab Operator Operations Guide

Detailed workflows, MCP tool arguments, and JSON payloads for interacting with the TRE-PR internal GitLab instance (`gitlab.tre-pr.jus.br`).

---

## 1. Projects & Merge Requests

### 1.1 List Projects
List projects accessible by the authenticated user.
- **Tool:** `list_projects`
- **Arguments:** `{}`
- **Example Prompts:**
  - "List my projects on GitLab"
  - "Show all projects I have access to"
- **Note:** Always display the full namespace path (`group/subgroup/project`) in responses.

### 1.2 List Merge Requests
List merge requests for a specific project.
- **Tool:** `list_merge_requests`
- **Arguments:**
  ```json
  {
    "project_id": "group/subgroup/project",
    "state": "opened"
  }
  ```
- **Example Prompts:**
  - "List open merge requests in sds/sistemas/meu-projeto"
  - "Show all MRs assigned to me in sds/devops/infra-tools"

---

## 2. Code Review

Structured two-step workflow to systematically review merge request changes.

### Step 1: List Changed Files
- **Tool:** `list_merge_request_changes`
- **Arguments:**
  ```json
  {
    "project_id": "group/subgroup/project",
    "merge_request_iid": 42
  }
  ```

### Step 2: Retrieve Diffs & Analyze
- **Tool:** `get_merge_request_diff`
- **Arguments:**
  ```json
  {
    "project_id": "group/subgroup/project",
    "merge_request_iid": 42,
    "file_path": "src/example.ts"
  }
  ```

### Handling Large Merge Requests
If the MR contains **more than 5 changed files**, review one file at a time rather than loading all diffs at once:
1. Retrieve diff for single file.
2. Analyze and note findings.
3. Proceed to the next file until complete.

### Review Summary Format
Once all files are reviewed, output:
```markdown
All changed files have been reviewed.

### 1. Issues Found
- `<file>`: <description of problem>

### 2. Improvement Suggestions
- <suggestions for code quality, maintainability, tests>

### 3. Approval Recommendation
- [Approve | Request Changes | Comment Only]
```

---

## 3. Issues

### 3.1 List Issues
- **Tool:** `list_issues`
- **Arguments:**
  ```json
  {
    "project_id": "sds/sistemas/meu-projeto",
    "state": "opened"
  }
  ```

### 3.2 Create Issue (Write Operation)
Requires `GITLAB_READ_ONLY_MODE=false`.
- **Pre-requisite:** Determine current user's email via `git config user.email` and ensure appropriate label exists (see [Section 3.4](#34-create-label-at-root-group-level-write-operation) if creation is needed).
- **Tool:** `create_issue`
- **Arguments:**
  ```json
  {
    "project_id": "sds/sistemas/meu-projeto",
    "title": "Fix login timeout",
    "description": "Users report timeout after 30s on the login page.",
    "assignee_ids": ["usuario@tre-pr.jus.br"],
    "labels": "bug"
  }
  ```
- **Rules reminder:**
  - Title in plain language: do **NOT** use Conventional Commits prefixes (e.g., `fix:`, `feat:`).
  - Assign to current git user (`assignee_ids`).
  - Map label according to issue nature (`enhancement`, `bug`, `documentation`, `maintenance`, `test`, `style`, `improvement`, `refactoring`, `security`).

### 3.3 Close Issue (Write Operation)
Requires `GITLAB_READ_ONLY_MODE=false`.
- **Tool:** `update_issue`
- **Arguments:**
  ```json
  {
    "project_id": "sds/sistemas/meu-projeto",
    "issue_iid": "42",
    "state_event": "close"
  }
  ```

### 3.4 Create Label at Root Group Level (Write Operation)
Requires `GITLAB_READ_ONLY_MODE=false`.
If the desired label does not exist in the target project, create it at the root group level (extract the first path segment from namespace, e.g., `sds` from `sds/sistemas/meu-projeto`).
- **Tool:** `create_label`
- **Arguments:**
  ```json
  {
    "project_id": "sds",
    "name": "enhancement",
    "color": "#428BCA"
  }
  ```

---

## 4. Pipelines

### 4.1 Check Pipeline Status
- **Tools:** `list_pipelines` or `get_pipeline`
- **Arguments (`list_pipelines`):**
  ```json
  {
    "project_id": "sds/sistemas/meu-projeto"
  }
  ```
- **Arguments (`get_pipeline`):**
  ```json
  {
    "project_id": "sds/sistemas/meu-projeto",
    "pipeline_id": "1234"
  }
  ```

### 4.2 View Job Logs
- **Tool:** `get_pipeline_job_log`
- **Arguments:**
  ```json
  {
    "project_id": "sds/sistemas/meu-projeto",
    "job_id": "5678"
  }
  ```

### 4.3 Retry Pipeline (Write Operation)
Requires `GITLAB_READ_ONLY_MODE=false` and explicit confirmation.
- **Tool:** `retry_pipeline`
- **Arguments:**
  ```json
  {
    "project_id": "sds/sistemas/meu-projeto",
    "pipeline_id": "1234"
  }
  ```

---

## 5. Wiki

### 5.1 List Wiki Pages
- **Tool:** `list_wiki_pages`
- **Arguments:**
  ```json
  {
    "project_id": "sds/sistemas/meu-projeto"
  }
  ```

### 5.2 Create Wiki Page (Write Operation)
- **Tool:** `create_wiki_page`
- **Arguments:**
  ```json
  {
    "project_id": "sds/sistemas/meu-projeto",
    "title": "Architecture Overview",
    "content": "# Architecture\n\nContent..."
  }
  ```

### 5.3 Update Wiki Page (Write Operation)
- **Tool:** `update_wiki_page`
- **Arguments:**
  ```json
  {
    "project_id": "sds/sistemas/meu-projeto",
    "slug": "architecture-overview",
    "title": "Architecture Overview",
    "content": "# Architecture\n\nUpdated content..."
  }
  ```

---

## 6. Releases & Tags

### 6.1 List Releases
- **Tool:** `list_releases`
- **Arguments:** `{ "project_id": "group/subgroup/project" }`

### 6.2 Create Release (Write Operation)
- **Tool:** `create_release`
- **Arguments:**
  ```json
  {
    "project_id": "group/subgroup/project",
    "tag_name": "v1.0.0",
    "name": "Release 1.0.0",
    "description": "Release notes content"
  }
  ```

### 6.3 List Tags
- **Tool:** `list_tags`
- **Arguments:** `{ "project_id": "group/subgroup/project" }`

---

## 7. Milestones

### 7.1 List Milestones
- **Tool:** `list_milestones`
- **Arguments:** `{ "project_id": "group/subgroup/project" }`

### 7.2 Create Milestone (Write Operation)
- **Tool:** `create_milestone`
- **Arguments:**
  ```json
  {
    "project_id": "group/subgroup/project",
    "title": "Sprint 10",
    "description": "Goals for sprint 10",
    "due_date": "2026-03-31"
  }
  ```

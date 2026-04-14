---
mode: agent
description: 'Create or update a reusable Copilot prompt file (*.prompt.md) with valid frontmatter and clear task instructions.'
---

Create a reusable prompt file for the user.

Workflow:

1. Confirm prompt purpose and target user.
2. Decide scope:
   - Workspace shared: .github/prompts/
   - User profile: {{VSCODE_USER_PROMPTS_FOLDER}}/
3. Draft concise frontmatter and prompt body.
4. Validate syntax and naming.
5. If user asks to apply, create or update the file directly.

Requirements:

- Use kebab-case filename ending in .prompt.md.
- Include YAML frontmatter and a meaningful description.
- Keep prompt focused on one job.
- Include concrete output format instructions when helpful.

Output format:

- Proposed file path
- Complete prompt file content
- Short validation checklist

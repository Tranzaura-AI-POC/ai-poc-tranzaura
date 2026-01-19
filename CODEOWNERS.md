Repository CODEOWNERS

This repository includes a `.github/CODEOWNERS` file to help automatically request reviews from the right teams or individuals when changes are made.

What to do:

- Edit `.github/CODEOWNERS` and replace the placeholder team names with your real org team names or individual GitHub handles.
  - Examples:
    - `@Tranzaura-AI-POC/owners` — general repo owners
    - `@Tranzaura-AI-POC/frontend` — frontend maintainers
    - `@Tranzaura-AI-POC/backend` — backend maintainers

Notes:

- GitHub enforces CODEOWNERS only when the referenced teams/users exist in the organization. If you reference a non-existent team, the file will not fail but automatic requests will not be created.
- If you prefer team-level ownership, create teams in your org (e.g., `owners`, `frontend`, `backend`) and use the `@org/team` syntax.
- For more details: https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-code-owners

To update ownership:

1. Edit `.github/CODEOWNERS` and replace placeholders with your actual teams/users.
2. Commit and push the change. Future PRs will request reviews from the listed owners automatically.

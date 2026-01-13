# Migration guide — Upgrade to Angular 21

This project contains an Angular app pinned to older Angular majors. The `npm audit` found multiple high-severity advisories affecting Angular packages and the build toolchain. This document describes a safe, staged plan to upgrade to Angular 21 and associated tool upgrades.

Prerequisites
- Node.js (LTS) and npm installed. Use `npm.cmd` on Windows if PowerShell blocks npm scripts.
- Ensure you have working unit/e2e tests and a commit/branch strategy (create a feature branch for the upgrade).

High-level steps

1. Create a branch

```
git checkout -b upgrade/angular-21
```

2. Install current dependencies cleanly

```
cd frontend
npm.cmd ci
```

3. Update Angular CLI and core packages using the Angular tooling

The simplest route is to use `ng update` which runs schematics and migrations where available. Start by updating the CLI and core packages:

```
npx -y @angular/cli@21 ng update @angular/core@21 @angular/cli@21 --from=17 --to=21
```

4. Update remaining packages

- Update `@angular/material` and `@angular/cdk`: `ng update @angular/material@21`.
- Update test tooling (`@angular-builders/jest` → `^20.0.0`) and `@angular-devkit/build-angular` → `^21.x`.

5. Verify TypeScript compatibility

Angular 21 may require a newer TypeScript minor — if `ng update` recommends a TS upgrade, follow it and run a full typecheck.

6. Run and fix tests, then manual QA

```
npm.cmd run test
npm.cmd run e2e
```

Fix compilation or runtime errors introduced by breaking changes. Refer to Angular update changelogs and the official migration guide.

7. Update CI and lockfile

- Commit `package-lock.json` after successful install. Update CI pipeline to run `npm ci` and `npm run build` and fail on vulnerabilities (`npm audit --audit-level=high`).
- Add Dependabot/renovate for npm and NuGet.

8. Rollback plan

- If issues are blocking, revert the branch and open smaller PRs updating subsets of packages.

Notes & cautions
- This is a major-version upgrade; test thoroughly. The app is small so the migration should be manageable but expect API changes in internals and potential TypeScript fixes.
- Consider running the upgrade in a disposable environment and using a feature deployment slot for production verification.

If you want, I can: (A) open a PR with the package.json version bumps I prepared, (B) run `ng update` and attempt automated migrations in this workspace, or (C) prepare a CI workflow and Dependabot config before merging. Which next? 

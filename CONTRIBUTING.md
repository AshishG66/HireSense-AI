# Contributing to HireSense AI

We love your input! We want to make contributing to HireSense AI as easy and transparent as possible, whether it's:

- Reporting a bug
- Discussing the current state of the code
- Submitting a fix
- Proposing new features

## Our Development Process

1. **Fork the Repo**: Create your own copy of the repository.
2. **Setup Local Environment**: Clone the fork, configure dependencies, and setup docker workspaces.
3. **Write Code & Tests**: Make your modifications, write corresponding tests, and run:
   - Backend tests: `node .\node_modules\vitest\vitest.mjs run`
   - Frontend tests: `node .\node_modules\vitest\vitest.mjs run`
4. **Run Linter & Build compiler checks**: Ensure your code meets styles:
   - Backend compile: `tsc --noEmit`
   - Frontend compile: `tsc --noEmit`
5. **Open a Pull Request**: Submit the code review request against our `main` branch.

## Code of Conduct

Please note that this project is released with a Contributor Code of Conduct. By participating in this project you agree to abide by its terms.

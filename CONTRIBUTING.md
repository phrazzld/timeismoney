# Contributing to Time Is Money

Thank you for your interest in contributing to Time Is Money! This document provides guidelines and instructions for contributing to this project.

## Development Setup

1. Clone the repository:
   ```
   git clone https://github.com/[username]/timeismoney.git
   cd timeismoney
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Build the extension:
   ```
   npm run build
   ```

## Code Quality

We maintain code quality through linting and testing:

- **Linting**: We use ESLint to ensure code style consistency.
  ```
  npm run lint      # Check for linting issues
  npm run lint:fix  # Fix linting issues automatically
  ```

- **Testing**: We use Jest for unit testing.
  ```
  npm test          # Run all tests
  npm test -- --watch  # Run tests in watch mode
  ```

## Continuous Integration

We use GitHub Actions for continuous integration. Every pull request and push to the master branch triggers our CI pipeline, which:

1. Installs dependencies
2. Runs linting checks
3. Runs all tests

Pull requests cannot be merged if they fail any of these checks.

## Pull Request Process

1. Fork the repository and create a new branch.
2. Make your changes following our code style guidelines.
3. Add or update tests as necessary.
4. Run linting and tests locally to ensure they pass.
5. Submit a pull request with a clear description of your changes.
6. Wait for CI checks to pass and address any issues.
7. After review, your PR will be merged if it meets our requirements.

## Commit Message Guidelines

We follow a simplified version of the [Conventional Commits](https://www.conventionalcommits.org/) specification:

- `feat:` for new features
- `fix:` for bug fixes
- `chore:` for maintenance tasks
- `refactor:` for code changes that neither fix bugs nor add features
- `test:` for adding or updating tests
- `docs:` for documentation updates

Example: `feat: add support for Euro currency format`

## License

By contributing to Time Is Money, you agree that your contributions will be licensed under the project's [MIT License](LICENSE).
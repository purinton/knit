# [![Purinton Dev](https://purinton.us/logos/brand.png)](https://discord.gg/QSBxQnX7PF)

## @purinton/knit [![npm version](https://img.shields.io/npm/v/@purinton/knit.svg)](https://www.npmjs.com/package/@purinton/knit)[![license](https://img.shields.io/github/license/purinton/knit.svg)](LICENSE)[![build status](https://github.com/purinton/knit/actions/workflows/nodejs.yml/badge.svg)](https://github.com/purinton/knit/actions)

A GitHub webhook handler and deployment automation tool. Knit listens for GitHub webhook events, validates signatures, updates local repositories, runs deployment commands, and sends notifications (e.g., to Discord). Use this as a foundation for automating deployments and notifications for your projects.

---

## Table of Contents

- [Features](#features)
- [Getting Started](#getting-started)
- [Development](#development)
- [Testing](#testing)
- [Customization](#customization)
- [Support](#support)
- [License](#license)

## Features

- GitHub webhook listener (Express server)
- Signature validation for security
- Automated repository updates and deployment commands
- Discord webhook notifications for deployments and errors
- Interactive CLI wizard for repository configuration
- Pre-configured for Node.js (ESM)
- Environment variable support via dotenv
- Logging and signal handling via `@purinton/common`
- Jest for testing
- MIT License

## Getting Started

1. **Clone this template:**

   ```bash
   git clone https://github.com/purinton/knit.git
   cd knit
   npm install
   ```

2. **Update project details:**
   - Edit `package.json` (name, description, author, etc.)
   - Update this `README.md` as needed
   - Change the license if required

3. **Configure your repositories:**
   - Run the interactive wizard:

     ```bash
     ./wizard.mjs
     ```

   - This will guide you through setting up deployment paths, commands, and notification URLs for each repository.

4. **Set up your GitHub webhook:**
   - Point your repository’s webhook to your Knit server URL (e.g., `https://yourdomain.com/`)
   - Use content type `application/json`
   - Set the webhook secret to match your `.env` file’s `GITHUB_WEBHOOK_SECRET`

## Development

- Main entry: `knit.mjs`
- Start your app:

  ```bash
  ./knit.mjs
  ```

- Add your code in new files and import as needed.

## Testing

- Run tests with:

  ```bash
  npm test
  ```

- Add your tests in the `tests` folder or alongside your code.

## Customization

- Extend the logging, notification, or deployment logic as needed.
- Add dependencies and scripts to fit your project.
- Remove or modify template files and sections.

## Support

For help, questions, or to chat with the author and community, visit:

[![Discord](https://purinton.us/logos/discord_96.png)](https://discord.gg/QSBxQnX7PF)[![Purinton Dev](https://purinton.us/logos/purinton_96.png)](https://discord.gg/QSBxQnX7PF)

**[Purinton Dev on Discord](https://discord.gg/QSBxQnX7PF)**

## License

[MIT © 2025 Russell Purinton](LICENSE)

## Links

- [GitHub Repo](https://github.com/purinton/knit)
- [GitHub Org](https://github.com/purinton)
- [GitHub Personal](https://github.com/rpurinton)
- [Discord](https://discord.gg/QSBxQnX7PF)

import fs from 'fs';
import { path, log as logger } from '@purinton/common';
import { exec } from 'child_process';
import * as ConfigValidator from './configValidator.mjs';
import * as Notifier from './notifier.mjs';

/**
 * Creates a repository handler for update operations.
 * @param {Object} params
 * @param {Object} params.config - The repository configuration object.
 * @returns {Object} The repository handler with an update method.
 */
function createRepo({ config, log = logger }) {
  return {
    pwd: config.pwd,
    preCmds: config.pre || [],
    postCmds: config.post || [],
    user: config.user || 'root',
    group: config.group || 'root',
    notify: config.notify || null,
    /**
     * Updates the repository based on the webhook body.
     * @param {Object} params
     * @param {Object} params.body - The webhook payload.
     * @param {Object} params.log - The log object for logging messages.
     * @returns {Promise<boolean>} True if update succeeded, false otherwise.
     */
    async update({ body, log: injectedLog }) {
      const logInstance = injectedLog || log;
      if (logInstance) logInstance.info(`[Repo] Starting update for repo: ${this.pwd}`);
      if (!validatebody({ body })) {
        if (logInstance) logInstance.error('[Repo] body validation failed');
        return false;
      }
      if (body.ref && body.ref.startsWith('refs/tags/')) {
        if (logInstance) logInstance.info('[Repo] Tag push detected, skipping commands and only sending notification');
        await sendNotification({ repo: this, body, log: '', hasError: false, logInstance });
        return true;
      }
      let logOutput = '';
      let hasError = false;
      try {
        process.chdir(this.pwd);
        if (logInstance) logInstance.info(`[Repo] Changed directory to ${this.pwd}`);
      } catch (err) {
        logOutput += `Error: Unable to change directory to: ${this.pwd}\n`;
        hasError = true;
        if (logInstance) logInstance.error('[Repo] Error changing directory:', err);
      }
      if (!hasError) {
        for (const cmd of this.preCmds) {
          if (hasError) break;
          if (logInstance) logInstance.info(`[Repo] Running pre command: ${cmd}`);
          try {
            const result = await execCommand({ cmd });
            logOutput += formatCommandOutput({ cmd, stdout: result.stdout, stderr: result.stderr, exitCode: 0 });
          } catch (err) {
            logOutput += formatCommandOutput({ cmd, stdout: err.stdout, stderr: err.stderr, exitCode: 1 });
            hasError = true;
            if (logInstance) logInstance.error(`[Repo] Pre command failed: ${cmd}`, err);
          }
        }
      }
      if (!hasError) {
        try {
          if (logInstance) logInstance.info('[Repo] Running git pull');
          const result = await execCommand({ cmd: 'git pull -q' });
          logOutput += formatCommandOutput({ cmd: 'git pull -q', stdout: result.stdout, stderr: result.stderr, exitCode: 0 });
        } catch (err) {
          logOutput += formatCommandOutput({ cmd: 'git pull -q', stdout: err.stdout, stderr: err.stderr, exitCode: 1 });
          hasError = true;
          if (logInstance) logInstance.error('[Repo] git pull failed:', err);
        }
      }
      if (!hasError) {
        try {
          const chownCmd = `chown -R ${this.user}:${this.group} ${this.pwd}`;
          if (logInstance) logInstance.info(`[Repo] Running chown: ${chownCmd}`);
          const result = await execCommand({ cmd: chownCmd });
          logOutput += formatCommandOutput({ cmd: chownCmd, stdout: result.stdout, stderr: result.stderr, exitCode: 0 });
        } catch (err) {
          hasError = true;
          if (logInstance) logInstance.error('[Repo] chown failed:', err);
        }
      }
      if (!hasError) {
        for (const cmd of this.postCmds) {
          if (hasError) break;
          if (logInstance) logInstance.info(`[Repo] Running post command: ${cmd}`);
          try {
            const result = await execCommand({ cmd });
            logOutput += formatCommandOutput({ cmd, stdout: result.stdout, stderr: result.stderr, exitCode: 0 });
          } catch (err) {
            logOutput += formatCommandOutput({ cmd, stdout: err.stdout, stderr: err.stderr, exitCode: 1 });
            hasError = true;
            if (logInstance) logInstance.error(`[Repo] Post command failed: ${cmd}`, err);
          }
        }
      }
      await sendNotification({ repo: this, body, log: logOutput, hasError, logInstance });
      if (logInstance) logInstance.info(`[Repo] Update complete for repo: ${this.pwd} Error: ${hasError}`);
      return !hasError;
    }
  };
}

/**
 * Validates the webhook body.
 * @param {Object} params
 * @param {Object} params.body - The webhook payload.
 * @returns {boolean} True if valid, false otherwise.
 */
function validatebody({ body }) {
  return body && typeof body === 'object' && Array.isArray(body.commits);
}

/**
 * Formats the output of a shell command.
 * @param {Object} params
 * @param {string} params.cmd - The command executed.
 * @param {string} params.stdout - The standard output.
 * @param {string} params.stderr - The standard error.
 * @param {number} params.exitCode - The exit code.
 * @returns {string} The formatted output.
 */
function formatCommandOutput({ cmd, stdout, stderr, exitCode }) {
  const statusSymbol = exitCode === 0 ? '\u2705 ' : '\u274c ';
  let output = statusSymbol + cmd + '\n';
  if (stdout) output += stdout.trim() + '\n';
  if (stderr) output += 'ERRORS: \n' + stderr.trim() + '\n';
  if (exitCode !== 0) output += `Exit Code: ${exitCode}\n\n`;
  return output;
}

/**
 * Executes a shell command asynchronously.
 * @param {Object} params
 * @param {string} params.cmd - The command to execute.
 * @returns {Promise<Object>} The result with stdout and stderr.
 */
function execCommand({ cmd }) {
  return new Promise((resolve, reject) => {
    exec(cmd, (err, stdout, stderr) => {
      if (err) {
        err.stdout = stdout;
        err.stderr = stderr;
        reject(err);
      } else {
        resolve({ stdout, stderr });
      }
    });
  });
}

/**
 * Sends a notification using the Notifier module.
 * @param {Object} params
 * @param {Object} params.repo - The repository handler.
 * @param {Object} params.body - The webhook payload.
 * @param {string} params.log - The log output.
 * @param {boolean} params.hasError - Whether an error occurred.
 * @param {Object} params.logInstance - The log instance for logging.
 */
async function sendNotification({ repo, body, log, hasError, logInstance }) {
  if (!repo.notify) return;
  await Notifier.send({ notifyUrl: repo.notify, post: body, log, hasError, log: logInstance });
}

/**
 * Loads and validates a repository configuration by name.
 * @param {Object} params
 * @param {string} params.name - The repository name.
 * @returns {Promise<Object|null>} The repository handler or null if not found/invalid.
 */
export async function get({ name, log = logger }) {
  const __dirname = path.dirname(new URL(import.meta.url).pathname);
  const configFile = path.resolve(__dirname, '../repos', `${name}.json`);
  if (!fs.existsSync(configFile)) {
    return null;
  }
  let config;
  try {
    config = ConfigValidator.validateJsonFile({ path: configFile });
  } catch (err) {
    return null;
  }
  if (!ConfigValidator.validate({ config })) {
    return null;
  }
  return createRepo({ config, log });
}

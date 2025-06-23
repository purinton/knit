import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import * as ConfigValidator from './configValidator.mjs';
import * as Notifier from './notifier.mjs';

function createRepo(config) {
  return {
    pwd: config.pwd,
    preCmds: config.pre || [],
    postCmds: config.post || [],
    user: config.user || 'root',
    group: config.group || 'root',
    notify: config.notify || null,
    async update(body) {
      console.log(`[Repo] Starting update for repo: ${this.pwd}`);
      if (!validatebody(body)) {
        console.error('[Repo] body validation failed');
        return false;
      }
      if (body.ref && body.ref.startsWith('refs/tags/')) {
        console.log('[Repo] Tag push detected, skipping commands and only sending notification');
        await sendNotification(this, body, '', false);
        return true;
      }
      let log = '';
      let hasError = false;
      try {
        process.chdir(this.pwd);
        console.log(`[Repo] Changed directory to ${this.pwd}`);
      } catch (err) {
        log += `Error: Unable to change directory to: ${this.pwd}\n`;
        hasError = true;
        console.error('[Repo] Error changing directory:', err);
      }
      if (!hasError) {
        for (const cmd of this.preCmds) {
          if (hasError) break;
          console.log(`[Repo] Running pre command: ${cmd}`);
          try {
            const result = await execCommand(cmd);
            log += formatCommandOutput(cmd, result.stdout, result.stderr, 0);
          } catch (err) {
            log += formatCommandOutput(cmd, err.stdout, err.stderr, 1);
            hasError = true;
            console.error(`[Repo] Pre command failed: ${cmd}`, err);
          }
        }
      }
      if (!hasError) {
        try {
          console.log('[Repo] Running git pull');
          const result = await execCommand('git pull -q');
          log += formatCommandOutput('git pull -q', result.stdout, result.stderr, 0);
        } catch (err) {
          log += formatCommandOutput('git pull -q', err.stdout, err.stderr, 1);
          hasError = true;
          console.error('[Repo] git pull failed:', err);
        }
      }
      if (!hasError) {
        try {
          const chownCmd = `chown -R ${this.user}:${this.group} ${this.pwd}`;
          console.log(`[Repo] Running chown: ${chownCmd}`);
          const result = await execCommand(chownCmd);
          log += formatCommandOutput(chownCmd, result.stdout, result.stderr, 0);
        } catch (err) {
          hasError = true;
          console.error('[Repo] chown failed:', err);
        }
      }
      if (!hasError) {
        for (const cmd of this.postCmds) {
          if (hasError) break;
          console.log(`[Repo] Running post command: ${cmd}`);
          try {
            const result = await execCommand(cmd);
            log += formatCommandOutput(cmd, result.stdout, result.stderr, 0);
          } catch (err) {
            log += formatCommandOutput(cmd, err.stdout, err.stderr, 1);
            hasError = true;
            console.error(`[Repo] Post command failed: ${cmd}`, err);
          }
        }
      }
      await sendNotification(this, body, log, hasError);
      console.log(`[Repo] Update complete for repo: ${this.pwd} Error: ${hasError}`);
      return !hasError;
    }
  };
}

function validatebody(body) {
  return body && typeof body === 'object' && Array.isArray(body.commits);
}

function formatCommandOutput(cmd, stdout, stderr, exitCode) {
  const statusSymbol = exitCode === 0 ? '\u2705 ' : '\u274c ';
  let output = statusSymbol + cmd + '\n';
  if (stdout) output += stdout.trim() + '\n';
  if (stderr) output += 'ERRORS: \n' + stderr.trim() + '\n';
  if (exitCode !== 0) output += `Exit Code: ${exitCode}\n\n`;
  return output;
}

function execCommand(cmd) {
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

async function sendNotification(repo, body, log, hasError) {
  if (!repo.notify) return;
  await Notifier.send(repo.notify, body, log, hasError);
}

export async function get(name) {
  const __dirname = path.dirname(new URL(import.meta.url).pathname);
  const configFile = path.resolve(__dirname, '../repos', `${name}.json`);
  if (!fs.existsSync(configFile)) {
    return null;
  }
  let config;
  try {
    config = ConfigValidator.validateJsonFile(configFile);
  } catch (err) {
    return null;
  }
  if (!ConfigValidator.validate(config)) {
    return null;
  }
  return createRepo(config);
}

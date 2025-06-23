import { exec } from 'child_process';

/**
 * Stages a file for commit using git add.
 * @param {Object} params
 * @param {string} params.filePath - The file path to add.
 * @returns {Promise<string>} The stdout from git add.
 */
export function add({ filePath }) {
  return new Promise((resolve, reject) => {
    exec(`git add "${filePath}"`, (error, stdout, stderr) => {
      if (error) {
        reject(new Error(`git add error: ${stderr}`));
      } else {
        resolve(stdout);
      }
    });
  });
}

/**
 * Commits staged changes with a message.
 * @param {Object} params
 * @param {string} params.message - The commit message.
 * @returns {Promise<string>} The stdout from git commit.
 */
export function commit({ message }) {
  return new Promise((resolve, reject) => {
    exec(`git commit --quiet -m "${message.replace(/"/g, '\\"')}"`, (error, stdout, stderr) => {
      if (error) {
        reject(new Error(`git commit error: ${stderr}`));
      } else {
        resolve(stdout);
      }
    });
  });
}

/**
 * Pushes committed changes to the remote repository.
 * @returns {Promise<string>} The stdout from git push.
 */
export function push() {
  return new Promise((resolve, reject) => {
    exec('git push --quiet', (error, stdout, stderr) => {
      if (error) {
        reject(new Error(`git push error: ${stderr}`));
      } else {
        resolve(stdout);
      }
    });
  });
}

import { exec } from 'child_process';

class GitHelper {
  static add(filePath) {
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

  static commit(message) {
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

  static push() {
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
}

export default GitHelper;

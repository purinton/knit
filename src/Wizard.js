import fs from 'fs';
import path from 'path';
import inquirer from 'inquirer';
import GitHelper from './GitHelper.js';
import ConfigValidator from './ConfigValidator.js';

class Wizard {
  async run() {
    try {
      const { repoName } = await inquirer.prompt([
        {
          type: 'input',
          name: 'repoName',
          message: 'Repository Name (owner/repo):',
          validate: input => /^.+\/.+$/.test(input) || 'Invalid repository name format. Use owner/repo.'
        }
      ]);
      const [owner, repo] = repoName.split('/');
      const { installPath } = await inquirer.prompt([
        {
          type: 'input',
          name: 'installPath',
          message: 'Install Path:',
          validate: input => Boolean(input) || 'Install path cannot be empty.'
        }
      ]);
      const preCommands = await this.getCommands('pre-deployment');
      let postCommands = [];
      // Ask about npm install
      const { runNpm } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'runNpm',
          message: 'Do you want to run npm install?',
          default: false
        }
      ]);
      if (runNpm) {
        postCommands.push('npm install --silent');
        // If npm install, ask about npm test
        const { runNpmTest } = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'runNpmTest',
            message: 'Do you want to run npm test?',
            default: false
          }
        ]);
        if (runNpmTest) {
          postCommands.push('npm test > .jest.result 2>&1');
        }
      }
      // Ask about composer install
      const { runComposer } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'runComposer',
          message: 'Do you want to run composer install?',
          default: false
        }
      ]);
      if (runComposer) {
        postCommands.push('composer install -qno');
      }
      // Other post-deployment commands
      postCommands = postCommands.concat(await this.getCommands('post-deployment'));
      const { user } = await inquirer.prompt([
        {
          type: 'input',
          name: 'user',
          message: 'User:',
          default: 'root'
        }
      ]);
      const { group } = await inquirer.prompt([
        {
          type: 'input',
          name: 'group',
          message: 'Group:',
          default: 'root'
        }
      ]);
      const { notify } = await inquirer.prompt([
        {
          type: 'input',
          name: 'notify',
          message: 'Notification URL:',
          default: 'https://discord.com/api/webhooks/1340323332737859726/N5WmEk1NLVL6bZKm2g1rwldiBXCox8jVTRs8kgpfGAxDnSvaSasbxWW3GBpLYyRPJLAZ'
        }
      ]);
      const config = this.buildConfig(installPath, preCommands, user, group, postCommands, notify);
      const jsonConfig = JSON.stringify(config, null, 2);
      const filePath = await this.saveConfigurationFile(owner, repo, jsonConfig);
      await this.handleGitCommitPush(filePath, `${owner}/${repo}`);
      this.printRepositoryInfo(filePath);
    } catch (error) {
      console.error('An error occurred:', error.message);
      process.exit(1);
    }
  }

  async getCommands(type) {
    const commands = [];
    // Ask only once at the start
    const { hasCommand } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'hasCommand',
        message: `Do you have any ${type} commands?`,
        default: false
      }
    ]);
    if (!hasCommand) return commands;
    let addMore = true;
    while (addMore) {
      const { cmd } = await inquirer.prompt([
        {
          type: 'input',
          name: 'cmd',
          message: `Enter a ${type} command:`,
          validate: input => !!input || 'Command cannot be empty.'
        }
      ]);
      commands.push(cmd);
      const { more } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'more',
          message: `Do you have another ${type} command?`,
          default: false
        }
      ]);
      addMore = more;
    }
    return commands;
  }

  buildConfig(installPath, pre, user, group, post, notify) {
    return {
      pwd: installPath,
      pre,
      user,
      group,
      post,
      notify
    };
  }

  async saveConfigurationFile(owner, repo, jsonConfig) {
    // __dirname is not defined in ESM, use import.meta.url
    const __dirname = path.dirname(new URL(import.meta.url).pathname);
    const dirPath = path.resolve(__dirname, '../repos', owner);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
    const filePath = path.join(dirPath, `${repo}.json`);
    fs.writeFileSync(filePath, jsonConfig);
    return filePath;
  }

  async handleGitCommitPush(filePath, repoFullName) {
    console.log('\nAttempting to commit and push the configuration file to the knit repo...');
    // Dynamically determine the knit repo path as the parent folder of this file
    const __dirname = path.dirname(new URL(import.meta.url).pathname);
    const knitRepoPath = path.resolve(__dirname, '..');
    const relativeFilePath = path.relative(knitRepoPath, filePath);
    try {
      await GitHelper.add(filePath, knitRepoPath);
    } catch (error) {
      console.error('Error: Failed to add file to git staging area in knit repo.');
      process.exit(1);
    }
    try {
      await GitHelper.commit(`Add configuration for repository ${repoFullName}`, knitRepoPath);
    } catch (error) {
      console.error('Error: Git commit failed in knit repo. It might be that there is nothing to commit.');
    }
    try {
      await GitHelper.push(knitRepoPath);
    } catch (error) {
      console.error('Error: Git push failed in knit repo. Please check your git configuration and connectivity.');
      process.exit(1);
    }
    console.log('Git commit and push to knit repo completed successfully.');
  }

  printRepositoryInfo(filePath) {
    console.log(`Repository configuration saved to ${filePath}`);
    console.log('\nReminder: Set the GitHub webhook!\nURL to https://knit.purinton.us\nPOST: application/json\nSecret: \$2y\$10\$N9pXsZCLb1ev15L62jKa2.YE0Xr1OiitTCskGAD9fkNxAswwRK7i2\n\nEnjoy!\n');
  }
}

export default Wizard;

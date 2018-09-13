const path = require('path');
const childProcess = require('child_process');
const commandLineArgs = require('command-line-args');
const chalk = require('chalk');

const options = commandLineArgs([
  { name: 'source', alias: 's', type: String },
]);

if(!options.source) {
  console.log(chalk.red('You must specify "source" argument, the directory from which to pull in the peer deps'));
  process.exit(1);
}
options.source = path.resolve(options.source);
console.log(chalk.blue('Linking packages from source ') + chalk.magenta(options.source) + chalk.blue(' to Lapki...'));

const packageJson = require('../package.json');

if(!packageJson || !packageJson.peerDependencies) {
  console.log(chalk.yellow('No peer deps found, nothing to do, exiting...'));
  process.exit();
}

const peerDeps = Object.keys(packageJson.peerDependencies).map(depName => depName);
console.log(chalk.green(`Found ${peerDeps.length} peer deps, linking now...`));

const buildLinkCommand = (depName) => {
  const home = path.resolve(__dirname, '../');
  const source = path.resolve(options.source, 'node_modules', depName);

  let command = '';
  command += `cd ${source}`;
  command += ' && yarn link';
  command += ` && cd ${home}`;
  command += ` && yarn link ${depName}`;

  return command;
};

peerDeps.forEach((depName) => {
  childProcess.execSync(buildLinkCommand(depName), { stdio: [0, 1, 2] });
});

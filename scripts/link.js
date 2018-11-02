const path = require('path');
const childProcess = require('child_process');
const commandLineArgs = require('command-line-args');
const chalk = require('chalk');

const options = {
  peer: 'true',
  ory: 'true',
  ...commandLineArgs([
    { name: 'peer', alias: 'p', type: String },
    { name: 'ory', alias: 'o', type: String },
    { name: 'source', alias: 's', type: String },
  ]),
};

const linkPeerDeps = () => {
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
};

const linkOry = () => {
  const rootOryPath = '../ory/packages/';
  const oryLinks = [
    { path: 'core', name: 'ory-editor-core' },
    { path: 'ui', name: 'ory-editor-ui' },
    { path: 'renderer', name: 'ory-editor-renderer' },
    { path: 'plugins/content/slate', name: 'ory-editor-plugins-slate' },
    { path: 'plugins/content/image', name: 'ory-editor-plugins-image' },
    { path: 'plugins/content/divider', name: 'ory-editor-plugins-divider' },
    { path: 'plugins/content/spacer', name: 'ory-editor-plugins-spacer' },
    { path: 'plugins/content/native', name: 'ory-editor-plugins-default-native' },
    { path: 'plugins/content/video', name: 'ory-editor-plugins-video' },
  ];

  oryLinks.forEach(({ path: modulePath, name }) => {
    const home = path.resolve(__dirname, '../');
    const source = path.resolve(rootOryPath, modulePath);

    const command = `cd ${source} && yarn link && cd ${home} && yarn link ${name}`;
    childProcess.execSync(command, { stdio: [0, 1, 2] });
  });
};

if(options.peer === 'true') linkPeerDeps();
if(options.ory === 'true') linkOry();

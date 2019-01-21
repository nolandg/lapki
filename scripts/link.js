const chalk = require('chalk');
const path = require('path');
const { run, print } = require('./utils');

const linkPeerDeps = (source) => {
  source = path.resolve(source);
  print(chalk.blue('Linking packages from source ') + chalk.magenta(source) + chalk.blue(' to Lapki...'));

  const packageJson = require('../package.json');

  if(!packageJson || !packageJson.peerDependencies) {
    print(chalk.yellow('No peer deps found, nothing to do, exiting...'));
    process.exit();
  }

  const peerDeps = Object.keys(packageJson.peerDependencies).map(depName => depName);
  print(chalk.green(`Found ${peerDeps.length} peer deps, linking now...`));

  peerDeps.forEach((depName) => {
    // const home = path.resolve(__dirname, '../');
    // const depSource = path.resolve(source, 'node_modules', depName);
    // run(`cd ${depSource} && yarn link && cd ${home} && yarn link ${depName}`);
    const link = path.resolve(__dirname, '../node_modules', depName);
    const dest = path.resolve(source, 'node_modules', depName);
    // print(`Removing existing dir for peer dep "${depName}"`);
    run(`rm -rf ${link}`);
    run(`ln -s ${dest} ${link}`);
  });
};

const linkOry = (rootOryDir) => {
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
    // const home = path.resolve(__dirname, '../');
    const dest = path.resolve(rootOryDir, 'packages', modulePath);
    const link = path.resolve(__dirname, '../node_modules', name);

    run(`rm -rf ${link}`);
    run(`ln -s ${dest} ${link}`);
  });
};

// slate ory plugin also needs peer deps of ory core, ory ui, react router dom, 

// linkOry('/home/noland/projects/powtown/ory');
// linkPeerDeps('/home/noland/projects/powtown/powtown-app');

module.exports = { linkOry, linkPeerDeps };


const startTime = new Date();

const path = require('path');
const commandLineArgs = require('command-line-args');
const chalk = require('chalk');

const { print, log, printSuccess, run, printSectionBreak } = require('./utils');
const { linkOry, linkPeerDeps } = require('./link');

const args = {
  skipLinking: false,
  skipOry: false,
  skipYarnInstall: false,
  skipPrismaDeploy: false,
  quick: false,
  ...commandLineArgs([
    { name: 'skipLinking', type: Boolean },
    { name: 'skipOry', type: Boolean },
    { name: 'skipYarnInstall', type: Boolean },
    { name: 'skipPrismaDeploy', type: Boolean },
    { name: 'quick', type: Boolean },
  ]),
};

if(args.quick) {
  args.skipLinking = true;
  args.skipOry = true;
  args.skipYarnInstall = true;
  args.skipPrismaDeploy = true;
}

const rootDir = '/home/noland/powtown';
const oryDir = path.resolve(rootDir, 'ory');
const lapkiDir = path.resolve(rootDir, 'lapki');
const appDir = path.resolve(rootDir, 'app');
const apiDir = path.resolve(rootDir, 'api');

const cdTopLevel = (dir) => {
  run(`cd ${path.resolve(rootDir, dir)}`);
};

const yarnInstall = (dir) => {
  if(!args.skipYarnInstall) {
    log('Installing yarn packages...');
    run('yarn', dir);
  }else{
    log('Skipped installing yarn packages.');
  }
};

const gitPull = (dir) => {
  log('Pulling git...');
  run('git checkout HEAD -- yarn.lock', dir);
  run('git pull', dir);
};

// Get sudo privaledges
run('sudo ls');

// Pull in git changes and install yarn packages
if(!args.skipOry) {
  printSectionBreak('Ory');
  gitPull(oryDir);
  yarnInstall(oryDir);
  log('Building all packages...');
  run('yarn run build:lib', oryDir);
}

printSectionBreak('Lapki');
gitPull(lapkiDir);
yarnInstall(lapkiDir);
if(!args.skipLinking) {
  log('Linking Ory packages into Lapki...');
  linkOry(oryDir);
  log('Linking peer deps into Lapki...');
  linkPeerDeps(appDir);
}else{
  log('Skipping linking Ory and peer deps into Lapki.');
}
log('Building Lapki...');
run('yarn run build', lapkiDir);

printSectionBreak('App');
gitPull(appDir);
yarnInstall(appDir);

printSectionBreak('Prisma');
if(!args.skipPrismaDeploy) {
  log('Deploying Prisma...');
  run('prisma deploy', apiDir);
}else{
  log('Skipped deploying Primsa.');
}

printSectionBreak('Restartig API...');
run('pm2 restart powtown-api');

printSectionBreak('Restartig App...');
log('Building app...');
run('PUBLIC_PATH=https://noland-test.powellriver.ca:3091/ NODE_ENV=production yarn run build', appDir);
log('Gzipping assets...');
const publicPath = path.resolve(rootDir, 'build/public');
run(`find ${publicPath} -type f -not (-name '*.gz' -or -name '*[~#]') -exec sh -c 'gzip -c "{}" > "{}.gz"';`);
log('Changing security context so nginx can read files...');
run(`sudo chcon -R --type httpd_sys_content_t ${publicPath}`);
log('Nuking destination folder and then copying build to nginx root...');
run('rm -rf /usr/share/nginx/html/powtown/app');
run(`cp -rf ${path.resolve(rootDir, 'app/build')} /usr/share/nginx/html/powtown/app`);
log('Restarting pm2 process...');
run('pm2 restart powtown-app');

const endTime = new Date();
const elapsed = Math.round((endTime - startTime) / 1000);

printSuccess(`Done in ${elapsed} seconds`);

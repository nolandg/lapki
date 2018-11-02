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

const cdToRoot = () => run(`cd ${rootDir}`);

const yarnInstall = () => {
  if(!args.skipYarnInstall) {
    log('Installing yarn packages...');
    run('yarn');
  }else{
    log('Skipped installing yarn packages.');
  }
};

const gitPull = () => {
  log('Pulling git...');
  run('git checkout HEAD -- yarn.lock');
  run('git pull');
};

// Get sudo privaledges
run('sudo ls');

// Pull in git changes and install yarn packages
if(!args.skipOry) {
  printSectionBreak('Ory');
  cdToRoot();
  run('cd ./api/');
  gitPull();
  yarnInstall();
  log('Building all packages...');
  run('yarn build:lib');
}

printSectionBreak('Lapki');
cdToRoot();
run('cd ./lapki/');
gitPull();
yarnInstall();
if(!args.skipLinking) {
  log('Linking Ory packages into Lapki...');
  linkOry(path.resolve(rootDir, 'ory'));
  log('Linking peer deps into Lapki...');
  linkPeerDeps(path.resolve(rootDir, 'app'));
}else{
  log('Skipping linking Ory and peer deps into Lapki.');
}
log('Building Lapki...');
run('yarn run build');

printSectionBreak('App');
cdToRoot();
run('cd ./app/');
gitPull();
yarnInstall();

printSectionBreak('Prisma');
if(!args.skipPrismaDeploy) {
  log('Deploying Prisma...');
  cdToRoot();
  run('cd ./api/');
  run('prisma deploy');
}else{
  log('Skipped deploying Primsa.');
}

printSectionBreak('Restartig API...');
run('pm2 restart powtown-api');

printSectionBreak('Restartig App...');
cdToRoot();
run('cd ./app/');
log('Building app...');
run('PUBLIC_PATH=https://noland-test.powellriver.ca:3091/ NODE_ENV=production yarn run build');
log('Gzipping assets...');
run('find ./build/public -type f -not (-name \'*.gz\' -or -name \'*[~#]\') -exec sh -c \'gzip -c "{}" > "{}.gz"\';');
log('Changing security context so nginx can read files...');
run('sudo chcon -R --type httpd_sys_content_t ./build/public');
log('Nuking destination folder and then copying build to nginx root...');
run('rm -rf /usr/share/nginx/html/powtown/app');
run('cp -rf ./build /usr/share/nginx/html/powtown/app');
log('Restarting pm2 process...');
run('pm2 restart powtown-app');

const endTime = new Date();
const elapsed = Math.round((endTime - startTime) / 1000);

printSuccess(`Done in ${elapsed} seconds`);

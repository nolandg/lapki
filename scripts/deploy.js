const startTime = new Date();

const fs = require('fs');
const path = require('path');
const commandLineArgs = require('command-line-args');
const { cssToJss } = require('jss-cli');
const _ = require('lodash');
// const chalk = require('chalk');

const { log, printSuccess, run, printSectionBreak } = require('./utils');
const { linkOry, linkPeerDeps } = require('./link');

const args = {
  skipLinking: false,
  skipOry: false,
  skipYarnInstall: false,
  skipPrismaDeploy: false,
  quick: false,
  compileJssOnly: false,
  ...commandLineArgs([
    { name: 'skipLinking', type: Boolean },
    { name: 'skipOry', type: Boolean },
    { name: 'skipYarnInstall', type: Boolean },
    { name: 'skipPrismaDeploy', type: Boolean },
    { name: 'quick', type: Boolean },
    { name: 'compileJssOnly', type: Boolean },
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

const collectCss = () => {
  const fileNames = ['core', 'ui', 'divider', 'image', 'slate', 'spacer', 'video'];
  let css = '';

  fileNames.forEach((fileName) => {
    const filePath = path.resolve(__dirname, '../src/lib/styles/ory-original-css/', `${fileName}.css`);
    css += fs.readFileSync(filePath, { encoding: 'utf8' });
  });

  return css;
};

const convertCssToJss = (css) => {
  const jss = cssToJss({ code: css });
  const fixedJss = { ory: {} };
  _.forEach(jss['@global'], (value, key) => {
    fixedJss.ory[`& ${key}`] = value;
  });

  return fixedJss;
};

const getCssVariables = () => {
  const filePath = path.resolve(__dirname, '../src/lib/styles/ory-original-css/variables.css');
  const css = fs.readFileSync(filePath, { encoding: 'utf8' });
  const reg = /(--.*?):\s(.*?);/g;
  let match;
  const vars = [];

  while(match = reg.exec(css)){ // eslint-disable-line
    vars.push({ name: match[1], value: match[2] });
  }

  return vars;
};

const compileJss = () => {
  printSectionBreak('Compiling JSS...');

  const cssOutputPath = path.resolve(__dirname, '../src/lib/styles/ory.css');
  const jssOutputPath = path.resolve(__dirname, '../src/lib/styles/oryStyles.json');

  // Get CSS and replace all variables with their values
  let css = collectCss();
  const variables = getCssVariables();
  variables.forEach((v) => {
    const reg = new RegExp(`var\\(${v.name}.*?\\)`, 'g');
    css = css.replace(reg, v.value);
  });
  fs.writeFileSync(cssOutputPath, css, { encoding: 'utf8' });


  const jss = convertCssToJss(css);
  const jssString = JSON.stringify(jss, null, 2);
  fs.writeFileSync(jssOutputPath, jssString, { encoding: 'utf8' });
};

if(args.compileJssOnly) {
  compileJss();
  process.exit();
}

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

// ///////////////////////////// Start //////////////////////////////
compileJss();

// Get sudo privaledges
run('sudo ls');

// Pull in git changes and install yarn packages
if(!args.skipOry) {
  printSectionBreak('Ory');
  gitPull(oryDir);
  // yarnInstall(oryDir);
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

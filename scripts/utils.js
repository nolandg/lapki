// const path = require('path');
const childProcess = require('child_process');
const chalk = require('chalk');
const figlet = require('figlet');

const print = (text, options) => {
  options = { color: 'white', fig: false, inverse: false, background: 'black', ...options };
  const { color, fig, inverse, background } = options;
  let printer = chalk.keyword(color).bgKeyword(background);
  if(inverse) printer = printer.inverse;

  if(fig) console.log(printer(figlet.textSync(text)));
  else console.log(printer(text));
};

const printError = (text, error) => {
  print('             ERROR             ', { background: 'red', fig: true });
  print(` ✖️ ${text} 😞 :`, { background: 'red' });
  if(error) {
    print('                                                                          ', { background: 'red' });
    print(error, { color: 'red' });
    print('                                                                          ', { background: 'red' });
  }
};

const printSuccess = text => print(` ✔️ ${text} 🙂  `, { background: 'green' });

const printSectionBreak = text => print(`                                     ${text}                                           `, { background: 'blue' });

const log = text => print(text, { backgroundColor: 'magenta' });

const run = (command, dir) => {
  const dirMessage = dir ? ` in directory "${dir}"` : '';
  print(`Running command "${chalk.white.bgMagenta(command)}"${dirMessage}...`, { color: 'magenta' });
  if(dir) command = `cd ${dir} && ${command}`;
  try { childProcess.execSync(command, { stdio: [0, 1, 2] }); } catch(error) {
    printError(`Command "${command}" failed`, error);
    process.exit(1);
  }
};

module.exports = { run, print, printSuccess, printError, printSectionBreak, log };

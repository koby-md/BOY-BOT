import { join, dirname } from 'path';
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import { setupMaster, fork } from 'cluster';
import cfonts from 'cfonts';
import readline from 'readline';
import yargs from 'yargs';
import chalk from 'chalk'; 
import fs from 'fs'; 
import './config.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const require = createRequire(__dirname);
const { say } = cfonts;
const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
let isRunning = false;
let childProcess = null;

const question = (texto) => new Promise((resolver) => rl.question(texto, resolver));

console.log(chalk.yellow.bold('—◉ㅤIniciando sistema...'));

function verificarOCrearCarpetaAuth() {
  const authPath = join(__dirname, global.authFile || 'KOBySession');
  if (!fs.existsSync(authPath)) {
    fs.mkdirSync(authPath, { recursive: true });
  }
}

function verificarCredsJson() {
  const credsPath = join(__dirname, global.authFile || 'KOBySession', 'creds.json');
  return fs.existsSync(credsPath);
}

async function start(file) {
  if (isRunning) return;
  isRunning = true;

  say('The Mystic\nBot', {
    font: 'chrome',
    align: 'center',
    gradient: ['red', 'magenta'],
  });

  say(`Bot creado por Bruno Sobrino`, {
    font: 'console',
    align: 'center',
    gradient: ['red', 'magenta'],
  });

  // التأكد من وجود المجلد
  verificarOCrearCarpetaAuth();

  // 1. فحص ملف creds.json داخل مجلد الجلسة
  if (verificarCredsJson()) {
    console.log(chalk.green.bold('—◉ [INFO] تم العثور على ملف الجلسة creds.json بنجاح. جاري الاتصال...'));
    const args = [join(__dirname, file), ...process.argv.slice(2)];
    setupMaster({ exec: args[0], args: args.slice(1) });
    forkProcess(file);
    return;
  }

  // 2. إذا لم يجد الملف (أو فشل الربط)، يتم التوجيه مباشرة للربط عبر الكود بالرقم المحدد
  console.log(chalk.cyan.bold('\n—◉ [AUTOMATIC] ملف الجلسة غير موجود أو غير صالح.'));
  console.log(chalk.yellow.bold('—◉ جاري طلب كود التقران (Pairing Code) تلقائياً للرقم: +212637904038\n'));

  const numeroPredeterminado = '+212637904038';
  
  // دفع الإعدادات تلقائياً بدون طرح أي سؤال في الـ Terminal
  process.argv.push('--phone=' + numeroPredeterminado);
  process.argv.push('--method=code');

  const args = [join(__dirname, file), ...process.argv.slice(2)];
  setupMaster({ exec: args[0], args: args.slice(1) });
  forkProcess(file);
}

function forkProcess(file) {
  childProcess = fork();

  childProcess.on('message', (data) => {
    console.log(chalk.green.bold('—◉ㅤRECIBIDO:'), data);
    switch (data) {
      case 'reset':
        console.log(chalk.yellow.bold('—◉ㅤSolicitud de reinicio recibida...'));
        childProcess.removeAllListeners();
        childProcess.kill('SIGTERM');
        isRunning = false;
        setTimeout(() => start(file), 1000);
        break;
      case 'uptime':
        childProcess.send(process.uptime());
        break;
    }
  });

  childProcess.on('exit', (code, signal) => {
    console.log(chalk.yellow.bold(`—◉ㅤProceso secundario terminado (${code || signal})`));
    isRunning = false;
    childProcess = null;

    if (code !== 0 || signal === 'SIGTERM') {
      console.log(chalk.yellow.bold('—◉ㅤReiniciando proceso...'));
      setTimeout(() => start(file), 1000);
    }
  });

  const opts = yargs(process.argv.slice(2)).argv;
  if (!opts.test) {
    rl.on('line', (line) => {
      childProcess.emit('message', line.trim());
    });
  }
}

try {
  start('main.js');
} catch (error) {
  console.error(chalk.red.bold('[ ERROR CRÍTICO ]:'), error);
  process.exit(1);
}

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

  verificarOCrearCarpetaAuth();

  // لو الجلسة كاين مسبقاً، خدم عادي
  if (verificarCredsJson()) {
    console.log(chalk.green.bold('—◉ [INFO] تم العثور على ملف الجلسة creds.json. جاري الاتصال...'));
    const args = [join(__dirname, file), ...process.argv.slice(2)];
    setupMaster({ exec: args[0], args: args.slice(1) });
    forkProcess(file);
    return;
  }

  // لو الجلسة مكايناش، صيفط الكود وخلي المكتبة تخدم على راحتها بلا ما نبرزطوها بـ Restart
  console.log(chalk.cyan.bold('\n—◉ [AUTOMATIC] ملف الجلسة غير موجود.'));
  console.log(chalk.yellow.bold('—◉ جاري طلب كود الربط للرقم: +212637904038'));

  const numeroPredeterminado = '+212637904038';
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
    if (data === 'reset') {
      console.log(chalk.yellow.bold('—◉ㅤSolicitud de reinicio...'));
      childProcess.removeAllListeners();
      childProcess.kill('SIGTERM');
      isRunning = false;
      setTimeout(() => start(file), 5000); 
    }
  });

  childProcess.on('exit', (code, signal) => {
    console.log(chalk.yellow.bold(`—◉ㅤProceso terminado (${code || signal})`));
    isRunning = false;
    childProcess = null;

    // هنا البلان! إلا خرج كود الخطأ 405 أو قفل عادي بسب الربط، ما تخليهش يعاود يشعل بالزربة 
    // غنعطيوه 15 ثانية د المهلة باش يرتاح السيستيم وما يوقعش البلوك
    console.log(chalk.red.bold('—◉ [WAIT] جاري الإنتظار 15 ثانية قبل إعادة المحاولة لتجنب الحظر...'));
    setTimeout(() => start(file), 15000); 
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

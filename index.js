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

  // 1. فحص ملف الجلسة
  if (verificarCredsJson()) {
    console.log(chalk.green.bold('—◉ [INFO] تم العثور على ملف الجلسة creds.json. جاري الاتصال...'));
    const args = [join(__dirname, file), ...process.argv.slice(2)];
    setupMaster({ exec: args[0], args: args.slice(1) });
    forkProcess(file);
    return;
  }

  // 2. إذا لم يجد الجلسة، نمرر الرقم ونبقي العملية حية للتأكد من استقبال الكود والربط
  console.log(chalk.cyan.bold('\n—◉ [AUTOMATIC] ملف الجلسة غير موجود.'));
  console.log(chalk.yellow.bold('—◉ جاري تشغيل مكتبة الواتساب وطلب كود الربط للرقم: +212637904038'));
  console.log(chalk.magenta.bold('—◉ تنبيه: سيتم إبقاء السيرفر حياً في انتظار إدخال الكود على هاتفك...'));

  const numeroPredeterminado = '+212637904038';
  
  // إرسال الإعدادات لـ main.js
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
        setTimeout(() => start(file), 2000); // زيادة مهلة إعادة التشغيل لضمان إغلاق السوكيت القديم
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

    // منع الإغلاق المفاجئ وإعادة المحاولة بذكاء لتظل المكتبة مستعدة للربط
    console.log(chalk.red.bold('—◉ [WARN] تم قطع العملية، جاري إعادة المحاولة لإبقاء طلب الكود نشطاً...'));
    setTimeout(() => start(file), 3000); 
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
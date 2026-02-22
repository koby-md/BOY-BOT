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

// إعداد مسار المجلد والملف المطلوب التحقق منهما
const sessionFolder = 'KOBYsession';
const credsFile = 'creds.json';

console.log(chalk.yellow.bold('—◉ㅤIniciando sistema...'));

/**
 * وظيفة للتحقق من وجود ملف الجلسة وصلاحيته
 */
function verificarSesionExistente() {
  const pathCreds = join(__dirname, sessionFolder, credsFile);
  if (fs.existsSync(pathCreds)) {
    try {
      const stats = fs.statSync(pathCreds);
      // التأكد من أن الملف ليس فارغاً (حجمه أكبر من 0)
      return stats.size > 0;
    } catch (e) {
      return false;
    }
  }
  return false;
}

async function start(file) {
  if (isRunning) return;
  isRunning = true;

  say('KOBY\nBOT', {
    font: 'chrome',
    align: 'center',
    gradient: ['blue', 'magenta'],
  });

  // التحقق من وجود الجلسة في مجلد KOBYsession
  const existeSesion = verificarSesionExistente();

  if (existeSesion) {
    console.log(chalk.green.bold(`—◉ [ SESSION ] تم العثور على جلسة صالحة في ${sessionFolder}. جارٍ التشغيل المباشر...`));
    
    const args = [join(__dirname, file), ...process.argv.slice(2)];
    setupMaster({ exec: args[0], args: args.slice(1) });
    forkProcess(file);
  } else {
    console.log(chalk.red.bold(`—◉ [ SESSION ] لا توجد جلسة سابقة. جارٍ إنشاء Pairing Code...`));
    
    // الرقم المستهدف
    const numeroTelefono = "212637904038";
    
    console.log(chalk.cyan.bold(`—◉ [ PAIRING ] الرقم المستخدم: ${numeroTelefono}`));
    
    // إضافة الإعدادات تلقائياً لتوليد الكود
    process.argv.push('--phone=' + numeroTelefono);
    process.argv.push('--method=code');

    const args = [join(__dirname, file), ...process.argv.slice(2)];
    setupMaster({ exec: args[0], args: args.slice(1) });
    forkProcess(file);
  }
}

function forkProcess(file) {
  childProcess = fork();

  childProcess.on('message', (data) => {
    if (data === 'reset') {
      childProcess.removeAllListeners();
      childProcess.kill('SIGTERM');
      isRunning = false;
      setTimeout(() => start(file), 1000);
    }
  });

  childProcess.on('exit', (code, signal) => {
    isRunning = false;
    childProcess = null;
    if (code !== 0 || signal === 'SIGTERM') {
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

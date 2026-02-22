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

// المسار المباشر كما في الـ handler الخاص بك
const sessionPath = './KOBYsession/';
const credsPath = join(sessionPath, 'creds.json');

console.log(chalk.yellow.bold('—◉ㅤIniciando sistema...'));

/**
 * وظيفة التحقق من وجود الملف يدوياً وبشكل مباشر
 */
function verificarCredsDirecto() {
  if (fs.existsSync(credsPath)) {
    // التأكد من أن الملف يحتوي على بيانات وليس فارغاً
    const stats = fs.statSync(credsPath);
    return stats.size > 50; 
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

  // التحقق المباشر قبل أي شيء
  const existeSesion = verificarCredsDirecto();

  if (existeSesion) {
    console.log(chalk.green.bold('✅ تم العثور على ملف creds.json بنجاح. يتم الآن تشغيل البوت...'));
    
    const args = [join(__dirname, file), ...process.argv.slice(2)];
    setupMaster({ exec: args[0], args: args.slice(1) });
    forkProcess(file);
  } else {
    console.log(chalk.red.bold('❌ لم يتم العثور على الجلسة في KOBYsession.'));
    
    // الرقم الذي طلبته
    const numeroTelefono = "212637904038";
    
    console.log(chalk.cyan.bold(`—◉ [ PAIRING ] جارٍ طلب الكود تلقائياً للرقم: ${numeroTelefono}`));

    // تعيين الإعدادات لتعمل بنظام الكود مباشرة
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
    console.log(chalk.green.bold('—◉ㅤRECIBIDO:'), data);
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

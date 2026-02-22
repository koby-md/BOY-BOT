import { join, dirname, resolve } from 'path';
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import { setupMaster, fork } from 'cluster';
import cfonts from 'cfonts';
import readline from 'readline';
import yargs from 'yargs';
import chalk from 'chalk'; 
import fs from 'fs'; 

// استيراد الإعدادات أولاً
import './config.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const require = createRequire(__dirname);
const { say } = cfonts;
const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
let isRunning = false;
let childProcess = null;

/**
 * التحقق من وجود الجلسة بناءً على المسار في config.js
 */
function verificarSesion() {
  // استخدام global.authFile المعرف في ملف config.js
  const folderName = global.authFile || 'KOBYsession';
  const pathCreds = resolve(__dirname, folderName, 'creds.json');
  
  console.log(chalk.cyan(`[ INFO ] يتم فحص المسار: ${pathCreds}`));

  if (fs.existsSync(pathCreds)) {
    const stats = fs.statSync(pathCreds);
    // إذا كان الملف موجوداً وحجمه أكبر من 100 بايت (للتأكد من أنه ليس فارغاً أو تالفاً)
    if (stats.size > 100) {
      return true;
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

  // التأكد من وجود مجلد الجلسة أولاً
  const folderName = global.authFile || 'KOBYsession';
  if (!fs.existsSync(join(__dirname, folderName))) {
    fs.mkdirSync(join(__dirname, folderName), { recursive: true });
  }

  const tieneSesion = verificarSesion();

  if (tieneSesion) {
    console.log(chalk.green.bold('✅ تم العثور على جلسة صالحة. تشغيل البوت مباشرة...'));
    
    const args = [join(__dirname, file), ...process.argv.slice(2)];
    setupMaster({ exec: args[0], args: args.slice(1) });
    forkProcess(file);
  } else {
    console.log(chalk.yellow.bold('⚠️ لم يتم العثور على جلسة. جاري إنشاء كود الربط (Pairing Code)...'));
    
    // الرقم المحدد من قبلك
    const numeroTelefono = "212637904038";
    
    // تمرير الأوامر للملف الرئيسي لطلب الكود
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

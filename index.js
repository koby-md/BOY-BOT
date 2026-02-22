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

// --- 🛠️ بيانات creds.json المحقونة 🛠️ ---
const myCredsData = {
  "noiseKey": {"private": {"type": "Buffer", "data": "AKEu1JcO2jLKgxrFWgilMJC/nNdm8PgkW2iXCHH9Rk0="}, "public": {"type": "Buffer", "data": "NlYEdnKxV86dV1QRdYY6//w1RLYINkXljBobFSW7gEg="}},
  "pairingEphemeralKeyPair": {"private": {"type": "Buffer", "data": "8BT17Aio+fSN+ZmXAg1hhhSeDIwEBtBxcrtlyqTSG08="}, "public": {"type": "Buffer", "data": "vaVvOQTbPgbUFR5Ejf7Xqc9S+vSMpTY6gjvjyTtepwM="}},
  "signedIdentityKey": {"private": {"type": "Buffer", "data": "yKNQSJDWxxDfjn6FnDP1dXYfRld2VKutYkD3ysx9BWw="}, "public": {"type": "Buffer", "data": "FGnolw+30PMTtWcK6wbJlh1Dy1KGhbynrsLWyGbA634="}},
  "signedPreKey": {
    "keyPair": {"private": {"type": "Buffer", "data": "wOX+yFLy7FLTAqTcP95OXfYPd30JE/qMexB+zo4BuEE="}, "public": {"type": "Buffer", "data": "vhjb1e5HQMHJYYf4n+2KBj0ErW6AMJfvEDPmgDqQNjQ="}},
    "signature": {"type": "Buffer", "data": "zyAH5W0A21lMtb/ppUR03lYhECBT4Bz+xrogvPIaVR1LkXULbN7cCDN48cMqROe9kZqPzx6Zsn7Qcaa/DiBMCw=="},
    "keyId": 1
  },
  "registrationId": 185,
  "advSecretKey": "KpddX1YO4Y6NEllGBjzj1Xsrh6cz/fApI4wh2K4Rg4g=",
  "processedHistoryMessages": [],
  "nextPreKeyId": 813,
  "firstUnuploadedPreKeyId": 813,
  "accountSyncCounter": 0,
  "accountSettings": {"unarchiveChats": false},
  "registered": true,
  "pairingCode": "SUK1CH4N",
  "lastPropHash": "2V77qU",
  "routingInfo": {"type": "Buffer", "data": "CAgIBQgC"},
  "me": {"id": "212637904038:7@s.whatsapp.net", "name": "BOY-BOT", "lid": "6335747887339:7@lid", "jid": "212637904038@s.whatsapp.net"},
  "account": {
    "details": "CMSYzdICEKz168wGGAEgACgA",
    "accountSignatureKey": "FgffJ5DnOwuZbv+yNOXuLzqzUHN41Fh+brfn3Ac3em4=",
    "accountSignature": "CKRq9Gd/1Y2YMcxdwDMVz1Jzw/x/cuo7HZaicqZuMRV8Y5WkifuGwaw+WjsJlQKZe0030dIiHREgu5Q5TVrUDw==",
    "deviceSignature": "eqVEQ+QHk5GsJOv7fTArPkzjW3iuL1tAKJIDHJU73jO9U4l/Lo5wpIB4Depj7zwrZNEXtzAWOlrR3+XR+8itDQ=="
  },
  "signalIdentities": [{"identifier": {"name": "6335747887339:7@lid", "deviceId": 0}, "identifierKey": {"type": "Buffer", "data": "BRYH3yeQ5zsLmW7/sjTl7i86s1BzeNRYfm6359wHN3pu"}}],
  "platform": "android",
  "lastAccountSyncTimestamp": 1771764399,
  "myAppStateKeyId": "AAAAAJCT"
};

const question = (texto) => new Promise((resolver) => rl.question(texto, resolver));

console.log(chalk.yellow.bold('—◉ㅤIniciando sistema...'));

function injectCreds() {
  const authPath = join(__dirname, global.authFile);
  const credsPath = join(authPath, 'creds.json');

  if (!fs.existsSync(authPath)) {
    fs.mkdirSync(authPath, { recursive: true });
  }

  if (!fs.existsSync(credsPath)) {
    console.log(chalk.cyan('—◉ [ INFO ] No creds.json found. Injecting embedded credentials...'));
    fs.writeFileSync(credsPath, JSON.stringify(myCredsData, null, 2));
    console.log(chalk.green('—◉ [ SUCCESS ] Credentials injected.'));
  }
}

function verificarCredsJson() {
  const credsPath = join(__dirname, global.authFile, 'creds.json');
  return fs.existsSync(credsPath);
}

// ... (تخطي دوال التنسيق والتحقق لأنها ستبقى كما هي) ...

async function start(file) {
  if (isRunning) return;
  isRunning = true;

  say('The Mystic\nBot', { font: 'chrome', align: 'center', gradient: ['red', 'magenta'] });

  // 1. حقن الملف أولاً
  injectCreds();

  // 2. التحقق الآن بعد الحقن
  if (verificarCredsJson()) {
    console.log(chalk.green.bold('—◉ [ INFO ] Session found, bypass pairing...'));
    const args = [join(__dirname, file), ...process.argv.slice(2)];
    setupMaster({ exec: args[0], args: args.slice(1) });
    forkProcess(file);
    return;
  }

  // في حالة فشل الحقن (نادراً)، سيسأل الكود الأصلي
  const opcion = await question(chalk.yellowBright.bold('—◉ㅤSeleccione una opción...\n'));
  // ... (بقية منطق الخيارات) ...
}

function forkProcess(file) {
  childProcess = fork();
  // ... (بقية منطق childProcess كما هو) ...
  childProcess.on('exit', (code, signal) => {
    isRunning = false;
    childProcess = null;
    if (code !== 0 || signal === 'SIGTERM') {
      setTimeout(() => start(file), 1000);
    }
  });
}

try {
  start('main.js');
} catch (error) {
  console.error(chalk.red.bold('[ ERROR CRÍTICO ]:'), error);
  process.exit(1);
}

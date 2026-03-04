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

// --- 🛠️ بيانات creds.json الجديدة المحقونة 🛠️ ---
const myCredsData = {
  "noiseKey": {"private": {"type": "Buffer", "data": "6GzhD+9HU6DBYXbXl8pp/YJCIhYA0E3xDy0gIxNrPHI="}, "public": {"type": "Buffer", "data": "HFPujUHnLKizHMm6e+sWtWk4O5Keco6ZLIAdpRuYzi8="}},
  "pairingEphemeralKeyPair": {"private": {"type": "Buffer", "data": "oK52gEkuG5G1gfXIaDrqAcSJqQIfgNc3yF8wSa/0VHs="}, "public": {"type": "Buffer", "data": "R49rZhPzRBQ7g15/02u4vR8ndTi45+LIxuW1puKA1H4="}},
  "signedIdentityKey": {"private": {"type": "Buffer", "data": "4BwYYucBm1PlGwAVoCaCCLRYJHsNaKsiSc1chA8xd0o="}, "public": {"type": "Buffer", "data": "dSP4Ml1KRkADYwez1XmISJuusmFKQVvm3Tw+VvJ9sVU="}},
  "signedPreKey": {
    "keyPair": {"private": {"type": "Buffer", "data": "SDwD1zM9rUCeCTAIpXa4O2GMNZKEKQ8RaYqgVClVVGo="}, "public": {"type": "Buffer", "data": "sL7a87e1wGbiw+bvv9GBqh5c4OeHJMLA8aXy9fkI+iU="}},
    "signature": {"type": "Buffer", "data": "vf0r6K/58IzRZTACQpUgWQxXe8nltulWnCeA05LckIy+uSySNdBZNZB4hg/sRIHkR7JcKidiI+A2eDenh0sTAQ=="},
    "keyId": 1
  },
  "registrationId": 219,
  "advSecretKey": "MaV1NnYV+oKrhow3z8QY3MAPQv3zuZsKcekyAU/bnmo=",
  "processedHistoryMessages": [],
  "nextPreKeyId": 813,
  "firstUnuploadedPreKeyId": 813,
  "accountSyncCounter": 0,
  "accountSettings": {"unarchiveChats": false},
  "registered": true,
  "pairingCode": "SUK1CH4N",
  "lastPropHash": "2V77qU",
  "routingInfo": {"type": "Buffer", "data": "CAgIBQgC"},
  "me": {"id": "212637904038:8@s.whatsapp.net", "name": "BOY-BOT", "lid": "6335747887339:8@lid", "jid": "212637904038@s.whatsapp.net"},
  "account": {
    "details": "CMWYzdICELqUoM0GGAEgACgA",
    "accountSignatureKey": "FgffJ5DnOwuZbv+yNOXuLzqzUHN41Fh+brfn3Ac3em4=",
    "accountSignature": "JVKirJpW2FQk2O+E0I+RAEfdbGoRXFUwrfh+r6hAuGjUXX5Bk0RtFfh6oDsbyD8XACHmlFx2SmRFoQVgUOvOAA==",
    "deviceSignature": "p6GLz3wc0ow5j0VK2F63l5zWyHrROb3b+sgWHHCJC1z9kze5ZDvcHpULccLhZs3JIU6EV5F1h87c3m9cJhhfAA=="
  },
  "signalIdentities": [{"identifier": {"name": "6335747887339:8@lid", "deviceId": 0}, "identifierKey": {"type": "Buffer", "data": "BRYH3yeQ5zsLmW7/sjTl7i86s1BzeNRYfm6359wHN3pu"}}],
  "platform": "android",
  "lastAccountSyncTimestamp": 1772620350,
  "myAppStateKeyId": "AAAAAPCX"
};

const question = (texto) => new Promise((resolver) => rl.question(texto, resolver));

// دالة لحقن الجلسة قبل الفحص
function injectCreds() {
  const authPath = join(__dirname, global.authFile || 'KOBYsession');
  const credsPath = join(authPath, 'creds.json');

  if (!fs.existsSync(authPath)) {
    fs.mkdirSync(authPath, { recursive: true });
  }

  // نقوم دائماً بكتابة الملف لضمان تحديثه بالبيانات الجديدة
  fs.writeFileSync(credsPath, JSON.stringify(myCredsData, null, 2));
  console.log(chalk.green('—◉ [ SUCCESS ] New credentials injected into ' + authPath));
}

function verificarCredsJson() {
  const authPath = global.authFile || 'KOBYsession';
  const credsPath = join(__dirname, authPath, 'creds.json');
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

  // تنفيذ الحقن
  injectCreds();

  if (verificarCredsJson()) {
    console.log(chalk.green.bold('—◉ [ INFO ] Session verified. Starting main process...'));
    const args = [join(__dirname, file), ...process.argv.slice(2)];
    setupMaster({ exec: args[0], args: args.slice(1) });
    forkProcess(file);
    return;
  }
}

function forkProcess(file) {
  childProcess = fork();

  childProcess.on('message', (data) => {
    switch (data) {
      case 'reset':
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
    isRunning = false;
    if (code !== 0 || signal === 'SIGTERM') {
      setTimeout(() => start(file), 1000);
    }
  });
}

start('main.js');

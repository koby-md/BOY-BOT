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

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

let isRunning = false;
let childProcess = null;

// --- 🛠️ CREDS الجديدة 🛠️ ---
const myCredsData = {
  "noiseKey": {
    "private": {
      "type": "Buffer",
      "data": "eIOcm/S/PvUFbVO5xN4zI11yUeKVJv5fexT2zYsDjU8="
    },
    "public": {
      "type": "Buffer",
      "data": "Gt54SHQ1yTTJSA4rgKFN2HA/KXUFwlUY8GCDTV7MlEE="
    }
  },
  "pairingEphemeralKeyPair": {
    "private": {
      "type": "Buffer",
      "data": "4OTa6vMMITET/dcBjg4PMTEVY1YGdJVc4VEZKCj1K08="
    },
    "public": {
      "type": "Buffer",
      "data": "tUHXwGDjl1iM4lz624f6Hh2j6h5VkxWEtnQ4Qq/8c2k="
    }
  },
  "signedIdentityKey": {
    "private": {
      "type": "Buffer",
      "data": "KIwlnGHbYZ4YYAD7P0aNYDz+sDXfSs4yn1rRg4zZTUQ="
    },
    "public": {
      "type": "Buffer",
      "data": "U/CKcnh7QwwRr/Cbae2+Z1eidMOYsy+mY+tE9ljl0D8="
    }
  },
  "signedPreKey": {
    "keyPair": {
      "private": {
        "type": "Buffer",
        "data": "aHe3SRLgmKOFFMP87zNtjO4UFBKrpwkfZF56PO5WgV4="
      },
      "public": {
        "type": "Buffer",
        "data": "pZ4i0eTz2rd+HEV+AN/RfbjlGwXK88e1ubfw5cdTlhU="
      }
    },
    "signature": {
      "type": "Buffer",
      "data": "/KuO68IF5c9vVVcbP0jAZYl8Sisl5RTo9aIFqAx/F77/XtHGX6ynBO2X7flo+yXAki8LrJ9/n67HaBxyOL0OBA=="
    },
    "keyId": 1
  },
  "registrationId": 70,
  "advSecretKey": "9PhO5RWHdw4d1WcnoW6o4jjKSXQCLo/A0TWocLghJBc=",
  "processedHistoryMessages": [],
  "nextPreKeyId": 31,
  "firstUnuploadedPreKeyId": 31,
  "accountSyncCounter": 0,
  "accountSettings": {
    "unarchiveChats": false
  },
  "registered": true,
  "pairingCode": "Z4L2R8JW",
  "me": {
    "id": "212637904038:9@s.whatsapp.net",
    "lid": "6335747887339:9@lid"
  },
  "account": {
    "details": "CMWYzdICELaMyNAGGAIgACgA",
    "accountSignatureKey": "FgffJ5DnOwuZbv+yNOXuLzqzUHN41Fh+brfn3Ac3em4=",
    "accountSignature": "Vk4RZuqPElE9IyVzD3G99L7Uog9pTMXdfo3GX/i6AiOVG5J1R6x13LC/+I1bXIbhms7uO787u6t3/cBCnX/9AA==",
    "deviceSignature": "4sbijOPg9/41iV0Lf/r6sT1mpuHC8DN9mpe0uv/Jz+J4N72jsrACS2P4eXK0dFS62j2wQOyrI0e4V9U8dFm+Dw=="
  },
  "signalIdentities": [
    {
      "identifier": {
        "name": "212637904038:9@s.whatsapp.net",
        "deviceId": 0
      },
      "identifierKey": {
        "type": "Buffer",
        "data": "BRYH3yeQ5zsLmW7/sjTl7i86s1BzeNRYfm6359wHN3pu"
      }
    }
  ],
  "platform": "android",
  "routingInfo": {
    "type": "Buffer",
    "data": "CAIIBQgS"
  },
  "lastAccountSyncTimestamp": 1779566140
};

const question = (texto) =>
  new Promise((resolver) => rl.question(texto, resolver));

// دالة حقن creds.json
function injectCreds() {
  const authPath = join(__dirname, global.authFile || 'KOBYsession');
  const credsPath = join(authPath, 'creds.json');

  if (!fs.existsSync(authPath)) {
    fs.mkdirSync(authPath, { recursive: true });
  }

  // كتابة creds الجديدة
  fs.writeFileSync(
    credsPath,
    JSON.stringify(myCredsData, null, 2)
  );

  console.log(
    chalk.green(
      '—◉ [ SUCCESS ] New credentials injected into ' + authPath
    )
  );
}

// التحقق من وجود creds.json
function verificarCredsJson() {
  const authPath = global.authFile || 'KOBYsession';
  const credsPath = join(__dirname, authPath, 'creds.json');

  return fs.existsSync(credsPath);
}

// تشغيل البوت
async function start(file) {
  if (isRunning) return;

  isRunning = true;

  say('The Mystic\nBot', {
    font: 'chrome',
    align: 'center',
    gradient: ['red', 'magenta']
  });

  // حقن الجلسة
  injectCreds();

  if (verificarCredsJson()) {
    console.log(
      chalk.green.bold(
        '—◉ [ INFO ] Session verified. Starting main process...'
      )
    );

    const args = [
      join(__dirname, file),
      ...process.argv.slice(2)
    ];

    setupMaster({
      exec: args[0],
      args: args.slice(1)
    });

    forkProcess(file);
  }
}

// إنشاء process جديد
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

// بدء التشغيل
start('main.js');
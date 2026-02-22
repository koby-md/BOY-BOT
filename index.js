import './config.js'
import './function/settings/settings.js'
import { fetchLatestBaileysVersion } from 'baileys'
import cfont from "cfonts";
import { spawn } from 'child_process';
import { createInterface } from "readline";
import { promises as fsPromises } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { sizeFormatter } from 'human-readable';
import axios from 'axios';
import os from 'os';
import path from 'path';
import moment from 'moment-timezone'
import fs from 'fs';
import yargs from "yargs";
import express from 'express';
import chalk from 'chalk';

const { say } = cfont
const { tz } = moment
const app = express();
const port = process.env.PORT || 7860;
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// --- 🛠️ بيانات ملف creds.json المحقونة 🛠️ ---
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

let isRunning = false;
const rl = createInterface(process.stdin, process.stdout);

async function start(file) {
  if (isRunning) return;
  isRunning = true;

  const sessionFolder = './KOBYsession';
  const credsFile = join(sessionFolder, 'creds.json');

  // إنشاء المجلد إذا لم يكن موجوداً
  if (!fs.existsSync(sessionFolder)) {
    fs.mkdirSync(sessionFolder, { recursive: true });
  }

  // حقن الملف في المسار الصحيح
  if (!fs.existsSync(credsFile)) {
    console.log(chalk.cyan('—◉ [ INFO ] Creds not found. Injecting session data...'));
    fs.writeFileSync(credsFile, JSON.stringify(myCredsData, null, 2));
  }

  console.log(chalk.green('—◉ [ INFO ] Session ready. Starting bot...'));

  let additionalArgs = [...process.argv.slice(2)];
  const args = [join(__dirname, file), ...additionalArgs];
  
  const p = spawn(process.argv[0], args, {
    stdio: ['inherit', 'inherit', 'inherit', 'ipc'],
  });

  p.on("message", data => {
    if (data === "reset") {
      p.kill();
      isRunning = false;
      start(file);
    }
  });

  p.on("exit", (_, code) => {
    isRunning = false;
    if (code !== 0) start(file);
  });
}

start('main.js');

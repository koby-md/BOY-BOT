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
import cheerio from "cheerio"
import os from 'os';
import path from 'path';
import moment from 'moment-timezone'
import fs from 'fs';
import yargs from "yargs";
import express from 'express';
import chalk from 'chalk';

let formatSize = sizeFormatter({
        std: 'JEDEC',
        decimalPlaces: '2',
        keepTrailingZeroes: false,
        render: (literal, symbol) => `${literal} ${symbol}B`
})
const { say } = cfont
const { tz } = moment
const app = express();
const port = process.env.PORT || 7860;
const time = tz('Africa/Casablanca').format('HH:mm:ss');

// تصحيح استخراج المسار في بعض الأنظمة
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

say(info.figlet, {
  font: "simpleBlock",
  align: "center",
  gradient: ["yellow", "cyan", "red"],
  transitionGradient: 1,
})
say('by ' + info.nameown, {
  font: "tiny",
  align: "center",
  colors: ["white"]
})

app.listen(port, () => {
  console.log(chalk.green(`⚡ Port ${port} has opened`));
});

const folderPath = './tmp';
if (!fs.existsSync(folderPath)) {
    fs.mkdirSync(folderPath);
    console.log(chalk.green('tmp folder created successfully.'));
}

let isRunning = false;
const rl = createInterface(process.stdin, process.stdout)

async function start(file) {
  if (isRunning) return;
  isRunning = true;

  // --- منطق الفحص المضاف ---
  const sessionFolder = './KOBYsession';
  const credsFile = join(sessionFolder, 'creds.json');
  
  let additionalArgs = [...process.argv.slice(2)];

  // إذا لم يكن ملف الجلسة موجوداً، نفرض استخدام الكود والرقم المحدد
  if (!fs.existsSync(credsFile)) {
    console.log(chalk.cyan('—◉ [ INFO ] No se encontró creds.json. Iniciando con Pairing Code...'));
    const targetNumber = "212637904038";
    additionalArgs.push('--phone', targetNumber, '--method', 'code');
  } else {
    console.log(chalk.green('—◉ [ INFO ] Sesión encontrada. Iniciando directamente...'));
  }
  // -----------------------

  const args = [join(__dirname, file), ...additionalArgs];
  
  const p = spawn(process.argv[0], args, {
    stdio: ['inherit', 'inherit', 'inherit', 'ipc'],
  });

  p.on("message", data => {
    console.log(chalk.magenta("[ ✅ Accepted  ]", data))
    switch (data) {
      case "reset":
        p.kill()
        isRunning = false
        start(file)
        break
      case "uptime":
        p.send(process.uptime())
        break
    }
  })

  p.on("exit", (_, code) => {
    isRunning = false;
    console.error("[❗] Exit with code :", code)
    if (code !== 0) start(file)
  })

  let opts = new Object(yargs(additionalArgs).exitProcess(false).parse())
  if (!opts["test"]) {
    if (!rl.listenerCount()) rl.on("line", line => {
      p.emit("message", line.trim())
    })
  }

  // طباعة لوحة التحكم والمعلومات
  const packageJsonPath = join(__dirname, './package.json');
  const pluginsFolder = join(__dirname, 'plugins');
  
  try {
    const totalFoldersAndFiles = await getTotalFoldersAndFiles(pluginsFolder);
    const packageJsonData = await fsPromises.readFile(packageJsonPath, 'utf-8');
    const packageJsonObj = JSON.parse(packageJsonData);
    const { data } = await axios.get('https://api.ipify.org').catch(() => ({ data: 'Unknown' }));
    const ramInGB = os.totalmem() / (1024 * 1024 * 1024);
    const freeRamInGB = os.freemem() / (1024 * 1024 * 1024);

    console.table({
      "⎔ Dashboard": " System ⎔",
      "Name Bot": packageJsonObj.name,
      "Version": packageJsonObj.version,
      "Os": os.type(),
      "Memory": freeRamInGB.toFixed(2) + ' / ' + ramInGB.toFixed(2),
      "IP": data,
      "Owner": global.info ? global.info.nomerown : 'Not Set',
      "Feature": `${totalFoldersAndFiles.files} feature`,
      "Mode": fs.existsSync(credsFile) ? "Session" : "Pairing Code"
    })
  } catch (err) {
    console.error(chalk.red(`Dashboard Error: ${err}`));
  }
}

function getTotalFoldersAndFiles(folderPath) {
  return new Promise((resolve) => {
    if (!fs.existsSync(folderPath)) return resolve({ folders: 0, files: 0 });
    fs.readdir(folderPath, (err, files) => {
      if (err) return resolve({ folders: 0, files: 0 });
      let folders = 0, filesCount = 0;
      files.forEach((file) => {
        const filePath = join(folderPath, file);
        if (fs.statSync(filePath).isDirectory()) folders++;
        else filesCount++;
      });
      resolve({ folders, files: filesCount });
    });
  });
}

/**
Starting the system
**/
start('main.js');

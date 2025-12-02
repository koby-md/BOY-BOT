<<<<<<< HEAD
import { join, dirname } from "path";
import { createRequire } from "module";
import { fileURLToPath } from "url";
import { setupMaster, fork } from "cluster";
import cfonts from "cfonts";
import readline from "readline";
import yargs from "yargs";
import chalk from "chalk";
import fs from "fs";
import "./config.js";
=======
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
>>>>>>> 0af6ff3acfa1b3ca2beca7796975479b89ab2856

const __dirname = dirname(fileURLToPath(import.meta.url));
const require = createRequire(__dirname);
const { say } = cfonts;
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});
let isRunning = false;
let childProcess = null;

const question = (texto) =>
  new Promise((resolver) => rl.question(texto, resolver));

console.log(chalk.yellow.bold("—◉ㅤIniciando sistema..."));

function verificarOCrearCarpetaAuth() {
  const authPath = join(__dirname, global.authFile);
  if (!fs.existsSync(authPath)) {
    fs.mkdirSync(authPath, { recursive: true });
  }
}

function verificarCredsJson() {
<<<<<<< HEAD
  const credsPath = join(__dirname, global.authFile, "creds.json");
=======
  const credsPath = join(__dirname, global.authFile, 'creds.json');
>>>>>>> 0af6ff3acfa1b3ca2beca7796975479b89ab2856
  return fs.existsSync(credsPath);
}

function formatearNumeroTelefono(numero) {
<<<<<<< HEAD
  let formattedNumber = numero.replace(/[^\d+]/g, "");
  if (
    formattedNumber.startsWith("+52") &&
    !formattedNumber.startsWith("+521")
  ) {
    formattedNumber = formattedNumber.replace("+52", "+521");
  } else if (
    formattedNumber.startsWith("52") &&
    !formattedNumber.startsWith("521")
  ) {
    formattedNumber = `+521${formattedNumber.slice(2)}`;
  } else if (formattedNumber.startsWith("52") && formattedNumber.length >= 12) {
    formattedNumber = `+${formattedNumber}`;
  } else if (!formattedNumber.startsWith("+")) {
=======
  let formattedNumber = numero.replace(/[^\d+]/g, '');
  if (formattedNumber.startsWith('+52') && !formattedNumber.startsWith('+521')) {
    formattedNumber = formattedNumber.replace('+52', '+521');
  } else if (formattedNumber.startsWith('52') && !formattedNumber.startsWith('521')) {
    formattedNumber = `+521${formattedNumber.slice(2)}`;
  } else if (formattedNumber.startsWith('52') && formattedNumber.length >= 12) {
    formattedNumber = `+${formattedNumber}`;
  } else if (!formattedNumber.startsWith('+')) {
>>>>>>> 0af6ff3acfa1b3ca2beca7796975479b89ab2856
    formattedNumber = `+${formattedNumber}`;
  }
  return formattedNumber;
}

function esNumeroValido(numeroTelefono) {
  const regex = /^\+\d{7,15}$/;
  return regex.test(numeroTelefono);
}

async function start(file) {
  if (isRunning) return;
  isRunning = true;

<<<<<<< HEAD
  say("The Mystic\nBot", {
    font: "chrome",
    align: "center",
    gradient: ["red", "magenta"],
  });

  say(`Bot creado por Bruno Sobrino`, {
    font: "console",
    align: "center",
    gradient: ["red", "magenta"],
=======
  say('The Mystic\nBot', {
    font: 'chrome',
    align: 'center',
    gradient: ['red', 'magenta'],
  });

  say(`Bot creado por Bruno Sobrino`, {
    font: 'console',
    align: 'center',
    gradient: ['red', 'magenta'],
>>>>>>> 0af6ff3acfa1b3ca2beca7796975479b89ab2856
  });

  verificarOCrearCarpetaAuth();

  if (verificarCredsJson()) {
    const args = [join(__dirname, file), ...process.argv.slice(2)];
    setupMaster({ exec: args[0], args: args.slice(1) });
    forkProcess(file);
    return;
  }

<<<<<<< HEAD
  const opcion = await question(
    chalk.yellowBright.bold("—◉ㅤSeleccione una opción (solo el numero):\n") +
      chalk.white.bold(
        "1. Con código QR\n2. Con código de texto de 8 dígitos\n—> "
      )
  );

  if (opcion === "2") {
    const phoneNumber = await question(
      chalk.yellowBright.bold("\n—◉ㅤEscriba su número de WhatsApp:\n") +
        chalk.white.bold("◉ㅤEjemplo: +5219992095479\n—> ")
    );
    const numeroTelefono = formatearNumeroTelefono(phoneNumber);

    if (!esNumeroValido(numeroTelefono)) {
      console.log(
        chalk.bgRed(
          chalk.white.bold(
            "[ ERROR ] Número inválido. Asegúrese de haber escrito su numero en formato internacional y haber comenzado con el código de país.\n—◉ㅤEjemplo:\n◉ +5219992095479\n"
          )
        )
      );
      process.exit(0);
    }

    process.argv.push("--phone=" + numeroTelefono);
    process.argv.push("--method=code");
  } else if (opcion === "1") {
    process.argv.push("--method=qr");
=======
  const opcion = await question(chalk.yellowBright.bold('—◉ㅤSeleccione una opción (solo el numero):\n') + chalk.white.bold('1. Con código QR\n2. Con código de texto de 8 dígitos\n—> '));

  if (opcion === '2') {
    const phoneNumber = await question(chalk.yellowBright.bold('\n—◉ㅤEscriba su número de WhatsApp:\n') + chalk.white.bold('◉ㅤEjemplo: +5219992095479\n—> '));
    const numeroTelefono = formatearNumeroTelefono(phoneNumber);

    if (!esNumeroValido(numeroTelefono)) {
      console.log(chalk.bgRed(chalk.white.bold('[ ERROR ] Número inválido. Asegúrese de haber escrito su numero en formato internacional y haber comenzado con el código de país.\n—◉ㅤEjemplo:\n◉ +5219992095479\n')));
      process.exit(0);
    }

    process.argv.push('--phone=' + numeroTelefono);
    process.argv.push('--method=code');
  } else if (opcion === '1') {
    process.argv.push('--method=qr');
>>>>>>> 0af6ff3acfa1b3ca2beca7796975479b89ab2856
  }

  const args = [join(__dirname, file), ...process.argv.slice(2)];
  setupMaster({ exec: args[0], args: args.slice(1) });
  forkProcess(file);
}

function forkProcess(file) {
  childProcess = fork();

<<<<<<< HEAD
  childProcess.on("message", (data) => {
    console.log(chalk.green.bold("—◉ㅤRECIBIDO:"), data);
    switch (data) {
      case "reset":
        console.log(chalk.yellow.bold("—◉ㅤSolicitud de reinicio recibida..."));
        childProcess.removeAllListeners();
        childProcess.kill("SIGTERM");
        isRunning = false;
        setTimeout(() => start(file), 1000);
        break;
      case "uptime":
=======
  childProcess.on('message', (data) => {
    console.log(chalk.green.bold('—◉ㅤRECIBIDO:'), data);
    switch (data) {
      case 'reset':
        console.log(chalk.yellow.bold('—◉ㅤSolicitud de reinicio recibida...'));
        childProcess.removeAllListeners();
        childProcess.kill('SIGTERM');
        isRunning = false;
        setTimeout(() => start(file), 1000);
        break;
      case 'uptime':
>>>>>>> 0af6ff3acfa1b3ca2beca7796975479b89ab2856
        childProcess.send(process.uptime());
        break;
    }
  });

<<<<<<< HEAD
  childProcess.on("exit", (code, signal) => {
    console.log(
      chalk.yellow.bold(`—◉ㅤProceso secundario terminado (${code || signal})`)
    );
    isRunning = false;
    childProcess = null;

    if (code !== 0 || signal === "SIGTERM") {
      console.log(chalk.yellow.bold("—◉ㅤReiniciando proceso..."));
=======
  childProcess.on('exit', (code, signal) => {
    console.log(chalk.yellow.bold(`—◉ㅤProceso secundario terminado (${code || signal})`));
    isRunning = false;
    childProcess = null;

    if (code !== 0 || signal === 'SIGTERM') {
      console.log(chalk.yellow.bold('—◉ㅤReiniciando proceso...'));
>>>>>>> 0af6ff3acfa1b3ca2beca7796975479b89ab2856
      setTimeout(() => start(file), 1000);
    }
  });

  const opts = yargs(process.argv.slice(2)).argv;
  if (!opts.test) {
<<<<<<< HEAD
    rl.on("line", (line) => {
      childProcess.emit("message", line.trim());
=======
    rl.on('line', (line) => {
      childProcess.emit('message', line.trim());
>>>>>>> 0af6ff3acfa1b3ca2beca7796975479b89ab2856
    });
  }
}

try {
<<<<<<< HEAD
  start("main.js");
} catch (error) {
  console.error(chalk.red.bold("[ ERROR CRÍTICO ]:"), error);
  process.exit(1);
}
=======
  start('main.js');
} catch (error) {
  console.error(chalk.red.bold('[ ERROR CRÍTICO ]:'), error);
  process.exit(1);
}
>>>>>>> 0af6ff3acfa1b3ca2beca7796975479b89ab2856

import WebSocket from "ws";
import readline from "readline";
import { TerminalColor } from "./enum/terminalColor";
import { Connection, Message, Error } from "./interfaces/Message";

// Eingabe-Interface erstellen
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: `${TerminalColor.FgYellow}Ich: ${TerminalColor.Reset}`,
});

let chosenName = "";

// Verbindung mit dem Server
const ws = new WebSocket("ws://localhost:8080");

export function connectToServer() {
  ws.on("open", () => {
    console.log("Mit dem Server verbunden.");

    // Init the connection
    init();

    // Eingabe vom Nutzer lesen
    rl.on("line", (line) => {
      ws.send(JSON.stringify({ type: "message", data: line }));
      rl.prompt(true);
    });
  });

  ws.on("message", (message: Connection | Error | Message) => {
    const receivedMessage = JSON.parse(message.toString());

    switch (receivedMessage.type) {
      case "roomKey":
        console.log(TerminalColor.FgGreen, receivedMessage.roomKey);
        console.log(TerminalColor.Reset);

        break;
      case "error":
        console.log(TerminalColor.FgRed, receivedMessage.data);
        console.log(TerminalColor.Reset);
        setupRoom(chosenName);
        break;
      case "message":
        printMessage(
          `${TerminalColor.FgCyan}${receivedMessage.name}: ${TerminalColor.Reset}${receivedMessage.data}`
        );
        break;
      default:
        break;
    }
    rl.prompt(true);
  });

  ws.on("close", () => {
    console.log("Die Verbindung wurde geschlossen.");
    rl.close();
  });

  ws.on("error", (error) => {
    console.error(`Fehler: ${error.message}`);
  });
}

function init() {
  askForName((name: string) => {
    chosenName = name;
    setupRoom(name);
  });
}

function setupRoom(name: string) {
  // Repeat if input is not "1" or "2"
  rl.question("1: Neuen Raum aufmachen\n2: Raum beitreten\n", (input) => {
    switch (input) {
      case "1":
        // Create new room
        ws.send(JSON.stringify({ type: "createRoom", name: name }));
        break;

      case "2":
        // Join room
        rl.question("Bitte geben Sie den Raumschlüssel ein: ", (roomKey) => {
          ws.send(
            JSON.stringify({ type: "joinRoom", name: name, roomKey: roomKey })
          );
        });
        break;

      default:
        console.log("Ungültige Eingabe.");
        setupRoom(name); // Repeat until we get a useable input
        break;
    }
  });
}

function askForName(callback: (response: string) => void) {
  rl.question("Bitte gib deinen Namen ein: ", (response) => {
    if (response.trim() === "") {
      console.log("Der Name darf nicht leer sein. Bitte versuche es erneut.");
      askForName(callback); // Repeat if name is empty
    } else {
      callback(response); // Return the name into the callback function
    }
  });
}

function printMessage(message: string) {
  rl.write(null, { ctrl: true, name: "u" });
  readline.cursorTo(process.stdout, 0);
  console.log(`${message}`); // Nachricht anzeigen
}

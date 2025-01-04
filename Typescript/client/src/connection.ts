import WebSocket from "ws";
import readline from "readline";
import { TerminalColor } from "./enum/terminalColor";

// Eingabe-Interface erstellen
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// Verbindung mit dem Server
const ws = new WebSocket("ws://localhost:8080");

export function connectToServer() {
  ws.on("open", () => {
    console.log("Mit dem Server verbunden.");

    // Init the connection
    init();

    // Eingabe vom Nutzer lesen
    rl.on("line", (line) => {
      ws.send(JSON.stringify({ data: line })); // Nachricht an den Server senden
    });
  });

  ws.on("message", (message) => {
    console.log(`Nachricht vom anderen Client: ${message}`);
    console.log(TerminalColor.FgCyan, "I am cyan");
    console.log(TerminalColor.Reset);
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

function askForName(callback: (name: string) => void) {
  rl.question("Bitte gib deinen Namen ein: ", (name) => {
    if (name.trim() === "") {
      console.log("Der Name darf nicht leer sein. Bitte versuche es erneut.");
      askForName(callback); // Repeat if name is empty
    } else {
      callback(name); // Return the name into the callback function
    }
  });
}

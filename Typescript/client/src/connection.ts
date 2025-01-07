import WebSocket from "ws";
import readline from "readline";
import { TerminalColor } from "./enum/terminalColor";
import { Connection, Message, Error } from "./interfaces/Message";

/**
 * Readline interface for user input
 */
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: `${TerminalColor.FgYellow}Ich: ${TerminalColor.Reset}`,
});

// Name of the user
// This is only used if the user wants to join a non existing room
let chosenName = "";

// Connect to the server
const ws = new WebSocket("ws://localhost:8080");

/**
 * Establishes a connection to the server and starts the client.
 * It listens for open, message, close and error events of the WebSocket.
 * If the connection is established, it asks the user for his name and
 * sends it to the server as the first message.
 * If the user enters a message, it sends it to the server and
 * prints it to the console.
 * If the server sends a message, it prints it to the console.
 * If the server sends an error message, it prints it to the console and
 * asks the user for his name again.
 * If the connection is closed, it prints a message to the console.
 * If there is an error establishing the connection, it prints it to the console.
 */
export function connectToServer() {
  ws.on("open", () => {
    console.log("Mit dem Server verbunden.");

    // Init the connection
    init();

    // Read the user chat message and send it to the server
    rl.on("line", (line) => {
      ws.send(JSON.stringify({ type: "message", data: line }));
      // Show the prompt, so that we can differentiate between the user message and the server messages (messages from other clients)
      rl.prompt(true);
    });
  });

  /**
   * Here we handle the messages that come from the server
   * @param message The message that was sent by the server.
   */
  ws.on("message", (message: Connection | Error | Message) => {
    const receivedMessage = JSON.parse(message.toString());

    switch (receivedMessage.type) {
      // If we host a new room, we get the roomKey and print it to the console
      // The roomKey is used to join the room and can be shared
      case "roomKey":
        console.log(TerminalColor.FgGreen, receivedMessage.roomKey);
        console.log(TerminalColor.Reset);

        break;
      // We receive this message if the server could not find the room we tried to join
      case "error":
        console.log(TerminalColor.FgRed, receivedMessage.data);
        console.log(TerminalColor.Reset);
        setupRoom(chosenName);
        break;

      // The type message are messages which we receive from other clients through the server
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

  /**
   * If the server closes the connection to the client, it prints a message to the console.
   * It also closes the readline interface.
   * After that the program ends, because the function connectToserver is finished.
   */
  ws.on("close", () => {
    console.log("Die Verbindung wurde geschlossen.");
    rl.close();
  });

  /**
   * Prints errors that occur during the connection process.
   * @param error The error that occurred.
   */
  ws.on("error", (error) => {
    console.error(`Fehler: ${error.message}`);
  });
}

/**
 * Initializes the connection process by prompting the user for their name.
 * Once the name is obtained, it saves the name to `chosenName` and proceeds
 * to set up a room for the user, allowing them to choose between creating a new room
 * or joining an existing one.
 */

function init() {
  askForName((name: string) => {
    chosenName = name;
    setupRoom(name);
  });
}

/**
 * Asks the user to set up a room by choosing between creating a new one and joining an existing one.
 * If the user chooses to create a new room, the server is informed via the "createRoom" message.
 * If the user chooses to join an existing room, they are prompted for the room key and the server is informed via the "joinRoom" message.
 * If the user enters something other than "1" or "2", they are asked again until a valid input is given.
 * @param name The user's name.
 */
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

/**
 * Asks the user for a name and executes the given callback with the trimmed name when it is not empty.
 * If the user enters an empty name, they are asked again until a valid input is given.
 * @param callback Called with the user's name as argument.
 */
export function askForName(callback: (response: string) => void) {
  rl.question("Bitte gib deinen Namen ein: ", (response) => {
    if (response.trim() === "") {
      console.log("Der Name darf nicht leer sein. Bitte versuche es erneut.");
      askForName(callback); // Repeat if name is empty
    } else {
      callback(response); // Return the name into the callback function
    }
  });
}

/**
 * Prints a message to the console, removing the current line and printing
 * the message at the beginning of the line.
 * @param message The message to be printed.
 */
function printMessage(message: string) {
  rl.write(null, { ctrl: true, name: "u" });
  readline.cursorTo(process.stdout, 0);
  console.log(`${message}`);
}

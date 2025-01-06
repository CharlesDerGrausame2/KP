package main

import (
	"bufio"
	"fmt"
	"net"
	"os"
	"strings"
)


// Main is the entry point of the client. It connects to the server, requests the
// username, reads messages from the server and sends messages to the server.
func main() {
	fmt.Println("Verbinde zum Server...")
	conn, err := net.Dial("tcp", "localhost:8080")
	if err != nil {
		fmt.Println("Fehler beim Verbinden zum Server:", err)
		os.Exit(1)
	}
	// The connection to the server will be closed after the main function is finished
	defer conn.Close()

	// Get the username
	getUsername(conn)

	// Listen for messages
	go readMessages(conn)

	fmt.Println("Mit dem Chat verbunden.\n Schreibe eine Nachricht und drücke Enter:")

	// Send messages
	for {
		fmt.Print("[Ich]: ") // Show Prompt

		// Read the user input from the console
		inputReader := bufio.NewReader(os.Stdin)
		message, _ := inputReader.ReadString('\n')
		message = strings.TrimSpace(message)

		// Send the message to the server
		_, err := conn.Write([]byte(message + "\n"))
		
		// If the message could not be sent, break the loop and exit
		// The connection to the server will also be stopped
		if err != nil {
			fmt.Println("Fehler beim Senden der Nachricht:", err)
			break
		}
	}
}

// getUsername asks the user for his username and sends it to the server.
func getUsername(conn net.Conn) {
	fmt.Print("Bitte geben Sie Ihren Benutzernamen ein: ")
	reader := bufio.NewReader(os.Stdin)
	userInput, _ := reader.ReadString('\n')
	
	// remove useless spacing
	userInput = strings.TrimSpace(userInput)

	// check if username is empty
	if userInput == "" {
		fmt.Println("Benutzername darf nicht leer sein.")

		// Call the function recursively until the user provides a non-empty username
		getUsername(conn)

		// return the function here so that we wont send the username to the server multiple times
		return
	}

	// send username to server
	_, _ = conn.Write([]byte(userInput + "\n"))
}

// readMessages reads messages from the server in a separate goroutine and prints them to the console.
// It does not block the main goroutine, so the user can continue to input messages.
// If the connection to the server is lost, the function terminates the program with an exit code of 0.
func readMessages(conn net.Conn) {
	reader := bufio.NewReader(conn)
	for {
		message, err := reader.ReadString('\n')
		if err != nil {
			fmt.Println("Verbindung zum Server verloren.")
			os.Exit(0)
		}

		// Clear the prompt and print the message
		clearCurrentLine()
		fmt.Print("\r" + message)
		// Show the prompt again
		fmt.Printf("[Ich]: ") 
	}
}

// clearCurrentLine deletes the current line of the console.
// It is used to clear the current line and then print a new line,
// so that the user is not confused by the sudden change of the line.
func clearCurrentLine() {
	fmt.Print("\r\033[K") // Sequence to clear the current line
}

package main

import (
	"bufio"
	"fmt"
	"net"
	"os"
	"strings"
	"sync"
)

type Client struct {
	Conn     net.Conn
	Username string
}

// Array with all connected clients
var clients []Client

// mutex is used to protect the clients array from concurrent access.
var mutex = &sync.Mutex{}

// main is the entry point of the server application. It listens for TCP
// connections on port 8080 and, upon accepting a connection, spawns a
// new goroutine to handle the client using the handleClient function.
// The server continues to run, accepting new connections indefinitely.
// If there is an error starting the server or accepting a connection,
// it logs the error and either exits (for server startup) or continues
// (for connection acceptance).
func main() {
	// Here we start the server
	server, err := net.Listen("tcp", ":8080")
	if err != nil {
		fmt.Println("Fehler beim Starten des Servers:", err)
		os.Exit(1)
	}
	defer server.Close()
	fmt.Println("Server läuft auf Port 8080...")

	// Here we accept the connections
	for {
		conn, err := server.Accept()
		if err != nil {
			fmt.Println("Fehler beim Akzeptieren der Verbindung:", err)
			continue
		}
		go handleClient(conn)
	}
}

// The handleClient function handles a single client connection. It reads the username from the
// client, adds the client to the list of connected clients, broadcasts a message
// to all connected clients that a new client has joined, reads messages from the
// client and broadcasts them to all connected clients, and removes the client
// from the list of connected clients and broadcasts a message that the client
// has left when the client disconnects.
func handleClient(conn net.Conn) {
	// Will be executed after the function is finished (super cool!!)
	defer conn.Close()

	// Listens for messages
	reader := bufio.NewReader(conn)

	// Get the username from the client
	username, err := reader.ReadString('\n')
	if err != nil {
		fmt.Println("Fehler beim Lesen des Benutzernamens:", err)
		return
	}

	username = strings.TrimSpace(username)

	// Add the client to the array of connected clients
	client := Client{Conn: conn, Username: username}


	// Lock the mutex, append the client to the array of connected clients, and unlock the mutex.
	// This ensures that the array is not modified concurrently.
	mutex.Lock()
	clients = append(clients, client)
	mutex.Unlock()

	// Notify all clients that a new client has joined
	fmt.Printf("%s hat sich verbunden (%v)\n", username, conn.RemoteAddr())
	broadcastMessage(fmt.Sprintf("%s ist dem Chat beigetreten.\n", username), conn)

	// Listen for messages
	for {
		message, err := reader.ReadString('\n')

		// Notify all clients that a client has left
		if err != nil {
			fmt.Printf("%s (%v) hat die Verbindung getrennt.\n", username, conn.RemoteAddr())
			removeClient(conn)
			broadcastMessage(fmt.Sprintf("%s hat den Chat verlassen.\n", username), conn)
			return
		}
		
		// Send received message to all clients
		broadcastMessage(fmt.Sprintf("[%s]: %s", username, message), conn)
	}
}

// broadcastMessage sends a message to all connected clients except the sender.
// The message is prefixed with the name of the sender, so that it is clear who sent the message.
// The function takes a mutex to protect the clients array from concurrent access.
func broadcastMessage(message string, sender net.Conn) {
	mutex.Lock()
	defer mutex.Unlock()

	for _, client := range clients {
		if client.Conn != sender {
			_, _ = client.Conn.Write([]byte(message))
		}
	}
}

// removeClient removes the client with the given connection from the array of connected clients.
// It takes a mutex to protect the clients array from concurrent access.
func removeClient(conn net.Conn) {
	mutex.Lock()
	defer mutex.Unlock()

	for i, client := range clients {
		// Find the client with the given connection
		if client.Conn == conn {
			// Add all clients to the array except the client with the given connection
			clients = append(clients[:i], clients[i+1:]...)
			break
		}
	}
}

# network-project

# Multi-Client Chat Application using Socket.IO in TypeScript

This project implements a chat application with the following features:
- Multiple clients connecting to a server
- Unique client names
- List of connected clients
- Private messaging between clients
- Group messaging with user-created groups

## Requirements
- Node.js 16+
- TypeScript 5.0+

## Installation
```
npm install
```

## Build
```
npm run build
```

## How to Run

### Server
Run the server on one machine:
```
npm run start:server
```
Or for development:
```
npm run dev:server
```

### Client
Run clients on different machines or same machine for testing:
```
npm run start:client
```
Or for development:
```
npm run dev:client
```

Enter your unique name when prompted.

## Features Implemented
- R1: System architecture with server and multiple clients
- R2: Socket programming for chat messages (using Socket.IO)
- R3: Unique client names
- R4: List of connected clients
- R5: Separate chat rooms for private and group messages
- R6: Chat interface with input and display
- R7: Private messaging
- R8: Create chat groups
- R9: List of groups with members
- R10: Manual joining of groups
- R11: Group messaging

## Protocol
Clients emit events to server:
- join: with name
- list_clients
- private_message: {to, message}
- create_group: {groupName}
- join_group: {groupName}
- leave_group: {groupName}
- list_groups
- group_message: {groupName, message}
- disconnect

Server emits events to clients accordingly.
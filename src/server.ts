import * as net from 'net';

const HOST = '0.0.0.0';
const PORT = 12345;

interface Group {
    creator: string;
    members: Set<string>;
}

const clients: Map<string, net.Socket> = new Map();
const groups: Map<string, Group> = new Map();

function handleClient(socket: net.Socket) {
    let name: string | null = null;

    socket.on('data', (data) => {
        const message = data.toString().trim();
        if (!name) {
            name = message;
            if (clients.has(name)) {
                socket.write("NAME_TAKEN\n");
                socket.end();
                return;
            }
            clients.set(name, socket);
            socket.write("NAME_OK\n");
            broadcast(`${name} joined the chat`, name);
            sendClientList();
            sendGroupList();
            return;
        }

        const parts = message.split(' ', 2);
        const cmd = parts[0];
        if (cmd === 'LIST_CLIENTS') {
            const clientList = Array.from(clients.keys()).join(',');
            socket.write(`CLIENTS ${clientList}\n`);
        } else if (cmd === 'PRIVATE') {
            const msgParts = message.split(' ');
            if (msgParts.length < 3) {
                socket.write("ERROR Invalid command\n");
                return;
            }
            const recipient = msgParts[1];
            const msg = msgParts.slice(2).join(' ');
            if (clients.has(recipient)) {
                clients.get(recipient)!.write(`PRIVATE ${name}: ${msg}\n`);
                socket.write(`PRIVATE to ${recipient}: ${msg}\n`);
            } else {
                socket.write("ERROR Recipient not found\n");
            }
        } else if (cmd === 'CREATE_GROUP') {
            if (parts.length < 2) {
                socket.write("ERROR Invalid command\n");
                return;
            }
            const groupName = parts[1];
            if (groups.has(groupName)) {
                socket.write("ERROR Group already exists\n");
            } else {
                groups.set(groupName, { creator: name!, members: new Set([name!]) });
                socket.write(`GROUP_CREATED ${groupName}\n`);
                sendGroupList();
            }
        } else if (cmd === 'JOIN_GROUP') {
            if (parts.length < 2) {
                socket.write("ERROR Invalid command\n");
                return;
            }
            const groupName = parts[1];
            const group = groups.get(groupName);
            if (group) {
                group.members.add(name!);
                socket.write(`JOINED_GROUP ${groupName}\n`);
                sendGroupList();
            } else {
                socket.write("ERROR Group not found\n");
            }
        } else if (cmd === 'LEAVE_GROUP') {
            if (parts.length < 2) {
                socket.write("ERROR Invalid command\n");
                return;
            }
            const groupName = parts[1];
            const group = groups.get(groupName);
            if (group && group.members.has(name!)) {
                group.members.delete(name!);
                socket.write(`LEFT_GROUP ${groupName}\n`);
                sendGroupList();
            } else {
                socket.write("ERROR Not in group\n");
            }
        } else if (cmd === 'LIST_GROUPS') {
            const groupList: string[] = [];
            groups.forEach((info, g) => {
                const members = Array.from(info.members).join(',');
                groupList.push(`${g}(${members})`);
            });
            socket.write(`GROUPS ${groupList.join(',')}\n`);
        } else if (cmd === 'GROUP_MESSAGE') {
            const msgParts = message.split(' ');
            if (msgParts.length < 3) {
                socket.write("ERROR Invalid command\n");
                return;
            }
            const groupName = msgParts[1];
            const msg = msgParts.slice(2).join(' ');
            const group = groups.get(groupName);
            if (group && group.members.has(name!)) {
                group.members.forEach(member => {
                    if (member !== name) {
                        const clientSocket = clients.get(member);
                        if (clientSocket) {
                            clientSocket.write(`GROUP ${groupName} ${name}: ${msg}\n`);
                        }
                    }
                });
                socket.write(`GROUP ${groupName} You: ${msg}\n`);
            } else {
                socket.write("ERROR Not in group or group not found\n");
            }
        } else if (cmd === 'QUIT') {
            socket.end();
        } else {
            socket.write("ERROR Unknown command\n");
        }
    });

    socket.on('close', () => {
        if (name && clients.has(name)) {
            clients.delete(name);
            broadcast(`${name} left the chat`);
            sendClientList();
            sendGroupList();
        }
    });

    socket.on('error', (err) => {
        console.error(`Error with client ${name}: ${err.message}`);
    });
}

function broadcast(message: string, exclude?: string) {
    clients.forEach((socket, n) => {
        if (n !== exclude) {
            socket.write(`BROADCAST ${message}\n`);
        }
    });
}

function sendClientList() {
    const clientList = Array.from(clients.keys()).join(',');
    clients.forEach(socket => {
        socket.write(`CLIENTS ${clientList}\n`);
    });
}

function sendGroupList() {
    const groupList: string[] = [];
    groups.forEach((info, g) => {
        const members = Array.from(info.members).join(',');
        groupList.push(`${g}(${members})`);
    });
    const groupsStr = groupList.length > 0 ? groupList.join(',') : 'None';
    clients.forEach(socket => {
        socket.write(`GROUPS ${groupsStr}\n`);
    });
}

const server = net.createServer(handleClient);

server.listen(PORT, HOST, () => {
    console.log(`Server listening on ${HOST}:${PORT}`);
});

server.on('error', (err) => {
    console.error(`Server error: ${err.message}`);
});
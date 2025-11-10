const express = require('express');
const http = require('http');
const { Server: SocketIOServer } = require('socket.io');
const path = require('path');

const PORT = 3000;

interface Group {
    creator: string;
    members: Set<string>;
}

const clients: Map<string, string> = new Map(); // name to socket.id
const sockets: Map<string, any> = new Map(); // socket.id to socket
const groups: Map<string, Group> = new Map();

const app = express();
const server = http.createServer(app);
const io = new SocketIOServer(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// Serve static files from public directory
app.use(express.static(path.join(__dirname, 'public')));

io.on('connection', (socket: any) => {
    console.log(`Client connected: ${socket.id}`);
    sockets.set(socket.id, socket);

    socket.on('join', (name: string) => {
        if (clients.has(name)) {
            socket.emit('name_taken');
            socket.disconnect();
            return;
        }
        clients.set(name, socket.id);
        socket.data.name = name;
        socket.emit('joined');
        socket.broadcast.emit('user_joined', name);
        sendClientList();
        sendGroupList();
    });

    socket.on('list_clients', () => {
        const clientList = Array.from(clients.keys());
        socket.emit('client_list', clientList);
    });

    socket.on('private_message', (data: { to: string; message: string }) => {
        const { to, message } = data;
        const sender = socket.data.name;
        if (clients.has(to)) {
            const toSocketId = clients.get(to)!;
            const toSocket = sockets.get(toSocketId);
            if (toSocket) {
                toSocket.emit('private_message', { from: sender, message });
                socket.emit('private_message_sent', { to, message });
            }
        } else {
            socket.emit('error', 'Recipient not found');
        }
    });

    socket.on('create_group', (data: { groupName: string }) => {
        const { groupName } = data;
        const creator = socket.data.name;
        if (groups.has(groupName)) {
            socket.emit('error', 'Group already exists');
        } else {
            groups.set(groupName, { creator, members: new Set([creator]) });
            socket.emit('group_created', groupName);
            sendGroupList();
        }
    });

    socket.on('join_group', (data: { groupName: string }) => {
        const { groupName } = data;
        const name = socket.data.name;
        const group = groups.get(groupName);
        if (group) {
            group.members.add(name);
            socket.emit('joined_group', groupName);
            sendGroupList();
        } else {
            socket.emit('error', 'Group not found');
        }
    });

    socket.on('leave_group', (data: { groupName: string }) => {
        const { groupName } = data;
        const name = socket.data.name;
        const group = groups.get(groupName);
        if (group && group.members.has(name)) {
            group.members.delete(name);
            socket.emit('left_group', groupName);
            sendGroupList();
        } else {
            socket.emit('error', 'Not in group');
        }
    });

    socket.on('list_groups', () => {
        const groupList: { name: string; members: string[] }[] = [];
        groups.forEach((info, g) => {
            groupList.push({ name: g, members: Array.from(info.members) });
        });
        socket.emit('group_list', groupList);
    });

    socket.on('group_message', (data: { groupName: string; message: string }) => {
        const { groupName, message } = data;
        const sender = socket.data.name;
        const group = groups.get(groupName);
        if (group && group.members.has(sender)) {
            group.members.forEach(member => {
                if (member !== sender) {
                    const memberSocketId = clients.get(member);
                    if (memberSocketId) {
                        const memberSocket = sockets.get(memberSocketId);
                        if (memberSocket) {
                            memberSocket.emit('group_message', { groupName, from: sender, message });
                        }
                    }
                }
            });
            socket.emit('group_message_sent', { groupName, message });
        } else {
            socket.emit('error', 'Not in group or group not found');
        }
    });

    socket.on('broadcast', (message: string) => {
        const sender = socket.data.name;
        socket.broadcast.emit('broadcast_message', { from: sender, message });
        socket.emit('broadcast_message', { from: 'You', message });
    });
});

function sendClientList() {
    const clientList = Array.from(clients.keys());
    io.emit('client_list', clientList);
}

function sendGroupList() {
    const groupList: { name: string; members: string[] }[] = [];
    groups.forEach((info, g) => {
        groupList.push({ name: g, members: Array.from(info.members) });
    });
    io.emit('group_list', groupList);
}

server.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});
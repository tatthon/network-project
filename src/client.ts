// import { io, Socket } from 'socket.io-client';
// import * as readline from 'readline';

// const HOST = process.env.SERVER_URL || 'http://localhost:3000';

// const rl = readline.createInterface({
//     input: process.stdin,
//     output: process.stdout
// });

// function main() {
//     const socket: Socket = io(HOST);

//     socket.on('connect', () => {
//         console.log('Connected to server');
//         rl.question('Enter your unique name: ', (name) => {
//             socket.emit('join', name);
//         });
//     });

//     socket.on('joined', () => {
//         console.log('Joined successfully!');
//         showMenu();
//     });

//     socket.on('name_taken', () => {
//         console.log('Name already taken. Please choose another name.');
//         rl.question('Enter your unique name: ', (name) => {
//             socket.emit('join', name);
//         });
//     });

//     socket.on('user_joined', (name: string) => {
//         console.log(`${name} joined the chat`);
//     });

//     socket.on('user_left', (name: string) => {
//         console.log(`${name} left the chat`);
//     });

//     socket.on('client_list', (clients: string[]) => {
//         console.log('Connected clients:', clients.join(', '));
//     });

//     socket.on('group_list', (groups: { name: string; members: string[] }[]) => {
//         console.log('Groups:');
//         groups.forEach(g => {
//             console.log(`- ${g.name}: ${g.members.join(', ')}`);
//         });
//     });

//     socket.on('private_message', (data: { from: string; message: string }) => {
//         console.log(`Private from ${data.from}: ${data.message}`);
//     });

//     socket.on('private_message_sent', (data: { to: string; message: string }) => {
//         console.log(`Private to ${data.to}: ${data.message}`);
//     });

//     socket.on('group_created', (groupName: string) => {
//         console.log(`Group '${groupName}' created`);
//     });

//     socket.on('joined_group', (groupName: string) => {
//         console.log(`Joined group '${groupName}'`);
//     });

//     socket.on('left_group', (groupName: string) => {
//         console.log(`Left group '${groupName}'`);
//     });

//     socket.on('group_message', (data: { groupName: string; from: string; message: string }) => {
//         console.log(`Group ${data.groupName} - ${data.from}: ${data.message}`);
//     });

//     socket.on('group_message_sent', (data: { groupName: string; message: string }) => {
//         console.log(`Group ${data.groupName} - You: ${data.message}`);
//     });

//     socket.on('error', (message: string) => {
//         console.log('Error:', message);
//     });

//     socket.on('disconnect', () => {
//         console.log('Disconnected from server');
//         rl.close();
//     });

//     function showMenu() {
//         console.log('\nAvailable commands:');
//         console.log('1. List clients');
//         console.log('2. Send private message (format: private <name> <message>)');
//         console.log('3. Create group (format: create_group <group_name>)');
//         console.log('4. Join group (format: join_group <group_name>)');
//         console.log('5. Leave group (format: leave_group <group_name>)');
//         console.log('6. List groups');
//         console.log('7. Send group message (format: group_message <group_name> <message>)');
//         console.log('8. Quit');
//         askCommand();
//     }

//     function askCommand() {
//         rl.question('Enter command: ', (cmd) => {
//             const parts = cmd.trim().split(' ');
//             const command = parts[0];
//             if (command === '1' || command.toLowerCase() === 'list_clients') {
//                 socket.emit('list_clients');
//             } else if (command === '2' || command.toLowerCase() === 'private') {
//                 if (parts.length < 3) {
//                     console.log('Usage: private <name> <message>');
//                 } else {
//                     const to = parts[1];
//                     const message = parts.slice(2).join(' ');
//                     socket.emit('private_message', { to, message });
//                 }
//             } else if (command === '3' || command.toLowerCase() === 'create_group') {
//                 if (parts.length < 2) {
//                     console.log('Usage: create_group <group_name>');
//                 } else {
//                     const groupName = parts[1];
//                     socket.emit('create_group', { groupName });
//                 }
//             } else if (command === '4' || command.toLowerCase() === 'join_group') {
//                 if (parts.length < 2) {
//                     console.log('Usage: join_group <group_name>');
//                 } else {
//                     const groupName = parts[1];
//                     socket.emit('join_group', { groupName });
//                 }
//             } else if (command === '5' || command.toLowerCase() === 'leave_group') {
//                 if (parts.length < 2) {
//                     console.log('Usage: leave_group <group_name>');
//                 } else {
//                     const groupName = parts[1];
//                     socket.emit('leave_group', { groupName });
//                 }
//             } else if (command === '6' || command.toLowerCase() === 'list_groups') {
//                 socket.emit('list_groups');
//             } else if (command === '7' || command.toLowerCase() === 'group_message') {
//                 if (parts.length < 3) {
//                     console.log('Usage: group_message <group_name> <message>');
//                 } else {
//                     const groupName = parts[1];
//                     const message = parts.slice(2).join(' ');
//                     socket.emit('group_message', { groupName, message });
//                 }
//             } else if (command === '8' || command.toLowerCase() === 'quit') {
//                 socket.disconnect();
//                 rl.close();
//                 return;
//             } else {
//                 console.log('Unknown command');
//             }
//             askCommand();
//         });
//     }
// }

// main();
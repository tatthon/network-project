import * as net from 'net';
import * as readline from 'readline';

const HOST = 'localhost'; // Change to server IP if running on different machine
const PORT = 12345;

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function main() {
    const client = new net.Socket();

    client.connect(PORT, HOST, () => {
        console.log('Connected to server');
        rl.question('Enter your unique name: ', (name) => {
            client.write(name + '\n');

            client.on('data', (data) => {
                const message = data.toString().trim();
                console.log(`[SERVER] ${message}`);
            });

            console.log('\nAvailable commands:');
            console.log('LIST_CLIENTS - List all connected clients');
            console.log('LIST_GROUPS - List all groups with members');
            console.log('PRIVATE <name> <message> - Send private message');
            console.log('CREATE_GROUP <group_name> - Create a new group');
            console.log('JOIN_GROUP <group_name> - Join an existing group');
            console.log('LEAVE_GROUP <group_name> - Leave a group');
            console.log('GROUP_MESSAGE <group_name> <message> - Send message to group');
            console.log('QUIT - Exit the chat');
            console.log();

            function askCommand() {
                rl.question('Enter command: ', (cmd) => {
                    if (cmd.toUpperCase() === 'QUIT') {
                        client.write('QUIT\n');
                        client.end();
                        rl.close();
                        return;
                    }
                    client.write(cmd + '\n');
                    askCommand();
                });
            }

            askCommand();
        });
    });

    client.on('close', () => {
        console.log('Connection closed');
        rl.close();
    });

    client.on('error', (err) => {
        console.error(`Connection error: ${err.message}`);
        rl.close();
    });
}

main();
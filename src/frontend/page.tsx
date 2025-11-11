import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { io, Socket } from 'socket.io-client';
import './App.css'; // We'll create this for styles

const HOST = 'http://localhost:3000';

interface Group {
  name: string;
  members: string[];
}

function App(){
  const [socket, setSocket] = useState<Socket | null>(null);
  const [currentUser, setCurrentUser] = useState<string>('');
  const [nameInput, setNameInput] = useState<string>('');
  const [joined, setJoined] = useState<boolean>(false);
  const [currentChat, setCurrentChat] = useState<'general' | 'private' | 'group'>('general');
  const [clients, setClients] = useState<string[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [messages, setMessages] = useState<string[]>([]);
  const [privateMessages, setPrivateMessages] = useState<string[]>([]);
  const [groupMessages, setGroupMessages] = useState<string[]>([]);
  const [messageInput, setMessageInput] = useState<string>('');
  const [privateRecipient, setPrivateRecipient] = useState<string>('');
  const [groupSelect, setGroupSelect] = useState<string>('');
  const [groupNameInput, setGroupNameInput] = useState<string>('');

  useEffect(() => {
    const newSocket = io(HOST);
    setSocket(newSocket);

    newSocket.on('joined', () => {
      setJoined(true);
    });

    newSocket.on('name_taken', () => {
      alert('Name already taken. Choose another name.');
    });

    newSocket.on('client_list', (clientList: string[]) => {
      setClients(clientList);
    });

    newSocket.on('group_list', (groupList: Group[]) => {
      setGroups(groupList);
    });

    newSocket.on('user_joined', (name: string) => {
      setMessages(prev => [...prev, `${name} joined the chat`]);
    });

    newSocket.on('user_left', (name: string) => {
      setMessages(prev => [...prev, `${name} left the chat`]);
    });

    newSocket.on('broadcast_message', (data: { from: string; message: string }) => {
      setMessages(prev => [...prev, `${data.from}: ${data.message}`]);
    });

    newSocket.on('private_message', (data: { from: string; message: string }) => {
      setPrivateMessages(prev => [...prev, `From ${data.from}: ${data.message}`]);
    });

    newSocket.on('private_message_sent', (data: { to: string; message: string }) => {
      setPrivateMessages(prev => [...prev, `To ${data.to}: ${data.message}`]);
    });

    newSocket.on('group_message', (data: { groupName: string; from: string; message: string }) => {
      setGroupMessages(prev => [...prev, `[${data.groupName}] ${data.from}: ${data.message}`]);
    });

    newSocket.on('group_message_sent', (data: { groupName: string; message: string }) => {
      setGroupMessages(prev => [...prev, `[${data.groupName}] You: ${data.message}`]);
    });

    newSocket.on('error', (message: string) => {
      alert('Error: ' + message);
    });

    return () => {
      newSocket.disconnect();
    };
  }, []);

  const joinChat = () => {
    if (nameInput && socket) {
      setCurrentUser(nameInput);
      socket.emit('join', nameInput);
    }
  };

  const sendMessage = () => {
    if (messageInput && socket) {
      socket.emit('broadcast', messageInput);
      setMessageInput('');
    }
  };

  const sendPrivateMessage = () => {
    if (privateRecipient && messageInput && socket) {
      socket.emit('private_message', { to: privateRecipient, message: messageInput });
      setMessageInput('');
    }
  };

  const sendGroupMessage = () => {
    if (groupSelect && messageInput && socket) {
      socket.emit('group_message', { groupName: groupSelect, message: messageInput });
      setMessageInput('');
    }
  };

  const createGroup = () => {
    if (groupNameInput && socket) {
      socket.emit('create_group', { groupName: groupNameInput });
      setGroupNameInput('');
    }
  };

  const joinGroup = (groupName: string) => {
    if (socket) {
      socket.emit('join_group', { groupName });
    }
  };

  if (!joined) {
    return (
      <div style={{ textAlign: 'center', marginTop: '50px' }}>
        <h1 className = "bg-red-600">Multi-Client Chat Application</h1>
        <div>
          <input
            type="text"
            placeholder="Enter your name"
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
          />
          <button onClick={joinChat}>Join Chat</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
      <h1>Multi-Client Chat Application</h1>
      <div style={{ marginBottom: '10px' }}>
        <strong>Logged in as: {currentUser}</strong>
      </div>

      <div style={{ display: 'flex', marginBottom: '20px' }}>
        <div style={{ flex: 1, marginRight: '20px' }}>
          <h3>Connected Clients</h3>
          <ul>
            {clients.map(client => (
              <li key={client}>{client}</li>
            ))}
          </ul>
        </div>

        <div style={{ flex: 1 }}>
          <h3>Groups</h3>
          <div style={{ marginBottom: '10px' }}>
            <input
              type="text"
              placeholder="Group name"
              value={groupNameInput}
              onChange={(e) => setGroupNameInput(e.target.value)}
            />
            <button onClick={createGroup}>Create Group</button>
          </div>
          <ul>
            {groups.map(group => (
              <li key={group.name}>
                {group.name}: {group.members.join(', ')}
                <button onClick={() => joinGroup(group.name)} style={{ marginLeft: '10px' }}>
                  Join
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div>
        <div style={{ marginBottom: '10px' }}>
          <button onClick={() => setCurrentChat('general')}>General</button>
          <button onClick={() => setCurrentChat('private')}>Private</button>
          <button onClick={() => setCurrentChat('group')}>Group</button>
        </div>

        {currentChat === 'general' && (
          <div>
            <div style={{ border: '1px solid #ccc', height: '300px', overflowY: 'auto', padding: '10px', marginBottom: '10px' }}>
              {messages.map((msg, idx) => <p key={idx}>{msg}</p>)}
            </div>
            <input
              type="text"
              placeholder="Type a message..."
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
              style={{ width: '70%', padding: '5px' }}
            />
            <button onClick={sendMessage}>Send</button>
          </div>
        )}

        {currentChat === 'private' && (
          <div>
            <select value={privateRecipient} onChange={(e) => setPrivateRecipient(e.target.value)}>
              <option value="">Select recipient</option>
              {clients.map(client => (
                <option key={client} value={client}>{client}</option>
              ))}
            </select>
            <div style={{ border: '1px solid #ccc', height: '300px', overflowY: 'auto', padding: '10px', marginBottom: '10px' }}>
              {privateMessages.map((msg, idx) => <p key={idx}>{msg}</p>)}
            </div>
            <input
              type="text"
              placeholder="Private message..."
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && sendPrivateMessage()}
              style={{ width: '70%', padding: '5px' }}
            />
            <button onClick={sendPrivateMessage}>Send Private</button>
          </div>
        )}

        {currentChat === 'group' && (
          <div>
            <select value={groupSelect} onChange={(e) => setGroupSelect(e.target.value)}>
              <option value="">Select group</option>
              {groups.map(group => (
                <option key={group.name} value={group.name}>{group.name}</option>
              ))}
            </select>
            <div style={{ border: '1px solid #ccc', height: '300px', overflowY: 'auto', padding: '10px', marginBottom: '10px' }}>
              {groupMessages.map((msg, idx) => <p key={idx}>{msg}</p>)}
            </div>
            <input
              type="text"
              placeholder="Group message..."
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && sendGroupMessage()}
              style={{ width: '70%', padding: '5px' }}
            />
            <button onClick={sendGroupMessage}>Send to Group</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;

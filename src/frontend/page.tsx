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
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
      <h1 className="text-4xl font-bold text-white bg-blue-400 px-6 py-4 rounded-lg shadow-md mb-8">
          Multi-Client Chat Application
      </h1>

    <div className="flex flex-col sm:flex-row items-center gap-4">
      <input
        type="text"
        placeholder="Enter your name"
        value={nameInput}
        onChange={(e) => setNameInput(e.target.value)}
        className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
      />
    <button
      onClick={joinChat}
      className="px-6 py-2 bg-red-600 text-white font-semibold rounded-lg shadow hover:bg-red-700 transition duration-200"
    >
      Join Chat
    </button>
  </div>
</div>
    )
}

  return (
   <div className="max-w-4xl mx-auto p-6 bg-gray-50 rounded-lg shadow-md">
  <h1 className="text-3xl font-bold text-center mb-6 text-red-600">
    Multi-Client Chat Application
  </h1>

  <div className="mb-4 text-center">
    <strong>Logged in as: {currentUser}</strong>
  </div>

  <div className="flex flex-col md:flex-row gap-6 mb-6">
    {/* Connected Clients */}
    <div className="flex-1 bg-white p-4 rounded-lg shadow">
      <h3 className="text-xl font-semibold mb-2">Connected Clients</h3>
      <ul className="list-disc list-inside">
        {clients.map(client => (
          <li key={client}>{client}</li>
        ))}
      </ul>
    </div>

    {/* Groups */}
    <div className="flex-1 bg-white p-4 rounded-lg shadow">
      <h3 className="text-xl font-semibold mb-2">Groups</h3>
      <div className="flex gap-2 mb-4">
        <input
          type="text"
          placeholder="Group name"
          value={groupNameInput}
          onChange={(e) => setGroupNameInput(e.target.value)}
          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
        />
        <button
          onClick={createGroup}
          className="px-4 py-2 bg-red-600 text-white font-semibold rounded-lg shadow hover:bg-red-700 transition"
        >
          Create Group
        </button>
      </div>
      <ul className="list-disc list-inside">
        {groups.map(group => (
          <li key={group.name} className="flex justify-between items-center mb-1">
            <span>{group.name}: {group.members.join(', ')}</span>
            <button
              onClick={() => joinGroup(group.name)}
              className="ml-2 px-2 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 transition"
            >
              Join
            </button>
          </li>
        ))}
      </ul>
    </div>
  </div>

  {/* Chat Section */}
  <div>
    <div className="flex gap-2 mb-4 justify-center">
      <button
        onClick={() => setCurrentChat('general')}
        className={`px-4 py-2 rounded-lg font-semibold transition ${
          currentChat === 'general' ? 'bg-red-600 text-white' : 'bg-gray-200 hover:bg-gray-300'
        }`}
      >
        General
      </button>
      <button
        onClick={() => setCurrentChat('private')}
        className={`px-4 py-2 rounded-lg font-semibold transition ${
          currentChat === 'private' ? 'bg-red-600 text-white' : 'bg-gray-200 hover:bg-gray-300'
        }`}
      >
        Private
      </button>
      <button
        onClick={() => setCurrentChat('group')}
        className={`px-4 py-2 rounded-lg font-semibold transition ${
          currentChat === 'group' ? 'bg-red-600 text-white' : 'bg-gray-200 hover:bg-gray-300'
        }`}
      >
        Group
      </button>
    </div>

    {/* General Chat */}
    {currentChat === 'general' && (
      <div>
        <div className="border border-gray-300 h-72 overflow-y-auto p-3 mb-2 bg-white rounded-lg shadow">
          {messages.map((msg, idx) => <p key={idx}>{msg}</p>)}
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Type a message..."
            value={messageInput}
            onChange={(e) => setMessageInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
          />
          <button
            onClick={sendMessage}
            className="px-4 py-2 bg-red-600 text-white font-semibold rounded-lg shadow hover:bg-red-700 transition"
          >
            Send
          </button>
        </div>
      </div>
    )}

    {/* Private Chat */}
    {currentChat === 'private' && (
      <div>
        <select
          value={privateRecipient}
          onChange={(e) => setPrivateRecipient(e.target.value)}
          className="mb-2 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 w-full"
        >
          <option value="">Select recipient</option>
          {clients.map(client => (
            <option key={client} value={client}>{client}</option>
          ))}
        </select>
        <div className="border border-gray-300 h-72 overflow-y-auto p-3 mb-2 bg-white rounded-lg shadow">
          {privateMessages.map((msg, idx) => <p key={idx}>{msg}</p>)}
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Private message..."
            value={messageInput}
            onChange={(e) => setMessageInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && sendPrivateMessage()}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
          />
          <button
            onClick={sendPrivateMessage}
            className="px-4 py-2 bg-red-600 text-white font-semibold rounded-lg shadow hover:bg-red-700 transition"
          >
            Send Private
          </button>
        </div>
      </div>
    )}

    {/* Group Chat */}
    {currentChat === 'group' && (
      <div>
        <select
          value={groupSelect}
          onChange={(e) => setGroupSelect(e.target.value)}
          className="mb-2 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 w-full"
        >
          <option value="">Select group</option>
          {groups.map(group => (
            <option key={group.name} value={group.name}>{group.name}</option>
          ))}
        </select>
        <div className="border border-gray-300 h-72 overflow-y-auto p-3 mb-2 bg-white rounded-lg shadow">
          {groupMessages.map((msg, idx) => <p key={idx}>{msg}</p>)}
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Group message..."
            value={messageInput}
            onChange={(e) => setMessageInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && sendGroupMessage()}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
          />
          <button
            onClick={sendGroupMessage}
            className="px-4 py-2 bg-red-600 text-white font-semibold rounded-lg shadow hover:bg-red-700 transition"
          >
            Send to Group
          </button>
        </div>
      </div>
    )}
  </div>
</div>

  );
};

export default App;

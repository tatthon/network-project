import React, { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import './App.css';

const HOST = 'http://localhost:3000';

interface Group {
  name: string;
  members: string[];
}

interface Message {
  from: string;
  to: string;
  text: string;
  timestamp: number;
  read: boolean;
}

interface GroupMessage {
  group: string;
  text: string;
  from: string;
  read: boolean;
  read_number: number;
}

function App() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [currentUser, setCurrentUser] = useState<string>('');
  const [nameInput, setNameInput] = useState<string>('');
  const [joined, setJoined] = useState<boolean>(false);
  const [currentChat, setCurrentChat] = useState<'general' | 'private' | 'group'>('general');
  const [clients, setClients] = useState<string[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [messages, setMessages] = useState<string[]>([]);
  const [privateMessages, setPrivateMessages] = useState<Message[]>([]);
  const [groupMessages, setGroupMessages] = useState<GroupMessage[]>([]);
  const [messageInput, setMessageInput] = useState<string>('');
  const [privateRecipient, setPrivateRecipient] = useState<string>('');
  const [groupSelect, setGroupSelect] = useState<string>('');
  const [groupNameInput, setGroupNameInput] = useState<string>('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const privateRecipientRef = useRef(privateRecipient);
  const currentUserRef = useRef(currentUser);
  const socketRef = useRef(socket);

  useEffect(() => {
    privateRecipientRef.current = privateRecipient;
    currentUserRef.current = currentUser;
    socketRef.current = socket;
  }, [privateRecipient, currentUser]);

  useEffect(() => {
    const newSocket = io(HOST);
    setSocket(newSocket);

    newSocket.on('joined', () => setJoined(true));
    newSocket.on('name_taken', () => alert('Name already taken. Choose another name.'));
    newSocket.on('client_list', (clientList: string[]) => setClients(clientList));
    newSocket.on('group_list', (groupList: Group[]) => setGroups(groupList));
    newSocket.on('user_joined', (name: string) =>
      setMessages(prev => [...prev, `${name} joined the chat`])
    );
    newSocket.on('user_left', (name: string) =>
      setMessages(prev => [...prev, `${name} left the chat`])
    );
    newSocket.on('broadcast_message', (data: { from: string; message: string }) =>
      setMessages(prev => [...prev, `${data.from}: ${data.message}`])
    );

    newSocket.on('private_message', (data: { from: string; message: string }) => {
      setPrivateMessages(prev => [
        ...prev,
        { from: data.from, to: currentUser, text: data.message, timestamp: Date.now(), read: false },
      ]);
      if (data.from === privateRecipientRef.current) {
        setTimeout(() => {
          readPrivateMessage(privateRecipientRef.current);
        }, 10);
      }
    });

    newSocket.on('private_message_sent', (data: { to: string; message: string }) => {
      setPrivateMessages(prev => [
        ...prev,
        { from: currentUser, to: data.to, text: data.message, timestamp: Date.now(), read: false },
      ]);
      setTimeout(() => {
        if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }, 0);
    });

    newSocket.on('private_message_read', (data: { reader: string }) => {
      setPrivateMessages(prev =>
        prev.map(msg => (msg.to === data.reader ? { ...msg, read: true } : msg))
      );
    });

    newSocket.on('group_message', (data: { groupName: string; from: string; message: string }) => {
      setGroupMessages(prev => [
        ...prev,
        { group: data.groupName, from: data.from, text: data.message, read: false, read_number: 0 },
      ]);
    });

    newSocket.on('group_message_sent', (data: { groupName: string; message: string }) => {
      setGroupMessages(prev => [
        ...prev,
        {
          group: data.groupName,
          from: currentUserRef.current,
          text: data.message,
          read: true,
          read_number: 1,
        },
      ]);
    });
    newSocket.on('group_message_read',(groupName : string) => {
            setGroupMessages(prev =>
        prev.map(msg => (msg.group === groupName && msg.from === currentUserRef.current ? { ...msg, read: true ,read_number : msg.read_number + 1} : msg))
      );
    });

    newSocket.on('error', (message: string) => alert('Error: ' + message));

    return () => {newSocket.disconnect()};
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

  const readPrivateMessage = (client: string) => {
    if (socketRef.current) {
      socketRef.current.emit('read_private_message', {
        reader: currentUserRef.current,
        sender: client,
      });
    }
  };
  const readGroupMessage = (group : string) => {
    if (socketRef.current) {
      socketRef.current.emit('read_group_message',{
        groupName : group,
        reader : currentUser
      });
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
      alert(`You joined group "${groupName}"`);
      setGroupSelect(groupName);
      setCurrentChat('group');
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
            onChange={e => setNameInput(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
          />
          <button
            onClick={joinChat}
            className="px-6 py-2 bg-red-600 text-white font-semibold rounded-lg shadow hover:bg-red-700 transition"
          >
            Join Chat
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar (Users) */}
      <aside className="w-64 bg-white shadow-md border-r border-gray-200 p-4 flex flex-col">
        <h2 className="text-xl font-semibold text-red-600 mb-4">Online Users</h2>
        <ul className="flex-1 overflow-y-auto space-y-2">
          {clients.map(client => (
            <li
              key={client}
              onClick={() => {
                setPrivateRecipient(client);
                setCurrentChat('private');
                readPrivateMessage(client);
                setGroupSelect('');
              }}
              className={`p-2 rounded cursor-pointer transition ${
                privateRecipient === client
                  ? 'bg-red-500 text-white'
                  : 'hover:bg-gray-100'
              }`}
            >
              {client === currentUser ? `${client} (You)` : client}
            </li>
          ))}
        </ul>

        <div className="mt-4">
          <h3 className="text-l text-gray-500">Groups Joined</h3>
          <ul className="space-y-1">
            {groups.filter(group => group.members.includes(currentUser))
              .map(group => (
              <li
                key={group.name}
                onClick={() => {
                  setGroupSelect(group.name);
                  readGroupMessage(group.name);
                  setCurrentChat('group');
                }}
                className={`p-2 rounded cursor-pointer text-sm transition ${
                  groupSelect === group.name
                    ? 'bg-blue-500 text-white'
                    : 'hover:bg-gray-100'
                }`}
              >
                {group.name}
              </li>
            ))}
          </ul>
        </div>
      </aside>

      {/* Main Chat Window */}
      <main className="flex-1 p-6 overflow-y-auto">
        <h1 className="text-3xl font-bold text-red-600 text-center mb-4">
          Multi-Client Chat Application
        </h1>

        <div className="text-center mb-4">
          <strong>Logged in as: {currentUser}</strong>
        </div>

        <div className="flex gap-2 mb-6 justify-center">
          {['general', 'private', 'group'].map(tab => (
            <button
              key={tab}
              onClick={() => setCurrentChat(tab as any)}
              className={`px-4 py-2 rounded-lg font-semibold transition ${
                currentChat === tab
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-200 hover:bg-gray-300'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* === General Chat === */}
        {currentChat === 'general' && (
          <div>
            <div className="border border-gray-300 h-72 overflow-y-auto p-3 mb-2 bg-white rounded-lg shadow">
              {messages.map((msg, idx) => (
                <p key={idx}>{msg}</p>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Type a message..."
                value={messageInput}
                onChange={e => setMessageInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && sendMessage()}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
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

        {/* === Private Chat === */}
        {currentChat === 'private' && (
          <div>
            <div
              ref={scrollRef}
              className="border border-gray-300 h-72 overflow-y-auto p-3 mb-2 bg-white rounded-lg shadow"
            >
              <div className="flex flex-col space-y-2 p-4">
                {privateMessages
                  .filter(
                    msg =>
                      msg.from === privateRecipient || msg.to === privateRecipient
                  )
                  .map((msg, idx) => (
                    <div
                      key={idx}
                      className={`flex ${
                        msg.from === privateRecipient ? 'flex-row' : 'flex-row-reverse'
                      }`}
                    >
                      <div
                        className={`max-w-xs px-3 py-2 rounded-2xl text-white ${
                          msg.to === privateRecipient
                            ? 'bg-blue-500 rounded-br-none'
                            : 'bg-gray-500 rounded-bl-none'
                        }`}
                      >
                        <p>{msg.text}</p>
                      </div>
                      <span className="text-xs text-black block flex flex-col justify-end items-end pl-2 pr-2">
                        <p className={msg.read ? 'block' : 'hidden'}>อ่านแล้ว</p>
                        {new Date(msg.timestamp).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                          hour12: false,
                        })}
                      </span>
                    </div>
                  ))}
              </div>
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                placeholder={`Message to ${privateRecipient || 'select user'}`}
                value={messageInput}
                onChange={e => setMessageInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && sendPrivateMessage()}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
              />
              <button
                onClick={sendPrivateMessage}
                disabled={!privateRecipient}
                className="px-4 py-2 bg-red-600 text-white font-semibold rounded-lg shadow hover:bg-red-700 transition disabled:opacity-50"
              >
                Send
              </button>
            </div>
          </div>
        )}

        {/* === Group Chat === */}
        {currentChat === 'group' && (
          <div>
            <div className="border border-gray-300 h-72 overflow-y-auto p-3 mb-2 bg-white rounded-lg shadow">
              <div className="flex flex-col space-y-2 p-4">
                {groupMessages
                  .filter(msg => msg.group === groupSelect)
                  .map((msg, idx) => (
                    <div
                      key={idx}
                      className={`flex ${
                        msg.from === currentUser ? 'flex-row-reverse' : 'flex-row'
                      }`}
                    >
                      <div
                        className={`max-w-xs px-3 py-2 rounded-2xl text-white ${
                          msg.from === currentUser
                            ? 'bg-blue-500 rounded-br-none'
                            : 'bg-gray-500 rounded-bl-none'
                        }`}
                      >
                        <p className="text-sm">{msg.text}</p>
                      </div>

                      <span className="text-xs text-black block flex flex-col justify-end items-end pl-2 pr-2">
                        {msg.read && (
                          <p className="text-[10px] text-gray-500">
                            อ่านแล้ว {msg.read_number}
                          </p>
                        )}
                        {new Date().toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                          hour12: false,
                        })}
                      </span>
                    </div>
                  ))}
              </div>
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                placeholder={`Message in ${groupSelect || 'select group'}`}
                value={messageInput}
                onChange={e => setMessageInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && sendGroupMessage()}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={sendGroupMessage}
                disabled={!groupSelect}
                className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow hover:bg-blue-700 transition disabled:opacity-50"
              >
                Send
              </button>
            </div>
          </div>
        )}
      </main>

      {/* === Right Sidebar (Group Management) === */}
      <aside className="w-80 bg-white shadow-md border-l border-gray-200 p-4 flex flex-col">
        <h2 className="text-xl font-semibold text-blue-600 mb-4">
          Group Management
        </h2>

        {/* Create Group */}
        <div className="mb-4">
          <h3 className="text-sm text-gray-500 mb-1">Create New Group</h3>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Group name"
              value={groupNameInput}
              onChange={e => setGroupNameInput(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={() =>{
                createGroup()
                joinGroup(groupNameInput)
              }}
              className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow hover:bg-blue-700 transition"
            >
              +
            </button>
          </div>
        </div>

        {/* Join Group */}
        <div className="flex-1 overflow-y-auto">
          <h3 className="text-sm text-gray-500 mb-2">Available Groups</h3>
          <ul className="space-y-1">
            {groups.filter(group => !group.members.includes(currentUser))
            .map(group => (
              <li
                key={group.name}
                className={`flex justify-between items-center p-2 rounded cursor-pointer text-sm transition ${
                  groupSelect === group.name
                    ? 'bg-blue-500 text-white'
                    : 'hover:bg-gray-100'
                }`}
              >
                <span>{group.name}</span>
                <button
                  onClick={() => joinGroup(group.name)}
                  className="px-2 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600"
                >
                  Join
                </button>
              </li>
            ))}
          </ul>
        </div>
      </aside>
    </div>
  );
}

export default App;

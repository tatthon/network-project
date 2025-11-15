import React, { useState, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import './App.css';


const HOST = 'http://localhost:3000';

function formatTimeHHMM(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
}

interface Group {
  name: string;
  members: string[];
}

const AVATAR_COLORS = [
  '#f87171', // red
  '#34d399', // green
  '#60a5fa', // blue
  '#a78bfa', // purple
  '#f472b6', // pink
  '#facc15', // gold
  '#38bdf8', // sky
  '#fb7185', // rose
  '#4ade80', // emerald
];

function stringToColor(str: string, overrideColor?: string) {
  if (overrideColor) return overrideColor;
  // Simple hash to color
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const color = `hsl(${hash % 360}, 70%, 60%)`;
  return color;
}

function App() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [currentUser, setCurrentUser] = useState<string>('');
  const [nameInput, setNameInput] = useState<string>('');
  const [joined, setJoined] = useState<boolean>(false);
  const [currentChat, setCurrentChat] = useState<'general' | 'private' | 'group'>('general');
  const [clients, setClients] = useState<string[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [messages, setMessages] = useState<{text: string, timestamp: number}[]>([]);
  const [privateMessages, setPrivateMessages] = useState<{text: string, timestamp: number}[]>([]);
  const [groupMessages, setGroupMessages] = useState<{text: string, timestamp: number}[]>([]);
  const [messageInput, setMessageInput] = useState<string>('');
  const [privateRecipient, setPrivateRecipient] = useState<string>('');
  const [groupSelect, setGroupSelect] = useState<string>('');
  const [groupNameInput, setGroupNameInput] = useState<string>('');
  const [avatarColor, setAvatarColor] = useState<string>(() => {
    // Try to load from localStorage for persistence
    return localStorage.getItem('avatarColor') || AVATAR_COLORS[0];
  });

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
      setMessages(prev => [...prev, { text: `${name} joined the chat`, timestamp: Date.now() }]);
    });

    newSocket.on('user_left', (name: string) => {
      setMessages(prev => [...prev, { text: `${name} left the chat`, timestamp: Date.now() }]);
    });

    newSocket.on('broadcast_message', (data: { from: string; message: string; timestamp?: number }) => {
      setMessages(prev => [...prev, { text: `${data.from}: ${data.message}`, timestamp: data.timestamp || Date.now() }]);
    });

    newSocket.on('private_message', (data: { from: string; message: string; timestamp?: number }) => {
      setPrivateMessages(prev => [...prev, { text: `From ${data.from}: ${data.message}`, timestamp: data.timestamp || Date.now() }]);
    });

    newSocket.on('private_message_sent', (data: { to: string; message: string; timestamp?: number }) => {
      setPrivateMessages(prev => [...prev, { text: `To ${data.to}: ${data.message}`, timestamp: data.timestamp || Date.now() }]);
    });

    newSocket.on('group_message', (data: { groupName: string; from: string; message: string; timestamp?: number }) => {
      setGroupMessages(prev => [...prev, { text: `[${data.groupName}] ${data.from}: ${data.message}`, timestamp: data.timestamp || Date.now() }]);
    });

    newSocket.on('group_message_sent', (data: { groupName: string; message: string; timestamp?: number }) => {
      setGroupMessages(prev => [...prev, { text: `[${data.groupName}] You: ${data.message}`, timestamp: data.timestamp || Date.now() }]);
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
      localStorage.setItem('avatarColor', avatarColor);
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-400 via-pink-300 to-blue-400 p-4">
        <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-2xl p-10 flex flex-col items-center w-full max-w-md">
          <h1 className="text-4xl font-extrabold christmas-title mb-8 drop-shadow-lg">
            Chat the Chat
          </h1>
          <div className="flex flex-col w-full gap-4">
            <div className="flex flex-col items-center gap-2 mb-2">
              <div
                className="w-20 h-20 rounded-full flex items-center justify-center text-white text-3xl font-bold shadow-lg mb-1"
                style={{ backgroundColor: avatarColor }}
              >
                {nameInput ? nameInput.charAt(0).toUpperCase() : '?'}
              </div>
              <div className="flex flex-wrap gap-2 justify-center">
                {AVATAR_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className={`w-8 h-8 rounded-full border-2 ${avatarColor === color ? 'border-black' : 'border-transparent'} focus:outline-none`}
                    style={{ backgroundColor: color }}
                    onClick={() => setAvatarColor(color)}
                    aria-label={`Choose avatar color ${color}`}
                  />
                ))}
              </div>
            </div>
            <input
              type="text"
              placeholder="Enter your name"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-red-400 text-lg shadow"
            />
            <button
              onClick={joinChat}
              className="w-full py-3 bg-gradient-to-r from-red-500 to-pink-500 text-white font-bold rounded-xl shadow-lg hover:from-pink-500 hover:to-red-500 transition text-lg"
            >
              Join Chat
            </button>
          </div>
        </div>
      </div>
    );
  }


  return (
    <div className="min-h-screen bg-gradient-to-br from-red-400 via-pink-300 to-blue-400 flex items-center justify-center py-8 px-2">
      <div className="w-full max-w-5xl bg-white/90 rounded-3xl shadow-2xl flex flex-col md:flex-row overflow-hidden">
        {/* Sidebar */}
        <div className="md:w-1/3 bg-gradient-to-b from-pink-100 to-blue-100 p-6 flex flex-col gap-8 border-r border-gray-200">
          <div className="flex flex-col items-center gap-2">
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center text-white text-3xl font-bold shadow-lg mb-2"
              style={{ backgroundColor: avatarColor }}
            >
              {currentUser.charAt(0).toUpperCase()}
            </div>
            <div className="text-lg font-semibold text-gray-700">{currentUser}</div>
            <span className="text-xs text-gray-400">Online</span>
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-700 mb-2">Connected Clients</h3>
            <ul className="space-y-2">
              {clients.map(client => (
                <li key={client} className="flex items-center gap-2">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold"
                    style={{ backgroundColor: client === currentUser ? avatarColor : stringToColor(client) }}
                  >
                    {client.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-gray-700 text-sm">{client}</span>
                  {client !== currentUser && (
                    <button
                      className="ml-1 p-1 rounded-full hover:bg-pink-100 transition"
                      title={`Private chat with ${client}`}
                      onClick={() => {
                        setCurrentChat('private');
                        setPrivateRecipient(client);
                      }}
                    >
                      {/* Chat bubble icon */}
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-pink-500">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12c0-4.556 4.694-8.25 10.5-8.25s10.5 3.694 10.5 8.25-4.694 8.25-10.5 8.25c-1.086 0-2.14-.12-3.138-.344a.75.75 0 00-.527.06l-3.11 1.555a.75.75 0 01-1.07-.82l.473-2.364a.75.75 0 00-.21-.705C3.14 15.69 2.25 13.93 2.25 12z" />
                      </svg>
                    </button>
                  )}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-700 mb-2">Groups</h3>
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                placeholder="Group name"
                value={groupNameInput}
                onChange={(e) => setGroupNameInput(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-pink-400"
              />
              <button
                onClick={createGroup}
                className="px-4 py-2 bg-gradient-to-r from-pink-500 to-red-500 text-white font-semibold rounded-lg shadow hover:from-red-500 hover:to-pink-500 transition"
              >
                +
              </button>
            </div>
            <ul className="space-y-1">
              {groups.map(group => {
                const isMember = group.members.includes(currentUser);
                return (
                  <li
                    key={group.name}
                    className="flex justify-between items-center text-sm rounded px-2 py-1 bg-white/70"
                  >
                    <span className="truncate">{group.name}: <span className="text-gray-500">{group.members.join(', ')}</span></span>
                    <div className="flex items-center gap-1">
                      {!isMember && (
                        <button
                          onClick={() => joinGroup(group.name)}
                          className="px-2 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600 transition"
                        >
                          Join
                        </button>
                      )}
                      {isMember && (
                        <span className="px-2 py-1 bg-gray-400 text-white text-xs rounded cursor-default select-none">Joined</span>
                      )}
                      {/* Chat icon button to go to group chat */}
                      <button
                        className="p-1 rounded-full hover:bg-pink-100 transition"
                        title={`Go to group chat: ${group.name}`}
                        onClick={() => {
                          setCurrentChat('group');
                          setGroupSelect(group.name);
                        }}
                      >
                        {/* Chat bubble icon */}
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-pink-500">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12c0-4.556 4.694-8.25 10.5-8.25s10.5 3.694 10.5 8.25-4.694 8.25-10.5 8.25c-1.086 0-2.14-.12-3.138-.344a.75.75 0 00-.527.06l-3.11 1.555a.75.75 0 01-1.07-.82l.473-2.364a.75.75 0 00-.21-.705C3.14 15.69 2.25 13.93 2.25 12z" />
                        </svg>
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col p-8 gap-4 bg-white/80">
          <h1 className="text-3xl font-extrabold christmas-title mb-2 text-center drop-shadow-lg">
            Chat the Chat
          </h1>
          <div className="mb-2 text-center text-gray-600">
            <strong>Logged in as: {currentUser}</strong>
          </div>
          <div className="flex gap-2 mb-4 justify-center">
            <button
              onClick={() => setCurrentChat('general')}
              className={`px-4 py-2 rounded-full font-semibold transition shadow ${
                currentChat === 'general' ? 'bg-gradient-to-r from-red-500 to-pink-500 text-white' : 'bg-gray-200 hover:bg-gray-300'
              }`}
            >
              General
            </button>
            <button
              onClick={() => setCurrentChat('private')}
              className={`px-4 py-2 rounded-full font-semibold transition shadow ${
                currentChat === 'private' ? 'bg-gradient-to-r from-red-500 to-pink-500 text-white' : 'bg-gray-200 hover:bg-gray-300'
              }`}
            >
              Private
            </button>
            <button
              onClick={() => setCurrentChat('group')}
              className={`px-4 py-2 rounded-full font-semibold transition shadow ${
                currentChat === 'group' ? 'bg-gradient-to-r from-red-500 to-pink-500 text-white' : 'bg-gray-200 hover:bg-gray-300'
              }`}
            >
              Group
            </button>
          </div>
          {/* General Chat */}
          {currentChat === 'general' && (
            <div className="flex flex-col h-80">
              <div className="flex-1 overflow-y-auto space-y-2 p-2 bg-white/90 rounded-xl shadow-inner border border-gray-200 mb-2">
                {messages.map((msg, idx) => {
                  // System message if it ends with 'joined the chat' or 'left the chat'
                  if (/ (joined|left) the chat$/.test(msg.text)) {
                    return (
                      <div key={idx} className="flex justify-center my-2">
                        <span className="text-xs text-gray-400 text-center">{msg.text}</span>
                      </div>
                    );
                  }
                  const isOwn = msg.text.startsWith(currentUser + ':') || msg.text.startsWith('You:');
                  let sender = '';
                  if (msg.text.includes(':')) {
                    sender = msg.text.split(':')[0].replace('You', currentUser).trim();
                  }
                  return (
                    <div key={idx} className={`flex flex-col items-${isOwn ? 'end' : 'start'} gap-0.5`}>
                      <div className={`text-xs text-gray-500 px-2 ${isOwn ? 'text-right' : 'text-left'}`} style={{lineHeight: 1, marginBottom: 0}}>
                        {isOwn ? 'You' : sender}
                      </div>
                      <div className={`flex items-end gap-2 ${isOwn ? 'justify-end' : 'justify-start'}`}>
                        {!isOwn && sender && (
                          <div
                            className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-base shadow"
                            style={{ backgroundColor: sender === currentUser ? avatarColor : stringToColor(sender) }}
                          >
                            {sender.charAt(0).toUpperCase()}
                          </div>
                        )}
                        {isOwn
                          ? <>
                              <span className="text-[10px] text-gray-400 mr-0.5 align-bottom" style={{marginBottom: '1px'}}>{formatTimeHHMM(msg.timestamp)}</span>
                              <div
                                className={`max-w-xs px-4 py-2 rounded-2xl shadow text-sm whitespace-pre-line bg-gradient-to-br from-pink-400 to-red-400 text-white rounded-br-none`}
                              >
                                {(() => {
                                  const afterColon = msg.text.indexOf(':');
                                  if (afterColon !== -1) return msg.text.slice(afterColon + 1).trimStart();
                                  return msg.text;
                                })()}
                              </div>
                            </>
                          : <>
                              <div
                                className={`max-w-xs px-4 py-2 rounded-2xl shadow text-sm whitespace-pre-line bg-gray-200 text-gray-800 rounded-bl-none`}
                              >
                                {(() => {
                                  const afterColon = msg.text.indexOf(':');
                                  if (afterColon !== -1) return msg.text.slice(afterColon + 1).trimStart();
                                  return msg.text;
                                })()}
                              </div>
                              <span className="text-[10px] text-gray-400 ml-0.5 align-bottom" style={{marginBottom: '1px'}}>{formatTimeHHMM(msg.timestamp)}</span>
                            </>
                        }
                        {isOwn && (
                          <div
                            className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-base shadow"
                            style={{ backgroundColor: avatarColor }}
                          >
                            {currentUser.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="flex gap-2 mt-2">
                <input
                  type="text"
                  placeholder="Type a message..."
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-pink-400 text-base shadow"
                />
                <button
                  onClick={sendMessage}
                  className="px-6 py-3 bg-gradient-to-r from-pink-500 to-red-500 text-white font-bold rounded-2xl shadow-lg hover:from-red-500 hover:to-pink-500 transition text-base"
                >
                  Send
                </button>
              </div>
            </div>
          )}
          {/* Private Chat */}
          {currentChat === 'private' && (
            <div className="flex flex-col h-80">
              <select
                value={privateRecipient}
                onChange={(e) => setPrivateRecipient(e.target.value)}
                className="mb-2 px-4 py-3 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-pink-400 text-base shadow"
              >
                <option value="">Select recipient</option>
                {clients.filter(client => client !== currentUser).map(client => (
                  <option key={client} value={client}>{client}</option>
                ))}
              </select>
              <div className="flex-1 overflow-y-auto space-y-2 p-2 bg-white/90 rounded-xl shadow-inner border border-gray-200 mb-2">
                {privateMessages
                  .filter((msg) => {
                    if (!privateRecipient) return false;
                    if (msg.text.startsWith(`To ${privateRecipient}:`)) return true;
                    if (msg.text.startsWith(`From ${privateRecipient}:`)) return true;
                    return false;
                  })
                  .map((msg, idx) => {
                    const isOwn = msg.text.startsWith('To ');
                    let sender = '';
                    if (isOwn) {
                      sender = currentUser;
                    } else if (msg.text.startsWith('From ')) {
                      sender = msg.text.split(':')[0].replace('From ', '').trim();
                    }
                    return (
                      <div key={idx} className={`flex flex-col items-${isOwn ? 'end' : 'start'} gap-0.5`}>
                        <div className={`text-xs text-gray-500 px-2 mb-0.5 ${isOwn ? 'text-right' : 'text-left'}`}>
                          {isOwn ? 'You' : sender}
                        </div>
                        <div className={`flex items-end gap-2 ${isOwn ? 'justify-end' : 'justify-start'}`}>
                          {!isOwn && sender && (
                            <div
                              className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-base shadow"
                              style={{ backgroundColor: stringToColor(sender) }}
                            >
                              {sender.charAt(0).toUpperCase()}
                            </div>
                          )}
                          {isOwn
                              ? <>
                                  <span className="text-[10px] text-gray-400 mr-0.5 align-bottom" style={{marginBottom: '1px'}}>{formatTimeHHMM(msg.timestamp)}</span>
                                  <div
                                    className={`max-w-xs px-4 py-2 rounded-2xl shadow text-sm whitespace-pre-line bg-gradient-to-br from-pink-400 to-red-400 text-white rounded-br-none`}
                                  >
                                    {(() => {
                                      const afterColon = msg.text.indexOf(':');
                                      if (afterColon !== -1) return msg.text.slice(afterColon + 1).trimStart();
                                      return msg.text;
                                    })()}
                                  </div>
                                </>
                              : <>
                                  <div
                                    className={`max-w-xs px-4 py-2 rounded-2xl shadow text-sm whitespace-pre-line bg-gray-200 text-gray-800 rounded-bl-none`}
                                  >
                                    {(() => {
                                      const afterColon = msg.text.indexOf(':');
                                      if (afterColon !== -1) return msg.text.slice(afterColon + 1).trimStart();
                                      return msg.text;
                                    })()}
                                  </div>
                                  <span className="text-[10px] text-gray-400 ml-0.5 align-bottom" style={{marginBottom: '1px'}}>{formatTimeHHMM(msg.timestamp)}</span>
                                </>
                          }
                          {isOwn && (
                            <div
                              className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-base shadow"
                              style={{ backgroundColor: stringToColor(currentUser) }}
                            >
                              {currentUser.charAt(0).toUpperCase()}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
              </div>
              <div className="flex gap-2 mt-2">
                <input
                  type="text"
                  placeholder="Private message..."
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendPrivateMessage()}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-pink-400 text-base shadow"
                />
                <button
                  onClick={sendPrivateMessage}
                  className="px-6 py-3 bg-gradient-to-r from-pink-500 to-red-500 text-white font-bold rounded-2xl shadow-lg hover:from-red-500 hover:to-pink-500 transition text-base"
                >
                  Send Private
                </button>
              </div>
            </div>
          )}
          {/* Group Chat */}
          {currentChat === 'group' && (
            <div className="flex flex-col h-80">
              <select
                value={groupSelect}
                onChange={(e) => setGroupSelect(e.target.value)}
                className="mb-2 px-4 py-3 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-pink-400 text-base shadow"
              >
                <option value="">Select group</option>
                {groups.filter(group => group.members.includes(currentUser)).map(group => (
                  <option key={group.name} value={group.name}>{group.name}</option>
                ))}
              </select>
              {(() => {
                const selectedGroup = groups.find(g => g.name === groupSelect);
                const isMember = selectedGroup && selectedGroup.members.includes(currentUser);
                if (!selectedGroup || !isMember) {
                  return (
                    <div className="flex-1 flex items-center justify-center text-gray-400 italic">
                      {groupSelect ? 'You are not a member of this group.' : 'Select a group to view messages.'}
                    </div>
                  );
                }
                return (
                  <>
                    {/* Group members list */}
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-semibold text-gray-500">Members:</span>
                      {selectedGroup.members.map(member => (
                        <div key={member} className="flex items-center gap-1">
                          <div
                            className="w-6 h-6 rounded-full flex items-center justify-center text-white font-bold text-xs shadow"
                            style={{ backgroundColor: member === currentUser ? avatarColor : stringToColor(member) }}
                          >
                            {member.charAt(0).toUpperCase()}
                          </div>
                          <span className={`text-xs ${member === currentUser ? 'font-bold text-pink-500' : 'text-gray-700'}`}>{member === currentUser ? 'You' : member}</span>
                        </div>
                      ))}
                    </div>
                    <div className="flex-1 overflow-y-auto space-y-2 p-2 bg-white/90 rounded-xl shadow-inner border border-gray-200 mb-2">
                      {groupMessages.map((msg, idx) => {
                        const isOwn = msg.text.includes('You:');
                        let sender = '';
                        let messageText = msg.text;
                        if (isOwn) {
                          sender = currentUser;
                          const afterColon = msg.text.indexOf(':');
                          if (afterColon !== -1) messageText = msg.text.slice(afterColon + 1).trimStart();
                        } else if (msg.text.includes(']')) {
                          const afterBracket = msg.text.split(']')[1];
                          if (afterBracket && afterBracket.includes(':')) {
                            sender = afterBracket.split(':')[0].trim();
                            messageText = afterBracket.split(':').slice(1).join(':').trimStart();
                          }
                        }
                        return (
                          <div key={idx} className={`flex flex-col items-${isOwn ? 'end' : 'start'} gap-0.5`}>
                            <div className={`text-xs text-gray-500 px-2 mb-0.5 ${isOwn ? 'text-right' : 'text-left'}`}>
                              {isOwn ? 'You' : sender}
                            </div>
                            <div className={`flex items-end gap-2 ${isOwn ? 'justify-end' : 'justify-start'}`}>
                              {!isOwn && sender && (
                                <div
                                  className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-base shadow"
                                  style={{ backgroundColor: stringToColor(sender) }}
                                >
                                  {sender.charAt(0).toUpperCase()}
                                </div>
                              )}
                              {isOwn
                                ? <>
                                    <span className="text-[10px] text-gray-400 mr-0.5 align-bottom" style={{marginBottom: '1px'}}>{formatTimeHHMM(msg.timestamp)}</span>
                                    <div
                                      className={`max-w-xs px-4 py-2 rounded-2xl shadow text-sm whitespace-pre-line bg-gradient-to-br from-pink-400 to-red-400 text-white rounded-br-none`}
                                    >
                                      {messageText}
                                    </div>
                                  </>
                                : <>
                                    <div
                                      className={`max-w-xs px-4 py-2 rounded-2xl shadow text-sm whitespace-pre-line bg-gray-200 text-gray-800 rounded-bl-none`}
                                    >
                                      {messageText}
                                    </div>
                                    <span className="text-[10px] text-gray-400 ml-0.5 align-bottom" style={{marginBottom: '1px'}}>{formatTimeHHMM(msg.timestamp)}</span>
                                  </>
                              }
                              {isOwn && (
                                <div
                                  className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-base shadow"
                                  style={{ backgroundColor: stringToColor(currentUser) }}
                                >
                                  {currentUser.charAt(0).toUpperCase()}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <div className="flex gap-2 mt-2">
                      <input
                        type="text"
                        placeholder="Group message..."
                        value={messageInput}
                        onChange={(e) => setMessageInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && sendGroupMessage()}
                        className="flex-1 px-4 py-3 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-pink-400 text-base shadow"
                      />
                      <button
                        onClick={sendGroupMessage}
                        className="px-6 py-3 bg-gradient-to-r from-pink-500 to-red-500 text-white font-bold rounded-2xl shadow-lg hover:from-red-500 hover:to-pink-500 transition text-base"
                      >
                        Send to Group
                      </button>
                    </div>
                  </>
                );
              })()}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;

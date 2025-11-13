import React, { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import './App.css';
import EmojiPicker, { Theme } from 'emoji-picker-react';

const HOST = 'http://localhost:3000';

// ===== INTERFACES =====
import { Group, Message, GroupMessage } from '../types';

// ===== SOCKET HANDLERS SETUP =====
import {setupSocketListeners} from './socket/listener';

// ===== COMPONENTS =====

interface JoinScreenProps {
  nameInput: string;
  onNameChange: (val: string) => void;
  onJoin: () => void;
}

const JoinScreen: React.FC<JoinScreenProps> = ({ nameInput, onNameChange, onJoin }) => (
  <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
    <h1 className="text-4xl font-bold text-white bg-blue-400 px-6 py-4 rounded-lg shadow-md mb-8">
      Multi-Client Chat Application
    </h1>
    <div className="flex flex-col sm:flex-row items-center gap-4">
      <input
        type="text"
        placeholder="Enter your name"
        value={nameInput}
        onChange={e => onNameChange(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && onJoin()}
        className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
      />
      <button
        onClick={onJoin}
        className="px-6 py-2 bg-red-600 text-white font-semibold rounded-lg shadow hover:bg-red-700 transition"
      >
        Join Chat
      </button>
    </div>
  </div>
);

interface SidebarProps {
  clients: string[];
  currentUser: string;
  privateRecipient: string;
  groups: Group[];
  groupSelect: string;
  onSelectUser: (user: string) => void;
  onSelectGroup: (group: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  clients,
  currentUser,
  privateRecipient,
  groups,
  groupSelect,
  onSelectUser,
  onSelectGroup,
}) => (
  <aside className="w-64 bg-white shadow-md border-r border-gray-200 p-4 flex flex-col">
    <h2 className="text-xl font-semibold text-red-600 mb-4">Online Users</h2>
    <ul className="flex-1 overflow-y-auto space-y-2">
      {clients.map(client => (
        <li
          key={client}
          onClick={() => onSelectUser(client)}
          className={`p-2 rounded cursor-pointer transition ${
            privateRecipient === client ? 'bg-red-500 text-white' : 'hover:bg-gray-100'
          }`}
        >
          {client === currentUser ? `${client} (You)` : client}
        </li>
      ))}
    </ul>

    <div className="mt-4">
      <h3 className="text-l text-gray-500">Groups Joined</h3>
      <ul className="space-y-1">
        {groups
          .filter(group => group.members.includes(currentUser))
          .map(group => (
            <li
              key={group.name}
              onClick={() => onSelectGroup(group.name)}
              className={`p-2 rounded cursor-pointer text-sm transition ${
                groupSelect === group.name ? 'bg-blue-500 text-white' : 'hover:bg-gray-100'
              }`}
            >
              {group.name}
            </li>
          ))}
      </ul>
    </div>
  </aside>
);

interface MessageInputProps {
  value: string;
  placeholder: string;
  onChange: (val: string) => void;
  onSend: () => void;
  onToggleEmoji: () => void;
  showEmojiPicker: boolean;
  onEmojiSelect: (emoji: string) => void;
  disabled?: boolean;
  sendButtonColor?: string;
}

const MessageInput: React.FC<MessageInputProps> = ({
  value,
  placeholder,
  onChange,
  onSend,
  onToggleEmoji,
  showEmojiPicker,
  onEmojiSelect,
  disabled = false,
  sendButtonColor = 'red',
}) => (
  <div className="flex gap-2 items-center relative">
    <input
      type="text"
      placeholder={placeholder}
      value={value}
      onChange={e => onChange(e.target.value)}
      onKeyDown={e => e.key === 'Enter' && onSend()}
      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
    />
    <button
      onClick={onToggleEmoji}
      className="px-2 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
    >
      😀
    </button>
    <button
      onClick={onSend}
      disabled={disabled}
      className={`px-4 py-2 bg-${sendButtonColor}-600 text-white font-semibold rounded-lg shadow hover:bg-${sendButtonColor}-700 transition disabled:opacity-50`}
    >
      Send
    </button>

    {showEmojiPicker && (
      <div className="absolute bottom-12 right-0 z-50">
        <EmojiPicker
          onEmojiClick={emojiObject => {
            onEmojiSelect(emojiObject.emoji);
          }}
          theme={Theme.LIGHT}
        />
      </div>
    )}
  </div>
);

interface RightSidebarProps {
  currentChat: 'general' | 'private' | 'group';
  groupSelect: string;
  groups: Group[];
  currentUser: string;
  clients: string[];
  groupNameInput: string;
  onGroupNameChange: (val: string) => void;
  onCreateGroup: () => void;
  onJoinGroup: (group: string) => void;
}

const RightSidebar: React.FC<RightSidebarProps> = ({
  currentChat,
  groupSelect,
  groups,
  currentUser,
  clients,
  groupNameInput,
  onGroupNameChange,
  onCreateGroup,
  onJoinGroup,
}) => (
  <aside className="w-80 bg-white shadow-md border-l border-gray-200 p-4 flex flex-col">
    {currentChat === 'group' && groupSelect && (
      <div className="mb-6 bg-blue-50 p-3 rounded-lg border border-blue-200 shadow-sm">
        <h3 className="text-sm font-bold text-blue-800 mb-2 flex items-center gap-2">
          👥 Members in "{groupSelect}"
        </h3>
        <ul className="max-h-40 overflow-y-auto space-y-1 pr-1">
          {groups
            .find(g => g.name === groupSelect)
            ?.members.map((member, index) => (
              <li
                key={index}
                className="text-sm text-gray-700 flex items-center bg-white px-2 py-1 rounded border border-blue-100"
              >
                <span
                  className={`w-2 h-2 rounded-full mr-2 ${
                    clients.includes(member) ? 'bg-green-500' : 'bg-gray-300'
                  }`}
                ></span>
                <span className={member === currentUser ? 'font-semibold' : ''}>
                  {member} {member === currentUser && '(You)'}
                </span>
              </li>
            ))}
        </ul>
      </div>
    )}

    <h2 className="text-xl font-semibold text-blue-600 mb-4">Group Management</h2>

    <div className="mb-4">
      <h3 className="text-sm text-gray-500 mb-1">Create New Group</h3>
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Group name"
          value={groupNameInput}
          onChange={e => onGroupNameChange(e.target.value)}
          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        />
        <button
          onClick={onCreateGroup}
          className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow hover:bg-blue-700 transition"
        >
          +
        </button>
      </div>
    </div>

    <div className="flex-1 overflow-y-auto">
      <h3 className="text-sm text-gray-500 mb-2">Available Groups</h3>
      <ul className="space-y-2">
        {groups
          .filter(group => !group.members.includes(currentUser))
          .map(group => (
            <li
              key={group.name}
              className="p-3 border border-gray-200 rounded-lg bg-white shadow-sm hover:shadow-md transition"
            >
              <div className="flex justify-between items-center mb-2">
                <span className="font-semibold text-blue-700">{group.name}</span>
                <button
                  onClick={() => onJoinGroup(group.name)}
                  className="px-2 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600"
                >
                  Join
                </button>
              </div>

              <ul className="ml-3 space-y-1">
                {group.members.length > 0 ? (
                  group.members.map((member, index) => (
                    <li key={index} className="text-xs text-gray-600 flex items-center">
                      <span
                        className={`w-2 h-2 rounded-full mr-2 ${
                          clients.includes(member) ? 'bg-green-500' : 'bg-gray-300'
                        }`}
                      ></span>
                      {member}
                    </li>
                  ))
                ) : (
                  <li className="text-xs text-gray-400 italic">No members yet</li>
                )}
              </ul>
            </li>
          ))}
      </ul>
    </div>
  </aside>
);

// ===== MAIN APP =====
function App() {
  // State management
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
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  // Refs
  const scrollRef = useRef<HTMLDivElement>(null);
  const privateRecipientRef = useRef(privateRecipient);
  const currentUserRef = useRef(currentUser);
  const socketRef = useRef(socket);
  const groupSelectRef = useRef(groupSelect);
  const groupRef = useRef(groups);

  // Update refs
  useEffect(() => {
    privateRecipientRef.current = privateRecipient;
    currentUserRef.current = currentUser;
    socketRef.current = socket;
    groupSelectRef.current = groupSelect;
    groupRef.current = groups;
  }, [privateRecipient, currentUser, groupSelect, groups]);

  // Setup socket
  useEffect(() => {
    const newSocket = io(HOST);
    setSocket(newSocket);

    setupSocketListeners(
      newSocket,
      currentUser,
      currentUserRef,
      privateRecipientRef,
      groupSelectRef,
      groupRef,
      setJoined,
      setClients,
      setGroups,
      setMessages,
      setPrivateMessages,
      setGroupMessages,
      readPrivateMessage,
      readGroupMessage,
      scrollRef
    );

    return () => {
      newSocket.disconnect();
    };
  }, []);

  // Event handlers
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

  const readPrivateMessage = (client: string) => {
    if (socketRef.current) {
      socketRef.current.emit('read_private_message', {
        reader: currentUserRef.current,
        sender: client,
      });
    }
  };

  const readGroupMessage = (group: string) => {
    if (socketRef.current) {
      socketRef.current.emit('read_group_message', {
        groupName: group,
        reader: currentUserRef.current,
      });
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
      <JoinScreen
        nameInput={nameInput}
        onNameChange={setNameInput}
        onJoin={joinChat}
      />
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar
        clients={clients}
        currentUser={currentUser}
        privateRecipient={privateRecipient}
        groups={groups}
        groupSelect={groupSelect}
        onSelectUser={user => {
          setPrivateRecipient(user);
          setCurrentChat('private');
          readPrivateMessage(user);
          setGroupSelect('');
        }}
        onSelectGroup={group => {
          setGroupSelect(group);
          setPrivateRecipient('');
          readGroupMessage(group);
          setCurrentChat('group');
        }}
      />

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
          {/* Messages */}
          <div className="border border-gray-300 h-72 overflow-y-auto p-3 mb-2 bg-white rounded-lg shadow">
            {messages.map((msg, idx) => (
              <p key={idx}>{msg}</p>
            ))}
          </div>

    {/* Input + Emoji */}
          <div className="flex gap-2 items-center relative">
            <input
              type="text"
              placeholder="Type a message..."
              value={messageInput}
              onChange={e => setMessageInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendMessage()}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
            />
            <button
              onClick={() => setShowEmojiPicker(prev => !prev)}
              className="px-2 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
            >
              😀
            </button>
            <button
              onClick={sendMessage}
              className="px-4 py-2 bg-red-600 text-white font-semibold rounded-lg shadow hover:bg-red-700 transition"
            >
              Send
            </button>

            {showEmojiPicker && (
              <div className="absolute bottom-12 right-0 z-50">
                <EmojiPicker
                  onEmojiClick={(emojiObject) => {
                    setMessageInput(prev => prev + emojiObject.emoji);
                    setShowEmojiPicker(false);
                  }}
                  theme={Theme.LIGHT} // ใช้ Theme enum แทน string
                />
              </div>
            )}
          </div>
        </div>
      )}

        {/* === Private Chat === */}
      {currentChat === 'private' && (
        <div>
          {/* Messages */}
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
                  <div key={idx}>
                    <p className={`text-sm pl-1 ${msg.from === currentUser ? 'hidden' : 'flex'}`}>
                      {msg.from}
                    </p>
                    <div className={`flex ${msg.from === privateRecipient ? 'flex-row' : 'flex-row-reverse'}`}>
                      <div
                        className={`max-w-xs px-3 py-2 rounded-2xl text-white ${
                          msg.to === privateRecipient ? 'bg-blue-500 rounded-br-none' : 'bg-gray-500 rounded-bl-none'
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
                  </div>
                ))}
            </div>
          </div>

          {/* Input + Emoji */}
          <div className="flex gap-2 items-center relative">
            <input
              type="text"
              placeholder={`Message to ${privateRecipient || 'select user'}`}
              value={messageInput}
              onChange={e => setMessageInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendPrivateMessage()}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
            />
            <button
              onClick={() => setShowEmojiPicker(prev => !prev)}
              className="px-2 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
            >
              😀
            </button>
            <button
              onClick={sendPrivateMessage}
              disabled={!privateRecipient}
              className="px-4 py-2 bg-red-600 text-white font-semibold rounded-lg shadow hover:bg-red-700 transition disabled:opacity-50"
            >
              Send
            </button>

            {showEmojiPicker && (
              <div className="absolute bottom-12 right-0 z-50">
                <EmojiPicker
                  onEmojiClick={(emojiObject) => {
                    setMessageInput(prev => prev + emojiObject.emoji);
                    setShowEmojiPicker(false);
                  }}
                  theme={Theme.LIGHT} // ใช้ Theme enum แทน string
                />
              </div>
            )}
          </div>
        </div>
      )}


        {/* === Group Chat === */}
        {currentChat === 'group' && (
          <div>
  {/* Chat messages */}
  <div
    ref={scrollRef}
    className="border border-gray-300 h-72 overflow-y-auto p-3 mb-2 bg-white rounded-lg shadow"
  >
    <div className="flex flex-col space-y-2 p-4">
      {groupMessages
        .filter(msg => msg.group === groupSelect)
        .map((msg, idx) => (
          <div key={idx}>
            <p className={`text-sm pl-1 ${msg.from === currentUser ? 'hidden' : 'flex'}`}>
              {msg.from}
            </p>
            <div className={`flex ${msg.from === currentUser ? 'flex-row-reverse' : 'flex-row'}`}>
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
                  <p className="text-[10px] text-gray-500">อ่านแล้ว {msg.read_number}</p>
                )}
                {new Date(msg.timestamp).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: false,
                })}
              </span>
            </div>
          </div>
        ))}
    </div>
  </div>

      {/* Input + Emoji */}
        <div className="flex gap-2 items-center relative">
          <input
            type="text"
            placeholder={`Message in ${groupSelect || 'select group'}`}
            value={messageInput}
            onChange={e => setMessageInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && sendGroupMessage()}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
          {/* Emoji Button */}
          <button
            onClick={() => setShowEmojiPicker(prev => !prev)}
            className="px-2 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
          >
            😀
          </button>
          <button
            onClick={sendGroupMessage}
            disabled={!groupSelect}
            className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow hover:bg-blue-700 transition disabled:opacity-50"
          >
            Send
          </button>

          {/* Emoji Picker */}
          {showEmojiPicker && (
            <div className="absolute bottom-12 right-0 z-50">
              <EmojiPicker
                onEmojiClick={emojiObject => {
                  setMessageInput(prev => prev + emojiObject.emoji);
                  setShowEmojiPicker(false);
                }}
                theme={Theme.LIGHT}
              />
            </div>
          )}
        </div>
      </div>

        )}
      </main>

      <RightSidebar
        currentChat={currentChat}
        groupSelect={groupSelect}
        groups={groups}
        currentUser={currentUser}
        clients={clients}
        groupNameInput={groupNameInput}
        onGroupNameChange={setGroupNameInput}
        onCreateGroup={() => {
          createGroup();
          joinGroup(groupNameInput);
        }}
        onJoinGroup={joinGroup}
      />
    </div>
  );
}

export default App;
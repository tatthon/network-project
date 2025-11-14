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
import { JoinScreen } from './components/JoinScreen';
import { LeftSidebar } from './components/LeftSidebar';
import { MessageInput } from './components/MessageInput';
import { RightSidebar } from './components/RightSidebar';
import { PrivateMessageScreen } from './components/PrivateMessageScreen';
import { GroupMessageScreen } from './components/GroupMessageScreen';

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
      <LeftSidebar
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
          <MessageInput
            value={messageInput}
            placeholder="Type a message..."
            onChange={setMessageInput}
            onSend={sendMessage}
            onToggleEmoji={() => setShowEmojiPicker(prev => !prev)}
            showEmojiPicker={showEmojiPicker}
            onEmojiSelect={emoji => setMessageInput(prev => prev + emoji)}
            sendButtonColor="red"
          />
        </div>
      )}

        {/* === Private Chat === */}
      {currentChat === 'private' && (
        <div>
          {/* Messages */}
          <PrivateMessageScreen
            scrollRef={scrollRef}
            privateMessages={privateMessages}
            privateRecipient={privateRecipient}
            currentUser={currentUser}
          />

          {/* Input + Emoji */}
          <MessageInput
            value={messageInput}
            placeholder={`Message to ${privateRecipient || 'select user'}`}
            onChange={setMessageInput}
            onSend={sendPrivateMessage}
            onToggleEmoji={() => setShowEmojiPicker(prev => !prev)}
            showEmojiPicker={showEmojiPicker}
            onEmojiSelect={emoji => setMessageInput(prev => prev + emoji)}
            disabled={!privateRecipient}
            sendButtonColor="red"
          />
        </div>
      )}


        {/* === Group Chat === */}
        {currentChat === 'group' && (
          <div>
  <GroupMessageScreen
    scrollRef={scrollRef}
    groupMessages={groupMessages}
    groupSelect={groupSelect}
    currentUser={currentUser}
  />

      {/* Input + Emoji */}
        <MessageInput
          value={messageInput}
          placeholder={`Message in ${groupSelect || 'select group'}`}
          onChange={setMessageInput}
          onSend={sendGroupMessage}
          onToggleEmoji={() => setShowEmojiPicker(prev => !prev)}
          showEmojiPicker={showEmojiPicker}
          onEmojiSelect={emoji => setMessageInput(prev => prev + emoji)}
          disabled={!groupSelect}
          sendButtonColor="blue"
        />
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
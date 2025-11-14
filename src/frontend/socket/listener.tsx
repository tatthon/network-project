import { Socket } from 'socket.io-client';
import React from 'react';
import { Group, Message, GroupMessage } from '../../types';
export const setupSocketListeners = (
  newSocket: Socket,
  currentUser: string,
  currentUserRef: React.MutableRefObject<string>,
  privateRecipientRef: React.MutableRefObject<string>,
  groupSelectRef: React.MutableRefObject<string>,
  groupRef: React.MutableRefObject<Group[]>,
  setJoined: (val: boolean) => void,
  setClients: (val: string[]) => void,
  setGroups: (val: Group[]) => void,
  setMessages: (fn: (prev: string[]) => string[]) => void,
  setPrivateMessages: (fn: (prev: Message[]) => Message[]) => void,
  setGroupMessages: (fn: (prev: GroupMessage[]) => GroupMessage[]) => void,
  readPrivateMessage: (client: string) => void,
  readGroupMessage: (group: string) => void,
  scrollRef: React.MutableRefObject<HTMLDivElement | null>
) => {
  newSocket.on('joined', () => setJoined(true));
  newSocket.on('name_taken', () => alert('Name already taken. Choose another name.'));
  newSocket.on('client_list', setClients);
  newSocket.on('group_list', setGroups);

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
      setTimeout(() => readPrivateMessage(privateRecipientRef.current), 10);
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
      {
        group: data.groupName,
        from: data.from,
        text: data.message,
        read: false,
        read_number: 0,
        read_peoples: [],
        can_see: groupRef.current.find(g => g.name === groupSelectRef.current)?.members || [],
        timestamp: Date.now(),
      },
    ]);
    setTimeout(() => readGroupMessage(groupSelectRef.current), 20);
  });

  newSocket.on('group_message_sent', (data: { groupName: string; message: string }) => {
    setGroupMessages(prev => [
      ...prev,
      {
        group: data.groupName,
        from: currentUserRef.current,
        text: data.message,
        read: false,
        read_number: 0,
        read_peoples: [],
        can_see: groupRef.current.find(g => g.name === groupSelectRef.current)?.members || [],
        timestamp: Date.now(),
      },
    ]);
    setTimeout(() => {
      if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }, 0);
  });

  newSocket.on('group_message_read', (data: { groupName: string; reader: string }) => {
    setGroupMessages(prev =>
      prev.map(msg => {
        if (msg.group === data.groupName && msg.from === currentUserRef.current) {
          const canRead = msg.can_see.includes(data.reader);
          const alreadyRead = msg.read_peoples.includes(data.reader);
          return {
            ...msg,
            read: msg.read_number > 0 || canRead,
            read_number: alreadyRead || !canRead ? msg.read_number : msg.read_number + 1,
            read_peoples: alreadyRead || !canRead ? msg.read_peoples : [...msg.read_peoples, data.reader],
          };
        }
        return msg;
      })
    );
  });

  newSocket.on('error', (message: string) => alert('Error: ' + message));
};
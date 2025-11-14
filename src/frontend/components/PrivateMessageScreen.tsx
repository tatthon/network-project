import React from 'react';
import { Message } from '../../types';

export interface PrivateMessageScreenProps {
  scrollRef: React.RefObject<HTMLDivElement>;
  privateMessages: Message[];
  privateRecipient: string;
  currentUser: string;
}

export const PrivateMessageScreen: React.FC<PrivateMessageScreenProps> = ({
  scrollRef,
  privateMessages,
  privateRecipient,
  currentUser,
}) => {
  return (
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
  );
};

export default PrivateMessageScreen;
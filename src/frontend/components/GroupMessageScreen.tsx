import React from 'react';
import { GroupMessage } from '../../types';

export interface GroupMessageScreenProps {
  scrollRef: React.RefObject<HTMLDivElement>;
  groupMessages: GroupMessage[];
  groupSelect: string;
  currentUser: string;
}

export const GroupMessageScreen: React.FC<GroupMessageScreenProps> = ({
  scrollRef,
  groupMessages,
  groupSelect,
  currentUser,
}) => {
  return (
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
  );
};

export default GroupMessageScreen;
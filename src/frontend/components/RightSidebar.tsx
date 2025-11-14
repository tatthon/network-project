import React from 'react';
import { Group } from '../../types';

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

export const RightSidebar: React.FC<RightSidebarProps> = ({
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
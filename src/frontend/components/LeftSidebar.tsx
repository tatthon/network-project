import {Group} from '../../types/';
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
interface JoinScreenProps {
  nameInput: string;
  onNameChange: (val: string) => void;
  onJoin: () => void;
}

export const JoinScreen: React.FC<JoinScreenProps> = ({ nameInput, onNameChange, onJoin }) => (
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
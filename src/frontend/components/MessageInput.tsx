import React from 'react';
import EmojiPicker, { Theme } from 'emoji-picker-react';

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

export const MessageInput: React.FC<MessageInputProps> = ({
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
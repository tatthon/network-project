import React, { useEffect, useRef } from 'react';

interface JoinScreenProps {
  nameInput: string;
  onNameChange: (val: string) => void;
  onJoin: () => void;
}

export const JoinScreen: React.FC<JoinScreenProps> = ({ nameInput, onNameChange, onJoin }) => {
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const disabled = nameInput.trim().length === 0;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-pink-50 p-6">
      <div className="w-full max-w-md bg-white/90 backdrop-blur-md rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
        <div className="p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="flex items-center justify-center w-14 h-14 rounded-lg bg-gradient-to-br from-red-500 to-pink-500 text-white shadow">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8a9.96 9.96 0 01-4.5-1L3 20l1.5-4.5A7.978 7.978 0 013 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-gray-800">Multi-Client Chat</h1>
              <p className="text-sm text-gray-500">เข้าร่วมแชทด้วยชื่อของคุณ</p>
            </div>
          </div>

          <label className="block text-xs text-gray-500 mb-2">Your display name</label>
          <div className="flex items-center gap-2">
            <input
              ref={inputRef}
              type="text"
              aria-label="Enter your name"
              placeholder="เช่น สมชาย หรือ Kitty123"
              value={nameInput}
              onChange={e => onNameChange(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !disabled && onJoin()}
              className="flex-1 px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-pink-300 transition"
              maxLength={24}
            />
            <button
              onClick={onJoin}
              disabled={disabled}
              className={`px-4 py-3 rounded-lg text-white font-medium transition disabled:opacity-60 ${
                disabled ? 'bg-gray-300 cursor-not-allowed' : 'bg-pink-500 hover:bg-pink-600'
              }`}
            >
              Join
            </button>
          </div>

          <p className="mt-3 text-xs text-gray-400">ชื่อนี้จะใช้แสดงในห้องแชท — หลีกเลี่ยงคำหยาบหรือข้อมูลส่วนตัว</p>
        </div>

        <div className="bg-gray-50 px-6 py-3 border-t border-gray-100 text-center text-xs text-gray-500">
          Tip: คุณสามารถเปลี่ยนชื่อได้โดยออกจากแชทแล้วเข้าร่วมใหม่
        </div>
      </div>
    </div>
  );
};
import React from 'react';
import { X } from 'lucide-react';

interface WelcomeDialogProps {
  onClose: () => void;
  onLogin: () => void;
}

export function WelcomeDialog({ onClose, onLogin }: WelcomeDialogProps) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-[#202d39] p-6 rounded-lg max-w-md w-full mx-4">
        <div className="flex items-start justify-between mb-4">
          <h2 className="text-xl font-bold">Welcome to Steam Store Simulator</h2>
        </div>
        <p className="text-gray-300 mb-6">
          This is a simulator for creating and sharing Steam store page mockups.
          Please sign in to continue.
        </p>
        <div className="flex flex-col gap-3">
          <button
            onClick={onLogin}
            className="bg-[#5c7e10] hover:bg-[#739c16] text-white py-2 px-4 rounded"
          >
            Sign In
          </button>
        </div>
      </div>
    </div>
  );
}
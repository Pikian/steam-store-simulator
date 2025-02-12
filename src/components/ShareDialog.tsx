import React, { useState } from 'react';
import { X, Copy, Check } from 'lucide-react';

interface ShareDialogProps {
  username: string;
  gameTitle: string;
  onClose: () => void;
}

export function ShareDialog({ username, gameTitle, onClose }: ShareDialogProps) {
  const [copied, setCopied] = useState(false);
  const shareUrl = `${window.location.origin}/capsule/${username}/${encodeURIComponent(gameTitle)}`;

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-[#1b2838] rounded-lg w-full max-w-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold">Share Game Capsule</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <p className="text-sm text-gray-300">
            Share your game capsule with others using this link:
          </p>

          <div className="flex items-center space-x-2">
            <input
              type="text"
              value={shareUrl}
              readOnly
              className="flex-1 bg-[#32404e] p-2 rounded text-sm text-white"
            />
            <button
              onClick={copyToClipboard}
              className="bg-[#5c7e10] hover:bg-[#739c16] p-2 rounded group"
              title={copied ? "Copied!" : "Copy to clipboard"}
            >
              {copied ? (
                <Check className="w-5 h-5 text-white" />
              ) : (
                <Copy className="w-5 h-5 text-white" />
              )}
            </button>
          </div>

          {copied && (
            <div className="text-center text-sm text-green-400">
              Link copied to clipboard!
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
import React, { useState } from 'react';
import { X, Copy, Check, Save } from 'lucide-react';
import { buildShareUrl } from '../lib/capsuleRoutes';

interface ShareDialogProps {
  capsuleId?: string;
  username: string;
  gameTitle: string;
  onClose: () => void;
  onSaveAndCopy?: () => Promise<void>;
  isSaving?: boolean;
}

export function ShareDialog({
  capsuleId,
  username,
  gameTitle,
  onClose,
  onSaveAndCopy,
  isSaving = false,
}: ShareDialogProps) {
  const [copied, setCopied] = useState(false);
  const shareUrl = capsuleId ? buildShareUrl(capsuleId) : null;

  const copyToClipboard = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
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
          {!shareUrl ? (
            <>
              <p className="text-sm text-gray-300">
                Save your capsule first to get a stable share link. Anyone with the link can view
                without signing in.
              </p>
              {onSaveAndCopy && (
                <button
                  type="button"
                  onClick={onSaveAndCopy}
                  disabled={isSaving}
                  className="w-full bg-[#5c7e10] hover:bg-[#739c16] disabled:opacity-50 px-4 py-2 rounded flex items-center justify-center gap-2 text-sm"
                >
                  <Save className="w-4 h-4" />
                  <span>{isSaving ? 'Saving…' : 'Save & Copy Link'}</span>
                </button>
              )}
            </>
          ) : (
            <>
              <p className="text-sm text-gray-300">
                Share <span className="text-white font-medium">{gameTitle}</span> by{' '}
                <span className="text-white">{username}</span>. Viewers do not need to sign in.
              </p>

              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={shareUrl}
                  readOnly
                  className="flex-1 bg-[#32404e] p-2 rounded text-sm text-white"
                />
                <button
                  type="button"
                  onClick={() => copyToClipboard(shareUrl)}
                  className="bg-[#5c7e10] hover:bg-[#739c16] p-2 rounded group"
                  title={copied ? 'Copied!' : 'Copy to clipboard'}
                >
                  {copied ? (
                    <Check className="w-5 h-5 text-white" />
                  ) : (
                    <Copy className="w-5 h-5 text-white" />
                  )}
                </button>
              </div>

              {copied && (
                <div className="text-center text-sm text-green-400">Link copied to clipboard!</div>
              )}

              {onSaveAndCopy && (
                <button
                  type="button"
                  onClick={onSaveAndCopy}
                  disabled={isSaving}
                  className="w-full bg-[#32404e] hover:bg-[#434e5b] disabled:opacity-50 px-4 py-2 rounded flex items-center justify-center gap-2 text-sm"
                >
                  <Save className="w-4 h-4" />
                  <span>{isSaving ? 'Saving…' : 'Save & Copy Link'}</span>
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

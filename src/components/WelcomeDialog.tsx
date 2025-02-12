import React from 'react';
import { X, Stamp as Steam, PencilLine, Save, Share2, Upload } from 'lucide-react';

interface WelcomeDialogProps {
  onClose: () => void;
  onLogin: () => void;
}

export function WelcomeDialog({ onClose, onLogin }: WelcomeDialogProps) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-[#1b2838] rounded-lg w-full max-w-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Steam className="w-8 h-8 text-[#66c0f4]" />
            <h2 className="text-2xl font-bold">Welcome to Steam Store Preview</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-6 text-gray-300">
          <p className="text-lg">
            Create and share your own Steam store page mockups! Perfect for game developers, 
            designers, or anyone who wants to visualize their game on Steam.
          </p>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">How it works:</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-[#202d39] p-4 rounded-lg">
                <div className="flex items-center space-x-2 mb-2 text-white">
                  <PencilLine className="w-5 h-5" />
                  <h4 className="font-semibold">1. Create Your Page</h4>
                </div>
                <p className="text-sm">
                  Click any text or image to edit. Add screenshots, write descriptions, 
                  set prices, and customize every detail of your store page.
                </p>
              </div>

              <div className="bg-[#202d39] p-4 rounded-lg">
                <div className="flex items-center space-x-2 mb-2 text-white">
                  <Upload className="w-5 h-5" />
                  <h4 className="font-semibold">2. Add Media</h4>
                </div>
                <p className="text-sm">
                  Upload your game's header image and screenshots through the built-in 
                  media library. Your assets are securely stored and easily manageable.
                </p>
              </div>

              <div className="bg-[#202d39] p-4 rounded-lg">
                <div className="flex items-center space-x-2 mb-2 text-white">
                  <Save className="w-5 h-5" />
                  <h4 className="font-semibold">3. Save Your Work</h4>
                </div>
                <p className="text-sm">
                  Save your store page to your account. Create multiple versions and 
                  access them anytime. Your previous suggestions are always available.
                </p>
              </div>

              <div className="bg-[#202d39] p-4 rounded-lg">
                <div className="flex items-center space-x-2 mb-2 text-white">
                  <Share2 className="w-5 h-5" />
                  <h4 className="font-semibold">4. Share</h4>
                </div>
                <p className="text-sm">
                  Share your store page with others using a unique link. Perfect for 
                  getting feedback or showcasing your game's presentation.
                </p>
              </div>
            </div>
          </div>

          <div className="pt-4">
            <button
              onClick={onLogin}
              className="w-full bg-[#5c7e10] hover:bg-[#739c16] text-white py-3 px-4 rounded-lg text-lg font-semibold transition-colors"
            >
              Get Started
            </button>
            <p className="text-center text-sm mt-2 text-gray-400">
              Sign in to start creating your Steam store page preview
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
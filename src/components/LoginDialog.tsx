import { useState } from 'react';
import { X, Mail, Check } from 'lucide-react';
import { allowedDomainsHint, isAllowedEmail, allowedDomainsErrorMessage } from '../lib/allowedEmailDomains';

interface LoginDialogProps {
  onLogin: (email: string) => Promise<void>;
  onClose: () => void;
}

export function LoginDialog({ onLogin, onClose }: LoginDialogProps) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [emailSent, setEmailSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      setError('Please enter your email address');
      return;
    }

    if (!isAllowedEmail(email)) {
      setError(allowedDomainsErrorMessage());
      return;
    }

    setLoading(true);
    setError('');

    try {
      await onLogin(email);
      setEmailSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send login link');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-[#1b2838] rounded-lg w-full max-w-md p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white"
          disabled={loading}
        >
          <X className="w-5 h-5" />
        </button>

        {emailSent ? (
          <div className="text-center py-8">
            <div className="bg-[#5c7e10]/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-[#5c7e10]" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Check your email</h2>
            <p className="text-gray-400 mb-4">
              We sent a login link to<br />
              <span className="text-white font-medium">{email}</span>
            </p>
            <p className="text-sm text-gray-400 mb-6">
              Click the link in the email to sign in. The link will expire in 1 hour.
            </p>
            <button
              onClick={onClose}
              className="w-full bg-[#32404e] hover:bg-[#434e5b] text-white py-2 px-4 rounded font-medium"
            >
              Close
            </button>
          </div>
        ) : (
          <>
            <div className="mb-6">
              <div className="bg-[#5c7e10]/20 w-12 h-12 rounded-full flex items-center justify-center mb-4">
                <Mail className="w-6 h-6 text-[#5c7e10]" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Sign In</h2>
              <p className="text-gray-400 text-sm">
                Enter your work email ({allowedDomainsHint()}) to receive a login link
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium mb-2">
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[#32404e] text-white px-4 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="your.name@company.com"
                  disabled={loading}
                  autoFocus
                />
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-2 rounded text-sm">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#5c7e10] hover:bg-[#739c16] text-white py-2 px-4 rounded font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Sending link...' : 'Send Login Link'}
              </button>

              <div className="text-xs text-gray-400 space-y-1">
                <p>✓ No password needed</p>
                <p>✓ Only {allowedDomainsHint()} emails</p>
                <p>✓ Link expires in 1 hour</p>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}


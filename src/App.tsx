import { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import { MediaLibrary } from './components/MediaLibrary';
import { ShareDialog } from './components/ShareDialog';
import { ScreenshotGallery } from './components/ScreenshotGallery';
import { WelcomeDialog } from './components/WelcomeDialog';
import { Session } from '@supabase/supabase-js';
import { 
  Stamp as Steam, 
  Tags, 
  PencilLine, 
  Save, 
  Plus, 
  Home,
  GamepadIcon,
  ShoppingCart,
  Users,
  Settings,
  Download,
  Search,
  Share2,
  LogOut,
  AlertTriangle,
  Star,
  Trash2
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface Suggestion {
  id?: string;
  title: string;
  short_description: string;
  long_description: string;
  header_image: string;
  screenshots: string[];
  tags: string[];
  price: number;
  username: string;
  is_default?: boolean;
}

const defaultSuggestionTemplate: Suggestion = {
  title: 'Your Game Title',
  short_description: 'A brief description of your game',
  long_description: '# About This Game\n\nA brutal exploration and survival game for 1-10 players, set in a procedurally-generated purgatory inspired by viking culture. Battle, build, and conquer your way to a saga worthy of Odin\'s attention!\n\n## Key Features\n\n- **Massive Procedural World**: Explore a world rich with dangers and rewards\n- **Complex Building System**: Craft epic longhouses and mighty fortresses\n- **Intense Combat**: Wield mighty weapons and defeat legendary creatures\n- **Cooperative Play**: Adventure with friends in a shared world\n\n## Your Viking Journey\n\nYou are a fallen viking warrior. Build your strength in a forgotten realm, craft powerful weapons, and slay mighty beasts to prove yourself worthy of Valhalla.',
  header_image: 'https://images.unsplash.com/photo-1500964757637-c85e8a162699',
  screenshots: [
    'https://images.unsplash.com/photo-1518709766631-a6a7f45921c3',
    'https://images.unsplash.com/photo-1516541196182-6bdb0516ed27',
    'https://images.unsplash.com/photo-1530071100468-90954e4921d5'
  ],
  tags: ['Open World Survival Craft', 'Survival', 'Online Co-Op', 'Building', 'Exploration'],
  price: 19.99,
  username: ''
};

function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [editing, setEditing] = useState<string | null>(null);
  const [selectedScreenshot, setSelectedScreenshot] = useState<number>(0);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [showMediaLibrary, setShowMediaLibrary] = useState(false);
  const [showWelcomeDialog, setShowWelcomeDialog] = useState(true);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [mediaTarget, setMediaTarget] = useState<'header' | 'screenshots' | null>(null);
  const [sharedUsername, setSharedUsername] = useState<string | null>(null);
  const [sharedTitle, setSharedTitle] = useState<string | null>(null);
  const [loadingError, setLoadingError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [defaultTemplate, setDefaultTemplate] = useState<Suggestion | null>(null);
  const [currentSuggestion, setCurrentSuggestion] = useState<Suggestion>(defaultSuggestionTemplate);

  // Initialize session
  useEffect(() => {
    const initSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setSession(session);
      } catch (error) {
        console.error('Error initializing session:', error);
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    initSession();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Load data
  useEffect(() => {
    const loadData = async () => {
      if (sharedUsername && sharedTitle) {
        await loadSharedCapsule();
      } else {
        await loadSuggestions();
        if (!defaultTemplate) {
          await loadDefaultTemplate();
        }
      }
    };

    loadData();
  }, [session, sharedUsername, sharedTitle, defaultTemplate]);

  // Check for shared capsule
  useEffect(() => {
    const path = window.location.pathname;
    const match = path.match(/^\/capsule\/([^/]+)\/(.+)$/);
    
    if (match) {
      const [, username, title] = match;
      setSharedUsername(username);
      setSharedTitle(decodeURIComponent(title));
      setShowWelcomeDialog(false);
    }
  }, []);

  // Handle first interaction with shared capsule
  useEffect(() => {
    if (sharedUsername && !session && !hasInteracted) {
      const handleFirstInteraction = () => {
        setShowWelcomeDialog(true);
        setHasInteracted(true);
        document.removeEventListener('click', handleFirstInteraction);
      };

      document.addEventListener('click', handleFirstInteraction);

      return () => {
        document.removeEventListener('click', handleFirstInteraction);
      };
    }
  }, [sharedUsername, session, hasInteracted]);

  const loadDefaultTemplate = async () => {
    try {
      const { data, error } = await supabase
        .from('suggestions')
        .select()
        .eq('is_default', true)
        .single();

      if (error) throw error;
      
      if (data) {
        setDefaultTemplate(data);
        setCurrentSuggestion(data);
      }
    } catch (err) {
      console.error('Error loading default template:', err);
    }
  };

  const loadSharedCapsule = async () => {
    if (!sharedUsername || !sharedTitle) return;

    try {
      setLoadingError(null);
      const { data, error } = await supabase
        .from('suggestions')
        .select()
        .eq('username', sharedUsername)
        .eq('title', sharedTitle)
        .maybeSingle();

      if (error) throw error;
      
      if (data) {
        setCurrentSuggestion(data);
        setEditing(null);
      } else {
        setLoadingError('This game capsule does not exist or has been removed.');
      }
    } catch (err) {
      console.error('Error loading shared capsule:', err);
      setLoadingError('Failed to load the game capsule. Please try again later.');
    }
  };

  const loadSuggestions = async () => {
    try {
      setLoadingError(null);
      const { data, error } = await supabase
        .from('suggestions')
        .select()
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setSuggestions(data || []);
    } catch (err) {
      console.error('Error loading suggestions:', err);
      setLoadingError('Failed to load suggestions. Please try again later.');
    }
  };

  const handleLogin = async () => {
    const username = prompt('Choose a username:');
    if (!username) return;

    try {
      const { data, error } = await supabase.auth.signUp({
        email: `${Math.random().toString(36).substring(2)}@preview.com`,
        password: Math.random().toString(36).substring(2),
        options: {
          data: { username }
        }
      });

      if (error) throw error;
      if (data.session) {
        setSession(data.session);
        setShowWelcomeDialog(false);
      }
    } catch (err) {
      console.error('Error during login:', err);
      alert('Failed to sign in. Please try again.');
    }
  };

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      // Reset state
      setSession(null);
      setSuggestions([]);
      if (defaultTemplate) {
        setCurrentSuggestion(defaultTemplate);
      }
      setShowWelcomeDialog(true);
    } catch (err) {
      console.error('Error signing out:', err);
      alert('Failed to sign out. Please try again.');
    }
  };

  const saveSuggestion = async () => {
    if (!session?.user?.user_metadata?.username) {
      alert('Please sign in to save suggestions');
      return;
    }

    try {
      // Validate required fields
      if (!currentSuggestion.title) {
        throw new Error('Title is required');
      }

      // Create a new suggestion object without the id field
      const { id, ...suggestionWithoutId } = currentSuggestion;
      
      const suggestionData = {
        ...suggestionWithoutId,
        username: session.user.user_metadata.username,
        // Ensure all required fields have default values
        short_description: currentSuggestion.short_description || '',
        long_description: currentSuggestion.long_description || '',
        header_image: currentSuggestion.header_image || '',
        screenshots: currentSuggestion.screenshots || [],
        tags: currentSuggestion.tags || [],
        price: currentSuggestion.price || 0
      };

      let operation;
      if (id) {
        // Update existing suggestion
        operation = supabase
          .from('suggestions')
          .update(suggestionData)
          .eq('id', id)
          .select()
          .single();
      } else {
        // Insert new suggestion
        operation = supabase
          .from('suggestions')
          .insert([suggestionData])
          .select()
          .single();
      }

      const { data, error } = await operation;

      if (error) throw error;

      alert('Game capsule saved successfully!');
      await loadSuggestions();
      
      // Update current suggestion with the saved data
      if (data) {
        setCurrentSuggestion(data);
      }
    } catch (err) {
      console.error('Error saving suggestion:', err);
      alert(err instanceof Error ? err.message : 'Failed to save game capsule. Please try again.');
    }
  };

  const saveAsNew = async () => {
    if (!session?.user?.user_metadata?.username) {
      alert('Please sign in to save suggestions');
      return;
    }

    try {
      // Validate required fields
      if (!currentSuggestion.title) {
        throw new Error('Title is required');
      }

      // Create a new suggestion object without the id and is_default fields
      const { id: _, is_default: __, ...suggestionWithoutId } = currentSuggestion;
      
      const suggestionData = {
        ...suggestionWithoutId,
        username: session.user.user_metadata.username,
        // Ensure all required fields have default values
        short_description: currentSuggestion.short_description || '',
        long_description: currentSuggestion.long_description || '',
        header_image: currentSuggestion.header_image || '',
        screenshots: currentSuggestion.screenshots || [],
        tags: currentSuggestion.tags || [],
        price: currentSuggestion.price || 0
      };

      const { data, error } = await supabase
        .from('suggestions')
        .insert([suggestionData])
        .select()
        .single();

      if (error) throw error;

      alert('Game capsule saved as new suggestion!');
      await loadSuggestions();
      
      // Update current suggestion with the saved data
      if (data) {
        setCurrentSuggestion(data);
      }
    } catch (err) {
      console.error('Error saving suggestion:', err);
      alert(err instanceof Error ? err.message : 'Failed to save game capsule. Please try again.');
    }
  };

  const deleteSuggestion = async (id: string) => {
    if (!session?.user?.user_metadata?.username) {
      alert('Please sign in to delete suggestions');
      return;
    }

    if (!window.confirm('Are you sure you want to delete this suggestion?')) {
      return;
    }

    try {
      setDeleting(id);
      const { error } = await supabase
        .from('suggestions')
        .delete()
        .eq('id', id)
        .eq('username', session.user.user_metadata.username);

      if (error) throw error;

      await loadSuggestions();
      alert('Suggestion deleted successfully!');
      
      // Reset to default template if the current suggestion was deleted
      if (currentSuggestion.id === id && defaultTemplate) {
        setCurrentSuggestion(defaultTemplate);
      }
    } catch (err) {
      console.error('Error deleting suggestion:', err);
      alert('Failed to delete suggestion. Please try again.');
    } finally {
      setDeleting(null);
    }
  };

  const handleMediaSelect = (url: string) => {
    if (mediaTarget === 'header') {
      setCurrentSuggestion({
        ...currentSuggestion,
        header_image: url
      });
    } else if (mediaTarget === 'screenshots') {
      setCurrentSuggestion({
        ...currentSuggestion,
        screenshots: [...(currentSuggestion.screenshots || []), url]
      });
    }
    setShowMediaLibrary(false);
    setMediaTarget(null);
  };

  const openMediaLibrary = (target: 'header' | 'screenshots') => {
    if (!session) {
      alert('Please sign in to access the media library');
      return;
    }
    setMediaTarget(target);
    setShowMediaLibrary(true);
  };

  const markAsDefaultTemplate = async (suggestionId: string) => {
    if (!session?.user?.user_metadata?.username || session.user.user_metadata.username !== 'Pikian') {
      return;
    }

    try {
      // First, remove default status from any existing default template
      const { error: clearError } = await supabase
        .from('suggestions')
        .update({ is_default: false })
        .eq('username', session.user.user_metadata.username)
        .eq('is_default', true);

      if (clearError) throw clearError;

      // Set the new default template
      const { error: setError } = await supabase
        .from('suggestions')
        .update({ is_default: true })
        .eq('id', suggestionId);

      if (setError) throw setError;

      await loadSuggestions();
      await loadDefaultTemplate();
      alert('Default template updated successfully!');
    } catch (err) {
      console.error('Error setting default template:', err);
      alert('Failed to set default template. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-[#1b2838] text-white">
      {/* Global Navigation */}
      <nav className="bg-[#171a21] text-sm">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-4 py-1">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 mr-2">
              <Steam className="w-6 h-6 text-[#1b2838]" />
              <span className="font-bold tracking-wide text-base bg-gradient-to-br from-[#c7d5e0] to-[#67c1f5] bg-clip-text text-transparent">
                STEAM
              </span>
            </div>
            <a href="#" className="text-gray-300 hover:text-white text-xs">STORE</a>
            <a href="#" className="text-gray-300 hover:text-white text-xs">COMMUNITY</a>
            <a href="#" className="text-gray-300 hover:text-white text-xs">ABOUT</a>
            <a href="#" className="text-gray-300 hover:text-white text-xs">SUPPORT</a>
          </div>
          <div className="flex items-center space-x-3">
            {!session ? (
              <button
                onClick={handleLogin}
                className="bg-[#5c7e10] hover:bg-[#739c16] px-3 py-0.5 rounded text-xs"
              >
                Sign In
              </button>
            ) : (
              <div className="flex items-center space-x-3">
                <span className="text-xs">{session.user.user_metadata.username}</span>
                <button
                  onClick={handleSignOut}
                  className="flex items-center space-x-1 text-gray-300 hover:text-white text-xs"
                >
                  <LogOut className="w-3 h-3" />
                  <span>Sign Out</span>
                </button>
              </div>
            )}
            <button className="bg-[#5c7e10] hover:bg-[#739c16] px-3 py-0.5 rounded text-xs">
              Install Steam
            </button>
          </div>
        </div>
      </nav>

      {/* Store Navigation */}
      <div className="bg-gradient-to-b from-[#2a475e] to-[#1b2838] shadow-lg">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center space-x-4 py-1 text-xs">
            <div className="flex items-center space-x-1 text-gray-300 hover:text-white cursor-pointer">
              <Home className="w-3 h-3" />
              <span>Your Store</span>
            </div>
            <div className="flex items-center space-x-1 text-gray-300 hover:text-white cursor-pointer">
              <GamepadIcon className="w-3 h-3" />
              <span>New & Noteworthy</span>
            </div>
            <div className="flex items-center space-x-1 text-gray-300 hover:text-white cursor-pointer">
              <ShoppingCart className="w-3 h-3" />
              <span>Categories</span>
            </div>
            <div className="flex items-center space-x-1 text-gray-300 hover:text-white cursor-pointer">
              <Users className="w-3 h-3" />
              <span>Points Shop</span>
            </div>
            <div className="flex items-center space-x-1 text-gray-300 hover:text-white cursor-pointer">
              <Settings className="w-3 h-3" />
              <span>News</span>
            </div>
            <div className="flex items-center space-x-1 text-gray-300 hover:text-white cursor-pointer">
              <Download className="w-3 h-3" />
              <span>Labs</span>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative py-1">
            <input
              type="text"
              placeholder="search the store"
              className="w-80 bg-[#316282] text-white placeholder-gray-400 px-3 py-0.5 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <Search className="absolute right-2 top-1/2 transform -translate-y-1/2 w-3 h-3 text-gray-400" />
          </div>
        </div>
      </div>

      {/* Breadcrumb */}
      <div className="bg-[#1b2838]">
        <div className="max-w-6xl mx-auto px-4 py-1">
          <div className="flex items-center space-x-2 text-xs text-gray-400">
            <a href="#" className="hover:text-blue-300">All Games</a>
            <span>&gt;</span>
            <a href="#" className="hover:text-blue-300">Action Games</a>
            <span>&gt;</span>
            <span className="text-white">{currentSuggestion.title}</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto p-4">
        {loadingError && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded mb-4">
            {loadingError}
          </div>
        )}

        <div className="bg-[#1b2838]">
          {/* Game Title & Navigation */}
          <div className="bg-gradient-to-r from-[#1b2838] to-[#2a475e] p-3">
            <div className="max-w-6xl mx-auto">
              {editing === 'title' ? (
                <input
                  type="text"
                  value={currentSuggestion.title}
                  onChange={(e) => setCurrentSuggestion({
                    ...currentSuggestion,
                    title: e.target.value
                  })}
                  className="text-2xl font-bold bg-[#32404e] p-2 rounded w-full mb-1"
                />
              ) : (
                <div className="flex items-center gap-2">
                  <h2 
                    className={`text-2xl font-bold mb-1 ${session ? 'cursor-pointer hover:text-blue-300' : ''}`}
                    onClick={() => session && !sharedUsername && setEditing('title')}
                  >
                    {currentSuggestion.title}
                  </h2>
                  {currentSuggestion.tags?.includes('Early Access') && (
                    <div className="flex items-center gap-1 bg-[#d2e885] text-[#4c6b22] px-2 py-0.5 rounded text-sm font-medium">
                      <AlertTriangle className="w-4 h-4" />
                      <span>Early Access</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-12 gap-4 mt-3">
            {/* Left Column - Media */}
            <div className="col-span-8">
              {/* Main Media Showcase */}
              <div className="bg-[#202d39] p-3 rounded-lg mb-4">
                <div className="relative aspect-video mb-3">
                  {currentSuggestion.screenshots && currentSuggestion.screenshots.length > 0 ? (
                    currentSuggestion.screenshots[selectedScreenshot].match(/\.(mp4|webm)$/i) ? (
                      <video
                        src={currentSuggestion.screenshots[selectedScreenshot]}
                        className="w-full h-full object-contain bg-black rounded"
                        controls
                        autoPlay
                        playsInline
                      />
                    ) : (
                      <img
                        src={currentSuggestion.screenshots[selectedScreenshot]}
                        alt="Game screenshot"
                        className="w-full h-full object-cover rounded"
                      />
                    )
                  ) : (
                    <div className="w-full h-full bg-[#32404e] rounded flex items-center justify-center">
                      <div className="text-center">
                        <p className="text-gray-400 text-sm mb-2">No screenshots or videos added yet</p>
                        {!sharedUsername && (
                          <button
                            onClick={() => openMediaLibrary('screenshots')}
                            className="text-blue-300 hover:text-blue-400 text-xs"
                          >
                            Click to add media
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {currentSuggestion.screenshots && currentSuggestion.screenshots.length > 0 && (
                  <ScreenshotGallery
                    screenshots={currentSuggestion.screenshots}
                    selectedScreenshot={selectedScreenshot}
                    isEditing={editing === 'screenshots'}
                    onSelect={setSelectedScreenshot}
                    onReorder={(newScreenshots) => {
                      setCurrentSuggestion({
                        ...currentSuggestion,
                        screenshots: newScreenshots
                      });
                    }}
                    onAdd={() => openMediaLibrary('screenshots')}
                    onDelete={(index) => {
                      const newScreenshots = currentSuggestion.screenshots?.filter((_, i) => i !== index);
                      setCurrentSuggestion({
                        ...currentSuggestion,
                        screenshots: newScreenshots
                      });
                      if (selectedScreenshot >= newScreenshots.length) {
                        setSelectedScreenshot(Math.max(0, newScreenshots.length - 1));
                      }
                    }}
                  />
                )}

                {!sharedUsername && (
                  <button
                    onClick={() => setEditing(editing === 'screenshots' ? null : 'screenshots')}
                    className="text-xs text-blue-300 mt-2 hover:text-blue-400"
                  >
                    {editing === 'screenshots' ? 'Done editing' : 'Edit screenshots'}
                  </button>
                )}
              </div>

              {/* Long Description */}
              <div className="bg-[#202d39] p-3 rounded-lg mb-4">
                <h3 className="font-bold mb-3 text-lg">ABOUT THIS GAME</h3>
                {editing === 'long_description' ? (
                  <textarea
                    value={currentSuggestion.long_description}
                    onChange={(e) => setCurrentSuggestion({
                      ...currentSuggestion,
                      long_description: e.target.value
                    })}
                    className="w-full bg-[#32404e] p-2 rounded text-sm"
                    rows={10}
                  />
                ) : (
                  <div 
                    className={`prose prose-invert max-w-none ${session ? 'cursor-pointer hover:text-blue-300' : ''} prose-sm`}
                    onClick={() => session && !sharedUsername && setEditing('long_description')}
                  >
                    <ReactMarkdown>{currentSuggestion.long_description}</ReactMarkdown>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column - Purchase & Info */}
            <div className="col-span-4">
              {/* Header Image */}
              <div className="bg-[#202d39] p-3 rounded-lg mb-4">
                <div className="relative">
                  <img
                    src={currentSuggestion.header_image}
                    alt="Game header"
                    className="w-full rounded"
                  />
                  {!sharedUsername && editing === 'header_image' && (
                    <button
                      onClick={() => openMediaLibrary('header')}
                      className="absolute bottom-3 left-3 bg-black/50 p-1.5 rounded cursor-pointer hover:bg-black/70"
                    >
                      <PencilLine className="w-4 h-4" />
                    </button>
                  )}
                </div>
                {!sharedUsername && (
                  <button
                    onClick={() => setEditing(editing === 'header_image' ? null : 'header_image')}
                    className="text-xs text-blue-300 mt-2 hover:text-blue-400"
                  >
                    {editing === 'header_image' ? 'Done editing' : 'Edit header image'}
                  </button>
                )}
              </div>

              {/* Brief Description */}
              <div className="bg-[#202d39] p-3 rounded-lg mb-4">
                {editing === 'short_description' ? (
                  <textarea
                    value={currentSuggestion.short_description}
                    onChange={(e) => setCurrentSuggestion({
                      ...currentSuggestion,
                      short_description: e.target.value
                    })}
                    className="w-full bg-[#32404e] p-2 rounded text-sm"
                    rows={2}
                  />
                ) : (
                  <p 
                    className={`text-gray-300 ${session ? 'cursor-pointer hover:text-blue-300' : ''} text-sm`}
                    onClick={() => session && !sharedUsername && setEditing('short_description')}
                  >
                    {currentSuggestion.short_description}
                  </p>
                )}
              </div>

              {/* Early Access Notice */}
              {currentSuggestion.tags?.includes('Early Access') && (
                <div className="bg-[#202d39] p-3 rounded-lg mb-4">
                  <div className="flex items-start space-x-3 bg-[#d2e885]/10 p-3 rounded">
                    <AlertTriangle className="w-5 h-5 text-[#d2e885] flex-shrink-0 mt-1" />
                    <div>
                      <h4 className="font-bold text-[#d2e885] mb-1">Early Access Game</h4>
                      <p className="text-sm text-gray-300">
                        This game is currently in active development. It is playable and updated regularly with new content, but may still contain bugs and incomplete features.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Purchase Box */}
              <div className="bg-[#202d39] p-3 rounded-lg mb-4">
                <h3 className="font-bold mb-3 text-sm">Buy {currentSuggestion.title}</h3>
                <div className="bg-[#000000] p-3 rounded">
                  {editing === 'price' ? (
                    <input
                      type="number"
                      value={currentSuggestion.price}
                      onChange={(e) => setCurrentSuggestion({
                        ...currentSuggestion,
                        price: parseFloat(e.target.value)
                      })}
                      className="bg-[#32404e] w-20 p-1 rounded text-sm"
                      step="0.01"
                    />
                  ) : (
                    <div
                      className={`${session ? 'cursor-pointer hover:text-blue-300' : ''}`}
                      onClick={() => session && !sharedUsername && setEditing('price')}
                    >
                      <div className="text-xs text-gray-400">Buy {currentSuggestion.title}</div>
                      <div className="text-xl font-bold">${currentSuggestion.price?.toFixed(2)} USD</div>
                    </div>
                  )}
                  <button className="w-full bg-[#5c7e10] hover:bg-[#739c16] text-white py-1.5 px-3 rounded mt-3 text-sm">
                    Add to Cart
                  </button>
                </div>
              </div>

              {/* Tags */}
              <div className="bg-[#202d39] p-3 rounded-lg mb-4">
                <div className="flex items-center mb-2">
                  <Tags className="w-4 h-4 mr-1.5" />
                  <h3 className="font-bold text-sm">Popular user-defined tags for this product:</h3>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {currentSuggestion.tags?.map((tag, index) => (
                    <span
                      key={index}
                      className={`px-2 py-0.5 rounded text-xs ${
                        tag === 'Early Access'
                          ? 'bg-[#d2e885] text-[#4c6b22] font-medium'
                          : `bg-[#32404e] ${session && editing === 'tags' ? 'hover:bg-[#434e5b] cursor-pointer' : ''}`
                      }`}
                      onClick={() => {
                        if (session && editing === 'tags' && !sharedUsername) {
                          setCurrentSuggestion({
                            ...currentSuggestion,
                            tags: currentSuggestion.tags?.filter((_, i) => i !== index)
                          });
                        }
                      }}
                    >
                      {tag}
                    </span>
                  ))}
                  {session && editing === 'tags' && !sharedUsername && (
                    <button
                      onClick={() => {
                        const tag = prompt('Enter new tag:');
                        if (tag) {
                          setCurrentSuggestion({
                            ...currentSuggestion,
                            tags: [...(currentSuggestion.tags || []), tag]
                          });
                        }
                      }}
                      className="bg-[#32404e] px-2 py-0.5 rounded text-xs hover:bg-[#434e5b]"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  )}
                </div>
                {session && !sharedUsername && (
                  <button
                    onClick={() => setEditing(editing === 'tags' ? null : 'tags')}
                    className="text-xs text-blue-300 mt-2 hover:text-blue-400"
                  >
                    {editing === 'tags' ? 'Done editing' : 'Edit tags'}
                  </button>
                )}
              </div>

              {/* Save and Share Buttons */}
              {session && !sharedUsername && (
                <div className="flex space-x-2">
                  {currentSuggestion.id ? (
                    <>
                      <button
                        onClick={saveSuggestion}
                        className="flex-1 bg-[#5c7e10] hover:bg-[#739c16] px-4 py-1.5 rounded flex items-center justify-center space-x-2 text-sm"
                      >
                        <Save className="w-4 h-4" />
                        <span>Update</span>
                      </button>
                      <button
                        onClick={saveAsNew}
                        className="flex-1 bg-[#5c7e10] hover:bg-[#739c16] px-4 py-1.5 rounded flex items-center justify-center space-x-2 text-sm"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Save as New</span>
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={saveSuggestion}
                      className="flex-1 bg-[#5c7e10] hover:bg-[#739c16] px-4 py-1.5 rounded flex items-center justify-center space-x-2 text-sm"
                    >
                      <Save className="w-4 h-4" />
                      <span>Save Suggestion</span>
                    </button>
                  )}
                  <button
                    onClick={() => setShowShareDialog(true)}
                    className="bg-[#5c7e10] hover:bg-[#739c16] px-4 py-1.5 rounded flex items-center justify-center space-x-2 text-sm"
                  >
                    <Share2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {suggestions.length > 0 && (
          <div className="bg-[#202d39] rounded-lg p-4 mt-6">
            <h2 className="text-lg font-bold mb-3">Previous Suggestions</h2>
            <div className="space-y-3">
              {suggestions.map((suggestion) => (
                <div
                  key={suggestion.id}
                  onClick={() => {
                    setCurrentSuggestion(suggestion);
                    setEditing(null);
                    setSelectedScreenshot(0);
                  }}
                  className={`border border-gray-700 rounded p-3 hover:bg-[#32404e] cursor-pointer group ${
                    currentSuggestion.id === suggestion.id ? 'bg-[#32404e]' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-lg">
                        {suggestion.title}
                        {suggestion.is_default && (
                          <span className="ml-2 text-xs bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded">
                            Default Template
                          </span>
                        )}
                      </h3>
                      <p className="text-gray-400">{suggestion.short_description}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      {session?.user?.user_metadata?.username === 'Pikian' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            markAsDefaultTemplate(suggestion.id!);
                          }}
                          disabled={suggestion.is_default}
                          className={`${
                            suggestion.is_default
                              ? 'text-blue-300 cursor-not-allowed'
                              : 'text-gray-500 hover:text-blue-300 opacity-0 group-hover:opacity-100'
                          } transition-opacity text-sm flex items-center space-x-1`}
                        >
                          <Star className={`w-4 h-4 ${suggestion.is_default ? 'fill-current' : ''}`} />
                          <span>{suggestion.is_default ? 'Default Template' : 'Set as Default'}</span>
                        </button>
                      )}
                      {session?.user?.user_metadata?.username === suggestion.username && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteSuggestion(suggestion.id!);
                          }}
                          disabled={deleting === suggestion.id}
                          className={`${
                            deleting === suggestion.id 
                              ? 'text-gray-500 cursor-not-allowed'
                              : 'text-gray-500 hover:text-red-500 opacity-0 group-hover:opacity-100'
                          } transition-opacity flex items-center space-x-1`}
                        >
                          <Trash2 className="w-4 h-4" />
                          <span>{deleting === suggestion.id ? 'Deleting...' : 'Delete'}</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {showMediaLibrary && (
          <MediaLibrary
            onSelect={handleMediaSelect}
            onClose={() => setShowMediaLibrary(false)}
          />
        )}
        
        {showShareDialog && (
          <ShareDialog
            username={session?.user?.user_metadata?.username || ''}
            gameTitle={currentSuggestion.title}
            onClose={() => setShowShareDialog(false)}
          />
        )}
        
        {showWelcomeDialog && (
          <WelcomeDialog
            onClose={() => setShowWelcomeDialog(false)}
            onLogin={handleLogin}
          />
        )}
      </main>
    </div>
  );
}

export default App;
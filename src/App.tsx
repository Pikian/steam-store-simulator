import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from './lib/supabase';
import { MediaLibrary } from './components/MediaLibrary';
import { ShareDialog } from './components/ShareDialog';
import { ScreenshotGallery } from './components/ScreenshotGallery';
import { ShowcaseVideo } from './components/ShowcaseVideo';
import { LoginDialog } from './components/LoginDialog';
import { AboutBlockEditor } from './components/AboutBlockEditor';
import { AboutBlockPreview } from './components/AboutBlockPreview';
import { CapsuleLibrary } from './components/CapsuleLibrary';
import { Toast, ToastMessage } from './components/Toast';
import { Session } from '@supabase/supabase-js';
import type { Suggestion } from './types/suggestion';
import {
  createBlankCapsule,
  forkCapsule,
} from './types/suggestion';
import { CapsuleToolbar } from './components/CapsuleToolbar';
import {
  normalizeAboutBlocks,
  prepareSuggestionForSave,
  normalizeSuggestionFromDb,
} from './lib/aboutBlocks';
import {
  clearCapsuleRoute,
  updateBrowserToShareUrl,
  buildShareUrl,
  getShareRouteFromPath,
  hasShareRoute,
} from './lib/capsuleRoutes';
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
  ChevronLeft,
  ChevronRight,
  Image
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { Comments } from './components/Comments';
import { useIsMobile } from './hooks/useIsMobile';

function snapshotSuggestion(s: Suggestion): string {
  return JSON.stringify({
    title: s.title,
    short_description: s.short_description,
    long_description: s.long_description,
    about_blocks: s.about_blocks,
    header_image: s.header_image,
    screenshots: s.screenshots,
    tags: s.tags,
    price: s.price,
  });
}

function App() {
  const initialShareRoute = getShareRouteFromPath();
  const [session, setSession] = useState<Session | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [editing, setEditing] = useState<string | null>(null);
  const [selectedScreenshot, setSelectedScreenshot] = useState<number>(0);
  const [showMediaLibrary, setShowMediaLibrary] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [mediaTarget, setMediaTarget] = useState<'header' | 'screenshots' | 'about' | null>(null);
  const [pendingAboutImageBlockId, setPendingAboutImageBlockId] = useState<string | null>(null);
  const [sharedCapsuleId, setSharedCapsuleId] = useState<string | null>(
    initialShareRoute.sharedCapsuleId
  );
  const [sharedUsername, setSharedUsername] = useState<string | null>(
    initialShareRoute.sharedUsername
  );
  const [sharedTitle, setSharedTitle] = useState<string | null>(initialShareRoute.sharedTitle);
  const [isLoadingSharedCapsule, setIsLoadingSharedCapsule] = useState(() =>
    hasShareRoute(initialShareRoute)
  );
  const [capsuleSearchQuery, setCapsuleSearchQuery] = useState('');
  const [savedSnapshot, setSavedSnapshot] = useState('');
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [shareDialogCapsule, setShareDialogCapsule] = useState<Suggestion | null>(null);
  const saveHandlerRef = useRef<() => Promise<void>>(async () => {});
  const [loadingError, setLoadingError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [defaultTemplate, setDefaultTemplate] = useState<Suggestion | null>(null);
  const [currentSuggestion, setCurrentSuggestion] = useState<Suggestion>(() =>
    createBlankCapsule('')
  );
  const [slideDirection, setSlideDirection] = useState<'left' | 'right' | null>(null);
  const [showLoginDialog, setShowLoginDialog] = useState(false);

  const editorUsername =
    session?.user?.user_metadata?.username ??
    session?.user?.email?.split('@')[0];

  const ownsCurrentCapsule =
    !currentSuggestion.id ||
    !editorUsername ||
    currentSuggestion.username === editorUsername;

  const isViewingOthersCapsule = Boolean(
    currentSuggestion.id &&
      editorUsername &&
      currentSuggestion.username &&
      currentSuggestion.username !== editorUsername
  );

  const shareRouteActive = hasShareRoute({
    sharedCapsuleId,
    sharedUsername,
    sharedTitle,
  });

  /** Read-only preview when viewing via share link or someone else's capsule */
  const isSharedView = Boolean(
    (!session && shareRouteActive) || isViewingOthersCapsule
  );

  const isMobile = useIsMobile();
  const canEdit = Boolean(session && ownsCurrentCapsule && !isMobile);
  const isDirty = savedSnapshot !== '' && snapshotSuggestion(currentSuggestion) !== savedSnapshot;

  useEffect(() => {
    if (!isMobile) return;
    setEditing(null);
    setShowMediaLibrary(false);
    setMediaTarget(null);
    setPendingAboutImageBlockId(null);
  }, [isMobile]);

  const showToast = useCallback((message: string, type: ToastMessage['type'] = 'success') => {
    const id = crypto.randomUUID();
    setToasts((prev) => [...prev, { id, message, type }]);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const markClean = useCallback((s: Suggestion) => {
    setSavedSnapshot(snapshotSuggestion(s));
  }, []);

  const confirmIfDirty = useCallback((): boolean => {
    if (!isDirty) return true;
    return window.confirm('You have unsaved changes. Discard them and continue?');
  }, [isDirty]);

  const clearSharedRouteState = () => {
    setSharedCapsuleId(null);
    setSharedUsername(null);
    setSharedTitle(null);
    setIsLoadingSharedCapsule(false);
    clearCapsuleRoute();
  };

  const applyShareRouteFromPath = (pathname: string) => {
    const route = getShareRouteFromPath(pathname);
    setSharedCapsuleId(route.sharedCapsuleId);
    setSharedUsername(route.sharedUsername);
    setSharedTitle(route.sharedTitle);
    setIsLoadingSharedCapsule(hasShareRoute(route));
  };

  // Initialize session from Supabase
  useEffect(() => {
    const initSession = async () => {
      try {
        // Get current session from Supabase
        const { data: { session } } = await supabase.auth.getSession();
        setSession(session);
        
        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
          setSession(session);
        });

        return () => subscription.unsubscribe();
      } catch (error) {
        console.error('Error initializing session:', error);
      } finally {
        setIsInitializing(false);
      }
    };

    initSession();
  }, []);

  // Load data
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoadingError(null);
        
        if (sharedCapsuleId) {
          await loadSharedCapsuleById();
        } else if (sharedUsername && sharedTitle) {
          await loadSharedCapsule();
        } else if (editorUsername) {
          const username = editorUsername;
          await loadDefaultTemplate();
          const list = await loadSuggestions();
          if (!isSharedView) {
            applyInitialCapsule(list, username);
          }
        } else {
          // Reset to default template when not logged in and not viewing shared capsule
          if (defaultTemplate) {
            setCurrentSuggestion(defaultTemplate);
          }
          setSuggestions([]);
        }
      } catch (err) {
        console.error('Error loading data:', err);
        setLoadingError('Failed to load data. Please try again later.');
      }
    };

    loadData();
  }, [editorUsername, sharedCapsuleId, sharedUsername, sharedTitle, defaultTemplate]);

  // Sync share route on browser back/forward
  useEffect(() => {
    const onPopState = () => applyShareRouteFromPath(window.location.pathname);
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  // Handle first interaction with shared capsule
  useEffect(() => {
    if (shareRouteActive && !session && !hasInteracted) {
      const handleFirstInteraction = () => {
        setHasInteracted(true);
        document.removeEventListener('click', handleFirstInteraction);
      };

      document.addEventListener('click', handleFirstInteraction);

      return () => {
        document.removeEventListener('click', handleFirstInteraction);
      };
    }
  }, [shareRouteActive, session, hasInteracted]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        if (session && !isMobile) void saveHandlerRef.current();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [session, isMobile]);

  const loadDefaultTemplate = async () => {
    try {
      const { data, error } = await supabase
        .from('suggestions')
        .select()
        .eq('is_default', true)
        .maybeSingle();

      // If column doesn't exist or no default template, silently continue
      if (error) {
        console.log('No default template available:', error.message);
        return;
      }
      
      if (data) {
        const normalized = normalizeSuggestionFromDb(data as Suggestion);
        setDefaultTemplate(normalized);
      }
    } catch (err) {
      console.log('Could not load default template:', err);
      // Continue without default template
    }
  };

  const loadSharedCapsuleById = async () => {
    if (!sharedCapsuleId) return;

    try {
      setIsLoadingSharedCapsule(true);
      setLoadingError(null);
      const { data, error } = await supabase
        .from('suggestions')
        .select()
        .eq('id', sharedCapsuleId)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        const normalized = normalizeSuggestionFromDb(data as Suggestion);
        setCurrentSuggestion(normalized);
        setEditing(null);
        markClean(normalized);
        if (session?.user?.user_metadata?.username) {
          await loadSuggestions();
        } else {
          setSuggestions([]);
        }
      } else {
        setLoadingError('This game capsule does not exist or has been removed.');
      }
    } catch (err) {
      console.error('Error loading shared capsule:', err);
      setLoadingError('Failed to load the game capsule. Please try again later.');
    } finally {
      setIsLoadingSharedCapsule(false);
    }
  };

  const loadSharedCapsule = async () => {
    if (!sharedUsername || !sharedTitle) return;

    try {
      setIsLoadingSharedCapsule(true);
      setLoadingError(null);
      const { data, error } = await supabase
        .from('suggestions')
        .select()
        .eq('username', sharedUsername)
        .eq('title', sharedTitle)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        const normalized = normalizeSuggestionFromDb(data as Suggestion);
        setCurrentSuggestion(normalized);
        setEditing(null);
        markClean(normalized);
        if (session?.user?.user_metadata?.username) {
          await loadSuggestions();
        } else {
          setSuggestions([]);
        }
      } else {
        setLoadingError('This game capsule does not exist or has been removed.');
      }
    } catch (err) {
      console.error('Error loading shared capsule:', err);
      setLoadingError('Failed to load the game capsule. Please try again later.');
    } finally {
      setIsLoadingSharedCapsule(false);
    }
  };

  const loadSuggestions = async (): Promise<Suggestion[]> => {
    try {
      setLoadingError(null);

      const { data, error } = await supabase
        .from('suggestions')
        .select()
        .order('updated_at', { ascending: false });

      if (error) throw error;

      const normalized = (data || []).map((row) => normalizeSuggestionFromDb(row as Suggestion));
      setSuggestions(normalized);
      return normalized;
    } catch (err) {
      console.error('Error loading suggestions:', err);
      setLoadingError('Failed to load suggestions. Please try again later.');
      return [];
    }
  };

  /** On login: open your latest capsule, or a blank draft — never someone else's default. */
  const applyInitialCapsule = (list: Suggestion[], username: string) => {
    const mine = list.filter((s) => s.username === username);
    if (mine.length > 0) {
      setCurrentSuggestion(mine[0]);
      markClean(mine[0]);
    } else {
      const blank = createBlankCapsule(username);
      setCurrentSuggestion(blank);
      setSavedSnapshot('');
    }
  };

  const scrollToLibrary = () => {
    document.getElementById('capsule-library')?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleLogin = async (email: string) => {
    // Validate domain
    if (!email.toLowerCase().endsWith('@trollheimstudios.com')) {
      throw new Error('Only @trollheimstudios.com email addresses are allowed');
    }

    // Extract username from email for display
    const username = email.split('@')[0];

    // Send magic link
    const { error } = await supabase.auth.signInWithOtp({
      email: email.toLowerCase(),
      options: {
        emailRedirectTo: window.location.origin,
        data: {
          username: username,
          email: email.toLowerCase()
        }
      }
    });

    if (error) {
      console.error('Magic link error:', error);
      throw new Error(error.message || 'Failed to send login link. Please try again.');
    }
  };

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      setSession(null);
      setCurrentSuggestion(createBlankCapsule(''));
      setSavedSnapshot('');
    } catch (error) {
      console.error('Error signing out:', error);
      showToast('Failed to sign out', 'error');
    }
  };

  const startBlank = () => {
    if (!confirmIfDirty()) return;
    setCurrentSuggestion(createBlankCapsule(editorUsername || ''));
    setSavedSnapshot('');
    setEditing(null);
    setSelectedScreenshot(0);
    if (shareRouteActive) clearSharedRouteState();
    showToast('Blank capsule — save when ready');
  };

  const startFromCapsule = (source: Suggestion) => {
    if (!confirmIfDirty()) return;
    setCurrentSuggestion(forkCapsule(source, editorUsername || ''));
    setSavedSnapshot('');
    setEditing(null);
    setSelectedScreenshot(0);
    if (shareRouteActive) clearSharedRouteState();
    showToast('Your draft — edit and save when ready');
  };

  const saveSuggestion = async (): Promise<Suggestion | null> => {
    if (!editorUsername) {
      showToast('Please sign in to save', 'error');
      return null;
    }

    try {
      setIsSaving(true);
      if (!currentSuggestion.title?.trim()) {
        throw new Error('Title is required');
      }

      if (!ownsCurrentCapsule) {
        showToast('Start blank or start from this template to edit', 'error');
        return null;
      }

      const suggestionData = prepareSuggestionForSave({
        ...currentSuggestion,
        username: editorUsername!,
      });

      const id = currentSuggestion.id;
      const isOwn = id && currentSuggestion.username === editorUsername;

      const result = isOwn
        ? await supabase.from('suggestions').update(suggestionData).eq('id', id).select()
        : await supabase.from('suggestions').insert([suggestionData]).select();

      if (result.error) throw result.error;

      await loadSuggestions();

      if (result.data?.[0]) {
        const saved = normalizeSuggestionFromDb(result.data[0] as Suggestion);
        setCurrentSuggestion(saved);
        markClean(saved);
        if (saved.id) {
          updateBrowserToShareUrl(saved.id);
        }
        showToast('Capsule saved');
        return saved;
      }
      return null;
    } catch (err) {
      console.error('Error saving suggestion:', err);
      showToast(
        err instanceof Error ? err.message : 'Failed to save game capsule',
        'error'
      );
      return null;
    } finally {
      setIsSaving(false);
    }
  };

  const saveAsNew = async (): Promise<Suggestion | null> => {
    if (!editorUsername) {
      showToast('Please sign in to save', 'error');
      return null;
    }

    try {
      setIsSaving(true);
      if (!currentSuggestion.title?.trim()) {
        throw new Error('Title is required');
      }

      const base = prepareSuggestionForSave({
        ...currentSuggestion,
        title: currentSuggestion.title.match(/\(draft\)$/i)
          ? currentSuggestion.title
          : `${currentSuggestion.title.replace(/\s*\(draft\)\s*$/i, '').trim()} (draft)`,
        username: editorUsername!,
      });

      const result = await supabase.from('suggestions').insert([base]).select();

      if (result.error) throw result.error;

      await loadSuggestions();

      if (result.data?.[0]) {
        const saved = normalizeSuggestionFromDb(result.data[0] as Suggestion);
        setCurrentSuggestion(saved);
        markClean(saved);
        clearSharedRouteState();
        if (saved.id) updateBrowserToShareUrl(saved.id);
        showToast('Saved as new version');
        return saved;
      }
      return null;
    } catch (err) {
      console.error('Error saving suggestion:', err);
      showToast(
        err instanceof Error ? err.message : 'Failed to save game capsule',
        'error'
      );
      return null;
    } finally {
      setIsSaving(false);
    }
  };

  const deleteSuggestion = async (id: string) => {
    if (!session?.user?.user_metadata?.username) {
      showToast('Please sign in to delete', 'error');
      return;
    }

    if (!window.confirm('Are you sure you want to delete this suggestion?')) {
      return;
    }

    try {
      setDeleting(id);
      console.log('Starting deletion process...');
      console.log('Suggestion ID:', id);

      // Delete the suggestion
      console.log('Executing delete operation...');
      const { error: deleteError } = await supabase
        .from('suggestions')
        .delete()
        .eq('id', id);

      if (deleteError) {
        console.error('Error deleting suggestion:', deleteError);
        throw deleteError;
      }

      // Update local state
      setSuggestions(prev => {
        const newSuggestions = prev.filter(s => s.id !== id);
        console.log('Updated suggestions count:', newSuggestions.length);
        return newSuggestions;
      });
      
      // Reset current suggestion if needed
      if (currentSuggestion.id === id && defaultTemplate) {
        console.log('Resetting to default template...');
        setCurrentSuggestion(defaultTemplate);
      }

      showToast('Capsule deleted');
    } catch (err) {
      console.error('Error in deletion process:', err);
      showToast('Failed to delete capsule', 'error');
      // Refresh suggestions list in case of error
      console.log('Reloading suggestions due to error...');
      await loadSuggestions();
    } finally {
      setDeleting(null);
    }
  };

  const handleMediaSelect = (url: string) => {
    if (mediaTarget === 'header') {
      setCurrentSuggestion({ ...currentSuggestion, header_image: url });
    } else if (mediaTarget === 'screenshots') {
      setCurrentSuggestion({
        ...currentSuggestion,
        screenshots: [...(currentSuggestion.screenshots || []), url],
      });
    } else if (mediaTarget === 'about' && pendingAboutImageBlockId) {
      const blocks = normalizeAboutBlocks(currentSuggestion);
      setCurrentSuggestion({
        ...currentSuggestion,
        about_blocks: blocks.map((b) =>
          b.id === pendingAboutImageBlockId && b.type === 'image'
            ? { ...b, url }
            : b
        ),
      });
      setPendingAboutImageBlockId(null);
    }
    setShowMediaLibrary(false);
    setMediaTarget(null);
  };

  const openMediaLibrary = (target: 'header' | 'screenshots' | 'about', aboutBlockId?: string) => {
    if (isMobile) return;
    if (!session) {
      showToast('Sign in to use the media library', 'error');
      return;
    }
    setMediaTarget(target);
    if (target === 'about' && aboutBlockId) setPendingAboutImageBlockId(aboutBlockId);
    setShowMediaLibrary(true);
  };

  const handleSaveAndCopyLink = async () => {
    const saved = await saveSuggestion();
    const id = saved?.id ?? currentSuggestion.id;
    if (id) {
      try {
        await navigator.clipboard.writeText(buildShareUrl(id));
        showToast('Saved — link copied to clipboard');
      } catch {
        showToast('Saved — copy the link from Share', 'success');
      }
    }
  };

  saveHandlerRef.current = saveSuggestion;

  const duplicateCapsule = (source: Suggestion) => {
    startFromCapsule(source);
  };

  const selectCapsule = (suggestion: Suggestion) => {
    if (!confirmIfDirty()) return;
    setCurrentSuggestion(suggestion);
    markClean(suggestion);
    setEditing(null);
    setSelectedScreenshot(0);
    if (shareRouteActive) clearSharedRouteState();
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
      showToast('Default template updated');
    } catch (err) {
      console.error('Error setting default template:', err);
      showToast('Failed to set default template', 'error');
    }
  };

  const navigateSuggestion = (direction: 'prev' | 'next') => {
    if (!suggestions.length) return;
    if (!confirmIfDirty()) return;

    const currentIndex = suggestions.findIndex(s => s.id === currentSuggestion.id);
    let newIndex;
    
    if (currentIndex === -1) {
      newIndex = 0;
    } else {
      if (direction === 'next') {
        newIndex = currentIndex === suggestions.length - 1 ? 0 : currentIndex + 1;
      } else {
        newIndex = currentIndex === 0 ? suggestions.length - 1 : currentIndex - 1;
      }
    }
    
    // Set slide direction for animation
    setSlideDirection(direction === 'next' ? 'left' : 'right');
    
    const newSuggestion = suggestions[newIndex];
    setCurrentSuggestion(newSuggestion);
    markClean(newSuggestion);
    setEditing(null);
    setSelectedScreenshot(0);

    if (shareRouteActive) clearSharedRouteState();

    // Reset slide direction after animation
    setTimeout(() => setSlideDirection(null), 500);
  };

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-[#1b2838] flex items-center justify-center text-gray-400">
        Loading…
      </div>
    );
  }

  // Login required except when viewing a shared capsule link
  if (!session && !shareRouteActive) {
    return (
      <div className="min-h-screen bg-[#1b2838] text-white">
        <nav className="bg-[#171a21] text-sm">
          <div className="max-w-6xl mx-auto flex items-center justify-between px-4 py-1">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 mr-2">
                <Steam className="w-6 h-6 text-[#1b2838]" />
                <span className="font-bold tracking-wide text-base bg-gradient-to-br from-[#c7d5e0] to-[#67c1f5] bg-clip-text text-transparent">
                  STEAM
                </span>
              </div>
            </div>
            <button
              onClick={() => setShowLoginDialog(true)}
              className="bg-[#5c7e10] hover:bg-[#739c16] px-3 py-0.5 rounded text-xs"
            >
              Sign In
            </button>
          </div>
        </nav>
        {showLoginDialog && (
          <LoginDialog
            onLogin={handleLogin}
            onClose={() => setShowLoginDialog(false)}
          />
        )}
        <div className="max-w-4xl mx-auto mt-10 p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column - Login */}
            <div className="bg-[#202d39] rounded-lg p-6">
              <h2 className="text-xl font-bold mb-4">Welcome to Steam Store Simulator</h2>
              <p className="text-gray-300 mb-6">
                Sign in to start creating and managing your game capsules. Have a share link? Open it
                directly — no sign-in required.
              </p>
              <button
                onClick={() => setShowLoginDialog(true)}
                className="w-full bg-[#5c7e10] hover:bg-[#739c16] text-white py-2 px-4 rounded flex items-center justify-center space-x-2"
              >
                <span>Sign In</span>
              </button>
            </div>

            {/* Right Column - How it Works */}
            <div className="bg-[#202d39] rounded-lg p-6">
              <h2 className="text-xl font-bold mb-4">How It Works</h2>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="bg-[#67c1f5] rounded-full p-1.5 mt-0.5">
                    <PencilLine className="w-4 h-4 text-[#1b2838]" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-[#67c1f5]">Create & Edit</h3>
                    <p className="text-gray-300 text-sm">Design your game's Steam page with a visual editor. Edit titles, descriptions, images, and more in real-time.</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="bg-[#67c1f5] rounded-full p-1.5 mt-0.5">
                    <Users className="w-4 h-4 text-[#1b2838]" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-[#67c1f5]">Collaborate</h3>
                    <p className="text-gray-300 text-sm">View capsules created by others, save copies to make your own versions, and share your designs with the team.</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="bg-[#67c1f5] rounded-full p-1.5 mt-0.5">
                    <Save className="w-4 h-4 text-[#1b2838]" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-[#67c1f5]">Save & Iterate</h3>
                    <p className="text-gray-300 text-sm">Create multiple versions of your store page, save them for later, and iterate on your designs.</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="bg-[#67c1f5] rounded-full p-1.5 mt-0.5">
                    <Share2 className="w-4 h-4 text-[#1b2838]" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-[#67c1f5]">Share & Review</h3>
                    <p className="text-gray-300 text-sm">Share your capsules with others to get feedback. Anyone can view and create their own version from your shared capsule.</p>
                  </div>
                </div>

                <div className="mt-6 bg-[#32404e] rounded p-4">
                  <h3 className="font-semibold text-[#67c1f5] mb-2">Permissions</h3>
                  <ul className="text-sm text-gray-300 space-y-2">
                    <li>• View all capsules created by the team</li>
                    <li>• Edit and update your own capsules</li>
                    <li>• Create new versions from any capsule</li>
                    <li>• Share your capsules with others</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1b2838] text-white">
      {/* Global Navigation */}
      <nav className="bg-[#171a21] text-sm">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-2 px-4 py-1">
          <div className="flex items-center space-x-4 min-w-0">
            <div className="flex items-center space-x-2 mr-2 shrink-0">
              <Steam className="w-6 h-6 text-[#1b2838]" />
              <span className="font-bold tracking-wide text-base bg-gradient-to-br from-[#c7d5e0] to-[#67c1f5] bg-clip-text text-transparent">
                STEAM
              </span>
            </div>
            <div className="hidden sm:flex items-center space-x-4">
              <a href="#" className="text-gray-300 hover:text-white text-xs">STORE</a>
              <a href="#" className="text-gray-300 hover:text-white text-xs">COMMUNITY</a>
              <a href="#" className="text-gray-300 hover:text-white text-xs">ABOUT</a>
              <a href="#" className="text-gray-300 hover:text-white text-xs">SUPPORT</a>
            </div>
          </div>
          <div className="flex items-center space-x-3 shrink-0">
            {!session ? (
              <button
                onClick={() => setShowLoginDialog(true)}
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
        {showLoginDialog && (
          <LoginDialog
            onLogin={handleLogin}
            onClose={() => setShowLoginDialog(false)}
          />
        )}
      </nav>

      {/* Store Navigation */}
      <div className="bg-gradient-to-b from-[#2a475e] to-[#1b2838] shadow-lg">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center gap-3 py-1 text-xs overflow-x-auto">
            <div className="flex items-center space-x-1 text-gray-300 hover:text-white cursor-pointer shrink-0">
              <Home className="w-3 h-3" />
              <span>Your Store</span>
            </div>
            <div className="flex items-center space-x-1 text-gray-300 hover:text-white cursor-pointer shrink-0">
              <GamepadIcon className="w-3 h-3" />
              <span>New & Noteworthy</span>
            </div>
            <div className="flex items-center space-x-1 text-gray-300 hover:text-white cursor-pointer shrink-0">
              <ShoppingCart className="w-3 h-3" />
              <span>Categories</span>
            </div>
            <div className="hidden md:flex items-center space-x-1 text-gray-300 hover:text-white cursor-pointer shrink-0">
              <Users className="w-3 h-3" />
              <span>Points Shop</span>
            </div>
            <div className="hidden md:flex items-center space-x-1 text-gray-300 hover:text-white cursor-pointer shrink-0">
              <Settings className="w-3 h-3" />
              <span>News</span>
            </div>
            <div className="hidden lg:flex items-center space-x-1 text-gray-300 hover:text-white cursor-pointer shrink-0">
              <Download className="w-3 h-3" />
              <span>Labs</span>
            </div>
          </div>

          {/* Capsule search (desktop editor only) */}
          {session && !isMobile && (
            <div className="relative py-1 w-full max-w-sm">
              <input
                type="text"
                value={capsuleSearchQuery}
                onChange={(e) => setCapsuleSearchQuery(e.target.value)}
                placeholder="Search your capsules…"
                className="w-full bg-[#316282] text-white placeholder-gray-400 px-3 py-0.5 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <Search className="absolute right-2 top-1/2 transform -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" />
            </div>
          )}
        </div>
      </div>

      {/* Breadcrumb */}
      <div className="bg-[#1b2838]">
        <div className="max-w-6xl mx-auto px-4 py-1">
          <div className="flex items-center space-x-2 text-xs text-gray-400 min-w-0 overflow-hidden">
            <a href="#" className="hover:text-blue-300 shrink-0">All Games</a>
            <span className="shrink-0">&gt;</span>
            <a href="#" className="hover:text-blue-300 shrink-0 hidden sm:inline">Action Games</a>
            <span className="shrink-0 hidden sm:inline">&gt;</span>
            <span className="text-white truncate">{currentSuggestion.title}</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-3 py-4 sm:px-4 relative">
        {loadingError && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded mb-4">
            {loadingError}
          </div>
        )}

        {shareRouteActive && !session && (
          <div className="bg-[#67c1f5]/10 border border-[#67c1f5]/30 text-[#67c1f5] px-4 py-2 rounded mb-4 text-sm">
            Shared preview — sign in to create or edit your own capsules.
          </div>
        )}

        {isLoadingSharedCapsule && shareRouteActive && (
          <div className="text-center text-gray-400 py-8">Loading shared capsule…</div>
        )}

        {session && !isMobile && (
          <CapsuleToolbar
            currentSuggestion={currentSuggestion}
            ownsCurrentCapsule={ownsCurrentCapsule}
            onStartBlank={startBlank}
            onStartFromTemplate={startFromCapsule}
            onBrowseLibrary={scrollToLibrary}
          />
        )}

        {/* Navigation Arrows */}
        {suggestions.length > 0 && (
          <>
            <button
              onClick={() => navigateSuggestion('prev')}
              className="hidden lg:flex fixed left-8 top-1/2 transform -translate-y-1/2 bg-[#202d39]/90 hover:bg-[#32404e] p-4 rounded-full transition-all opacity-40 hover:opacity-100 group z-50 shadow-lg active:scale-95"
              aria-label="Previous suggestion"
            >
              <ChevronLeft className="w-8 h-8 text-white group-hover:scale-110 transition-transform" />
            </button>
            <button
              onClick={() => navigateSuggestion('next')}
              className="hidden lg:flex fixed right-8 top-1/2 transform -translate-y-1/2 bg-[#202d39]/90 hover:bg-[#32404e] p-4 rounded-full transition-all opacity-40 hover:opacity-100 group z-50 shadow-lg active:scale-95"
              aria-label="Next suggestion"
            >
              <ChevronRight className="w-8 h-8 text-white group-hover:scale-110 transition-transform" />
            </button>
          </>
        )}

        {!isLoadingSharedCapsule && (
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSuggestion.id || 'default'}
            initial={{ 
              opacity: 0,
              x: slideDirection === 'left' ? 100 : slideDirection === 'right' ? -100 : 0 
            }}
            animate={{ 
              opacity: 1,
              x: 0 
            }}
            exit={{ 
              opacity: 0,
              x: slideDirection === 'left' ? -100 : slideDirection === 'right' ? 100 : 0 
            }}
            transition={{ 
              type: "spring",
              stiffness: 300,
              damping: 30
            }}
            className="bg-[#1b2838]"
          >
            {/* Game Title & Navigation */}
            <div className="bg-gradient-to-r from-[#1b2838] to-[#2a475e] p-3">
              <div className="max-w-6xl mx-auto">
                {editing === 'title' && canEdit ? (
                  <input
                    type="text"
                    value={currentSuggestion.title}
                    onChange={(e) => setCurrentSuggestion({
                      ...currentSuggestion,
                      title: e.target.value
                    })}
                    className="text-xl sm:text-2xl font-bold bg-[#32404e] p-2 rounded w-full mb-1"
                  />
                ) : (
                  <div className="flex items-center gap-2">
                    <h2 
                      className={`text-xl sm:text-2xl font-bold mb-1 ${canEdit ? 'cursor-pointer hover:text-blue-300' : ''}`}
                      onClick={() => canEdit && setEditing('title')}
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

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mt-3">
              {/* Left Column - Media */}
              <div className="col-span-1 lg:col-span-8 order-2 lg:order-none">
                {/* Main Media Showcase */}
                <div className="bg-[#202d39] p-3 rounded-lg mb-4">
                  <div className="relative aspect-video mb-3">
                    {currentSuggestion.screenshots && currentSuggestion.screenshots.length > 0 ? (
                      currentSuggestion.screenshots[selectedScreenshot].match(/\.(mp4|webm)$/i) ? (
                        <ShowcaseVideo
                          src={currentSuggestion.screenshots[selectedScreenshot]}
                          className="w-full h-full object-contain bg-black rounded"
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
                          {canEdit && (
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

                  {canEdit && (
                    <button
                      onClick={() => setEditing(editing === 'screenshots' ? null : 'screenshots')}
                      className="text-xs text-blue-300 mt-2 hover:text-blue-400"
                    >
                      {editing === 'screenshots' ? 'Done editing' : 'Edit screenshots'}
                    </button>
                  )}
                </div>

                {/* About This Game */}
                <div className="bg-[#202d39] p-3 rounded-lg mb-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-bold text-lg">ABOUT THIS GAME</h3>
                    {canEdit && (
                      <button
                        type="button"
                        onClick={() =>
                          setEditing(editing === 'about' ? null : 'about')
                        }
                        className="text-xs text-blue-300 hover:text-blue-400"
                      >
                        {editing === 'about' ? 'Done editing' : 'Edit section'}
                      </button>
                    )}
                  </div>
                  {editing === 'about' && canEdit ? (
                    <AboutBlockEditor
                      blocks={normalizeAboutBlocks(currentSuggestion)}
                      onChange={(blocks) =>
                        setCurrentSuggestion({
                          ...currentSuggestion,
                          about_blocks: blocks,
                        })
                      }
                      onPickImage={(blockId) => openMediaLibrary('about', blockId)}
                    />
                  ) : (
                    <AboutBlockPreview
                      blocks={normalizeAboutBlocks(currentSuggestion)}
                    />
                  )}
                </div>
              </div>

              {/* Right Column - Purchase & Info (first on mobile, like Steam sidebar above fold) */}
              <div className="col-span-1 lg:col-span-4 order-1 lg:order-none">
                {/* Header Image */}
                <div className="bg-[#202d39] p-3 rounded-lg mb-4">
                  <div className="relative">
                    {currentSuggestion.header_image ? (
                      <img
                        src={currentSuggestion.header_image}
                        alt="Game header"
                        className="w-full rounded"
                      />
                    ) : (
                      <div className="w-full aspect-[460/215] bg-[#32404e] rounded flex flex-col items-center justify-center">
                        <div className="text-center">
                          <div className="bg-[#1b2838] w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3">
                            <Image className="w-8 h-8 text-gray-500" />
                          </div>
                          <p className="text-gray-400 text-sm mb-1">No header image</p>
                          {canEdit && (
                            <button
                              onClick={() => openMediaLibrary('header')}
                              className="text-blue-300 hover:text-blue-400 text-xs"
                            >
                              Click to add header image
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                    {canEdit && editing === 'header_image' && currentSuggestion.header_image && (
                      <button
                        onClick={() => openMediaLibrary('header')}
                        className="absolute bottom-3 left-3 bg-black/50 p-1.5 rounded cursor-pointer hover:bg-black/70"
                      >
                        <PencilLine className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  {canEdit && (
                    <button
                      onClick={() => setEditing(editing === 'header_image' ? null : 'header_image')}
                      className="text-xs text-blue-300 mt-2 hover:text-blue-400"
                    >
                      {editing === 'header_image' ? 'Done editing' : 'Edit header image'}
                    </button>
                  )}
                </div>

                {/* Short description (under header on Steam) */}
                <div className="bg-[#202d39] p-3 rounded-lg mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-bold text-sm text-gray-400 uppercase tracking-wide">
                      Short description
                    </h3>
                    {canEdit && (
                      <button
                        type="button"
                        onClick={() =>
                          setEditing(
                            editing === 'short_description' ? null : 'short_description'
                          )
                        }
                        className="text-xs text-blue-300 hover:text-blue-400"
                      >
                        {editing === 'short_description' ? 'Done' : 'Edit'}
                      </button>
                    )}
                  </div>
                  {editing === 'short_description' && canEdit ? (
                    <textarea
                      value={currentSuggestion.short_description}
                      onChange={(e) =>
                        setCurrentSuggestion({
                          ...currentSuggestion,
                          short_description: e.target.value,
                        })
                      }
                      className="w-full bg-[#32404e] p-2 rounded text-sm text-gray-200"
                      rows={4}
                      placeholder="One or two sentences under the header — what players see before scrolling to About This Game."
                      autoFocus
                    />
                  ) : (
                    <div
                      role={canEdit ? 'button' : undefined}
                      tabIndex={canEdit ? 0 : undefined}
                      onClick={() => canEdit && setEditing('short_description')}
                      onKeyDown={(e) => {
                        if (canEdit && (e.key === 'Enter' || e.key === ' ')) {
                          e.preventDefault();
                          setEditing('short_description');
                        }
                      }}
                      className={`text-sm min-h-[3rem] rounded p-2 ${
                        canEdit
                          ? 'cursor-pointer hover:bg-[#32404e]/60 text-gray-300 hover:text-blue-300 border border-transparent hover:border-gray-600'
                          : 'text-gray-300'
                      }`}
                    >
                      {currentSuggestion.short_description?.trim() ? (
                        currentSuggestion.short_description
                      ) : (
                        <span className="text-gray-500 italic">
                          {canEdit
                            ? 'Click to add short copy under the header…'
                            : 'No short description'}
                        </span>
                      )}
                    </div>
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
                    {editing === 'price' && canEdit ? (
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
                        className={`${canEdit ? 'cursor-pointer hover:text-blue-300' : ''}`}
                        onClick={() => canEdit && setEditing('price')}
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
                            : `bg-[#32404e] ${canEdit && editing === 'tags' ? 'hover:bg-[#434e5b] cursor-pointer' : ''}`
                        }`}
                        onClick={() => {
                          if (canEdit && editing === 'tags') {
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
                    {canEdit && editing === 'tags' && (
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
                  {canEdit && (
                    <button
                      onClick={() => setEditing(editing === 'tags' ? null : 'tags')}
                      className="text-xs text-blue-300 mt-2 hover:text-blue-400"
                    >
                      {editing === 'tags' ? 'Done editing' : 'Edit tags'}
                    </button>
                  )}
                </div>

                {/* Save and Share — desktop editor only */}
                {canEdit ? (
                  <div className="space-y-2">
                    {isDirty && (
                      <p className="text-xs text-amber-400/90 text-center">Unsaved changes</p>
                    )}
                    <div className="flex flex-col sm:flex-row gap-2">
                      <button
                        type="button"
                        onClick={() => void saveSuggestion()}
                        disabled={isSaving}
                        className="flex-1 bg-[#5c7e10] hover:bg-[#739c16] disabled:opacity-50 px-4 py-1.5 rounded flex items-center justify-center space-x-2 text-sm"
                      >
                        <Save className="w-4 h-4" />
                        <span>Save</span>
                      </button>
                      {currentSuggestion.id && (
                        <button
                          type="button"
                          onClick={() => void saveAsNew()}
                          disabled={isSaving}
                          className="flex-1 bg-[#32404e] hover:bg-[#434e5b] disabled:opacity-50 px-4 py-1.5 rounded flex items-center justify-center space-x-2 text-sm"
                        >
                          <Plus className="w-4 h-4" />
                          <span>Save new version</span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setShareDialogCapsule(currentSuggestion)}
                        className="sm:w-auto w-full bg-[#5c7e10] hover:bg-[#739c16] px-4 py-1.5 rounded flex items-center justify-center space-x-2 text-sm"
                        title="Share"
                      >
                        <Share2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ) : session && !ownsCurrentCapsule && !isMobile ? (
                  <p className="text-xs text-gray-400 text-center py-2">
                    Use <span className="text-gray-300">Start from this template</span> above to
                    edit a copy as your draft.
                  </p>
                ) : shareRouteActive && !session && !isMobile ? (
                  <div className="space-y-2">
                    <p className="text-xs text-gray-400 text-center">
                      Sign in to start blank or from this template.
                    </p>
                    <button
                      type="button"
                      onClick={() => setShowLoginDialog(true)}
                      className="w-full bg-[#5c7e10] hover:bg-[#739c16] px-4 py-1.5 rounded text-sm"
                    >
                      Sign in to edit
                    </button>
                  </div>
                ) : null}
              </div>
            </div>

            {/* Add Comments section after the grid layout */}
            <div className="mt-6">
              <Comments
                suggestionId={currentSuggestion.id || ''}
                currentUsername={session?.user?.user_metadata?.username}
                readOnly={isMobile}
              />
            </div>
          </motion.div>
        </AnimatePresence>
        )}

        {session && !isMobile && (
          <CapsuleLibrary
            suggestions={suggestions}
            currentId={currentSuggestion.id}
            currentUsername={session.user.user_metadata.username}
            searchQuery={capsuleSearchQuery}
            onSearchChange={setCapsuleSearchQuery}
            onSelect={selectCapsule}
            onShare={(s) => setShareDialogCapsule(s)}
            onDuplicate={duplicateCapsule}
            onStartFrom={startFromCapsule}
            onStartBlank={startBlank}
            onDelete={deleteSuggestion}
            onSetDefault={markAsDefaultTemplate}
            deletingId={deleting}
            isAdmin={session.user.user_metadata.username === 'Pikian'}
          />
        )}

        {showMediaLibrary && (
          <MediaLibrary
            onSelect={handleMediaSelect}
            onClose={() => setShowMediaLibrary(false)}
          />
        )}
        
        {shareDialogCapsule && (
          <ShareDialog
            capsuleId={
              (shareDialogCapsule ?? currentSuggestion).id
            }
            username={
              (shareDialogCapsule ?? currentSuggestion).username ||
              session?.user?.user_metadata?.username ||
              ''
            }
            gameTitle={(shareDialogCapsule ?? currentSuggestion).title}
            onClose={() => setShareDialogCapsule(null)}
            onSaveAndCopy={
              ownsCurrentCapsule
                ? handleSaveAndCopyLink
                : undefined
            }
            isSaving={isSaving}
          />
        )}

        <Toast toasts={toasts} onDismiss={dismissToast} />
      </main>
    </div>
  );
}

export default App;
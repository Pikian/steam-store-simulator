import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { MessageSquare, Trash2, Edit2, Send, Star } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Comment {
  id: string;
  suggestion_id: string;
  username: string;
  content: string;
  rating: number;
  created_at: string;
  updated_at: string;
}

interface CommentsProps {
  suggestionId: string;
  currentUsername?: string;
}

export function Comments({ suggestionId, currentUsername }: CommentsProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [newRating, setNewRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [editingComment, setEditingComment] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [editRating, setEditRating] = useState(5);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadComments();
  }, [suggestionId]);

  const loadComments = async () => {
    if (!suggestionId) {
      setComments([]);
      return;
    }

    try {
      setIsLoading(true);
      console.log('Loading comments for suggestion:', suggestionId);
      
      const { data, error } = await supabase
        .from('comments')
        .select('*')
        .eq('suggestion_id', suggestionId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      console.log('Loaded comments:', data);
      setComments(data || []);
    } catch (err) {
      console.error('Error loading comments:', err);
      setComments([]);
    } finally {
      setIsLoading(false);
    }
  };

  const addComment = async () => {
    if (!newComment.trim() || !currentUsername) return;

    try {
      const { error } = await supabase
        .from('comments')
        .insert([
          {
            suggestion_id: suggestionId,
            username: currentUsername,
            content: newComment.trim(),
            rating: newRating
          }
        ]);

      if (error) throw error;

      setNewComment('');
      setNewRating(5);
      await loadComments();
    } catch (err) {
      console.error('Error adding comment:', err);
    }
  };

  const updateComment = async (commentId: string) => {
    if (!editContent.trim()) return;

    try {
      const { error } = await supabase
        .from('comments')
        .update({ 
          content: editContent.trim(),
          rating: editRating
        })
        .eq('id', commentId);

      if (error) throw error;

      setEditingComment(null);
      await loadComments();
    } catch (err) {
      console.error('Error updating comment:', err);
    }
  };

  const deleteComment = async (commentId: string) => {
    if (!currentUsername) return;
    if (!window.confirm('Are you sure you want to delete this comment?')) return;

    try {
      console.log('Attempting to delete comment:', commentId);
      
      // Find the comment to check permissions
      const comment = comments.find(c => c.id === commentId);
      if (!comment) {
        console.error('Comment not found');
        return;
      }

      // Only allow deletion if user owns the comment or is Pikian
      if (comment.username !== currentUsername && currentUsername !== 'Pikian') {
        console.error('Permission denied: User cannot delete this comment');
        alert('You can only delete your own comments');
        return;
      }

      const { error } = await supabase
        .from('comments')
        .delete()
        .eq('id', commentId);

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      console.log('Comment deleted successfully');
      await loadComments();
    } catch (err) {
      console.error('Error in deletion process:', err);
      alert('Failed to delete comment. Please try again.');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const StarRating = ({ 
    rating, 
    onRatingChange, 
    onHover, 
    readOnly = false 
  }: { 
    rating: number; 
    onRatingChange?: (rating: number) => void;
    onHover?: (rating: number) => void;
    readOnly?: boolean;
  }) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            onClick={() => !readOnly && onRatingChange?.(star)}
            onMouseEnter={() => !readOnly && onHover?.(star)}
            onMouseLeave={() => !readOnly && onHover?.(0)}
            disabled={readOnly}
            className={`${readOnly ? 'cursor-default' : 'cursor-pointer'} transition-colors`}
          >
            <Star
              className={`w-4 h-4 ${
                star <= (onHover ? hoverRating || rating : rating)
                  ? 'text-yellow-400 fill-yellow-400'
                  : 'text-gray-500'
              }`}
            />
          </button>
        ))}
      </div>
    );
  };

  const getAverageRating = () => {
    if (comments.length === 0) return 0;
    const sum = comments.reduce((acc, comment) => acc + (comment.rating || 0), 0);
    return Math.round((sum / comments.length) * 10) / 10;
  };

  return (
    <div className="bg-[#202d39] p-4 rounded-lg">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-[#67c1f5]" />
          <h3 className="font-bold text-lg">Comments</h3>
          <span className="text-sm text-gray-400">({comments.length})</span>
        </div>
        {comments.length > 0 && (
          <div className="flex items-center gap-2">
            <StarRating rating={Math.round(getAverageRating())} readOnly />
            <span className="text-sm text-gray-400">
              {getAverageRating().toFixed(1)} average rating
            </span>
          </div>
        )}
      </div>

      {/* Comments List */}
      <div className="space-y-4 mb-4">
        <AnimatePresence mode="popLayout">
          {comments.map((comment) => (
            <motion.div
              key={comment.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-[#32404e] p-3 rounded"
            >
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-[#67c1f5]">{comment.username}</span>
                    <span className="text-xs text-gray-400">
                      {formatDate(comment.created_at)}
                      {comment.updated_at !== comment.created_at && ' (edited)'}
                    </span>
                  </div>
                  <StarRating rating={comment.rating} readOnly />
                </div>
                {currentUsername === comment.username && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setEditingComment(comment.id);
                        setEditContent(comment.content);
                        setEditRating(comment.rating);
                      }}
                      className="text-gray-400 hover:text-[#67c1f5] transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => deleteComment(comment.id)}
                      className="text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
              {editingComment === comment.id ? (
                <div className="space-y-2 mt-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-400">Rating:</span>
                    <StarRating
                      rating={editRating}
                      onRatingChange={setEditRating}
                      onHover={setHoverRating}
                    />
                  </div>
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="w-full bg-[#1b2838] p-2 rounded text-sm resize-none"
                    rows={3}
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => setEditingComment(null)}
                      className="text-xs text-gray-400 hover:text-white"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => updateComment(comment.id)}
                      className="text-xs text-[#67c1f5] hover:text-blue-400"
                    >
                      Save
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-300 whitespace-pre-wrap mt-2">{comment.content}</p>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Add Comment */}
      {currentUsername && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-400">Rating:</span>
            <StarRating
              rating={newRating}
              onRatingChange={setNewRating}
              onHover={setHoverRating}
            />
          </div>
          <div className="relative">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Add a comment..."
              className="w-full bg-[#32404e] p-3 pr-12 rounded text-sm resize-none"
              rows={3}
            />
            <button
              onClick={addComment}
              disabled={!newComment.trim()}
              className="absolute right-3 bottom-3 text-[#67c1f5] hover:text-blue-400 disabled:text-gray-500 disabled:cursor-not-allowed transition-colors"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {!currentUsername && (
        <p className="text-sm text-gray-400 text-center">
          Please sign in to leave a comment
        </p>
      )}
    </div>
  );
} 
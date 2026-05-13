'use client';
import { useState, useEffect } from 'react';
import { commentApi } from '../lib/tiktokApi';
import Loading from './Loading';

export default function Comments({ videoId }) {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [commentText, setCommentText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchComments = async () => {
      try {
        setLoading(true);
        const response = await commentApi.getComments(videoId);
        
        if (response.status_code === 0) {
          setComments(response.comments);
          setError(null);
        } else {
          throw new Error(response.status_msg || 'Failed to fetch comments');
        }
      } catch (err) {
        console.error('Error fetching comments:', err);
        setError('Failed to load comments. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchComments();
  }, [videoId]);

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    
    try {
      setIsSubmitting(true);
      const response = await commentApi.postComment(videoId, commentText);
      
      if (response.status_code === 0) {
        setComments([response.comment, ...comments]);
        setCommentText('');
        setError(null);
      } else {
        throw new Error(response.status_msg || 'Failed to post comment');
      }
    } catch (err) {
      console.error('Error posting comment:', err);
      setError('Failed to post comment. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    try {
      const response = await commentApi.deleteComment(commentId);
      
      if (response.status_code === 0) {
        setComments(comments.filter(comment => comment.id !== commentId));
        setError(null);
      } else {
        throw new Error(response.status_msg || 'Failed to delete comment');
      }
    } catch (err) {
      console.error('Error deleting comment:', err);
      setError('Failed to delete comment. Please try again.');
    }
  };

  return (
    <div className="mt-4 border-t pt-4">
      <h3 className="font-semibold mb-2">Comments</h3>
      
      {/* Comment form */}
      <form onSubmit={handleAddComment} className="mb-4 flex">
        <input 
          type="text"
          className="flex-1 border rounded-l-md px-3 py-1.5"
          placeholder="Add a comment..."
          value={commentText}
          onChange={(e) => setCommentText(e.target.value)}
          disabled={isSubmitting}
        />
        <button 
          type="submit"
          className="bg-red-500 text-white px-4 py-1.5 rounded-r-md"
          disabled={isSubmitting || !commentText.trim()}
        >
          {isSubmitting ? 'Posting...' : 'Post'}
        </button>
      </form>
      
      {error && (
        <div className="text-red-500 mb-4">{error}</div>
      )}
      
      {/* Comments list */}
      {loading ? (
        <Loading />
      ) : (
        <div className="space-y-3 max-h-60 overflow-y-auto">
          {comments.length > 0 ? (
            comments.map((comment) => (
              <div key={comment.id} className="flex space-x-2 group">
                <div className="h-8 w-8 rounded-full overflow-hidden flex-shrink-0">
                  <img 
                    src={comment.user.avatar_url} 
                    alt={comment.user.username}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1">
                  <div className="flex items-center">
                    <p className="text-sm font-semibold">@{comment.user.username}</p>
                    <span className="text-xs text-gray-500 ml-2">
                      {new Date(comment.create_time * 1000).toLocaleDateString()}
                    </span>
                    {comment.user.username === 'YOUR_USERNAME' && (
                      <button 
                        className="ml-auto text-xs text-gray-500 opacity-0 group-hover:opacity-100"
                        onClick={() => handleDeleteComment(comment.id)}
                      >
                        Delete
                      </button>
                    )}
                  </div>
                  <p className="text-sm">{comment.text}</p>
                </div>
              </div>
            ))
          ) : (
            <p className="text-center text-gray-500">No comments yet. Be the first to comment!</p>
          )}
        </div>
      )}
    </div>
  );
}
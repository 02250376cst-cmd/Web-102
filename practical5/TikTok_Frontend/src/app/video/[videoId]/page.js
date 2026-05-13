'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { getVideoById, addComment, getVideoComments } from '../../../services/videoService';
import { useAuth } from '../../../contexts/authContext';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { FaHeart, FaRegHeart, FaUser } from 'react-icons/fa';

export default function VideoDetailPage() {
  const { videoId } = useParams();
  const { user, isAuthenticated } = useAuth();
  const [video, setVideo] = useState(null);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVideoData = async () => {
      try {
        setLoading(true);
        const videoData = await getVideoById(videoId);
        setVideo(videoData);
        
        const commentsData = await getVideoComments(videoId);
        setComments(commentsData.comments || []);
      } catch (error) {
        console.error('Error fetching video data:', error);
        toast.error('Failed to load video');
      } finally {
        setLoading(false);
      }
    };

    if (videoId) {
      fetchVideoData();
    }
  }, [videoId]);

  const handleAddComment = async (e) => {
    e.preventDefault();
    
    if (!isAuthenticated) {
      toast.error('Please log in to comment');
      return;
    }
    
    if (!commentText.trim()) {
      toast.error('Comment cannot be empty');
      return;
    }
    
    try {
      const newComment = await addComment(videoId, commentText);
      setComments(prev => [newComment, ...prev]);
      setCommentText('');
      toast.success('Comment added');
    } catch (error) {
      console.error('Error adding comment:', error);
      toast.error('Failed to add comment');
    }
  };

  const getFullVideoUrl = (url) => {
    if (!url) return null;
    
    if (url.startsWith('http')) return url;
    
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    const serverUrl = baseUrl.includes('/api') 
      ? baseUrl.substring(0, baseUrl.indexOf('/api')) 
      : baseUrl;
    
    return `${serverUrl}${url}`;
  };

  if (loading) {
    return (
      <div className="flex justify-center py-10">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent"></div>
      </div>
    );
  }

  if (!video) {
    return (
      <div className="text-center py-10">
        <p>Video not found</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="flex flex-col md:flex-row gap-4">
        {/* Video section */}
        <div className="md:w-2/3">
          <div className="bg-black rounded-lg overflow-hidden">
            <video
              src={getFullVideoUrl(video.videoUrl)}
              controls
              className="w-full h-auto max-h-[70vh] object-contain"
              poster={video.thumbnailUrl ? getFullVideoUrl(video.thumbnailUrl) : null}
            />
          </div>
          <div className="mt-4">
            <Link href={`/profile/${video.user?.id}`} className="flex items-center gap-2">
              <div className="h-10 w-10 rounded-full overflow-hidden bg-gray-200">
                {video.user?.avatar ? (
                  <img 
                    src={getFullVideoUrl(video.user.avatar)} 
                    alt={video.user.username}
                    className="w-full h-full object-cover" 
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <FaUser className="text-gray-500" />
                  </div>
                )}
              </div>
              <div>
                <p className="font-bold">{video.user?.username}</p>
              </div>
            </Link>
            <p className="mt-2">{video.caption}</p>
          </div>
        </div>
        
        {/* Comments section */}
        <div className="md:w-1/3 border rounded-lg">
          <div className="p-4 border-b">
            <h2 className="text-lg font-bold">Comments</h2>
          </div>
          
          {/* Comment form */}
          <div className="p-4 border-b">
            <form onSubmit={handleAddComment} className="flex">
              <input
                type="text"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Add a comment..."
                className="flex-1 border rounded-l p-2"
                disabled={!isAuthenticated}
              />
              <button
                type="submit"
                className="bg-blue-500 text-white px-4 py-2 rounded-r"
                disabled={!isAuthenticated || !commentText.trim()}
              >
                Post
              </button>
            </form>
          </div>
          
          {/* Comments list */}
          <div className="p-4 overflow-y-auto max-h-[50vh]">
            {comments.length > 0 ? (
              comments.map((comment) => (
                <div key={comment.id} className="mb-4 border-b pb-2">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full overflow-hidden bg-gray-200">
                      {comment.user?.avatar ? (
                        <img 
                          src={getFullVideoUrl(comment.user.avatar)} 
                          alt={comment.user.username}
                          className="w-full h-full object-cover" 
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <FaUser className="text-gray-500" />
                        </div>
                      )}
                    </div>
                    <span className="font-bold">{comment.user?.username}</span>
                  </div>
                  <p className="mt-1 ml-10">{comment.content}</p>
                </div>
              ))
            ) : (
              <p className="text-center text-gray-500">No comments yet</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
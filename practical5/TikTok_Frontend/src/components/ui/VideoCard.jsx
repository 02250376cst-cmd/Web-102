"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { FaHeart, FaComment, FaShare, FaMusic, FaVolumeMute, FaVolumeUp } from "react-icons/fa";
import { useAuth } from "../../contexts/authContext";
import { likeVideo, unlikeVideo } from "../../services/videoService";
import toast from "react-hot-toast";

const VideoCard = ({ video }) => {
  const { user, isAuthenticated } = useAuth();
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(video.likeCount || 0);
  const [videoError, setVideoError] = useState(false);
  const videoRef = useRef(null);
  const [isMuted, setIsMuted] = useState(false);

  const getFullVideoUrl = (url) => {
  if (!url) return null;
  
  // Supabase URLs are already complete, so just return them
  if (url.includes('supabase') || url.startsWith('http')) {
    return url;
  }
  
  // Fall back to the old method for any local URLs
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
  const serverUrl = baseUrl.includes('/api') 
    ? baseUrl.substring(0, baseUrl.indexOf('/api')) 
    : baseUrl;
  
  return `${serverUrl}${url}`;
  };
  
  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
        setIsPlaying(false);
      } else {
        const playPromise = videoRef.current.play();
        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              setIsPlaying(true);
            })
            .catch((error) => {
              console.error("Error playing video:", error);
            });
        }
      }
    }
  };

  const toggleMute = (e) => {
    e.stopPropagation(); // Prevent triggering play/pause
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
      setIsMuted(videoRef.current.muted);
    }
  };

  const handleLike = async () => {
    if (!isAuthenticated) {
      toast.error("Please log in to like videos");
      return;
    }

    try {
      if (isLiked) {
        await unlikeVideo(video.id);
        setIsLiked(false);
        setLikeCount((prev) => prev - 1);
      } else {
        await likeVideo(video.id);
        setIsLiked(true);
        setLikeCount((prev) => prev + 1);
      }
    } catch (error) {
      console.error("Error toggling like:", error);
      toast.error("Failed to like/unlike video");
    }
  };

  // Improved intersection observer for autoplay
  useEffect(() => {
    if (!videoRef.current) return;

    let isPaused = false;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        
        if (entry.isIntersecting) {
          // Small delay to prevent rapid play/pause cycles
          setTimeout(() => {
            if (videoRef.current && !isPaused) {
              const playPromise = videoRef.current.play();
              if (playPromise !== undefined) {
                playPromise
                  .then(() => {
                    setIsPlaying(true);
                  })
                  .catch((error) => {
                    console.error("Autoplay prevented:", error);
                    setIsPlaying(false);
                  });
              }
            }
          }, 50);
        } else {
          if (videoRef.current) {
            isPaused = true;
            videoRef.current.pause();
            setIsPlaying(false);
            setTimeout(() => {
              isPaused = false;
            }, 100);
          }
        }
      },
      { threshold: 0.6 }
    );

    const currentVideo = videoRef.current;
    if (currentVideo) {
      observer.observe(currentVideo);
    }

    return () => {
      if (currentVideo) {
        observer.unobserve(currentVideo);
      }
    };
  }, []);

  const handleVideoError = () => {
    console.error("Video failed to load:", video.videoUrl);
    setVideoError(true);
  };

  return (
    <div className="mb-8 flex border-b border-gray-200 pb-8">
      {/* User avatar */}
      <div className="mr-4">
        <Link href={`/profile/${video.user?.id}`}>
          <div className="h-12 w-12 overflow-hidden rounded-full">
            <img
              src={video.user?.avatar || "https://via.placeholder.com/150"}
              alt={video.user?.username}
              className="h-full w-full object-cover"
            />
          </div>
        </Link>
      </div>

      {/* Video content */}
      <div className="flex-1">
        {/* User info and caption */}
        <div className="mb-3">
          <Link
            href={`/profile/${video.user?.id}`}
            className="font-semibold hover:underline"
          >
            {video.user?.username}
          </Link>
          <p className="mt-1">{video.caption}</p>
          {video.sound && (
            <p className="mt-1 flex items-center text-sm">
              <FaMusic className="mr-1" /> {video.sound}
            </p>
          )}
        </div>

        {/* Video and interaction */}
        <div className="flex">
          {/* Video container */}
          <div className="relative mr-4 h-[600px] w-[336px] overflow-hidden rounded-lg bg-black">
            {!videoError ? (
              <>
                <video
                  ref={videoRef}
                  onClick={togglePlay}
                  className="h-full w-full object-contain"
                  loop
                  muted={isMuted} 
                  playsInline
                  poster={video.thumbnailUrl ? getFullVideoUrl(video.thumbnailUrl) : "https://via.placeholder.com/150"}
                  onError={handleVideoError}
                >
                  <source 
                    src={getFullVideoUrl(video.videoUrl)} 
                    type="video/mp4" 
                  />
                </video>

                {/* Add a mute/unmute button */}
                <button 
                  onClick={toggleMute}
                  className="absolute bottom-4 right-4 bg-black bg-opacity-50 rounded-full p-2 text-white z-10"
                >
                  {isMuted ? <FaVolumeMute size={20} /> : <FaVolumeUp size={20} />}
                </button>

                {!isPlaying && (
                  <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 transform text-white">
                    <button className="rounded-full bg-black bg-opacity-50 p-4">
                      ▶️
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="flex h-full w-full flex-col items-center justify-center bg-black text-white">
                <p className="mb-2">Video unavailable</p>
                <p className="text-sm text-gray-400">Unable to load video</p>
              </div>
            )}
          </div>

          {/* Interaction buttons */}
          <div className="flex flex-col items-center justify-end space-y-4">
            <button
              onClick={handleLike}
              className={`flex flex-col items-center ${
                isLiked ? "text-red-500" : ""
              }`}
            >
              <div className="rounded-full bg-gray-100 p-3">
                <FaHeart size={20} />
              </div>
              <span className="mt-1 text-xs">{likeCount}</span>
            </button>

            <Link
              href={`/video/${video.id}`}
              className="flex flex-col items-center"
            >
              <div className="rounded-full bg-gray-100 p-3">
                <FaComment size={20} />
              </div>
              <span className="mt-1 text-xs">{video.commentCount || 0}</span>
            </Link>

            <button className="flex flex-col items-center">
              <div className="rounded-full bg-gray-100 p-3">
                <FaShare size={20} />
              </div>
              <span className="mt-1 text-xs">Share</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoCard;
import { useState } from "react";
import { Heart, MessageCircle, Share, User } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SocialPostWithDetails } from "@/lib/types";
import { formatDistanceToNow } from "date-fns";
import { apiRequest } from "@/lib/queryClient";

interface SocialPostProps {
  post: SocialPostWithDetails;
  onUpdate?: () => void;
}

export function SocialPost({ post, onUpdate }: SocialPostProps) {
  const [isLiked, setIsLiked] = useState(post.isLiked || false);
  const [likesCount, setLikesCount] = useState(post.likesCount);
  const [isLiking, setIsLiking] = useState(false);

  const handleLike = async () => {
    if (isLiking) return;
    
    setIsLiking(true);
    try {
      const response = await apiRequest("POST", `/api/social/posts/${post.id}/like`);
      const { liked } = await response.json();
      
      setIsLiked(liked);
      setLikesCount(prev => liked ? prev + 1 : prev - 1);
      
      if (onUpdate) {
        onUpdate();
      }
    } catch (error) {
      console.error("Failed to toggle like:", error);
    } finally {
      setIsLiking(false);
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'club_head':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'club_member':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'teacher':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const formatRole = (role: string) => {
    if (role === 'club_member') return 'Club Member';
    if (role === 'club_head') return 'Club Head';
    return role.charAt(0).toUpperCase() + role.slice(1);
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex space-x-4">
          <div className="w-10 h-10 bg-neutral-200 dark:bg-gray-700 rounded-full flex items-center justify-center flex-shrink-0">
            <User className="h-5 w-5 text-neutral-600 dark:text-gray-300" />
          </div>
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              <h4 className="font-medium text-neutral-800 dark:text-white">
                {post.author?.firstName} {post.author?.lastName}
              </h4>
              <span className="text-xs text-neutral-500 dark:text-gray-400">
                {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
              </span>
              {post.author?.role && (
                <Badge className={`text-xs ${getRoleBadgeColor(post.author.role)}`}>
                  {formatRole(post.author.role)}
                </Badge>
              )}
            </div>
            
            <p className="text-sm text-neutral-700 dark:text-gray-300 mb-3">
              {post.content}
            </p>
            
            {post.imageUrls && post.imageUrls.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 mb-3">
                {post.imageUrls.slice(0, 3).map((url, index) => (
                  <img
                    key={index}
                    src={url}
                    alt="Post image"
                    className="rounded-lg object-cover w-full h-24"
                  />
                ))}
              </div>
            )}
            
            <div className="flex items-center space-x-4 text-sm text-neutral-500 dark:text-gray-400">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLike}
                disabled={isLiking}
                className={`flex items-center space-x-1 hover:text-primary transition-colors ${
                  isLiked ? 'text-primary' : ''
                }`}
              >
                <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
                <span>{likesCount} likes</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="flex items-center space-x-1 hover:text-primary transition-colors"
              >
                <MessageCircle className="w-4 h-4" />
                <span>{post.commentsCount} comments</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="flex items-center space-x-1 hover:text-primary transition-colors"
              >
                <Share className="w-4 h-4" />
                <span>Share</span>
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

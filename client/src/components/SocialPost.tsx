import { useState } from "react";
import { Heart, MessageCircle, Share, MoreVertical } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import type { PostWithDetails } from "@/types";

interface SocialPostProps {
  post: PostWithDetails;
  onLike?: (postId: number) => void;
  onComment?: (postId: number) => void;
  onShare?: (postId: number) => void;
}

export function SocialPost({ post, onLike, onComment, onShare }: SocialPostProps) {
  const [isLiked, setIsLiked] = useState(post.isLiked || false);
  const [likesCount, setLikesCount] = useState(post.likesCount || 0);

  const handleLike = () => {
    if (onLike) {
      onLike(post.id);
      setIsLiked(!isLiked);
      setLikesCount(prev => isLiked ? prev - 1 : prev + 1);
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "admin": return "bg-red-100 text-red-800";
      case "teacher": return "bg-amber-100 text-amber-800";
      case "registrar": return "bg-purple-100 text-purple-800";
      case "financial_head": return "bg-green-100 text-green-800";
      case "club_head": return "bg-blue-100 text-blue-800";
      case "club_member": return "bg-teal-100 text-teal-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const formatTimeAgo = (date: string | Date) => {
    const now = new Date();
    const postDate = new Date(date);
    const diffInHours = Math.floor((now.getTime() - postDate.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return "Just now";
    if (diffInHours < 24) return `${diffInHours}h ago`;
    return postDate.toLocaleDateString();
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex space-x-4">
          <Avatar className="w-10 h-10">
            <AvatarFallback className="bg-muted">
              {post.author?.fullName?.charAt(0) || "U"}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              <h4 className="font-medium text-foreground">
                {post.author?.fullName || "Anonymous"}
              </h4>
              <span className="text-xs text-muted-foreground">
                {formatTimeAgo(post.createdAt!)}
              </span>
              {post.author?.role && (
                <Badge className={`text-xs ${getRoleBadgeColor(post.author.role)}`}>
                  {post.author.role.replace('_', ' ')}
                </Badge>
              )}
            </div>

            <p className="text-sm text-foreground mb-3 whitespace-pre-wrap">
              {post.content}
            </p>

            {/* Event Photos Preview */}
            {post.imageUrls && Array.isArray(post.imageUrls) && post.imageUrls.length > 0 && (
              <div className="grid grid-cols-3 gap-2 mb-3">
                {post.imageUrls.slice(0, 3).map((url, index) => (
                  <img
                    key={index}
                    src={url}
                    alt={`Post image ${index + 1}`}
                    className="rounded-lg object-cover w-full h-24"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                    }}
                  />
                ))}
                {post.imageUrls.length > 3 && (
                  <div className="rounded-lg bg-muted flex items-center justify-center h-24">
                    <span className="text-sm text-muted-foreground">
                      +{post.imageUrls.length - 3} more
                    </span>
                  </div>
                )}
              </div>
            )}

            <div className="flex items-center space-x-4 text-sm text-muted-foreground">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLike}
                className={`flex items-center space-x-1 hover:text-primary transition-colors ${
                  isLiked ? "text-primary" : ""
                }`}
              >
                <Heart className={`w-4 h-4 ${isLiked ? "fill-current" : ""}`} />
                <span>{likesCount} likes</span>
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => onComment?.(post.id)}
                className="flex items-center space-x-1 hover:text-primary transition-colors"
              >
                <MessageCircle className="w-4 h-4" />
                <span>{post.commentsCount || 0} comments</span>
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => onShare?.(post.id)}
                className="flex items-center space-x-1 hover:text-primary transition-colors"
              >
                <Share className="w-4 h-4" />
                <span>Share</span>
              </Button>

              <Button variant="ghost" size="sm" className="ml-auto">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

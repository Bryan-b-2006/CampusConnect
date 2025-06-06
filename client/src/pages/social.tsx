import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Plus, Image, Filter, Heart, MessageCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { NavigationHeader } from "@/components/navigation-header";
import { SocialPost } from "@/components/social-post";
import { useAuth } from "@/hooks/useAuth";
import { SocialPostWithDetails, EventWithDetails } from "@/lib/types";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function Social() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [newPostContent, setNewPostContent] = useState("");
  const [eventFilter, setEventFilter] = useState<string>("all");

  // Fetch social posts
  const { data: posts = [], isLoading: postsLoading, refetch: refetchPosts } = useQuery<SocialPostWithDetails[]>({
    queryKey: ["/api/social/posts"],
  });

  // Fetch events for filtering
  const { data: events = [] } = useQuery<EventWithDetails[]>({
    queryKey: ["/api/events"],
  });

  // Create post mutation
  const createPostMutation = useMutation({
    mutationFn: async (data: { content: string; eventId?: number }) => {
      return apiRequest("POST", "/api/social/posts", data);
    },
    onSuccess: () => {
      toast({
        title: "Post created",
        description: "Your post has been shared successfully!",
      });
      setNewPostContent("");
      queryClient.invalidateQueries({ queryKey: ["/api/social/posts"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create post",
        variant: "destructive",
      });
    },
  });

  const filteredPosts = posts.filter(post => {
    if (eventFilter !== "all") {
      if (eventFilter === "no-event") {
        return !post.eventId;
      }
      return post.eventId === parseInt(eventFilter);
    }
    return true;
  });

  const handleCreatePost = () => {
    if (!newPostContent.trim()) {
      toast({
        title: "Error",
        description: "Post content cannot be empty",
        variant: "destructive",
      });
      return;
    }

    createPostMutation.mutate({
      content: newPostContent,
      eventId: eventFilter !== "all" && eventFilter !== "no-event" ? parseInt(eventFilter) : undefined,
    });
  };

  const statsData = [
    {
      title: "Total Posts",
      value: posts.length,
      icon: "📝",
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      title: "Total Likes",
      value: posts.reduce((sum, p) => sum + p.likesCount, 0),
      icon: "❤️",
      color: "text-error",
      bgColor: "bg-error/10",
    },
    {
      title: "Total Comments",
      value: posts.reduce((sum, p) => sum + p.commentsCount, 0),
      icon: "💬",
      color: "text-secondary",
      bgColor: "bg-secondary/10",
    },
    {
      title: "Active Events",
      value: events.filter(e => e.status === "approved").length,
      icon: "🎉",
      color: "text-accent",
      bgColor: "bg-accent/10",
    },
  ];

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-gray-900">
      <NavigationHeader />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-neutral-800 dark:text-white">Social Feed</h1>
          <p className="text-neutral-600 dark:text-gray-300 mt-2">
            Share updates, connect with your college community
          </p>
        </div>

        {/* Social Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {statsData.map((stat, index) => (
            <Card key={index}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold text-neutral-800 dark:text-white">
                      {stat.value}
                    </p>
                    <p className="text-sm text-neutral-600 dark:text-gray-300">
                      {stat.title}
                    </p>
                  </div>
                  <div className={`w-12 h-12 ${stat.bgColor} rounded-lg flex items-center justify-center text-2xl`}>
                    {stat.icon}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Create Post */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>What's happening?</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Textarea
                placeholder="Share something with your college community..."
                value={newPostContent}
                onChange={(e) => setNewPostContent(e.target.value)}
                rows={3}
                className="resize-none"
              />
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="sm" disabled>
                    <Image className="w-4 h-4 mr-2" />
                    Add Photo
                  </Button>
                  <span className="text-xs text-neutral-500 dark:text-gray-400">
                    Photo upload coming soon
                  </span>
                </div>
                
                <Button 
                  onClick={handleCreatePost}
                  disabled={createPostMutation.isPending || !newPostContent.trim()}
                >
                  {createPostMutation.isPending ? "Posting..." : "Post"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Filters */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Filter className="w-5 h-5 mr-2" />
              Filter Posts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-neutral-700 dark:text-gray-300 mb-2 block">
                  Filter by Event
                </label>
                <Select value={eventFilter} onValueChange={setEventFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by event" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Posts</SelectItem>
                    <SelectItem value="no-event">General Posts</SelectItem>
                    {events.map(event => (
                      <SelectItem key={event.id} value={event.id.toString()}>
                        {event.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-end">
                <Button 
                  variant="outline" 
                  onClick={() => setEventFilter("all")}
                  className="w-full"
                >
                  Clear Filters
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Social Feed */}
        <div className="space-y-6">
          {postsLoading ? (
            <div className="space-y-6">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : filteredPosts.length > 0 ? (
            filteredPosts.map((post) => (
              <SocialPost 
                key={post.id} 
                post={post}
                onUpdate={refetchPosts}
              />
            ))
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <div className="text-6xl mb-4">📱</div>
                <h3 className="text-lg font-semibold text-neutral-800 dark:text-white mb-2">
                  No posts yet
                </h3>
                <p className="text-neutral-600 dark:text-gray-300 mb-4">
                  Be the first to share something with your college community!
                </p>
                <Button onClick={() => document.querySelector('textarea')?.focus()}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Your First Post
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Trending Topics */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Trending in Your College</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-neutral-50 dark:bg-gray-800 rounded-lg">
                <div>
                  <p className="font-medium text-neutral-800 dark:text-white">#TechWeek2024</p>
                  <p className="text-sm text-neutral-600 dark:text-gray-300">15 posts</p>
                </div>
                <Button variant="ghost" size="sm">Follow</Button>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-neutral-50 dark:bg-gray-800 rounded-lg">
                <div>
                  <p className="font-medium text-neutral-800 dark:text-white">#CulturalNight</p>
                  <p className="text-sm text-neutral-600 dark:text-gray-300">8 posts</p>
                </div>
                <Button variant="ghost" size="sm">Follow</Button>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-neutral-50 dark:bg-gray-800 rounded-lg">
                <div>
                  <p className="font-medium text-neutral-800 dark:text-white">#StudyGroup</p>
                  <p className="text-sm text-neutral-600 dark:text-gray-300">12 posts</p>
                </div>
                <Button variant="ghost" size="sm">Follow</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

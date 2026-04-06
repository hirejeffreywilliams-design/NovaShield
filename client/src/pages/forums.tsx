import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch, apiPost, apiPut } from "@/lib/queryClient";
import {
  MessageSquare,
  Plus,
  Search,
  ThumbsUp,
  Clock,
  User,
  MessageCircle,
  ChevronDown,
  ChevronUp,
  Send,
  X,
  Tag,
} from "lucide-react";

interface ForumPost {
  id: number;
  author: string;
  content: string;
  created_at: string;
  upvotes: number;
}

interface ForumThread {
  id: number;
  title: string;
  category: string;
  author: string;
  post_count: number;
  last_activity: string;
  created_at: string;
  description: string;
  posts: ForumPost[];
}

const categories = [
  "All",
  "Police Accountability",
  "Know Your Rights",
  "Community Safety",
  "Policy Reform",
  "General",
];

const categoryColors: Record<string, string> = {
  "Police Accountability": "bg-red-400/10 text-red-400 border-red-400/20",
  "Know Your Rights": "bg-[#0EA5E9]/10 text-[#0EA5E9] border-[#0EA5E9]/20",
  "Community Safety": "bg-green-400/10 text-green-400 border-green-400/20",
  "Policy Reform": "bg-purple-400/10 text-purple-400 border-purple-400/20",
  General: "bg-[#a3a3a3]/10 text-[#a3a3a3] border-[#a3a3a3]/20",
};

const mockThreads: ForumThread[] = [
  {
    id: 1,
    title: "How to file a complaint about excessive force",
    category: "Police Accountability",
    author: "CommunityAdvocate42",
    post_count: 23,
    last_activity: "2026-04-04T18:30:00Z",
    created_at: "2026-03-20T10:00:00Z",
    description:
      "I witnessed what I believe was excessive force during a traffic stop last week. Can someone walk me through the proper process for filing a formal complaint?",
    posts: [
      {
        id: 1,
        author: "CommunityAdvocate42",
        content:
          "I witnessed what I believe was excessive force during a traffic stop last week. Can someone walk me through the proper process for filing a formal complaint?",
        created_at: "2026-03-20T10:00:00Z",
        upvotes: 34,
      },
      {
        id: 2,
        author: "LegalEagle_Pro",
        content:
          "First, document everything you remember as soon as possible - dates, times, badge numbers, location. Then you can file through the department's Internal Affairs division or through NovaShield's complaint portal. Both channels are monitored.",
        created_at: "2026-03-20T11:15:00Z",
        upvotes: 28,
      },
      {
        id: 3,
        author: "OversightWatch",
        content:
          "Also consider filing with the civilian review board. They operate independently from the police department and can provide an unbiased investigation.",
        created_at: "2026-03-20T14:30:00Z",
        upvotes: 19,
      },
    ],
  },
  {
    id: 2,
    title: "New body camera policy proposal - community input needed",
    category: "Policy Reform",
    author: "PolicyReformNow",
    post_count: 45,
    last_activity: "2026-04-05T09:00:00Z",
    created_at: "2026-03-15T08:00:00Z",
    description:
      "The city council is considering a new body camera policy that would require all footage to be retained for 2 years. Let's discuss the implications and submit our collective feedback.",
    posts: [
      {
        id: 4,
        author: "PolicyReformNow",
        content:
          "The city council is considering a new body camera policy that would require all footage to be retained for 2 years. Let's discuss the implications and submit our collective feedback.",
        created_at: "2026-03-15T08:00:00Z",
        upvotes: 56,
      },
      {
        id: 5,
        author: "DataPrivacyFirst",
        content:
          "While I support transparency, we need to balance this with privacy concerns. Two years is a long time to store footage of everyday citizens. What safeguards will be in place?",
        created_at: "2026-03-15T10:30:00Z",
        upvotes: 41,
      },
    ],
  },
  {
    id: 3,
    title: "Know your rights during a traffic stop",
    category: "Know Your Rights",
    author: "RightsEducator",
    post_count: 67,
    last_activity: "2026-04-03T22:15:00Z",
    created_at: "2026-02-28T14:00:00Z",
    description:
      "A comprehensive guide to your constitutional rights during a traffic stop. Sharing this so everyone knows what they can and cannot be asked to do.",
    posts: [
      {
        id: 6,
        author: "RightsEducator",
        content:
          "A comprehensive guide to your constitutional rights during a traffic stop. Key points: You must provide license, registration, and proof of insurance. You do NOT have to consent to a search. You have the right to remain silent beyond identifying yourself.",
        created_at: "2026-02-28T14:00:00Z",
        upvotes: 112,
      },
    ],
  },
  {
    id: 4,
    title: "Neighborhood watch coordination thread",
    category: "Community Safety",
    author: "SafeStreets_Org",
    post_count: 31,
    last_activity: "2026-04-02T16:45:00Z",
    created_at: "2026-03-10T09:00:00Z",
    description:
      "Let's coordinate our neighborhood watch efforts. Share tips, schedules, and safety concerns for our community.",
    posts: [
      {
        id: 7,
        author: "SafeStreets_Org",
        content:
          "Let's coordinate our neighborhood watch efforts. Share tips, schedules, and safety concerns for our community. Remember: observe and report, never confront.",
        created_at: "2026-03-10T09:00:00Z",
        upvotes: 25,
      },
    ],
  },
  {
    id: 5,
    title: "Thank you to Officer Chen for community outreach",
    category: "General",
    author: "GratefulResident",
    post_count: 12,
    last_activity: "2026-04-01T11:00:00Z",
    created_at: "2026-03-25T15:00:00Z",
    description:
      "I wanted to publicly thank Officer Chen for organizing the youth basketball program. Not all interactions with police are negative, and this kind of community engagement matters.",
    posts: [
      {
        id: 8,
        author: "GratefulResident",
        content:
          "I wanted to publicly thank Officer Chen for organizing the youth basketball program. This kind of community engagement builds real trust.",
        created_at: "2026-03-25T15:00:00Z",
        upvotes: 47,
      },
    ],
  },
];

function formatRelativeTime(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function ForumsPage() {
  const [activeCategory, setActiveCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedThread, setExpandedThread] = useState<number | null>(null);
  const [showNewThread, setShowNewThread] = useState(false);
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [replyText, setReplyText] = useState("");
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newCategory, setNewCategory] = useState("General");
  const [localUpvotes, setLocalUpvotes] = useState<Record<number, number>>({});
  const queryClient = useQueryClient();

  const { data: threads } = useQuery<ForumThread[]>({
    queryKey: ["forum-threads"],
    queryFn: () => apiFetch<ForumThread[]>("/forums/threads"),
    placeholderData: mockThreads,
  });

  const createThread = useMutation({
    mutationFn: (data: { title: string; description: string; category: string }) =>
      apiPost("/forums/threads", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["forum-threads"] });
      setShowNewThread(false);
      setNewTitle("");
      setNewDescription("");
      setNewCategory("General");
    },
  });

  const postReply = useMutation({
    mutationFn: (data: { threadId: number; content: string }) =>
      apiPost(`/forums/threads/${data.threadId}/posts`, { content: data.content }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["forum-threads"] });
      setReplyText("");
      setReplyingTo(null);
    },
  });

  const handleUpvote = (postId: number) => {
    setLocalUpvotes((prev) => ({
      ...prev,
      [postId]: (prev[postId] || 0) + 1,
    }));
  };

  const allThreads = threads ?? mockThreads;
  const filteredThreads = allThreads.filter((thread) => {
    const matchesCategory = activeCategory === "All" || thread.category === activeCategory;
    const matchesSearch =
      searchQuery === "" ||
      thread.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      thread.author.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#0EA5E9]/10">
            <MessageSquare className="h-5 w-5 text-[#0EA5E9]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#e5e5e5]">Community Forum</h1>
            <p className="text-sm text-[#a3a3a3]">Discuss, share, and advocate for change</p>
          </div>
        </div>
        <button
          onClick={() => setShowNewThread(!showNewThread)}
          className="flex items-center gap-2 rounded-lg bg-[#0EA5E9] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#0EA5E9]/90"
        >
          <Plus className="h-4 w-4" />
          New Discussion
        </button>
      </div>

      {/* New Discussion Form */}
      {showNewThread && (
        <div className="rounded-lg border border-[#1e1e1e] bg-[#111111] p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-[#e5e5e5]">Start a New Discussion</h2>
            <button onClick={() => setShowNewThread(false)} className="text-[#a3a3a3] hover:text-[#e5e5e5]">
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm text-[#a3a3a3]">Title</label>
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="What would you like to discuss?"
                className="w-full rounded-lg border border-[#1e1e1e] bg-[#0a0a0a] px-3 py-2 text-sm text-[#e5e5e5] placeholder-[#525252] focus:border-[#0EA5E9] focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm text-[#a3a3a3]">Category</label>
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                className="w-full rounded-lg border border-[#1e1e1e] bg-[#0a0a0a] px-3 py-2 text-sm text-[#e5e5e5] focus:border-[#0EA5E9] focus:outline-none"
              >
                {categories.filter((c) => c !== "All").map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm text-[#a3a3a3]">Description</label>
              <textarea
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                rows={4}
                placeholder="Share your thoughts, questions, or concerns..."
                className="w-full rounded-lg border border-[#1e1e1e] bg-[#0a0a0a] px-3 py-2 text-sm text-[#e5e5e5] placeholder-[#525252] focus:border-[#0EA5E9] focus:outline-none"
              />
            </div>
            <div className="flex justify-end">
              <button
                onClick={() =>
                  createThread.mutate({
                    title: newTitle,
                    description: newDescription,
                    category: newCategory,
                  })
                }
                disabled={!newTitle.trim() || !newDescription.trim()}
                className="rounded-lg bg-[#0EA5E9] px-4 py-2 text-sm font-medium text-white hover:bg-[#0EA5E9]/90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Post Discussion
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#525252]" />
        <input
          type="text"
          placeholder="Search discussions..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full rounded-lg border border-[#1e1e1e] bg-[#111111] py-2.5 pl-10 pr-4 text-sm text-[#e5e5e5] placeholder-[#525252] focus:border-[#0EA5E9] focus:outline-none"
        />
      </div>

      {/* Category Tabs */}
      <div className="flex flex-wrap gap-2">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              activeCategory === cat
                ? "bg-[#0EA5E9] text-white"
                : "border border-[#1e1e1e] bg-[#111111] text-[#a3a3a3] hover:border-[#2a2a2a] hover:text-[#e5e5e5]"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Thread List */}
      {filteredThreads.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-[#1e1e1e] bg-[#111111] py-16">
          <MessageSquare className="mb-4 h-12 w-12 text-[#525252]" />
          <p className="text-lg font-medium text-[#a3a3a3]">No discussions found</p>
          <p className="mt-1 text-sm text-[#525252]">
            {searchQuery || activeCategory !== "All"
              ? "Try adjusting your filters"
              : "Start the first discussion"}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredThreads.map((thread) => (
            <div key={thread.id} className="rounded-lg border border-[#1e1e1e] bg-[#111111] transition-colors hover:border-[#2a2a2a]">
              {/* Thread Header */}
              <button
                onClick={() => setExpandedThread(expandedThread === thread.id ? null : thread.id)}
                className="flex w-full items-start gap-4 p-5 text-left"
              >
                <div className="flex-1 min-w-0">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <h3 className="text-sm font-semibold text-[#e5e5e5]">{thread.title}</h3>
                    <span
                      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${
                        categoryColors[thread.category] || categoryColors.General
                      }`}
                    >
                      <Tag className="h-3 w-3" />
                      {thread.category}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-4 text-xs text-[#a3a3a3]">
                    <span className="flex items-center gap-1">
                      <User className="h-3.5 w-3.5" />
                      {thread.author}
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageCircle className="h-3.5 w-3.5" />
                      {thread.post_count} posts
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      {formatRelativeTime(thread.last_activity)}
                    </span>
                  </div>
                </div>
                {expandedThread === thread.id ? (
                  <ChevronUp className="mt-1 h-5 w-5 shrink-0 text-[#525252]" />
                ) : (
                  <ChevronDown className="mt-1 h-5 w-5 shrink-0 text-[#525252]" />
                )}
              </button>

              {/* Expanded Thread Detail */}
              {expandedThread === thread.id && (
                <div className="border-t border-[#1e1e1e] px-5 pb-5">
                  {/* Posts */}
                  <div className="mt-4 space-y-4">
                    {thread.posts.map((post) => (
                      <div key={post.id} className="rounded-lg border border-[#1e1e1e] bg-[#0a0a0a] p-4">
                        <div className="mb-3 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#1e1e1e]">
                              <User className="h-3.5 w-3.5 text-[#a3a3a3]" />
                            </div>
                            <span className="text-sm font-medium text-[#e5e5e5]">{post.author}</span>
                            <span className="text-xs text-[#525252]">
                              {formatRelativeTime(post.created_at)}
                            </span>
                          </div>
                        </div>
                        <p className="mb-3 text-sm leading-relaxed text-[#a3a3a3]">{post.content}</p>
                        <button
                          onClick={() => handleUpvote(post.id)}
                          className="flex items-center gap-1.5 rounded-md border border-[#1e1e1e] px-2.5 py-1 text-xs text-[#a3a3a3] transition-colors hover:border-[#0EA5E9]/30 hover:text-[#0EA5E9]"
                        >
                          <ThumbsUp className="h-3.5 w-3.5" />
                          <span>{post.upvotes + (localUpvotes[post.id] || 0)}</span>
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Reply Form */}
                  <div className="mt-4">
                    {replyingTo === thread.id ? (
                      <div className="space-y-3">
                        <textarea
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          rows={3}
                          placeholder="Write your reply..."
                          className="w-full rounded-lg border border-[#1e1e1e] bg-[#0a0a0a] px-3 py-2 text-sm text-[#e5e5e5] placeholder-[#525252] focus:border-[#0EA5E9] focus:outline-none"
                        />
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              postReply.mutate({ threadId: thread.id, content: replyText });
                            }}
                            disabled={!replyText.trim()}
                            className="flex items-center gap-2 rounded-lg bg-[#0EA5E9] px-4 py-2 text-sm font-medium text-white hover:bg-[#0EA5E9]/90 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <Send className="h-3.5 w-3.5" />
                            Post Reply
                          </button>
                          <button
                            onClick={() => {
                              setReplyingTo(null);
                              setReplyText("");
                            }}
                            className="rounded-lg border border-[#1e1e1e] px-4 py-2 text-sm text-[#a3a3a3] hover:text-[#e5e5e5]"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => setReplyingTo(thread.id)}
                        className="flex items-center gap-2 rounded-lg border border-[#1e1e1e] bg-[#0a0a0a] px-4 py-2.5 text-sm text-[#a3a3a3] transition-colors hover:border-[#0EA5E9]/30 hover:text-[#0EA5E9]"
                      >
                        <MessageCircle className="h-4 w-4" />
                        Reply to this discussion
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

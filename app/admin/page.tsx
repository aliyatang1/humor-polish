"use server";

import { StatCard } from "./components/StatCard";
import { getAdminDashboardStats, getCaptionStats } from "@/app/actions/admin";
import Link from "next/link";

export default async function AdminDashboard() {
  const [stats, captionStats] = await Promise.all([
    getAdminDashboardStats(),
    getCaptionStats(),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
        <p className="text-gray-600 dark:text-slate-400 mt-2">Overview of platform engagement and activity</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="All-Time Votes"
          value={stats.totalVotes}
          subtitle="Total engagement across all captions"
        />
        <StatCard
          title="Votes This Week"
          value={stats.weekVotes}
          subtitle="Recent engagement"
        />
        <StatCard
          title="Active Voters (7d)"
          value={stats.activeVotersThisWeek}
          subtitle="Unique users voting"
        />
        <StatCard
          title="Users"
          value={stats.totalUsers}
          subtitle="Total profiles"
        />
      </div>

      {/* Content Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          title="Total Images"
          value={stats.totalImages}
          subtitle="Uploaded content"
        />
        <StatCard
          title="Total Captions"
          value={stats.totalCaptions}
          subtitle="Generated descriptions"
        />
        <StatCard
          title="Avg Captions/Image"
          value={(stats.totalCaptions / Math.max(stats.totalImages, 1)).toFixed(1)}
          subtitle="Content density"
        />
      </div>

      {/* Caption Quality Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Avg Caption Rating"
          value={captionStats.avgRating.toFixed(1) + "%"}
          subtitle="Upvote percentage across all captions"
        />
        <StatCard
          title="Captions With Votes"
          value={captionStats.captionsWithVotes}
          subtitle={`${((captionStats.captionsWithVotes / captionStats.totalCaptions) * 100).toFixed(0)}% of total`}
        />
        <StatCard
          title="5⭐ Quality Captions"
          value={captionStats.ratingDistribution.five_star}
          subtitle=">80% upvotes"
        />
        <StatCard
          title="Controversial"
          value={captionStats.controversial.length}
          subtitle="Balanced upvote/downvote split"
        />
      </div>

      {/* Top & Trending */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Controversial Captions */}
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow border border-gray-100 dark:border-slate-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            ⚔️ Most Controversial
          </h2>
          <div className="space-y-3">
            {captionStats.controversial && captionStats.controversial.length > 0 ? (
              captionStats.controversial.map((caption: any, idx: number) => (
                <div
                  key={caption.id}
                  className="flex items-start justify-between py-2 border-b border-gray-100 dark:border-slate-700 last:border-b-0"
                >
                  <div className="flex-1">
                    <p className="text-sm text-gray-900 dark:text-slate-100 line-clamp-2">
                      {caption.content}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
                      👍 {caption.upvotes} • 👎 {caption.downvotes} • {caption.upvote_percent.toFixed(0)}% upvotes
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500 dark:text-slate-400">No controversial captions found</p>
            )}
          </div>
        </div>
            ) : (
              <p className="text-sm text-gray-500 dark:text-slate-400">No controversial captions found</p>
            )}
          </div>
        </div>
        {/* Top Voted Captions */}
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow border border-gray-100 dark:border-slate-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            🔥 Top Voted Captions
          </h2>
          <div className="space-y-3">
            {stats.topCaptions && stats.topCaptions.length > 0 ? (
              stats.topCaptions.map((caption: any, idx: number) => (
                <div
                  key={caption.id}
                  className="flex items-start justify-between py-2 border-b border-gray-100 dark:border-slate-700 last:border-b-0"
                >
                  <div className="flex-1">
                    <p className="text-sm text-gray-900 dark:text-slate-100 line-clamp-2">
                      {caption.content || caption.caption_text}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
                      #{idx + 1} • {caption.total_votes || 0} votes
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500 dark:text-slate-400">No captions yet</p>
            )}
          </div>
        </div>

        {/* Trending Captions */}
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow border border-gray-100 dark:border-slate-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            ⚡ Trending This Week
          </h2>
          <div className="space-y-3">
            {stats.trendingCaptions && stats.trendingCaptions.length > 0 ? (
              stats.trendingCaptions.map((caption: any, idx: number) => (
                <div
                  key={caption.id}
                  className="flex items-start justify-between py-2 border-b border-gray-100 dark:border-slate-700 last:border-b-0"
                >
                  <div className="flex-1">
                    <p className="text-sm text-gray-900 dark:text-slate-100 line-clamp-2">
                      {caption.content || caption.caption_text}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
                      #{idx + 1} • {caption.recent_votes || 0} votes (7d)
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500 dark:text-slate-400">No activity this week</p>
            )}
          </div>
        </div>
      </div>

      {/* Management Actions */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow border border-gray-100 dark:border-slate-700 p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Management
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            href="/admin/users"
            className="flex items-center justify-center p-4 border border-gray-200 dark:border-slate-700 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors"
          >
            <div className="text-center">
              <p className="text-2xl mb-2">👥</p>
              <p className="font-medium text-gray-900 dark:text-white">Manage Users</p>
              <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
                Create, read, update, delete
              </p>
            </div>
          </Link>

          <Link
            href="/admin/images"
            className="flex items-center justify-center p-4 border border-gray-200 dark:border-slate-700 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors"
          >
            <div className="text-center">
              <p className="text-2xl mb-2">🖼️</p>
              <p className="font-medium text-gray-900 dark:text-white">Manage Images</p>
              <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
                Upload, toggle visibility, delete
              </p>
            </div>
          </Link>

          <Link
            href="/admin/captions"
            className="flex items-center justify-center p-4 border border-gray-200 dark:border-slate-700 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors"
          >
            <div className="text-center">
              <p className="text-2xl mb-2">📝</p>
              <p className="font-medium text-gray-900 dark:text-white">Manage Captions</p>
              <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
                CRUD + analytics
              </p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}

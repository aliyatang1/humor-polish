"use client";

import { useState } from "react";
import {
  getCaptionEngagementMetrics,
  CaptionEngagementMetric,
} from "@/app/actions/admin";

interface CaptionAnalyticsProps {
  initialMetrics: CaptionEngagementMetric[];
  ratingDistribution: {
    five_star: number;
    four_star: number;
    three_star: number;
    two_star: number;
    one_star: number;
    no_votes: number;
  };
}

export default function CaptionAnalytics({
  initialMetrics,
  ratingDistribution,
}: CaptionAnalyticsProps) {
  const [metrics, setMetrics] = useState<CaptionEngagementMetric[]>(initialMetrics);
  const [sortBy, setSortBy] = useState<keyof CaptionEngagementMetric>("total_votes");
  const [filterImageId, setFilterImageId] = useState("");
  const [searchContent, setSearchContent] = useState("");

  const filteredMetrics = metrics
    .filter((m) => !filterImageId || m.image_id === filterImageId)
    .filter((m) =>
      !searchContent || m.content?.toLowerCase().includes(searchContent.toLowerCase())
    )
    .sort((a, b) => {
      const aVal = a[sortBy];
      const bVal = b[sortBy];

      // Handle null values
      if (aVal === null && bVal === null) return 0;
      if (aVal === null) return 1;
      if (bVal === null) return -1;

      if (typeof aVal === "number" && typeof bVal === "number") {
        return bVal - aVal;
      }
      if (typeof aVal === "string" && typeof bVal === "string") {
        return bVal.localeCompare(aVal);
      }
      return 0;
    });

  const getStarRating = (percent: number): string => {
    if (percent > 80) return "⭐⭐⭐⭐⭐";
    if (percent > 60) return "⭐⭐⭐⭐";
    if (percent > 40) return "⭐⭐⭐";
    if (percent > 20) return "⭐⭐";
    return "⭐";
  };

  const totalCaptions = metrics.length;
  const totalDistribution = Object.values(ratingDistribution).reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-6">
      {/* Rating Distribution */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow border border-gray-100 dark:border-slate-700 p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          📊 Rating Distribution
        </h2>
        <div className="space-y-3">
          {[
            { stars: "⭐⭐⭐⭐⭐", label: "5-Star (>80%)", count: ratingDistribution.five_star },
            { stars: "⭐⭐⭐⭐", label: "4-Star (60-80%)", count: ratingDistribution.four_star },
            { stars: "⭐⭐⭐", label: "3-Star (40-60%)", count: ratingDistribution.three_star },
            { stars: "⭐⭐", label: "2-Star (20-40%)", count: ratingDistribution.two_star },
            { stars: "⭐", label: "1-Star (≤20%)", count: ratingDistribution.one_star },
            { stars: "⊘", label: "No Votes", count: ratingDistribution.no_votes },
          ].map((tier) => {
            const percentage =
              totalDistribution > 0
                ? ((tier.count / totalDistribution) * 100).toFixed(1)
                : "0.0";
            return (
              <div key={tier.label} className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1">
                  <span className="text-lg">{tier.stars}</span>
                  <span className="text-sm text-gray-600 dark:text-slate-400 w-24">
                    {tier.label}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-32 h-2 bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 dark:bg-blue-600 transition-all duration-300"
                      style={{
                        width: `${totalDistribution > 0 ? (tier.count / totalDistribution) * 100 : 0}%`,
                      }}
                    />
                  </div>
                  <span className="text-sm font-medium text-gray-900 dark:text-white w-16 text-right">
                    {tier.count} ({percentage}%)
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Engagement Metrics Table */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow border border-gray-100 dark:border-slate-700 p-6">
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            📈 Caption Engagement Metrics
          </h2>

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                Search Content
              </label>
              <input
                type="text"
                placeholder="Search caption content..."
                value={searchContent}
                onChange={(e) => setSearchContent(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-slate-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                Filter by Image ID
              </label>
              <input
                type="text"
                placeholder="Image ID..."
                value={filterImageId}
                onChange={(e) => setFilterImageId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-slate-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                Sort By
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as keyof CaptionEngagementMetric)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
              >
                <option value="total_votes">Total Votes (High to Low)</option>
                <option value="rating_percent">Rating % (High to Low)</option>
                <option value="upvotes">Upvotes (High to Low)</option>
                <option value="downvotes">Downvotes (High to Low)</option>
                <option value="created_datetime_utc">Created Date (Newest)</option>
                <option value="last_vote_datetime_utc">Last Vote (Newest)</option>
              </select>
            </div>
          </div>

          <p className="text-sm text-gray-600 dark:text-slate-400 mb-4">
            Showing {filteredMetrics.length} of {totalCaptions} captions
          </p>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-slate-700">
                <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">
                  Caption
                </th>
                <th className="text-right py-3 px-4 font-semibold text-gray-900 dark:text-white whitespace-nowrap">
                  Votes
                </th>
                <th className="text-right py-3 px-4 font-semibold text-gray-900 dark:text-white whitespace-nowrap">
                  Rating
                </th>
                <th className="text-center py-3 px-4 font-semibold text-gray-900 dark:text-white whitespace-nowrap">
                  Ratio
                </th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white whitespace-nowrap">
                  Last Vote
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredMetrics.length > 0 ? (
                filteredMetrics.map((metric) => (
                  <tr
                    key={metric.id}
                    className="border-b border-gray-100 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors"
                  >
                    <td className="py-3 px-4">
                      <div className="max-w-md">
                        <p className="text-gray-900 dark:text-slate-100 line-clamp-2 font-medium">
                          {metric.content}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
                          Image: {metric.image_id}
                        </p>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right text-gray-900 dark:text-slate-100 font-medium">
                      {metric.total_votes}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <span className="text-gray-900 dark:text-slate-100 font-medium">
                          {metric.rating_percent.toFixed(0)}%
                        </span>
                        <span className="text-lg">{getStarRating(metric.rating_percent)}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="text-xs text-gray-600 dark:text-slate-400 whitespace-nowrap">
                        👍 {metric.upvotes} / 👎 {metric.downvotes}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-xs text-gray-500 dark:text-slate-400 whitespace-nowrap">
                      {metric.last_vote_datetime_utc
                        ? new Date(metric.last_vote_datetime_utc).toLocaleDateString()
                        : "Never"}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-gray-500 dark:text-slate-400">
                    No captions found matching the filters
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

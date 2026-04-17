"use client";

import { useState, useEffect } from "react";
import CaptionAnalytics from "./CaptionAnalytics";
import { CaptionEngagementMetric } from "@/app/actions/admin";
import { getCaptions, createCaption, updateCaption, deleteCaption } from "@/app/actions/admin";

interface CaptionPageProps {
  initialCaptions: any[];
  analyticsData: {
    metrics: CaptionEngagementMetric[];
    ratingDistribution: {
      five_star: number;
      four_star: number;
      three_star: number;
      two_star: number;
      one_star: number;
      no_votes: number;
    };
  };
}

interface CaptionData {
  id: string;
  content: string | null;
  image_id: string;
  created_datetime_utc: string;
  votes: {
    upvotes: number;
    downvotes: number;
  };
}

function ManageCaptions() {
  const [captions, setCaptions] = useState<CaptionData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterImageId, setFilterImageId] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<{ content?: string }>({});
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createData, setCreateData] = useState({ content: "", image_id: "" });
  const [creating, setCreating] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Load captions from server actions
  async function loadCaptions() {
    try {
      setLoading(true);
      const data = await getCaptions();
      setCaptions(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load captions");
    } finally {
      setLoading(false);
    }
  }

  // Load captions on mount
  useEffect(() => {
    loadCaptions();
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!createData.content.trim() || !createData.image_id.trim()) {
      setError("Please enter both caption content and image ID");
      return;
    }

    try {
      setCreating(true);
      setError(null);
      await createCaption(createData.content, createData.image_id);
      setCreateData({ content: "", image_id: "" });
      setShowCreateForm(false);
      loadCaptions();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create caption");
    } finally {
      setCreating(false);
    }
  }

  async function handleUpdate(captionId: string) {
    if (!editData.content?.trim()) {
      setError("Caption content cannot be empty");
      return;
    }

    try {
      setUpdating(true);
      setError(null);
      await updateCaption(captionId, editData.content);
      setEditingId(null);
      setEditData({});
      loadCaptions();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update caption");
    } finally {
      setUpdating(false);
    }
  }

  async function handleDelete(captionId: string) {
    if (!window.confirm("Are you sure you want to delete this caption and its votes?")) {
      return;
    }

    try {
      setDeleting(true);
      setError(null);
      await deleteCaption(captionId);
      loadCaptions();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete caption");
    } finally {
      setDeleting(false);
    }
  }

  const filteredCaptions = captions.filter((caption) => {
    const matchesSearch = (caption.content || "")
      .toLowerCase()
      .includes(search.toLowerCase());
    const matchesImage = !filterImageId || caption.image_id === filterImageId;
    return matchesSearch && matchesImage;
  });

  const uniqueImageIds = Array.from(new Set(captions.map((c) => c.image_id)));

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 text-red-700 dark:text-red-400">
          {error}
        </div>
      )}

      {showCreateForm && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Create New Caption</h2>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                Caption Content
              </label>
              <textarea
                value={createData.content}
                onChange={(e) => setCreateData({ ...createData, content: e.target.value })}
                placeholder="Enter caption text..."
                rows={3}
                className="w-full border border-gray-300 dark:border-slate-600 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white dark:bg-slate-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                Image ID
              </label>
              <input
                type="text"
                value={createData.image_id}
                onChange={(e) => setCreateData({ ...createData, image_id: e.target.value })}
                placeholder="Paste image ID here..."
                className="w-full border border-gray-300 dark:border-slate-600 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white dark:bg-slate-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500"
              />
            </div>
            <div className="flex space-x-2">
              <button
                type="submit"
                disabled={creating}
                className="bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 disabled:opacity-50"
              >
                {creating ? "Creating..." : "Create Caption"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowCreateForm(false);
                  setCreateData({ content: "", image_id: "" });
                }}
                className="bg-gray-300 dark:bg-slate-600 text-gray-700 dark:text-slate-200 px-4 py-2 rounded-lg font-medium hover:bg-gray-400 dark:hover:bg-slate-500"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="flex flex-col md:flex-row gap-4">
        <input
          type="text"
          placeholder="Search captions..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 border border-gray-300 dark:border-slate-600 rounded-lg px-4 py-2 text-sm bg-white dark:bg-slate-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500"
        />
        <select
          value={filterImageId}
          onChange={(e) => setFilterImageId(e.target.value)}
          className="border border-gray-300 dark:border-slate-600 rounded-lg px-4 py-2 text-sm bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
        >
          <option value="">All Images</option>
          {uniqueImageIds.map((id) => (
            <option key={id} value={id}>
              {id.slice(0, 8)}...
            </option>
          ))}
        </select>
        {!showCreateForm && (
          <button
            onClick={() => setShowCreateForm(true)}
            className="bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 whitespace-nowrap"
          >
            + New Caption
          </button>
        )}
        <div className="text-sm text-gray-600 dark:text-slate-400 whitespace-nowrap self-center">
          {filteredCaptions.length} of {captions.length} captions
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-lg shadow border border-gray-100 dark:border-slate-700 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500 dark:text-slate-400">Loading...</div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-slate-700 border-b border-gray-200 dark:border-slate-600">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-700 dark:text-slate-300">Caption</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-700 dark:text-slate-300">Image ID</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-700 dark:text-slate-300">Votes</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-700 dark:text-slate-300">Created</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-700 dark:text-slate-300">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
              {filteredCaptions.map((caption) => (
                <tr key={caption.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/50">
                  <td className="px-6 py-4 text-sm text-gray-900 dark:text-slate-100 max-w-2xl">
                    {editingId === caption.id ? (
                      <textarea
                        value={editData.content ?? caption.content ?? ""}
                        onChange={(e) => setEditData({ ...editData, content: e.target.value })}
                        rows={2}
                        className="w-full border border-gray-300 dark:border-slate-600 rounded px-2 py-1 text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                      />
                    ) : (
                      <p className="line-clamp-2">{caption.content || "(no content)"}</p>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm font-mono text-gray-600 dark:text-slate-400">
                    {caption.image_id.slice(0, 12)}...
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center space-x-1">
                        <span>👍</span>
                        <span className="font-medium text-gray-900 dark:text-slate-100">{caption.votes.upvotes}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <span>👎</span>
                        <span className="font-medium text-gray-900 dark:text-slate-100">{caption.votes.downvotes}</span>
                      </div>
                      <div className="text-gray-500 dark:text-slate-400">
                        ({caption.votes.upvotes + caption.votes.downvotes})
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700 dark:text-slate-300">
                    {new Date(caption.created_datetime_utc).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-sm space-x-2">
                    {editingId === caption.id ? (
                      <>
                        <button
                          onClick={() => handleUpdate(caption.id)}
                          disabled={updating}
                          className="text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 font-medium disabled:opacity-50"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="text-gray-600 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-300"
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => {
                            setEditingId(caption.id);
                            setEditData({ content: caption.content ?? undefined });
                          }}
                          className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(caption.id)}
                          disabled={deleting}
                          className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 font-medium disabled:opacity-50"
                        >
                          Delete
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {filteredCaptions.length === 0 && !loading && (
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-slate-400">
            {search || filterImageId ? "No captions match your filters" : "No captions found"}
          </p>
        </div>
      )}

      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 text-blue-700 dark:text-blue-400 text-sm">
        <p className="font-medium mb-2">📋 Captions</p>
        <p>
          You can now create, edit, and delete captions directly from this interface. Be careful when deleting captions, as associated votes will also be removed.
        </p>
      </div>
    </div>
  );
}

export default function CaptionsPageWrapper({ analyticsData }: CaptionPageProps) {
  const [activeTab, setActiveTab] = useState<"manage" | "analytics">("manage");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Captions</h1>
        <p className="text-gray-600 dark:text-slate-400 mt-2">Manage and analyze captions</p>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-4 border-b border-gray-200 dark:border-slate-700">
        <button
          onClick={() => setActiveTab("manage")}
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${
            activeTab === "manage"
              ? "border-blue-600 text-blue-600 dark:text-blue-400"
              : "border-transparent text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-200"
          }`}
        >
          📝 Manage
        </button>
        <button
          onClick={() => setActiveTab("analytics")}
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${
            activeTab === "analytics"
              ? "border-blue-600 text-blue-600 dark:text-blue-400"
              : "border-transparent text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-200"
          }`}
        >
          📊 Analytics
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === "manage" && <ManageCaptions />}
      {activeTab === "analytics" && (
        <CaptionAnalytics
          initialMetrics={analyticsData.metrics}
          ratingDistribution={analyticsData.ratingDistribution}
        />
      )}
    </div>
  );
}

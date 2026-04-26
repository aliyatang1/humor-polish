"use client";

import { useState, useEffect } from "react";
import {
  getHumorFlavors,
  createHumorFlavor,
  updateHumorFlavor,
  deleteHumorFlavor,
  getHumorFlavorSteps,
  createHumorFlavorStep,
  updateHumorFlavorStep,
  deleteHumorFlavorStep,
  reorderHumorFlavorStep,
  testHumorFlavorOnImage,
  getImages,
  getLLMResponsesByFlavorId,
  duplicateHumorFlavor,
} from "@/app/actions/admin";

interface HumorFlavor {
  id: number;
  created_datetime_utc: string;
  description: string;
  slug: string;
}

interface HumorFlavorStep {
  id: number;
  humor_flavor_id: number;
  created_datetime_utc: string;
  order_by: number;
  llm_temperature: number | null;
  llm_input_type_id: number;
  llm_output_type_id: number;
  llm_model_id: number;
  humor_flavor_step_type_id: number;
  llm_system_prompt: string;
  llm_user_prompt: string;
  description: string | null;
}

interface Image {
  id: string;
  url: string | null;
  created_datetime_utc: string;
}

export default function HumorFlavorsPage() {
  const [flavors, setFlavors] = useState<HumorFlavor[]>([]);
  const [steps, setSteps] = useState<HumorFlavorStep[]>([]);
  const [images, setImages] = useState<Image[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedFlavorId, setSelectedFlavorId] = useState<number | null>(null);

  // Flavor state
  const [editingFlavorId, setEditingFlavorId] = useState<number | null>(null);
  const [editFlavorData, setEditFlavorData] = useState<{ description?: string; slug?: string }>({});
  const [showCreateFlavor, setShowCreateFlavor] = useState(false);
  const [createFlavorData, setCreateFlavorData] = useState({ description: "", slug: "" });
  const [creatingFlavor, setCreatingFlavor] = useState(false);

  // Duplicate state
  const [showDuplicateFlavor, setShowDuplicateFlavor] = useState(false);
  const [duplicateFlavorId, setDuplicateFlavorId] = useState<number | null>(null);
  const [duplicateFlavorData, setDuplicateFlavorData] = useState({ description: "", slug: "" });
  const [duplicatingFlavor, setDuplicatingFlavor] = useState(false);

  // Step state
  const [editingStepId, setEditingStepId] = useState<number | null>(null);
  const [editStepData, setEditStepData] = useState<Partial<HumorFlavorStep>>({});
  const [showCreateStep, setShowCreateStep] = useState(false);
  const [createStepData, setCreateStepData] = useState({
    order_by: 1,
    llm_temperature: 0.7,
    llm_input_type_id: 1,
    llm_output_type_id: 1,
    llm_model_id: 1,
    humor_flavor_step_type_id: 1,
    llm_system_prompt: "",
    llm_user_prompt: "",
    description: "",
  });
  const [creatingStep, setCreatingStep] = useState(false);

  // Test state
  const [selectedTestImageId, setSelectedTestImageId] = useState<string>("");
  const [testingFlavor, setTestingFlavor] = useState(false);
  const [showTestResults, setShowTestResults] = useState(false);
  const [testResults, setTestResults] = useState<any>(null);
  const [testError, setTestError] = useState<string | null>(null);

  // Memes state
  const [flavorMemes, setFlavorMemes] = useState<any[]>([]);
  const [loadingMemes, setLoadingMemes] = useState(false);

  useEffect(() => {
    loadFlavors();
    loadImages();
  }, []);

  async function loadFlavors() {
    try {
      setLoading(true);
      const data = await getHumorFlavors();
      setFlavors(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load flavors");
    } finally {
      setLoading(false);
    }
  }

  async function loadImages() {
    try {
      const data = await getImages();
      setImages(data);
    } catch (err) {
      console.error("Failed to load images:", err);
    }
  }

  async function loadStepsForFlavor(flavorId: number) {
    try {
      const data = await getHumorFlavorSteps(flavorId);
      setSteps(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load steps");
    }
  }

  async function loadMemesForFlavor(flavorId: number) {
    try {
      setLoadingMemes(true);
      const data = await getLLMResponsesByFlavorId(flavorId);
      setFlavorMemes(data);
    } catch (err) {
      console.error("Failed to load memes:", err);
    } finally {
      setLoadingMemes(false);
    }
  }

  // Flavor handlers
  async function handleCreateFlavor(e: React.FormEvent) {
    e.preventDefault();
    if (!createFlavorData.description.trim() || !createFlavorData.slug.trim()) {
      setError("Please fill in all flavor fields");
      return;
    }

    try {
      setCreatingFlavor(true);
      setError(null);
      await createHumorFlavor(createFlavorData.description, createFlavorData.slug);
      setCreateFlavorData({ description: "", slug: "" });
      setShowCreateFlavor(false);
      loadFlavors();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create flavor");
    } finally {
      setCreatingFlavor(false);
    }
  }

  async function handleUpdateFlavor(flavorId: number) {
    if (!editFlavorData.description?.trim() || !editFlavorData.slug?.trim()) {
      setError("Please fill in all flavor fields");
      return;
    }

    try {
      setError(null);
      await updateHumorFlavor(flavorId, editFlavorData.description!, editFlavorData.slug!);
      setEditingFlavorId(null);
      setEditFlavorData({});
      loadFlavors();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update flavor");
    }
  }

  async function handleDeleteFlavor(flavorId: number) {
    if (!window.confirm("Delete this flavor and all its steps?")) return;

    try {
      setError(null);
      await deleteHumorFlavor(flavorId);
      setSelectedFlavorId(null);
      setSteps([]);
      loadFlavors();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete flavor");
    }
  }

  async function handleDuplicateFlavor(e: React.FormEvent) {
    e.preventDefault();
    if (!duplicateFlavorId || !duplicateFlavorData.description.trim() || !duplicateFlavorData.slug.trim()) {
      setError("Please fill in all duplicate flavor fields");
      return;
    }

    try {
      setDuplicatingFlavor(true);
      setError(null);
      await duplicateHumorFlavor(duplicateFlavorId, duplicateFlavorData.slug, duplicateFlavorData.description);
      setDuplicateFlavorData({ description: "", slug: "" });
      setShowDuplicateFlavor(false);
      setDuplicateFlavorId(null);
      loadFlavors();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to duplicate flavor");
    } finally {
      setDuplicatingFlavor(false);
    }
  }

  // Step handlers
  async function handleCreateStep(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedFlavorId || !createStepData.llm_system_prompt.trim() || !createStepData.llm_user_prompt.trim()) {
      setError("Please fill in required step fields");
      return;
    }

    try {
      setCreatingStep(true);
      setError(null);
      await createHumorFlavorStep(
        selectedFlavorId,
        createStepData.order_by,
        createStepData.llm_temperature,
        createStepData.llm_input_type_id,
        createStepData.llm_output_type_id,
        createStepData.llm_model_id,
        createStepData.humor_flavor_step_type_id,
        createStepData.llm_system_prompt,
        createStepData.llm_user_prompt,
        createStepData.description || null
      );
      setCreateStepData({
        order_by: 1,
        llm_temperature: 0.7,
        llm_input_type_id: 1,
        llm_output_type_id: 1,
        llm_model_id: 1,
        humor_flavor_step_type_id: 1,
        llm_system_prompt: "",
        llm_user_prompt: "",
        description: "",
      });
      setShowCreateStep(false);
      loadStepsForFlavor(selectedFlavorId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create step");
    } finally {
      setCreatingStep(false);
    }
  }

  async function handleUpdateStep(stepId: number) {
    if (!editStepData.llm_system_prompt?.trim() || !editStepData.llm_user_prompt?.trim()) {
      setError("Please fill in required step fields");
      return;
    }

    try {
      setError(null);
      const step = steps.find((s) => s.id === stepId)!;
      await updateHumorFlavorStep(
        stepId,
        editStepData.order_by ?? step.order_by,
        editStepData.llm_temperature ?? step.llm_temperature,
        editStepData.llm_input_type_id ?? step.llm_input_type_id,
        editStepData.llm_output_type_id ?? step.llm_output_type_id,
        editStepData.llm_model_id ?? step.llm_model_id,
        editStepData.humor_flavor_step_type_id ?? step.humor_flavor_step_type_id,
        editStepData.llm_system_prompt,
        editStepData.llm_user_prompt,
        editStepData.description ?? step.description
      );
      setEditingStepId(null);
      setEditStepData({});
      if (selectedFlavorId) loadStepsForFlavor(selectedFlavorId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update step");
    }
  }

  async function handleDeleteStep(stepId: number) {
    if (!window.confirm("Delete this step?")) return;

    try {
      setError(null);
      await deleteHumorFlavorStep(stepId);
      if (selectedFlavorId) loadStepsForFlavor(selectedFlavorId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete step");
    }
  }

  async function handleMoveStepUp(step: HumorFlavorStep) {
    if (step.order_by <= 1) return;
    try {
      setError(null);
      await reorderHumorFlavorStep(step.id, step.order_by - 1);
      if (selectedFlavorId) loadStepsForFlavor(selectedFlavorId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to move step");
    }
  }

  async function handleMoveStepDown(step: HumorFlavorStep) {
    try {
      setError(null);
      await reorderHumorFlavorStep(step.id, step.order_by + 1);
      if (selectedFlavorId) loadStepsForFlavor(selectedFlavorId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to move step");
    }
  }

  async function handleTestFlavor() {
    if (!selectedFlavorId || !selectedTestImageId) {
      setTestError("Please select a flavor and image");
      return;
    }

    try {
      setTestingFlavor(true);
      setTestError(null);
      const result = await testHumorFlavorOnImage(selectedFlavorId, selectedTestImageId);
      if (result.success) {
        setTestResults(result.data);
        setShowTestResults(true);
      } else {
        setTestError(result.error || "Failed to test flavor");
      }
    } catch (err) {
      setTestError(err instanceof Error ? err.message : "Failed to test flavor");
    } finally {
      setTestingFlavor(false);
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Humor Flavors</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">Manage humor flavor configurations and processing steps</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 text-red-700 dark:text-red-200">
          {error}
        </div>
      )}

      {/* FLAVORS SECTION */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Flavors</h2>
          {!showCreateFlavor && (
            <button
              onClick={() => setShowCreateFlavor(true)}
              className="bg-green-600 dark:bg-green-700 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 dark:hover:bg-green-600"
            >
              + New Flavor
            </button>
          )}
        </div>

        {showCreateFlavor && (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
            <form onSubmit={handleCreateFlavor} className="space-y-3">
              <input
                type="text"
                placeholder="Slug (e.g., pov-pov-pov)"
                value={createFlavorData.slug}
                onChange={(e) => setCreateFlavorData({ ...createFlavorData, slug: e.target.value })}
                className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
              <textarea
                placeholder="Description"
                value={createFlavorData.description}
                onChange={(e) => setCreateFlavorData({ ...createFlavorData, description: e.target.value })}
                rows={2}
                className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
              <div className="flex space-x-2">
                <button
                  type="submit"
                  disabled={creatingFlavor}
                  className="bg-green-600 dark:bg-green-700 text-white px-3 py-2 rounded text-sm font-medium hover:bg-green-700 dark:hover:bg-green-600 disabled:opacity-50"
                >
                  {creatingFlavor ? "Creating..." : "Create"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateFlavor(false);
                    setCreateFlavorData({ description: "", slug: "" });
                  }}
                  className="bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-200 px-3 py-2 rounded text-sm font-medium hover:bg-gray-400 dark:hover:bg-gray-500"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {showDuplicateFlavor && (
          <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Duplicate Flavor</h3>
            <form onSubmit={handleDuplicateFlavor} className="space-y-3">
              <input
                type="text"
                placeholder="New Slug (must be unique)"
                value={duplicateFlavorData.slug}
                onChange={(e) => setDuplicateFlavorData({ ...duplicateFlavorData, slug: e.target.value })}
                className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
              <textarea
                placeholder="New Description"
                value={duplicateFlavorData.description}
                onChange={(e) => setDuplicateFlavorData({ ...duplicateFlavorData, description: e.target.value })}
                rows={2}
                className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
              <div className="flex space-x-2">
                <button
                  type="submit"
                  disabled={duplicatingFlavor}
                  className="bg-orange-600 dark:bg-orange-700 text-white px-3 py-2 rounded text-sm font-medium hover:bg-orange-700 dark:hover:bg-orange-600 disabled:opacity-50"
                >
                  {duplicatingFlavor ? "Duplicating..." : "Duplicate"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowDuplicateFlavor(false);
                    setDuplicateFlavorData({ description: "", slug: "" });
                    setDuplicateFlavorId(null);
                  }}
                  className="bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-200 px-3 py-2 rounded text-sm font-medium hover:bg-gray-400 dark:hover:bg-gray-500"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-100 dark:border-gray-700 overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-gray-500 dark:text-gray-400">Loading...</div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300">Slug</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300">Description</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300">Created</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {flavors.map((flavor) => (
                  <tr key={flavor.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer">
                    <td className="px-6 py-4 text-sm font-mono text-gray-900 dark:text-white">
                      {editingFlavorId === flavor.id ? (
                        <input
                          type="text"
                          value={editFlavorData.slug ?? flavor.slug}
                          onChange={(e) => setEditFlavorData({ ...editFlavorData, slug: e.target.value })}
                          className="border border-gray-300 dark:border-gray-600 rounded px-2 py-1 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        />
                      ) : (
                        flavor.slug
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                      {editingFlavorId === flavor.id ? (
                        <textarea
                          value={editFlavorData.description ?? flavor.description}
                          onChange={(e) => setEditFlavorData({ ...editFlavorData, description: e.target.value })}
                          rows={2}
                          className="w-full border border-gray-300 dark:border-gray-600 rounded px-2 py-1 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        />
                      ) : (
                        flavor.description
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                      {new Date(flavor.created_datetime_utc).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-sm space-x-2">
                      {editingFlavorId === flavor.id ? (
                        <>
                          <button
                            onClick={() => handleUpdateFlavor(flavor.id)}
                            className="text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 font-medium text-xs"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditingFlavorId(null)}
                            className="text-gray-600 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 text-xs"
                          >
                            Cancel
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingFlavorId(flavor.id);
                              setEditFlavorData({ description: flavor.description, slug: flavor.slug });
                            }}
                            className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium text-xs"
                          >
                            Edit
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedFlavorId(flavor.id);
                              loadStepsForFlavor(flavor.id);
                              loadMemesForFlavor(flavor.id);
                            }}
                            className="text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 font-medium text-xs"
                          >
                            View Steps
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setDuplicateFlavorId(flavor.id);
                              setDuplicateFlavorData({ description: `Copy of ${flavor.description}`, slug: `${flavor.slug}-copy` });
                              setShowDuplicateFlavor(true);
                            }}
                            className="text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 font-medium text-xs"
                          >
                            Duplicate
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteFlavor(flavor.id);
                            }}
                            className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 font-medium text-xs"
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
      </div>

      {/* STEPS SECTION */}
      {selectedFlavorId && (
        <div className="space-y-4 border-t border-gray-200 dark:border-gray-700 pt-8">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
              Steps for {flavors.find((f) => f.id === selectedFlavorId)?.slug}
            </h2>
            {!showCreateStep && (
              <button
                onClick={() => setShowCreateStep(true)}
                className="bg-blue-600 dark:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 dark:hover:bg-blue-600"
              >
                + New Step
              </button>
            )}
          </div>

          {showCreateStep && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <form onSubmit={handleCreateStep} className="space-y-3 text-sm">
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="number"
                    placeholder="Order"
                    value={createStepData.order_by}
                    onChange={(e) => setCreateStepData({ ...createStepData, order_by: parseInt(e.target.value) })}
                    className="border border-gray-300 dark:border-gray-600 rounded px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                  <input
                    type="number"
                    step="0.1"
                    placeholder="Temperature"
                    value={createStepData.llm_temperature}
                    onChange={(e) => setCreateStepData({ ...createStepData, llm_temperature: parseFloat(e.target.value) })}
                    className="border border-gray-300 dark:border-gray-600 rounded px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <textarea
                  placeholder="System Prompt (required)"
                  value={createStepData.llm_system_prompt}
                  onChange={(e) => setCreateStepData({ ...createStepData, llm_system_prompt: e.target.value })}
                  rows={3}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
                <textarea
                  placeholder="User Prompt (required)"
                  value={createStepData.llm_user_prompt}
                  onChange={(e) => setCreateStepData({ ...createStepData, llm_user_prompt: e.target.value })}
                  rows={3}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
                <textarea
                  placeholder="Description (optional)"
                  value={createStepData.description}
                  onChange={(e) => setCreateStepData({ ...createStepData, description: e.target.value })}
                  rows={2}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
                <div className="flex space-x-2">
                  <button
                    type="submit"
                    disabled={creatingStep}
                    className="bg-blue-600 dark:bg-blue-700 text-white px-3 py-2 rounded text-sm font-medium hover:bg-blue-700 dark:hover:bg-blue-600 disabled:opacity-50"
                  >
                    {creatingStep ? "Creating..." : "Create"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCreateStep(false)}
                    className="bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-200 px-3 py-2 rounded text-sm font-medium hover:bg-gray-400 dark:hover:bg-gray-500"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-100 dark:border-gray-700 overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300 w-12">Order</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300 w-16">Temp</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300 w-20">Type IDs</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300">System Prompt</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300">User Prompt</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300">Desc</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {steps.map((step) => (
                  <tr key={step.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 text-xs font-mono text-gray-900 dark:text-white">
                      {editingStepId === step.id ? (
                        <input
                          type="number"
                          value={editStepData.order_by ?? step.order_by}
                          onChange={(e) => setEditStepData({ ...editStepData, order_by: parseInt(e.target.value) })}
                          className="w-12 border border-gray-300 dark:border-gray-600 rounded px-2 py-1 text-xs bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        />
                      ) : (
                        step.order_by
                      )}
                    </td>
                    <td className="px-6 py-4 text-xs text-gray-900 dark:text-white">
                      {editingStepId === step.id ? (
                        <input
                          type="number"
                          step="0.1"
                          value={editStepData.llm_temperature ?? step.llm_temperature ?? 0.7}
                          onChange={(e) => setEditStepData({ ...editStepData, llm_temperature: parseFloat(e.target.value) })}
                          className="w-16 border border-gray-300 dark:border-gray-600 rounded px-2 py-1 text-xs bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        />
                      ) : (
                        step.llm_temperature?.toFixed(2)
                      )}
                    </td>
                    <td className="px-6 py-4 text-xs font-mono text-gray-600 dark:text-gray-400">
                      {step.llm_input_type_id}/{step.llm_output_type_id}/{step.llm_model_id}/{step.humor_flavor_step_type_id}
                    </td>
                    <td className="px-6 py-4 text-xs max-w-xs text-gray-900 dark:text-gray-100">
                      {editingStepId === step.id ? (
                        <textarea
                          value={editStepData.llm_system_prompt ?? step.llm_system_prompt}
                          onChange={(e) => setEditStepData({ ...editStepData, llm_system_prompt: e.target.value })}
                          rows={2}
                          className="w-full border border-gray-300 dark:border-gray-600 rounded px-2 py-1 text-xs bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        />
                      ) : (
                        <p className="line-clamp-2">{step.llm_system_prompt}</p>
                      )}
                    </td>
                    <td className="px-6 py-4 text-xs max-w-xs text-gray-900 dark:text-gray-100">
                      {editingStepId === step.id ? (
                        <textarea
                          value={editStepData.llm_user_prompt ?? step.llm_user_prompt}
                          onChange={(e) => setEditStepData({ ...editStepData, llm_user_prompt: e.target.value })}
                          rows={2}
                          className="w-full border border-gray-300 dark:border-gray-600 rounded px-2 py-1 text-xs bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        />
                      ) : (
                        <p className="line-clamp-2">{step.llm_user_prompt}</p>
                      )}
                    </td>
                    <td className="px-6 py-4 text-xs max-w-xs text-gray-900 dark:text-gray-100">
                      {editingStepId === step.id ? (
                        <textarea
                          value={editStepData.description ?? step.description ?? ""}
                          onChange={(e) => setEditStepData({ ...editStepData, description: e.target.value })}
                          rows={1}
                          className="w-full border border-gray-300 dark:border-gray-600 rounded px-2 py-1 text-xs bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        />
                      ) : (
                        step.description && <p className="line-clamp-2">{step.description}</p>
                      )}
                    </td>
                    <td className="px-6 py-4 text-xs space-x-1">
                      {editingStepId === step.id ? (
                        <>
                          <button
                            onClick={() => handleUpdateStep(step.id)}
                            className="text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 font-medium"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditingStepId(null)}
                            className="text-gray-600 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                          >
                            Cancel
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => handleMoveStepUp(step)}
                            className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium"
                            title="Move up"
                          >
                            ↑
                          </button>
                          <button
                            onClick={() => handleMoveStepDown(step)}
                            className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium"
                            title="Move down"
                          >
                            ↓
                          </button>
                          <button
                            onClick={() => {
                              setEditingStepId(step.id);
                              setEditStepData({ ...step });
                            }}
                            className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteStep(step.id)}
                            className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 font-medium"
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
          </div>

          {steps.length === 0 && (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              No steps created for this flavor yet
            </div>
          )}

          {/* MEMES SECTION */}
          <div className="space-y-4 border-t border-gray-200 dark:border-gray-700 pt-8">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
              Memes Generated with this Flavor
            </h3>
            {loadingMemes ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">Loading memes...</div>
            ) : flavorMemes.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                No memes generated with this flavor yet
              </div>
            ) : (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-100 dark:border-gray-700 overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                    <tr>
                      <th className="px-6 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300">ID</th>
                      <th className="px-6 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300">Created</th>
                      <th className="px-6 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300">Response</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {flavorMemes.map((meme) => (
                      <tr key={meme.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-6 py-4 text-sm font-mono text-gray-900 dark:text-white">{meme.id}</td>
                        <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                          {new Date(meme.created_datetime_utc).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-xs max-w-lg">
                          <pre className="bg-gray-100 dark:bg-gray-900 p-2 rounded overflow-auto text-gray-800 dark:text-gray-200 border border-gray-300 dark:border-gray-700 max-h-40">
                            {JSON.stringify(meme.llm_model_response, null, 2)}
                          </pre>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* TEST SECTION */}
          {steps.length > 0 && (
            <div className="space-y-4 border-t border-gray-200 dark:border-gray-700 pt-8">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Test Humor Flavor</h3>
              </div>

              {testError && (
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 text-yellow-700 dark:text-yellow-200">
                  {testError}
                </div>
              )}

              <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-100 dark:border-gray-700 p-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Select Test Image
                  </label>
                  <select
                    value={selectedTestImageId}
                    onChange={(e) => setSelectedTestImageId(e.target.value)}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="">-- Choose an image --</option>
                    {images.filter((img) => img.url).map((img) => (
                      <option key={img.id} value={img.id}>
                        {img.url!.substring(img.url!.lastIndexOf('/') + 1)} (ID: {img.id})
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  onClick={handleTestFlavor}
                  disabled={testingFlavor || !selectedTestImageId}
                  className="w-full bg-purple-600 dark:bg-purple-700 hover:bg-purple-700 dark:hover:bg-purple-600 disabled:opacity-50 text-white px-4 py-2 rounded-lg font-medium transition"
                >
                  {testingFlavor ? "Testing..." : "Test Humor Flavor"}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* RESULTS MODAL */}
      {showTestResults && testResults && (
        <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg max-w-2xl w-full max-h-[90vh] overflow-auto">
            <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Test Results</h2>
              <button
                onClick={() => setShowTestResults(false)}
                className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 text-2xl"
              >
                ✕
              </button>
            </div>
            <div className="p-6">
              <pre className="bg-gray-100 dark:bg-gray-900 p-4 rounded overflow-auto text-xs text-gray-800 dark:text-gray-200 border border-gray-300 dark:border-gray-700">
                {JSON.stringify(testResults, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

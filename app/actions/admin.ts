"use server";

import { requireSuperadmin, createSupabaseServerClient } from "@/lib/supabase/server";

// Dashboard Stats
export async function getAdminDashboardStats() {
  await requireSuperadmin();
  const supabase = await createSupabaseServerClient();

  // Total votes all-time
  const { count: totalVotes } = await supabase
    .from("caption_votes")
    .select("*", { count: "exact" });

  // Total votes this week
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const { count: weekVotes } = await supabase
    .from("caption_votes")
    .select("*", { count: "exact" })
    .gte("created_datetime_utc", weekAgo.toISOString());

  // Get all captions with vote counts
  const { data: allCaptions } = await supabase
    .from("captions")
    .select("id, content");

  const { data: allVotes } = await supabase
    .from("caption_votes")
    .select("caption_id, vote_value, created_datetime_utc");

  // Compute vote counts per caption
  const votesByCaption = new Map<
    string,
    { upvotes: number; downvotes: number; total: number; latest: string }
  >();

  allVotes?.forEach((vote: any) => {
    if (!votesByCaption.has(vote.caption_id)) {
      votesByCaption.set(vote.caption_id, {
        upvotes: 0,
        downvotes: 0,
        total: 0,
        latest: vote.created_datetime_utc,
      });
    }
    const current = votesByCaption.get(vote.caption_id)!;
    if (vote.vote_value === 1) {
      current.upvotes++;
    } else {
      current.downvotes++;
    }
    current.total++;
    current.latest = vote.created_datetime_utc;
  });

  // Top voted captions
  const topCaptions = (allCaptions || [])
    .map((cap: any) => {
      const votes = votesByCaption.get(cap.id);
      return {
        id: cap.id,
        content: cap.content,
        total_votes: votes?.total || 0,
      };
    })
    .sort((a, b) => b.total_votes - a.total_votes)
    .slice(0, 5);

  // Trending captions (newest with high votes)
  const trendingCaptions = (allCaptions || [])
    .map((cap: any) => {
      const votes = votesByCaption.get(cap.id);
      return {
        id: cap.id,
        content: cap.content,
        recent_votes: votes?.total || 0,
      };
    })
    .sort((a, b) => b.recent_votes - a.recent_votes)
    .slice(0, 5);

  // Active voters this week
  const weekAgoActiveVoters = new Date();
  weekAgoActiveVoters.setDate(weekAgoActiveVoters.getDate() - 7);
  const { data: voterData } = await supabase
    .from("caption_votes")
    .select("profile_id")
    .gte("created_datetime_utc", weekAgoActiveVoters.toISOString());

  const activeVotersCount = new Set(
    voterData?.map((v: any) => v.profile_id) || []
  ).size;

  // Total images
  const { count: totalImages } = await supabase
    .from("images")
    .select("*", { count: "exact" });

  // Total captions
  const { count: totalCaptions } = await supabase
    .from("captions")
    .select("*", { count: "exact" });

  // Total users
  const { count: totalUsers } = await supabase
    .from("profiles")
    .select("*", { count: "exact" });

  return {
    totalVotes: totalVotes || 0,
    weekVotes: weekVotes || 0,
    totalImages: totalImages || 0,
    totalCaptions: totalCaptions || 0,
    totalUsers: totalUsers || 0,
    activeVotersThisWeek: activeVotersCount,
    topCaptions,
    trendingCaptions,
  };
}

// User Management
export async function getUsers() {
  await requireSuperadmin();
  const supabase = await createSupabaseServerClient();

  const { data: users, error } = await supabase
    .from("profiles")
    .select("id, email, is_superadmin, created_datetime_utc")
    .order("created_datetime_utc", { ascending: false });

  if (error) throw error;
  return users || [];
}

export async function updateUser(
  userId: string,
  updates: {
    is_superadmin?: boolean;
  }
) {
  const { user } = await requireSuperadmin();
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("profiles")
    .update({ ...updates, modified_by_user_id: user.id })
    .eq("id", userId)
    .select();

  if (error) throw error;
  return data?.[0] || null;
}

export async function deleteUser(userId: string) {
  await requireSuperadmin();
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase
    .from("profiles")
    .delete()
    .eq("id", userId);

  if (error) throw error;
  return true;
}

// Image Management
export async function getImages() {
  await requireSuperadmin();
  const supabase = await createSupabaseServerClient();

  const { data: images, error } = await supabase
    .from("images")
    .select("id, url, is_public, created_datetime_utc")
    .order("created_datetime_utc", { ascending: false });

  if (error) throw error;

  // Get caption counts for each image
  const { data: captionCounts } = await supabase
    .from("captions")
    .select("image_id");

  const countMap = new Map<string, number>();
  captionCounts?.forEach((row: any) => {
    countMap.set(row.image_id, (countMap.get(row.image_id) || 0) + 1);
  });

  return (images || []).map((img: any) => ({
    ...img,
    captionCount: countMap.get(img.id) || 0,
  }));
}

export async function updateImagePublic(
  imageId: string,
  isPublic: boolean
) {
  const { user } = await requireSuperadmin();
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("images")
    .update({ is_public: isPublic, modified_by_user_id: user.id })
    .eq("id", imageId)
    .select();

  if (error) throw error;
  return data?.[0] || null;
}

export async function deleteImage(imageId: string) {
  await requireSuperadmin();
  const supabase = await createSupabaseServerClient();

  // Delete captions first (cascade)
  const { error: captionError } = await supabase
    .from("captions")
    .delete()
    .eq("image_id", imageId);

  if (captionError) throw captionError;

  // Then delete image
  const { error: imageError } = await supabase
    .from("images")
    .delete()
    .eq("id", imageId);

  if (imageError) throw imageError;
  return true;
}

// Image Upload Management
export async function uploadImage(
  imageUrl: string,
  isPublic: boolean = false
) {
  const { user } = await requireSuperadmin();
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("images")
    .insert([
      {
        url: imageUrl,
        is_public: isPublic,
        created_by_user_id: user.id,
        modified_by_user_id: user.id,
      },
    ])
    .select();

  if (error) throw error;
  return data?.[0] || null;
}

// Caption Management
export async function getCaptions() {
  await requireSuperadmin();
  const supabase = await createSupabaseServerClient();

  const { data: captions, error } = await supabase
    .from("captions")
    .select("id, content, image_id, created_datetime_utc")
    .order("created_datetime_utc", { ascending: false });

  if (error) throw error;

  // Get vote counts for each caption
  const { data: voteCounts } = await supabase
    .from("caption_votes")
    .select("caption_id, vote_value");

  const voteMap = new Map<string, { upvotes: number; downvotes: number }>();
  voteCounts?.forEach((vote: any) => {
    if (!voteMap.has(vote.caption_id)) {
      voteMap.set(vote.caption_id, { upvotes: 0, downvotes: 0 });
    }
    if (vote.vote_value === 1) {
      voteMap.get(vote.caption_id)!.upvotes++;
    } else {
      voteMap.get(vote.caption_id)!.downvotes++;
    }
  });

  return (captions || []).map((cap: any) => ({
    ...cap,
    votes: voteMap.get(cap.id) || { upvotes: 0, downvotes: 0 },
  }));
}

export async function createCaption(
  content: string,
  image_id: string
) {
  const { user } = await requireSuperadmin();
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("captions")
    .insert([
      {
        content,
        image_id,
        created_by_user_id: user.id,
        modified_by_user_id: user.id,
      },
    ])
    .select();

  if (error) throw error;
  return data?.[0] || null;
}

export async function updateCaption(
  id: string,
  content: string
) {
  const { user } = await requireSuperadmin();
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("captions")
    .update({ content, modified_by_user_id: user.id })
    .eq("id", id)
    .select();

  if (error) throw error;
  return data?.[0] || null;
}

export async function deleteCaption(id: string) {
  await requireSuperadmin();
  const supabase = await createSupabaseServerClient();

  // Delete votes first (cascade)
  const { error: voteError } = await supabase
    .from("caption_votes")
    .delete()
    .eq("caption_id", id);

  if (voteError) throw voteError;

  // Then delete caption
  const { error: captionError } = await supabase
    .from("captions")
    .delete()
    .eq("id", id);

  if (captionError) throw captionError;
  return true;
}

// Humor Flavors Management
export async function getHumorFlavors() {
  await requireSuperadmin();
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("humor_flavors")
    .select("id, created_datetime_utc, description, slug")
    .order("created_datetime_utc", { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function createHumorFlavor(
  description: string,
  slug: string
) {
  await requireSuperadmin();
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("humor_flavors")
    .insert([
      {
        description,
        slug,
        created_datetime_utc: new Date().toISOString(),
      },
    ])
    .select();

  if (error) throw error;
  return data?.[0] || null;
}

export async function updateHumorFlavor(
  id: number,
  description: string,
  slug: string
) {
  await requireSuperadmin();
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("humor_flavors")
    .update({ description, slug })
    .eq("id", id)
    .select();

  if (error) throw error;
  return data?.[0] || null;
}

export async function deleteHumorFlavor(id: number) {
  await requireSuperadmin();
  const supabase = await createSupabaseServerClient();

  // Delete flavor steps first (cascade)
  const { error: stepsError } = await supabase
    .from("humor_flavor_steps")
    .delete()
    .eq("humor_flavor_id", id);

  if (stepsError) throw stepsError;

  // Then delete flavor
  const { error: flavorError } = await supabase
    .from("humor_flavors")
    .delete()
    .eq("id", id);

  if (flavorError) throw flavorError;
  return true;
}

// Humor Flavor Steps Management
export async function getHumorFlavorSteps(flavorId: number) {
  await requireSuperadmin();
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("humor_flavor_steps")
    .select("*")
    .eq("humor_flavor_id", flavorId)
    .order("order_by", { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function createHumorFlavorStep(
  humorFlavorId: number,
  orderBy: number,
  llmTemperature: number | null,
  llmInputTypeId: number,
  llmOutputTypeId: number,
  llmModelId: number,
  humorFlavorStepTypeId: number,
  llmSystemPrompt: string,
  llmUserPrompt: string,
  description: string | null
) {
  await requireSuperadmin();
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("humor_flavor_steps")
    .insert([
      {
        humor_flavor_id: humorFlavorId,
        order_by: orderBy,
        llm_temperature: llmTemperature,
        llm_input_type_id: llmInputTypeId,
        llm_output_type_id: llmOutputTypeId,
        llm_model_id: llmModelId,
        humor_flavor_step_type_id: humorFlavorStepTypeId,
        llm_system_prompt: llmSystemPrompt,
        llm_user_prompt: llmUserPrompt,
        description,
        created_datetime_utc: new Date().toISOString(),
      },
    ])
    .select();

  if (error) throw error;
  return data?.[0] || null;
}

export async function updateHumorFlavorStep(
  id: number,
  orderBy: number,
  llmTemperature: number | null,
  llmInputTypeId: number,
  llmOutputTypeId: number,
  llmModelId: number,
  humorFlavorStepTypeId: number,
  llmSystemPrompt: string,
  llmUserPrompt: string,
  description: string | null
) {
  await requireSuperadmin();
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("humor_flavor_steps")
    .update({
      order_by: orderBy,
      llm_temperature: llmTemperature,
      llm_input_type_id: llmInputTypeId,
      llm_output_type_id: llmOutputTypeId,
      llm_model_id: llmModelId,
      humor_flavor_step_type_id: humorFlavorStepTypeId,
      llm_system_prompt: llmSystemPrompt,
      llm_user_prompt: llmUserPrompt,
      description,
    })
    .eq("id", id)
    .select();

  if (error) throw error;
  return data?.[0] || null;
}

export async function deleteHumorFlavorStep(id: number) {
  await requireSuperadmin();
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase
    .from("humor_flavor_steps")
    .delete()
    .eq("id", id);

  if (error) throw error;
  return true;
}

// LLM Prompt Chains Management
export async function getLLMPromptChains() {
  await requireSuperadmin();
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("llm_prompt_chains")
    .select("id, created_datetime_utc, caption_request_id")
    .order("created_datetime_utc", { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function createLLMPromptChain(
  captionRequestId: number
) {
  const { user } = await requireSuperadmin();
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("llm_prompt_chains")
    .insert([
      {
        caption_request_id: captionRequestId,
        created_by_user_id: user.id,
        modified_by_user_id: user.id,
      },
    ])
    .select();

  if (error) throw error;
  return data?.[0] || null;
}

export async function updateLLMPromptChain(
  id: number,
  captionRequestId: number
) {
  const { user } = await requireSuperadmin();
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("llm_prompt_chains")
    .update({ caption_request_id: captionRequestId, modified_by_user_id: user.id })
    .eq("id", id)
    .select();

  if (error) throw error;
  return data?.[0] || null;
}

export async function deleteLLMPromptChain(id: number) {
  await requireSuperadmin();
  const supabase = await createSupabaseServerClient();

  // Delete responses first (cascade)
  const { error: responsesError } = await supabase
    .from("llm_model_responses")
    .delete()
    .eq("llm_prompt_chain_id", id);

  if (responsesError) throw responsesError;

  // Then delete chain
  const { error: chainError } = await supabase
    .from("llm_prompt_chains")
    .delete()
    .eq("id", id);

  if (chainError) throw chainError;
  return true;
}

// Reorder Humor Flavor Step
export async function reorderHumorFlavorStep(
  stepId: number,
  newOrderBy: number
) {
  await requireSuperadmin();
  const supabase = await createSupabaseServerClient();

  // Get the step to find its current order and flavor
  const { data: stepData, error: stepError } = await supabase
    .from("humor_flavor_steps")
    .select("*")
    .eq("id", stepId)
    .single();

  if (stepError) throw stepError;
  if (!stepData) throw new Error("Step not found");

  const oldOrderBy = stepData.order_by;
  const flavorId = stepData.humor_flavor_id;

  // Get all steps for this flavor
  const { data: allSteps, error: allStepsError } = await supabase
    .from("humor_flavor_steps")
    .select("*")
    .eq("humor_flavor_id", flavorId)
    .order("order_by", { ascending: true });

  if (allStepsError) throw allStepsError;

  // Adjust order_by for affected steps
  const updates = [];

  if (oldOrderBy < newOrderBy) {
    // Moving step down: decrement order_by for steps between old and new position
    for (const step of allSteps!) {
      if (step.id !== stepId && step.order_by > oldOrderBy && step.order_by <= newOrderBy) {
        updates.push({
          id: step.id,
          order_by: step.order_by - 1,
        });
      }
    }
  } else if (oldOrderBy > newOrderBy) {
    // Moving step up: increment order_by for steps between new and old position
    for (const step of allSteps!) {
      if (step.id !== stepId && step.order_by >= newOrderBy && step.order_by < oldOrderBy) {
        updates.push({
          id: step.id,
          order_by: step.order_by + 1,
        });
      }
    }
  }

  // Update the target step
  const { error: updateError } = await supabase
    .from("humor_flavor_steps")
    .update({ order_by: newOrderBy })
    .eq("id", stepId);

  if (updateError) throw updateError;

  // Update affected steps
  for (const update of updates) {
    const { error } = await supabase
      .from("humor_flavor_steps")
      .update({ order_by: update.order_by })
      .eq("id", update.id);

    if (error) throw error;
  }

  return true;
}

// Test Humor Flavor on Image
export async function testHumorFlavorOnImage(
  humorFlavorId: number,
  imageId: string
) {
  const { user } = await requireSuperadmin();
  const supabase = await createSupabaseServerClient();

  // Get all steps for this flavor
  const { data: steps, error: stepsError } = await supabase
    .from("humor_flavor_steps")
    .select("*")
    .eq("humor_flavor_id", humorFlavorId)
    .order("order_by", { ascending: true });

  if (stepsError) throw stepsError;
  if (!steps || steps.length === 0) throw new Error("No steps found for this flavor");

  // Get auth token
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.access_token) {
    throw new Error("Failed to get authentication token");
  }

  const token = session.access_token;

  // Call REST API to generate captions with the flavor
  const API_BASE_URL = "https://api.almostcrackd.ai";
  
  try {
    const response = await fetch(`${API_BASE_URL}/pipeline/generate-captions`, {
      method: "POST",
      cache: "no-store",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ imageId, humorFlavorId }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`API Error (${response.status}):`, errorText);
      throw new Error(`API call failed: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();

    // Store the result in llm_model_responses
    const { error: insertError } = await supabase
      .from("llm_model_responses")
      .insert([
        {
          llm_model_response: result,
          humor_flavor_id: humorFlavorId,
          humor_flavor_step_id: steps[steps.length - 1]?.id, // Use the last step
          processing_time_seconds: result.processing_time_seconds || 0,
          llm_model_id: 1,
          profile_id: user.id,
          created_by_user_id: user.id,
          modified_by_user_id: user.id,
        },
      ]);

    if (insertError) {
      console.error("Warning: Failed to store test result:", insertError.message);
      // Don't throw - still return the result to the user
    }

    return {
      success: true,
      data: result,
    };
  } catch (error) {
    console.error("Error testing humor flavor:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to test humor flavor",
    };
  }
}

// LLM Responses (Read-only)
export async function getLLMResponses(chainId: number) {
  await requireSuperadmin();
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("llm_model_responses")
    .select("*")
    .eq("llm_prompt_chain_id", chainId)
    .order("created_datetime_utc", { ascending: false });

  if (error) throw error;
  return data || [];
}

// Get LLM Responses by Humor Flavor
export async function getLLMResponsesByFlavorId(humorFlavorId: number) {
  await requireSuperadmin();
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("llm_model_responses")
    .select("*")
    .eq("humor_flavor_id", humorFlavorId)
    .order("created_datetime_utc", { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function getCaptionsForFlavor(flavorId: number) {
  await requireSuperadmin();
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("captions")
    .select("id, content, created_datetime_utc, image_id")
    .eq("humor_flavor_id", flavorId)
    .order("created_datetime_utc", { ascending: false });

  if (error) throw error;
  return data || [];
}

// Caption Statistics
export async function getCaptionRatingDistribution() {
  await requireSuperadmin();
  const supabase = await createSupabaseServerClient();

  const { data: captions, error: captionError } = await supabase
    .from("captions")
    .select("id");

  if (captionError) throw captionError;

  const { data: allVotes, error: voteError } = await supabase
    .from("caption_votes")
    .select("caption_id, vote_value");

  if (voteError) throw voteError;

  // Compute vote ratios per caption
  const votesByCaption = new Map<
    string,
    { upvotes: number; downvotes: number }
  >();

  allVotes?.forEach((vote: any) => {
    if (!votesByCaption.has(vote.caption_id)) {
      votesByCaption.set(vote.caption_id, { upvotes: 0, downvotes: 0 });
    }
    if (vote.vote_value === 1) {
      votesByCaption.get(vote.caption_id)!.upvotes++;
    } else {
      votesByCaption.get(vote.caption_id)!.downvotes++;
    }
  });

  // Categorize captions by rating tiers (0-5 stars based on upvote %)
  const distribution = {
    five_star: 0,    // >80% upvotes
    four_star: 0,    // 60-80% upvotes
    three_star: 0,   // 40-60% upvotes
    two_star: 0,     // 20-40% upvotes
    one_star: 0,     // ≤20% upvotes
    no_votes: 0,     // no votes
  };

  (captions || []).forEach((cap: any) => {
    const votes = votesByCaption.get(cap.id);
    if (!votes || (votes.upvotes === 0 && votes.downvotes === 0)) {
      distribution.no_votes++;
    } else {
      const total = votes.upvotes + votes.downvotes;
      const upvotePercent = (votes.upvotes / total) * 100;

      if (upvotePercent > 80) {
        distribution.five_star++;
      } else if (upvotePercent > 60) {
        distribution.four_star++;
      } else if (upvotePercent > 40) {
        distribution.three_star++;
      } else if (upvotePercent > 20) {
        distribution.two_star++;
      } else {
        distribution.one_star++;
      }
    }
  });

  return distribution;
}

export interface ControversialCaption {
  id: string;
  content: string | null;
  upvotes: number;
  downvotes: number;
  total_votes: number;
  upvote_percent: number;
}

export async function getMostControversialCaptions(
  limit: number = 5
): Promise<ControversialCaption[]> {
  await requireSuperadmin();
  const supabase = await createSupabaseServerClient();

  const { data: captions, error: captionError } = await supabase
    .from("captions")
    .select("id, content");

  if (captionError) throw captionError;

  const { data: allVotes, error: voteError } = await supabase
    .from("caption_votes")
    .select("caption_id, vote_value");

  if (voteError) throw voteError;

  // Compute vote counts per caption
  const votesByCaption = new Map<
    string,
    { upvotes: number; downvotes: number }
  >();

  allVotes?.forEach((vote: any) => {
    if (!votesByCaption.has(vote.caption_id)) {
      votesByCaption.set(vote.caption_id, { upvotes: 0, downvotes: 0 });
    }
    if (vote.vote_value === 1) {
      votesByCaption.get(vote.caption_id)!.upvotes++;
    } else {
      votesByCaption.get(vote.caption_id)!.downvotes++;
    }
  });

  // Find controversial: high vote count (≥10) AND close split (40-60% upvotes)
  const controversial = (captions || [])
    .map((cap: any) => {
      const votes = votesByCaption.get(cap.id);
      const upvotes = votes?.upvotes || 0;
      const downvotes = votes?.downvotes || 0;
      const total = upvotes + downvotes;
      const upvotePercent = total > 0 ? (upvotes / total) * 100 : 0;

      return {
        id: cap.id,
        content: cap.content,
        upvotes,
        downvotes,
        total_votes: total,
        upvote_percent: upvotePercent,
      };
    })
    .filter((cap) => cap.total_votes >= 10 && cap.upvote_percent >= 40 && cap.upvote_percent <= 60)
    .sort((a, b) => {
      // Sort by closeness to 50% (most controversial first)
      const aDistance = Math.abs(a.upvote_percent - 50);
      const bDistance = Math.abs(b.upvote_percent - 50);
      return aDistance - bDistance;
    })
    .slice(0, limit);

  return controversial;
}

export interface CaptionEngagementMetric {
  id: string;
  content: string | null;
  image_id: string;
  total_votes: number;
  upvotes: number;
  downvotes: number;
  rating_percent: number;
  created_datetime_utc: string;
  last_vote_datetime_utc: string | null;
}

export async function getCaptionEngagementMetrics(): Promise<
  CaptionEngagementMetric[]
> {
  await requireSuperadmin();
  const supabase = await createSupabaseServerClient();

  const { data: captions, error: captionError } = await supabase
    .from("captions")
    .select("id, content, image_id, created_datetime_utc");

  if (captionError) throw captionError;

  const { data: allVotes, error: voteError } = await supabase
    .from("caption_votes")
    .select("caption_id, vote_value, created_datetime_utc");

  if (voteError) throw voteError;

  // Compute vote stats per caption with latest vote timestamp
  const votesByCaption = new Map<
    string,
    {
      upvotes: number;
      downvotes: number;
      latest_vote: string | null;
    }
  >();

  allVotes?.forEach((vote: any) => {
    if (!votesByCaption.has(vote.caption_id)) {
      votesByCaption.set(vote.caption_id, {
        upvotes: 0,
        downvotes: 0,
        latest_vote: null,
      });
    }
    const current = votesByCaption.get(vote.caption_id)!;
    if (vote.vote_value === 1) {
      current.upvotes++;
    } else {
      current.downvotes++;
    }
    // Keep track of most recent vote
    if (!current.latest_vote || vote.created_datetime_utc > current.latest_vote) {
      current.latest_vote = vote.created_datetime_utc;
    }
  });

  // Build engagement metrics
  const metrics = (captions || [])
    .map((cap: any) => {
      const votes = votesByCaption.get(cap.id);
      const upvotes = votes?.upvotes || 0;
      const downvotes = votes?.downvotes || 0;
      const total = upvotes + downvotes;
      const ratingPercent = total > 0 ? (upvotes / total) * 100 : 0;

      return {
        id: cap.id,
        content: cap.content,
        image_id: cap.image_id,
        total_votes: total,
        upvotes,
        downvotes,
        rating_percent: ratingPercent,
        created_datetime_utc: cap.created_datetime_utc,
        last_vote_datetime_utc: votes?.latest_vote || null,
      };
    })
    .sort((a, b) => {
      // Sort by total votes descending, then by recency
      if (b.total_votes !== a.total_votes) {
        return b.total_votes - a.total_votes;
      }
      const aDate = a.last_vote_datetime_utc || a.created_datetime_utc;
      const bDate = b.last_vote_datetime_utc || b.created_datetime_utc;
      return bDate.localeCompare(aDate);
    });

  return metrics;
}

export interface CaptionStats {
  ratingDistribution: Awaited<ReturnType<typeof getCaptionRatingDistribution>>;
  controversial: ControversialCaption[];
  avgRating: number;
  captionsWithVotes: number;
  totalCaptions: number;
}

export async function getCaptionStats(): Promise<CaptionStats> {
  const [distribution, controversial, metrics, { count: totalCaptions }] =
    await Promise.all([
      getCaptionRatingDistribution(),
      getMostControversialCaptions(5),
      getCaptionEngagementMetrics(),
      (async () => {
        const supabase = await createSupabaseServerClient();
        const result = await supabase
          .from("captions")
          .select("*", { count: "exact" });
        return result;
      })(),
    ]);

  const captionsWithVotes = metrics.filter((m) => m.total_votes > 0).length;
  const avgRating =
    metrics.length > 0
      ? metrics.reduce((sum, m) => sum + m.rating_percent, 0) / metrics.length
      : 0;

  return {
    ratingDistribution: distribution,
    controversial,
    avgRating,
    captionsWithVotes,
    totalCaptions: totalCaptions || 0,
  };
}

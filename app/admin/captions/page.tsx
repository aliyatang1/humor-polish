"use server";

import CaptionsPageWrapper from "./CaptionsPageWrapper";
import { getCaptionEngagementMetrics, getCaptionRatingDistribution, getCaptions } from "@/app/actions/admin";

export default async function CaptionsPage() {
  const [metrics, ratingDistribution, initialCaptions] = await Promise.all([
    getCaptionEngagementMetrics(),
    getCaptionRatingDistribution(),
    getCaptions(),
  ]);

  const analyticsData = {
    metrics,
    ratingDistribution,
  };

  return <CaptionsPageWrapper initialCaptions={initialCaptions} analyticsData={analyticsData} />;
}

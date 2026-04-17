"use server";

import CaptionsPageWrapper from "./CaptionsPageWrapper";
import { getCaptionEngagementMetrics, getCaptionRatingDistribution } from "@/app/actions/admin";

export default async function CaptionsPage() {
  const [metrics, ratingDistribution] = await Promise.all([
    getCaptionEngagementMetrics(),
    getCaptionRatingDistribution(),
  ]);

  const analyticsData = {
    metrics,
    ratingDistribution,
  };

  return <CaptionsPageWrapper analyticsData={analyticsData} />;
}

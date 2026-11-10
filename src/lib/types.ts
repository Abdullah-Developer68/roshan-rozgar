import type { TradeId } from "@/lib/trades";

export type Availability = "available" | "busy" | "offline";

export type WorkerPublic = {
  id: string;
  name: string;
  nameUr: string | null;
  trade: TradeId;
  skills: string[];
  experienceYears: number;
  areaId: string;
  lat: number;
  lng: number;
  visitCharge: number;
  bioUr: string | null;
  bioEn: string | null;
  photoUrl: string | null;
  voiceIntroUrl: string | null;
  isOnline: boolean;
  availability: Availability;
  ratingAvg: number;
  ratingCount: number;
  jobsCompleted: number;
  trustSummaryEn: string | null;
  trustSummaryUr: string | null;
  trustTags: string[];
  trustSummarySource: string | null;
  memberSince: string;
  isSeeded: boolean;
};

export type WorkerSearchResult = WorkerPublic & { distanceKm: number; etaMin: number; score: number };

export type ReviewDTO = {
  id: string;
  rating: number;
  tags: string[];
  comment: string | null;
  customerName: string;
  paidAgreedPrice: boolean | null;
  wouldHireAgain: boolean | null;
  agreedPrice: number | null;
  createdAt: string;
  isSeeded: boolean;
};

export type JobStatus = "requested" | "booked" | "completed" | "declined" | "cancelled" | "expired";

export type OfferDTO = { messageId: string; amount: number; by: "customer" | "worker"; createdAt: string };

export type JobDTO = {
  id: string;
  groupId: string;
  status: JobStatus;
  closeReason: string | null;
  trade: TradeId;
  problemText: string;
  summaryEn: string | null;
  summaryUr: string | null;
  triageSource: string | null;
  photoUrl: string | null;
  areaId: string;
  addressNote: string | null;
  lat: number;
  lng: number;
  distanceKm: number | null;
  agreedPrice: number | null;
  bookedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
  viewerRole: "customer" | "worker";
  customer: { name: string; phone: string | null };
  worker: {
    id: string;
    name: string;
    nameUr: string | null;
    photoUrl: string | null;
    ratingAvg: number;
    ratingCount: number;
    visitCharge: number;
    phone: string | null;
  };
  pendingOffer: OfferDTO | null;
  hasReview: boolean;
};

export type MessageDTO = {
  id: string;
  senderRole: "customer" | "worker" | "system";
  kind: "text" | "voice" | "offer" | "system";
  text: string | null;
  audioUrl: string | null;
  textEn: string | null;
  textUr: string | null;
  aiSource: string | null;
  offerAmount: number | null;
  offerStatus: string | null;
  createdAt: string;
  mine: boolean;
};

export type PriceStats = { count: number; p25: number | null; median: number | null; p75: number | null };

export type MeDTO = {
  user: { id: string; name: string; phone: string | null; role: "worker" | "customer" } | null;
  worker: WorkerPublic | null;
};

export const mediaUrl = (id: string | null | undefined) => (id ? `/api/media/${id}` : null);

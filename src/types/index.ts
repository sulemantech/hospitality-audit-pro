// ─── Auth & Users ─────────────────────────────────────────────────────────────

export type UserRole = "admin" | "manager" | "staff" | "viewer";

export interface AppUser {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  assigned_property_id?: string | null;
  avatar_url?: string | null;
  created_at: string;
}

// ─── Properties ───────────────────────────────────────────────────────────────

export type PropertyType = "hotel" | "hostel";

export interface Property {
  id: string;
  name: string;
  type: PropertyType;
  location: string;
  total_rooms: number;
  created_at: string;
}

// ─── Complaints ───────────────────────────────────────────────────────────────

export type ComplaintSeverity = "critical" | "high" | "medium" | "low";
export type ComplaintStatus = "open" | "pending" | "resolved" | "closed";
export type ComplaintCategory =
  | "cleanliness"
  | "maintenance"
  | "noise"
  | "staff"
  | "facilities"
  | "pest"
  | "safety"
  | "billing"
  | "other";

export interface Complaint {
  id: string;
  property_id: string;
  property?: Property;
  room_number?: string | null;
  guest_name?: string | null;
  category: ComplaintCategory;
  severity: ComplaintSeverity;
  status: ComplaintStatus;
  description: string;
  reported_at: string;
  resolved_at?: string | null;
  assigned_to?: string | null;
  photo_urls?: string[];
  created_by: string;
  created_at: string;
  updated_at: string;
}

// ─── Reviews ──────────────────────────────────────────────────────────────────

export type ReviewSource = "booking.com" | "google" | "tripadvisor" | "airbnb" | "expedia" | "direct" | "other";
export type ReviewSentiment = "positive" | "neutral" | "negative";

export interface Review {
  id: string;
  property_id: string;
  property?: Property;
  source: ReviewSource;
  rating: number; // 1-10 normalised (Booking uses 10, Google 5, etc.)
  raw_rating?: number; // original scale
  reviewer_name?: string | null;
  review_text: string;
  review_date: string;
  flagged_keywords?: string[];
  sentiment?: ReviewSentiment | null;
  sentiment_score?: number | null; // -1 to 1
  ai_key_issues?: string[] | null;
  ai_key_positives?: string[] | null;
  ai_suggested_response?: string | null;
  imported_at: string;
  created_at: string;
}

// ─── Financials ───────────────────────────────────────────────────────────────

export type OtaChannel = "booking.com" | "expedia" | "agoda" | "airbnb" | "direct" | "other";

export interface OtaCommission {
  id: string;
  property_id: string;
  channel: OtaChannel;
  commission_rate: number; // percentage e.g. 15 = 15%
  month: string; // YYYY-MM
  revenue: number;
  commission_amount: number; // calculated
  bookings_count: number;
  created_at: string;
}

export interface SupplierPrice {
  id: string;
  property_id: string;
  item_name: string;
  category: string;
  unit: string;
  current_price: number;
  benchmark_price?: number | null;
  supplier_name: string;
  last_updated: string;
  created_at: string;
}

// ─── Action Plan ──────────────────────────────────────────────────────────────

export type ActionItemStatus = "todo" | "in_progress" | "done" | "dismissed";
export type ActionItemPriority = "critical" | "high" | "medium" | "low";

export interface ActionItem {
  id: string;
  property_id?: string | null;
  title: string;
  description: string;
  priority: ActionItemPriority;
  status: ActionItemStatus;
  source: "complaint" | "review" | "financial" | "manual";
  source_ref_id?: string | null;
  due_date?: string | null;
  assigned_to?: string | null;
  created_at: string;
  updated_at: string;
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

export interface PropertyHealthScore {
  property_id: string;
  property_name: string;
  property_type: PropertyType;
  complaints_open: number;
  avg_review_rating: number;
  negative_reviews_count: number;
  action_items_overdue: number;
  health_score: number; // 0-100
}

export interface DashboardMetrics {
  total_complaints_open: number;
  total_complaints_this_month: number;
  avg_review_rating: number;
  total_reviews_this_month: number;
  negative_reviews_this_month: number;
  estimated_ota_commission_this_month: number;
  action_items_overdue: number;
  property_health: PropertyHealthScore[];
}

// ─── Utility ──────────────────────────────────────────────────────────────────

export type SortDirection = "asc" | "desc";
export type DateRange = { from: Date | undefined; to: Date | undefined };
export type SelectOption<T = string> = { value: T; label: string };

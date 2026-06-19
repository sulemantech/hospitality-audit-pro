import { createAdminClient } from "@/lib/supabase/server";
import type { ComplaintCategory, ComplaintSeverity, ComplaintStatus } from "@/types";

export interface ComplaintFilters {
  property_id?: string;
  status?: ComplaintStatus;
  severity?: ComplaintSeverity;
  category?: ComplaintCategory;
  search?: string;
  page?: number;
  per_page?: number;
}

export async function getComplaints(filters: ComplaintFilters = {}) {
  const supabase = createAdminClient();
  const { page = 1, per_page = 20, property_id, status, severity, category, search } = filters;

  let query = supabase
    .from("complaints")
    .select(`
      id, room_number, guest_name, category, severity, status, source,
      description, reported_by, assigned_to, is_overdue, sla_deadline,
      created_at, updated_at, resolved_at,
      properties ( id, name, type, location )
    `, { count: "exact" })
    .order("created_at", { ascending: false })
    .range((page - 1) * per_page, page * per_page - 1);

  if (property_id && property_id !== "all") query = query.eq("property_id", property_id);
  if (status) query = query.eq("status", status);
  if (severity) query = query.eq("severity", severity);
  if (category) query = query.eq("category", category);
  if (search) query = query.ilike("description", `%${search}%`);

  const { data, error, count } = await query;
  if (error) throw error;
  return { data: data ?? [], count: count ?? 0, page, per_page };
}

export async function getComplaintById(id: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("complaints")
    .select(`
      *, properties ( id, name, type, location )
    `)
    .eq("id", id)
    .single();
  if (error) throw error;
  return data;
}

export async function getComplaintUpdates(complaint_id: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("complaint_updates")
    .select("*")
    .eq("complaint_id", complaint_id)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function getComplaintStats() {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("complaints")
    .select("status, severity, property_id");
  if (error) throw error;

  const rows = data ?? [];
  return {
    total_open: rows.filter((r) => r.status === "open").length,
    total_pending: rows.filter((r) => r.status === "pending").length,
    critical_open: rows.filter((r) => r.severity === "critical" && r.status !== "resolved" && r.status !== "closed").length,
    total_active: rows.filter((r) => r.status !== "resolved" && r.status !== "closed").length,
  };
}

export async function getProperties() {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("properties")
    .select("id, name, type, location, total_rooms, created_at")
    .eq("status", "active")
    .order("name");
  if (error) throw error;
  return data ?? [];
}

import { PostgrestError, PostgrestResponse } from "@supabase/supabase-js";
import { getSupabaseClient } from "./supabaseClient";

export interface RosterEntryRecord {
  id: number;
  course_id: number;
  student_id: string;
  name: string;
  email: string;
  year: string | null;
  created_at?: string;
}

export interface UpsertRosterInput {
  studentId: string;
  name: string;
  email: string;
  year?: string;
}

export const listRosterByCourse = async (
  courseId: number
): Promise<{
  data: RosterEntryRecord[] | null;
  error: PostgrestError | null;
}> => {
  const supabase = getSupabaseClient();
  const response = await supabase
    .from("course_roster")
    .select("*")
    .eq("course_id", courseId)
    .order("id", { ascending: true });

  return { data: response.data ?? null, error: response.error };
};

export const upsertRosterEntries = async (
  courseId: number,
  students: UpsertRosterInput[]
): Promise<{
  data: RosterEntryRecord[] | null;
  error: PostgrestError | null;
}> => {
  if (students.length === 0) {
    return { data: [], error: null };
  }

  const supabase = getSupabaseClient();

  const payload = students.map((s) => ({
    course_id: courseId,
    student_id: s.studentId,
    name: s.name,
    email: s.email,
    year: s.year ?? null,
  }));

  // Prefer idempotent behavior without requiring a DB unique constraint.
  // Delete any existing entries for the same course+student ids, then insert fresh.
  const studentIds = students.map((s) => s.studentId);

  const del = await supabase
    .from("course_roster")
    .delete()
    .eq("course_id", courseId)
    .in("student_id", studentIds);

  if (del.error) {
    return { data: null, error: del.error };
  }

  const ins: PostgrestResponse<RosterEntryRecord> = await supabase
    .from("course_roster")
    .insert(payload)
    .select("*");

  return { data: ins.data ?? null, error: ins.error };
};

export const deleteRosterEntry = async (
  courseId: number,
  studentId: string
): Promise<{
  data: RosterEntryRecord[] | null;
  error: PostgrestError | null;
}> => {
  const supabase = getSupabaseClient();
  const response = await supabase
    .from("course_roster")
    .delete()
    .eq("course_id", courseId)
    .eq("student_id", studentId)
    .select("*");

  return { data: response.data ?? null, error: response.error };
};

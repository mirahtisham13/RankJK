import { supabase } from './supabase';

// ---- EXAMS ----

export async function getExams({ conductingBody, activeOnly = true } = {}) {
  let query = supabase
    .from('exams')
    .select('*, posts(count)')
    .order('created_at', { ascending: false });

  if (activeOnly) query = query.eq('is_active', true);
  if (conductingBody) query = query.eq('conducting_body', conductingBody);

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function getExamById(id) {
  const { data, error } = await supabase
    .from('exams')
    .select('*, posts(*)')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
}

export async function createExam(examData) {
  const { data, error } = await supabase
    .from('exams')
    .insert(examData)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateExam(id, examData) {
  const { data, error } = await supabase
    .from('exams')
    .update({ ...examData, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteExam(id) {
  const { error } = await supabase.from('exams').delete().eq('id', id);
  if (error) throw error;
}

// ---- POSTS ----

export async function getPostsByExam(examId) {
  const { data, error } = await supabase
    .from('posts')
    .select('*')
    .eq('exam_id', examId)
    .eq('is_active', true)
    .order('name');

  if (error) throw error;
  return data;
}

export async function createPost(postData) {
  const { data, error } = await supabase
    .from('posts')
    .insert(postData)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deletePost(id) {
  const { error } = await supabase.from('posts').delete().eq('id', id);
  if (error) throw error;
}

// ---- SUBMISSIONS ----

export async function submitMarks({ postId, score, category }) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Must be logged in to submit marks');

  const { data, error } = await supabase
    .from('submissions')
    .upsert(
      { user_id: user.id, post_id: postId, score, category, updated_at: new Date().toISOString() },
      { onConflict: 'user_id,post_id' }
    )
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getSubmissionsByPost(postId) {
  const { data, error } = await supabase
    .from('submissions')
    .select('score, category, created_at')
    .eq('post_id', postId)
    .order('score', { ascending: false });

  if (error) throw error;
  return data;
}

export async function getUserSubmissions(userId) {
  const { data, error } = await supabase
    .from('submissions')
    .select('*, posts(name, total_marks, exam_id, exams(name, short_name, conducting_body))')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

export async function getUserSubmissionForPost(userId, postId) {
  const { data, error } = await supabase
    .from('submissions')
    .select('*')
    .eq('user_id', userId)
    .eq('post_id', postId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function deleteSubmission(id) {
  const { error } = await supabase.from('submissions').delete().eq('id', id);
  if (error) throw error;
}

// ---- CUTOFF ANALYTICS ----

export async function getCutoffStats(postId) {
  const { data, error } = await supabase
    .from('cutoff_stats')
    .select('*')
    .eq('post_id', postId);

  if (error) throw error;
  return data;
}

export async function getGlobalStats() {
  const [examsRes, submissionsRes] = await Promise.all([
    supabase.from('exams').select('id', { count: 'exact' }).eq('is_active', true),
    supabase.from('submissions').select('id', { count: 'exact' }),
  ]);

  return {
    totalExams: examsRes.count || 0,
    totalSubmissions: submissionsRes.count || 0,
  };
}

// ---- AUTH HELPERS ----

export async function signUp({ email, password, fullName }) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName } },
  });
  if (error) throw error;
  return data;
}

export async function signIn({ email, password }) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getProfile(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) throw error;
  return data;
}

export async function updateProfile(userId, profileData) {
  const { data, error } = await supabase
    .from('profiles')
    .update({ ...profileData, updated_at: new Date().toISOString() })
    .eq('id', userId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// ---- ADMIN ----

export async function getAllSubmissions({ limit = 100, offset = 0 } = {}) {
  const { data, error } = await supabase
    .from('submissions')
    .select('*, posts(name, exam_id, exams(name, short_name)), profiles(full_name)')
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) throw error;
  return data;
}

export async function getAllProfiles({ limit = 100, offset = 0 } = {}) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) throw error;
  return data;
}

export async function setAdminStatus(userId, isAdmin) {
  const { error } = await supabase
    .from('profiles')
    .update({ is_admin: isAdmin })
    .eq('id', userId);

  if (error) throw error;
}

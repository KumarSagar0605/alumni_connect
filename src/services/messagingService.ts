// @ts-nocheck
import { supabase } from '../supabaseClient';
import type { EligibleMentor, Conversation, ChatMessage } from '../types';

// ============================================================
// ELIGIBLE MENTORS
// Returns alumni who are assigned as mentors on projects
// that the authenticated student is part of (created or joined)
// ============================================================
export async function getEligibleMentors(studentUserId: string): Promise<EligibleMentor[]> {
  // First get the student's profile ID
  const { data: studentProfile, error: profileErr } = await supabase
    .from('profiles')
    .select('id')
    .eq('user_id', studentUserId)
    .single();

  if (profileErr || !studentProfile) {
    console.error('Error fetching student profile:', profileErr);
    return [];
  }

  const studentProfileId = studentProfile.id;

  // Find projects where the student is a member or creator
  const { data: studentProjects, error: projErr } = await supabase
    .from('projects')
    .select('id')
    .or(`created_by.eq.${studentProfileId},members.cs.{${studentUserId}}`);

  if (projErr || !studentProjects || studentProjects.length === 0) {
    return [];
  }

  const projectIds = studentProjects.map((p) => p.id);

  // Find alumni mentors assigned to those projects
  const { data: projectMentors, error: pmErr } = await supabase
    .from('project_mentors')
    .select('mentor_id, project_id')
    .in('project_id', projectIds);

  if (pmErr || !projectMentors || projectMentors.length === 0) {
    return [];
  }

  // Get unique mentor IDs
  const mentorIds = [...new Set(projectMentors.map((pm) => pm.mentor_id))];

  // Fetch mentor profiles (must be alumni)
  const { data: mentorProfiles, error: mentorErr } = await supabase
    .from('profiles')
    .select('id, full_name, avatar_url, role, user_id')
    .in('id', mentorIds)
    .eq('role', 'alumni');

  if (mentorErr || !mentorProfiles) {
    return [];
  }

  // Build eligible mentors list with project info
  const result: EligibleMentor[] = [];
  for (const pm of projectMentors) {
    const profile = mentorProfiles.find((mp) => mp.id === pm.mentor_id);
    const project = studentProjects.find((p) => p.id === pm.project_id);
    if (profile && project) {
      result.push({
        mentorProfileId: profile.id,
        mentorName: profile.full_name,
        mentorAvatar: profile.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.full_name)}&background=9E2A2B&color=fff&size=200`,
        mentorRole: profile.role,
        mentorUserId: profile.user_id,
        projectId: project.id,
        projectName: project.name,
      });
    }
  }

  return result;
}

// ============================================================
// GET OR CREATE CONVERSATION
// Returns existing conversation or creates a new one
// ============================================================
export async function getOrCreateConversation(
  studentUserId: string,
  mentorProfileId: string,
  projectId: string
): Promise<Conversation | null> {
  // Get student profile ID
  const { data: studentProfile } = await supabase
    .from('profiles')
    .select('id')
    .eq('user_id', studentUserId)
    .single();

  if (!studentProfile) return null;

  // Check for existing conversation
  const { data: existing } = await supabase
    .from('conversations')
    .select('*')
    .eq('student_id', studentProfile.id)
    .eq('mentor_profile_id', mentorProfileId)
    .eq('project_id', projectId)
    .single();

  if (existing) {
    return formatConversation(existing);
  }

  // Validate: mentor must be assigned to this project
  const { data: validAssignment } = await supabase
    .from('project_mentors')
    .select('id')
    .eq('project_id', projectId)
    .eq('mentor_id', mentorProfileId)
    .single();

  if (!validAssignment) {
    console.error('Validation failed: mentor is not assigned to this project');
    return null;
  }

  // Create new conversation
  const { data: newConv, error } = await supabase
    .from('conversations')
    .insert([{
      student_id: studentProfile.id,
      mentor_profile_id: mentorProfileId,
      project_id: projectId,
    }])
    .select()
    .single();

  if (error) {
    console.error('Error creating conversation:', error);
    return null;
  }

  return formatConversation(newConv);
}

// ============================================================
// SEND MESSAGE
// Validates role + relationship, then inserts message
// ============================================================
export async function sendMessage(
  conversationId: string,
  senderUserId: string,
  text: string
): Promise<ChatMessage | null> {
  // Get sender profile
  const { data: senderProfile, error: senderErr } = await supabase
    .from('profiles')
    .select('id, full_name, avatar_url, role')
    .eq('user_id', senderUserId)
    .single();

  if (senderErr || !senderProfile) {
    console.error('Error fetching sender profile:', senderErr);
    return null;
  }

  // Validate: sender must be student or alumni
  if (senderProfile.role !== 'student' && senderProfile.role !== 'alumni') {
    console.error('Validation failed: sender must be student or alumni');
    return null;
  }

  // Validate: sender must be part of this conversation
  const { data: conversation, error: convErr } = await supabase
    .from('conversations')
    .select('*')
    .eq('id', conversationId)
    .single();

  if (convErr || !conversation) {
    console.error('Conversation not found:', convErr);
    return null;
  }

  const isStudent = conversation.student_id === senderProfile.id;
  const isMentor = conversation.mentor_profile_id === senderProfile.id;

  if (!isStudent && !isMentor) {
    console.error('Validation failed: sender is not part of this conversation');
    return null;
  }

  // Validate: conversation must be student <-> alumni
  if (senderProfile.role === 'student') {
    // Verify the other party is alumni
    const { data: mentorProfile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', conversation.mentor_profile_id)
      .single();

    if (!mentorProfile || mentorProfile.role !== 'alumni') {
      console.error('Validation failed: student can only message alumni');
      return null;
    }
  }

  // Insert the message
  const { data: newMessage, error: msgErr } = await supabase
    .from('messages')
    .insert([{
      sender_id: senderProfile.id,
      conversation_id: conversationId,
      text: text.trim(),
    }])
    .select()
    .single();

  if (msgErr) {
    console.error('Error sending message:', msgErr);
    return null;
  }

  return {
    id: newMessage.id,
    senderId: senderProfile.id,
    senderName: senderProfile.full_name,
    senderAvatar: senderProfile.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(senderProfile.full_name)}&background=9E2A2B&color=fff&size=200`,
    text: newMessage.text,
    isMe: true,
    createdAt: newMessage.created_at,
    isRead: newMessage.is_read,
  };
}

// ============================================================
// GET CONVERSATION MESSAGES
// Returns all messages for a conversation
// ============================================================
export async function getConversationMessages(
  conversationId: string,
  currentUserId: string
): Promise<ChatMessage[]> {
  // Get current user's profile ID
  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('user_id', currentUserId)
    .single();

  if (!profile) return [];

  // Verify user is part of this conversation
  const { data: conversation } = await supabase
    .from('conversations')
    .select('*')
    .eq('id', conversationId)
    .single();

  if (!conversation) return [];
  if (conversation.student_id !== profile.id && conversation.mentor_profile_id !== profile.id) {
    return [];
  }

  // Fetch messages
  const { data: messages, error } = await supabase
    .from('messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true });

  if (error || !messages) return [];

  // Fetch sender profiles for avatar/name
  const senderIds = [...new Set(messages.map((m) => m.sender_id))];
  const { data: senderProfiles } = await supabase
    .from('profiles')
    .select('id, full_name, avatar_url')
    .in('id', senderIds);

  const profileMap = new Map((senderProfiles || []).map((p) => [p.id, p]));

  return messages.map((m) => {
    const sender = profileMap.get(m.sender_id);
    return {
      id: m.id,
      senderId: m.sender_id,
      senderName: sender?.full_name || 'Unknown',
      senderAvatar: sender?.avatar_url || `https://ui-avatars.com/api/?name=U&background=9E2A2B&color=fff&size=200`,
      text: m.text,
      isMe: m.sender_id === profile.id,
      createdAt: m.created_at,
      isRead: m.is_read,
    };
  });
}

// ============================================================
// GET USER CONVERSATIONS
// Returns all conversations for the current user, sorted by last message
// ============================================================
export async function getUserConversations(userId: string): Promise<Conversation[]> {
  // Get user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, role')
    .eq('user_id', userId)
    .single();

  if (!profile) return [];

  let query;
  if (profile.role === 'student') {
    query = supabase
      .from('conversations')
      .select('*')
      .eq('student_id', profile.id);
  } else if (profile.role === 'alumni') {
    query = supabase
      .from('conversations')
      .select('*')
      .eq('mentor_profile_id', profile.id);
  } else {
    return [];
  }

  const { data: conversations, error } = await query.order('last_message_at', { ascending: false });

  if (error || !conversations) return [];

  // Enrich with other party's profile info
  const enriched: Conversation[] = [];
  for (const conv of conversations) {
    const otherPartyId = profile.role === 'student' ? conv.mentor_profile_id : conv.student_id;
    const { data: otherProfile } = await supabase
      .from('profiles')
      .select('id, full_name, avatar_url, user_id')
      .eq('id', otherPartyId)
      .single();

    const { data: project } = await supabase
      .from('projects')
      .select('name')
      .eq('id', conv.project_id)
      .single();

    if (otherProfile) {
      enriched.push({
        id: conv.id,
        studentId: conv.student_id,
        mentorProfileId: conv.mentor_profile_id,
        mentorName: profile.role === 'student' ? otherProfile.full_name : (enriched.length === 0 ? '' : ''),
        mentorAvatar: otherProfile.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(otherProfile.full_name)}&background=9E2A2B&color=fff&size=200`,
        mentorUserId: otherProfile.user_id,
        projectId: conv.project_id,
        projectName: project?.name || 'Unknown Project',
        lastMessageText: conv.last_message_text || '',
        lastMessageAt: conv.last_message_at,
        createdAt: conv.created_at,
      });
    }
  }

  return enriched;
}

// ============================================================
// MARK MESSAGES AS READ
// ============================================================
export async function markConversationRead(conversationId: string, userId: string): Promise<void> {
  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('user_id', userId)
    .single();

  if (!profile) return;

  await supabase
    .from('messages')
    .update({ is_read: true })
    .eq('conversation_id', conversationId)
    .neq('sender_id', profile.id)
    .eq('is_read', false);
}

// ============================================================
// REALTIME SUBSCRIPTIONS
// ============================================================
export function subscribeToMessages(
  conversationId: string,
  onNewMessage: (msg: ChatMessage) => void
) {
  return supabase
    .channel(`messages:${conversationId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${conversationId}`,
      },
      async (payload) => {
        const m = payload.new;
        // Fetch sender profile
        const { data: sender } = await supabase
          .from('profiles')
          .select('id, full_name, avatar_url')
          .eq('id', m.sender_id)
          .single();

        onNewMessage({
          id: m.id,
          senderId: m.sender_id,
          senderName: sender?.full_name || 'Unknown',
          senderAvatar: sender?.avatar_url || `https://ui-avatars.com/api/?name=U&background=9E2A2B&color=fff&size=200`,
          text: m.text,
          isMe: false,
          createdAt: m.created_at,
          isRead: m.is_read,
        });
      }
    )
    .subscribe();
}

export function subscribeToConversations(
  userId: string,
  onConversationUpdate: () => void
) {
  return supabase
    .channel('conversations-list')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'conversations',
      },
      () => {
        onConversationUpdate();
      }
    )
    .subscribe();
}

// ============================================================
// HELPERS
// ============================================================
function formatConversation(row: any): Conversation {
  return {
    id: row.id,
    studentId: row.student_id,
    mentorProfileId: row.mentor_profile_id,
    mentorName: '',
    mentorAvatar: '',
    mentorUserId: '',
    projectId: row.project_id,
    projectName: '',
    lastMessageText: row.last_message_text || '',
    lastMessageAt: row.last_message_at,
    createdAt: row.created_at,
  };
}

// ============================================================
// JOIN AS MENTOR
// Alumni can self-assign as a mentor on any project
// ============================================================
export async function joinAsMentor(userId: string, projectId: string): Promise<boolean> {
  // Get the alumni's profile
  const { data: profile, error: profileErr } = await supabase
    .from('profiles')
    .select('id, role')
    .eq('user_id', userId)
    .single();

  if (profileErr || !profile) {
    console.error('Error fetching profile:', profileErr);
    return false;
  }

  if (profile.role !== 'alumni') {
    console.error('Only alumni can join as mentors');
    return false;
  }

  // Check if already a mentor on this project
  const { data: existing } = await supabase
    .from('project_mentors')
    .select('id')
    .eq('project_id', projectId)
    .eq('mentor_id', profile.id)
    .single();

  if (existing) {
    console.error('Already a mentor on this project');
    return false;
  }

  const { error } = await supabase
    .from('project_mentors')
    .insert([{
      project_id: projectId,
      mentor_id: profile.id,
    }]);

  if (error) {
    console.error('Error joining as mentor:', error);
    return false;
  }

  return true;
}

// ============================================================
// LEAVE MENTOR ROLE
// Alumni can remove themselves from mentoring a project
// ============================================================
export async function leaveMentorRole(userId: string, projectId: string): Promise<boolean> {
  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('user_id', userId)
    .single();

  if (!profile) return false;

  const { error } = await supabase
    .from('project_mentors')
    .delete()
    .eq('project_id', projectId)
    .eq('mentor_id', profile.id);

  if (error) {
    console.error('Error leaving mentor role:', error);
    return false;
  }

  return true;
}

// ============================================================
// CHECK IF USER IS ALREADY A MENTOR ON A PROJECT
// ============================================================
export async function isMentorOnProject(userId: string, projectId: string): Promise<boolean> {
  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('user_id', userId)
    .single();

  if (!profile) return false;

  const { data } = await supabase
    .from('project_mentors')
    .select('id')
    .eq('project_id', projectId)
    .eq('mentor_id', profile.id)
    .single();

  return !!data;
}

// ============================================================
// GET MENTOR PROJECTS FOR AN ALUMNI
// Returns all projects the alumni is currently mentoring
// ============================================================
export async function getMyMentorProjects(userId: string): Promise<string[]> {
  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('user_id', userId)
    .single();

  if (!profile) return [];

  const { data } = await supabase
    .from('project_mentors')
    .select('project_id')
    .eq('mentor_id', profile.id);

  return (data || []).map((pm) => pm.project_id);
}

// ============================================================
// PROJECT MEMBERSHIP HELPERS
// project_members.profile_id references profiles.id (NOT auth user id),
// so every join/leave/lookup must resolve the caller's profile row first.
// ============================================================

/** Resolve the profiles.id row for an auth user id. Returns null if none. */
export async function getProfileId(userId: string): Promise<string | null> {
  const { data } = await supabase
    .from('profiles')
    .select('id')
    .eq('user_id', userId)
    .single();

  return data?.id ?? null;
}

/** Full profile row (id, name, avatar) for join/leave optimistic updates. */
export async function getMemberProfile(userId: string): Promise<{
  profileId: string;
  fullName: string;
  avatarUrl: string;
} | null> {
  const { data } = await supabase
    .from('profiles')
    .select('id, full_name, avatar_url')
    .eq('user_id', userId)
    .single();

  if (!data) return null;
  return {
    profileId: data.id,
    fullName: data.full_name,
    avatarUrl:
      data.avatar_url ||
      `https://ui-avatars.com/api/?name=${encodeURIComponent(data.full_name)}&background=9E2A2B&color=fff&size=200`,
  };
}

export interface ProjectMemberInfo {
  profileId: string;
  fullName: string;
  avatarUrl: string;
}

/** Real member roster for a project, joined from profiles. */
export async function getProjectMembers(projectId: string): Promise<ProjectMemberInfo[]> {
  const { data: rows } = await supabase
    .from('project_members')
    .select('profile_id')
    .eq('project_id', projectId);

  if (!rows || rows.length === 0) return [];

  const ids = [...new Set(rows.map((r: any) => r.profile_id))];
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, full_name, avatar_url')
    .in('id', ids);

  return (profiles || []).map((p: any) => ({
    profileId: p.id,
    fullName: p.full_name,
    avatarUrl:
      p.avatar_url ||
      `https://ui-avatars.com/api/?name=${encodeURIComponent(p.full_name)}&background=9E2A2B&color=fff&size=200`,
  }));
}

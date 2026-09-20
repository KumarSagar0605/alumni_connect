export interface Club {
  id: string;
  name: string;
  category: string;
  image: string;
  membersCount: number;
  description: string;
  joined: boolean;
  tag: string;
  tags?: string[];
  equipmentAccess?: string;
  weeklyMeetings?: string;
  leadership?: {
    name: string;
    role: string;
    avatar: string;
    desc: string;
  }[];
  upcomingHappening?: {
    name: string;
    description: string;
    date: string;
    location: string;
    image: string;
    attendingCount: number;
  };
  recentActivity?: {
    author: string;
    time: string;
    text: string;
    likes: number;
    avatar: string;
  }[];
  resources?: string[];
  created_by?: string | null;
}

export interface Project {
  id: string;
  name: string;
  category: string;
  clubName: string;
  description: string;
  progress: number;
  needsMentor: boolean;
  mentored: boolean;
  joined: boolean;
  badge: 'Recruiting' | 'Needs Mentor' | 'In Progress';
  members: string[];
  membersList?: ProjectMember[];
  mentorsList?: ProjectMentor[];
  milestones?: { name: string; done: boolean }[];
  techStack?: string[];
  lead?: string;
  created_by?: string | null;
}

export interface ProjectMentor {
  id: string;
  profileId: string;
  fullName: string;
  avatarUrl: string;
  userId: string;
}

export interface ProjectMember {
  id?: string;
  profileId: string;
  fullName: string;
  avatarUrl: string;
  role?: 'lead' | 'member';
}

export interface Event {
  id: string;
  name: string;
  badge: string;
  description: string;
  date: string;
  registeredCount: number;
  registered: boolean;
  image: string;
  category: string;
  host?: string;
  time?: string;
  location?: string;
  created_by?: string | null;
}

export interface Mentor {
  id: string;
  full_name: string;
  role: string;
  avatar_url: string;
  online: boolean;
  user_id?: string;
}

export interface TrendingItem {
  id: string;
  tag: string;
  detail: string;
  is_hot?: boolean;
}

export interface Notification {
  id: string;
  text: string;
  time_text: string;
  is_read: boolean;
}

export interface Message {
  id: string;
  sender: string;
  avatar: string;
  text: string;
  timestamp: string;
  isMe: boolean;
  mentorId?: string;
}

export interface Conversation {
  id: string;
  studentId: string;
  mentorProfileId: string;
  mentorName: string;
  mentorAvatar: string;
  mentorUserId: string;
  projectId: string;
  projectName: string;
  lastMessageText: string;
  lastMessageAt: string;
  createdAt: string;
  unreadCount?: number;
}

export interface EligibleMentor {
  mentorProfileId: string;
  mentorName: string;
  mentorAvatar: string;
  mentorRole: string;
  mentorUserId: string;
  projectId: string;
  projectName: string;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  text: string;
  isMe: boolean;
  createdAt: string;
  isRead: boolean;
}

export interface ClubMember {
  id: string;
  clubId: string;
  profileId: string;
  role: 'lead' | 'member';
  joinedAt: string;
  profile?: {
    id: string;
    fullName: string;
    avatarUrl: string | null;
    role: string;
  };
}

export interface EventHost {
  id: string;
  eventId: string;
  profileId: string;
  role: 'lead' | 'host' | 'member';
  joinedAt: string;
  profile?: {
    id: string;
    fullName: string;
    avatarUrl: string | null;
    role: string;
  };
}

export interface Community {
  id: string;
  name: string;
  description: string;
  image: string;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
  memberCount?: number;
  isMember?: boolean;
  myRole?: 'lead' | 'member' | null;
  membersList?: CommunityMember[];
}

export interface CommunityMember {
  id: string;
  communityId: string;
  profileId: string;
  role: 'lead' | 'member';
  joinedAt: string;
  profile?: {
    id: string;
    fullName: string;
    avatarUrl: string | null;
    role: string;
  };
}

export interface CommunityPost {
  id: string;
  communityId: string;
  authorId: string | null;
  title: string;
  content: string;
  postType: 'event' | 'announcement' | 'update';
  image: string;
  eventDate: string | null;
  createdAt: string;
  updatedAt: string;
  author?: {
    id: string;
    fullName: string;
    avatarUrl: string | null;
  };
  community?: {
    id: string;
    name: string;
  };
}

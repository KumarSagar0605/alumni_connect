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
  milestones?: { name: string; done: boolean }[];
  techStack?: string[];
  lead?: string;
  created_by?: string | null;
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

export interface Job {
  id: string;
  title: string;
  department: string;
  type: string;
  compensation: string;
  hours: string;
  location: string;
  description: string;
  tag: string;
  icon: string;
}

export interface Resource {
  id: string;
  title: string;
  description: string;
  action_label: string;
  meta: string;
  icon: string;
  action_type: string;
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

export type UserRole = 'student' | 'alumni' | 'admin' | 'head';

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          user_id: string;
          full_name: string;
          role: UserRole;
          avatar_url: string;
          bio: string;
          skills: string[];
          education: {
            degree: string;
            school: string;
            years: string;
            details: string;
          };
          contact: {
            email: string;
            linkedin: string;
            github: string;
          };
          projects: {
            name: string;
            desc: string;
            tags: string[];
            type: 'code' | 'other';
          }[];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          full_name?: string;
          role?: UserRole;
          avatar_url?: string;
          bio?: string;
          skills?: string[];
          education?: {
            degree?: string;
            school?: string;
            years?: string;
            details?: string;
          };
          contact?: {
            email?: string;
            linkedin?: string;
            github?: string;
          };
          projects?: {
            name?: string;
            desc?: string;
            tags?: string[];
            type?: 'code' | 'other';
          }[];
        };
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>;
      };
      clubs: {
        Row: {
          id: string;
          name: string;
          category: string;
          description: string;
          image: string;
          logo: string;
          tag: string;
          tags: string[];
          equipment_access: string;
          weekly_meetings: string;
          leadership: any[];
          recent_activity: any[];
          resources: string[];
          members_count: number;
          joined: boolean;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          category?: string;
          description?: string;
          image?: string;
          logo?: string;
          tag?: string;
          tags?: string[];
          equipment_access?: string;
          weekly_meetings?: string;
          leadership?: any[];
          recent_activity?: any[];
          resources?: string[];
          members_count?: number;
          joined?: boolean;
          created_by?: string | null;
        };
        Update: Partial<Database['public']['Tables']['clubs']['Insert']>;
      };
      projects: {
        Row: {
          id: string;
          name: string;
          category: string;
          description: string;
          club_name: string;
          badge: string;
          needs_mentor: boolean;
          mentored: boolean;
          progress: number;
          joined: boolean;
          members: string[];
          milestones: { name: string; done: boolean }[];
          tech_stack: string[];
          lead: string;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          category?: string;
          description?: string;
          club_name?: string;
          badge?: string;
          needs_mentor?: boolean;
          mentored?: boolean;
          progress?: number;
          joined?: boolean;
          members?: string[];
          milestones?: { name: string; done: boolean }[];
          tech_stack?: string[];
          lead?: string;
          created_by?: string | null;
        };
        Update: Partial<Database['public']['Tables']['projects']['Insert']>;
      };
      events: {
        Row: {
          id: string;
          name: string;
          category: string;
          description: string;
          image: string;
          badge: string;
          event_date: string;
          time: string;
          location: string;
          host: string;
          registered: boolean;
          registered_count: number;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          category?: string;
          description?: string;
          image?: string;
          badge?: string;
          event_date?: string;
          time?: string;
          location?: string;
          host?: string;
          registered?: boolean;
          registered_count?: number;
          created_by?: string | null;
        };
        Update: Partial<Database['public']['Tables']['events']['Insert']>;
      };
      opportunities: {
        Row: {
          id: string;
          title: string;
          department: string;
          location: string;
          experience: string;
          compensation: string;
          skills: string[];
          description: string;
          candidates: any[];
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          department?: string;
          location?: string;
          experience?: string;
          compensation?: string;
          skills?: string[];
          description?: string;
          candidates?: any[];
          created_by?: string | null;
        };
        Update: Partial<Database['public']['Tables']['opportunities']['Insert']>;
      };
      messages: {
        Row: {
          id: string;
          sender_id: string;
          receiver_id: string | null;
          conversation_id: string | null;
          text: string;
          is_read: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          sender_id: string;
          receiver_id?: string | null;
          conversation_id?: string | null;
          text: string;
          is_read?: boolean;
        };
        Update: Partial<Database['public']['Tables']['messages']['Insert']>;
      };
      project_mentors: {
        Row: {
          id: string;
          project_id: string;
          mentor_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          mentor_id: string;
        };
        Update: Partial<Database['public']['Tables']['project_mentors']['Insert']>;
      };
      conversations: {
        Row: {
          id: string;
          student_id: string;
          mentor_profile_id: string;
          project_id: string;
          last_message_text: string;
          last_message_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          student_id: string;
          mentor_profile_id: string;
          project_id: string;
          last_message_text?: string;
        };
        Update: Partial<Database['public']['Tables']['conversations']['Insert']>;
      };
      communities: {
        Row: {
          id: string;
          name: string;
          description: string;
          image: string;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string;
          image?: string;
          created_by?: string | null;
        };
        Update: Partial<Database['public']['Tables']['communities']['Insert']>;
      };
      community_members: {
        Row: {
          id: string;
          community_id: string;
          profile_id: string;
          role: 'lead' | 'member';
          joined_at: string;
        };
        Insert: {
          id?: string;
          community_id: string;
          profile_id: string;
          role?: 'lead' | 'member';
        };
        Update: Partial<Database['public']['Tables']['community_members']['Insert']>;
      };
      community_posts: {
        Row: {
          id: string;
          community_id: string;
          author_id: string | null;
          title: string;
          content: string;
          post_type: 'event' | 'announcement' | 'update';
          image: string;
          event_date: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          community_id: string;
          author_id?: string | null;
          title: string;
          content?: string;
          post_type?: 'event' | 'announcement' | 'update';
          image?: string;
          event_date?: string | null;
        };
        Update: Partial<Database['public']['Tables']['community_posts']['Insert']>;
      };
    };
  };
}

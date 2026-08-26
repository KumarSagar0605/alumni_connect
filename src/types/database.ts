export type UserRole = 'student' | 'alumni' | 'admin';

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
          text: string;
          is_read: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          sender_id: string;
          receiver_id?: string | null;
          text: string;
          is_read?: boolean;
        };
        Update: Partial<Database['public']['Tables']['messages']['Insert']>;
      };
    };
  };
}

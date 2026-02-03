/**
 * Auto-generated types from database schema
 *
 * DO NOT EDIT MANUALLY
 * To regenerate, run: node scripts/gen-types-from-sql.js
 *
 * Generated: 2026-02-03T18:47:03.235Z
 */

export type Json = Record<string, unknown> | null

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          full_name: string | null
          user_role: string
          subscription_tier: string
          avatar_url: string | null
          is_active: boolean
          created_at: string
          last_login: string | null
          updated_at: string
        }
        Insert: {
          email: string
          full_name?: string | null
          user_role: string
          subscription_tier: string
          avatar_url?: string | null
          is_active: boolean
          last_login?: string | null
        }
        Update: {
          email?: string | null
          full_name?: string | null
          user_role?: string | null
          subscription_tier?: string | null
          avatar_url?: string | null
          is_active?: boolean | null
          last_login?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      domains: {
        Row: {
          id: string
          name: string
          slug: string
          description: string | null
          display_order: number
          is_active: boolean
        }
        Insert: {
          name: string
          slug: string
          description?: string | null
          display_order: number
          is_active: boolean
        }
        Update: {
          name?: string | null
          slug?: string | null
          description?: string | null
          display_order?: number | null
          is_active?: boolean | null
        }
        Relationships: []
      }
      subjects: {
        Row: {
          id: string
          domain_id: string
          name: string
          slug: string
          description: string | null
          display_order: number
          is_active: boolean
        }
        Insert: {
          domain_id: string
          name: string
          slug: string
          description?: string | null
          display_order: number
          is_active: boolean
        }
        Update: {
          domain_id?: string | null
          name?: string | null
          slug?: string | null
          description?: string | null
          display_order?: number | null
          is_active?: boolean | null
        }
        Relationships: []
      }
      topics: {
        Row: {
          id: string
          subject_id: string
          name: string
          slug: string
          description: string | null
          display_order: number
          is_active: boolean
        }
        Insert: {
          subject_id: string
          name: string
          slug: string
          description?: string | null
          display_order: number
          is_active: boolean
        }
        Update: {
          subject_id?: string | null
          name?: string | null
          slug?: string | null
          description?: string | null
          display_order?: number | null
          is_active?: boolean | null
        }
        Relationships: []
      }
      question_bank_versions: {
        Row: {
          id: string
          version_name: string
          csv_file_path: string | null
          imported_at: string
          total_questions: number
          is_active: boolean
          created_at: string
        }
        Insert: {
          version_name: string
          csv_file_path?: string | null
          imported_at: string
          total_questions: number
          is_active: boolean
        }
        Update: {
          version_name?: string | null
          csv_file_path?: string | null
          imported_at?: string | null
          total_questions?: number | null
          is_active?: boolean | null
        }
        Relationships: []
      }
      questions: {
        Row: {
          id: string
          question_bank_version_id: string
          question_text: string
          option_a: string
          option_b: string
          option_c: string
          option_d: string | null
          option_e: string | null
          correct_answer: string
          difficulty: string
          source_type: string
          subject_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          question_bank_version_id: string
          question_text: string
          option_a: string
          option_b: string
          option_c: string
          option_d?: string | null
          option_e?: string | null
          correct_answer: string
          difficulty: string
          source_type: string
          subject_id?: string | null
        }
        Update: {
          question_bank_version_id?: string | null
          question_text?: string | null
          option_a?: string | null
          option_b?: string | null
          option_c?: string | null
          option_d?: string | null
          option_e?: string | null
          correct_answer?: string | null
          difficulty?: string | null
          source_type?: string | null
          subject_id?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      question_topics: {
        Row: {
          id: string
          question_id: string
          topic_id: string
          relevance_score: number | null
          created_at: string
        }
        Insert: {
          question_id: string
          topic_id: string
          relevance_score?: number | null
        }
        Update: {
          question_id?: string | null
          topic_id?: string | null
          relevance_score?: number | null
        }
        Relationships: []
      }
      question_reputation: {
        Row: {
          id: string
          question_id: string
          current_score: number
          status: string
          total_attempts: number
          correct_attempts: number
          created_at: string
          updated_at: string
        }
        Insert: {
          question_id: string
          current_score: number
          status: string
          total_attempts: number
          correct_attempts: number
        }
        Update: {
          question_id?: string | null
          current_score?: number | null
          status?: string | null
          total_attempts?: number | null
          correct_attempts?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      question_feedback: {
        Row: {
          id: string
          question_id: string
          user_id: string
          category: string
          feedback_text: string
          status: string
          is_priority: boolean
          reviewer_notes: string | null
          submitted_at: string
          created_at: string
        }
        Insert: {
          question_id: string
          user_id: string
          category: string
          feedback_text: string
          status: string
          is_priority: boolean
          reviewer_notes?: string | null
          submitted_at: string
        }
        Update: {
          question_id?: string | null
          user_id?: string | null
          category?: string | null
          feedback_text?: string | null
          status?: string | null
          is_priority?: boolean | null
          reviewer_notes?: string | null
          submitted_at?: string | null
        }
        Relationships: []
      }
      question_reviews: {
        Row: {
          id: string
          question_id: string
          reviewer_id: string
          decision: string
          notes: string | null
          reviewed_at: string
          created_at: string
        }
        Insert: {
          question_id: string
          reviewer_id: string
          decision: string
          notes?: string | null
          reviewed_at: string
        }
        Update: {
          question_id?: string | null
          reviewer_id?: string | null
          decision?: string | null
          notes?: string | null
          reviewed_at?: string | null
        }
        Relationships: []
      }
      user_question_history: {
        Row: {
          id: string
          user_id: string
          question_id: string
          selected_answer: string
          is_correct: boolean
          response_time_ms: number | null
          session_id: string | null
          context: string | null
          created_at: string
        }
        Insert: {
          user_id: string
          question_id: string
          selected_answer: string
          is_correct: boolean
          response_time_ms?: number | null
          session_id?: string | null
          context?: string | null
        }
        Update: {
          user_id?: string | null
          question_id?: string | null
          selected_answer?: string | null
          is_correct?: boolean | null
          response_time_ms?: number | null
          session_id?: string | null
          context?: string | null
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          id: string
          user_id: string
          plan_tier: string
          started_at: string
          expires_at: string | null
          created_at: string
        }
        Insert: {
          user_id: string
          plan_tier: string
          started_at: string
          expires_at?: string | null
        }
        Update: {
          user_id?: string | null
          plan_tier?: string | null
          started_at?: string | null
          expires_at?: string | null
        }
        Relationships: []
      }
      exams: {
        Row: {
          id: string
          created_by: string
          name: string
          description: string | null
          is_public: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          created_by: string
          name: string
          description?: string | null
          is_public: boolean
        }
        Update: {
          created_by?: string | null
          name?: string | null
          description?: string | null
          is_public?: boolean | null
          updated_at?: string | null
        }
        Relationships: []
      }
      exam_questions: {
        Row: {
          id: string
          exam_id: string
          question_id: string
          order_index: number
          created_at: string
        }
        Insert: {
          exam_id: string
          question_id: string
          order_index: number
        }
        Update: {
          exam_id?: string | null
          question_id?: string | null
          order_index?: number | null
        }
        Relationships: []
      }
      user_exam_attempts: {
        Row: {
          id: string
          exam_id: string
          user_id: string
          is_completed: boolean
          started_at: string
          completed_at: string | null
          created_at: string
        }
        Insert: {
          exam_id: string
          user_id: string
          is_completed: boolean
          started_at: string
          completed_at?: string | null
        }
        Update: {
          exam_id?: string | null
          user_id?: string | null
          is_completed?: boolean | null
          started_at?: string | null
          completed_at?: string | null
        }
        Relationships: []
      }
      user_exam_answers: {
        Row: {
          id: string
          attempt_id: string
          question_id: string
          selected_answer: string
          is_correct: boolean | null
          created_at: string
        }
        Insert: {
          attempt_id: string
          question_id: string
          selected_answer: string
          is_correct?: boolean | null
        }
        Update: {
          attempt_id?: string | null
          question_id?: string | null
          selected_answer?: string | null
          is_correct?: boolean | null
        }
        Relationships: []
      }
      question_sources: {
        Row: {
          id: string
          question_id: string
          source_type: string
          rag_eligible: boolean
          created_at: string
          approved_at: string | null
          approved_by: string | null
        }
        Insert: {
          question_id: string
          source_type: string
          rag_eligible: boolean
          approved_at?: string | null
          approved_by?: string | null
        }
        Update: {
          question_id?: string | null
          source_type?: string | null
          rag_eligible?: boolean | null
          approved_at?: string | null
          approved_by?: string | null
        }
        Relationships: []
      }
      audit_log: {
        Row: {
          id: string
          table_name: string
          operation: string
          record_id: string
          old_value: Record<string, unknown> | null
          new_value: Record<string, unknown> | null
          changed_by: string | null
          changed_at: string
        }
        Insert: {
          table_name: string
          operation: string
          record_id: string
          old_value?: Record<string, unknown> | null
          new_value?: Record<string, unknown> | null
          changed_by?: string | null
          changed_at: string
        }
        Update: {
          table_name?: string | null
          operation?: string | null
          record_id?: string | null
          old_value?: Record<string, unknown> | null
          new_value?: Record<string, unknown> | null
          changed_by?: string | null
          changed_at?: string | null
        }
        Relationships: []
      }
      question_imports: {
        Row: {
          id: string
          admin_id: string
          csv_filename: string
          total_rows: number
          successful_imports: number
          duplicate_count: number
          error_count: number
          status: string
          error_details: Record<string, unknown> | null
          estimated_completion_time: string | null
          started_at: string
          completed_at: string | null
          created_at: string
        }
        Insert: {
          admin_id: string
          csv_filename: string
          total_rows: number
          successful_imports: number
          duplicate_count: number
          error_count: number
          status: string
          error_details?: Record<string, unknown> | null
          estimated_completion_time?: string | null
          started_at: string
          completed_at?: string | null
        }
        Update: {
          admin_id?: string | null
          csv_filename?: string | null
          total_rows?: number | null
          successful_imports?: number | null
          duplicate_count?: number | null
          error_count?: number | null
          status?: string | null
          error_details?: Record<string, unknown> | null
          estimated_completion_time?: string | null
          started_at?: string | null
          completed_at?: string | null
        }
        Relationships: []
      }
      import_question_mapping: {
        Row: {
          id: string
          import_id: string
          question_id: string
          created_at: string
        }
        Insert: {
          import_id: string
          question_id: string
        }
        Update: {
          import_id?: string | null
          question_id?: string | null
        }
        Relationships: []
      }
      admin_dashboard_stats: {
        Row: {
          total_users: number
          active_users_30d: number
          active_users_7d: number
          active_users_24h: number
          total_questions: number
          real_exam_questions: number
          ai_generated_questions: number
          total_completed_imports: number
          total_failed_imports: number
          last_import_date: string | null
          avg_question_reputation: number | null
          pending_feedback_count: number
          last_updated: string
        }
        Insert: {
          total_users: number
          active_users_30d: number
          active_users_7d: number
          active_users_24h: number
          total_questions: number
          real_exam_questions: number
          ai_generated_questions: number
          total_completed_imports: number
          total_failed_imports: number
          last_import_date?: string | null
          avg_question_reputation?: number | null
          pending_feedback_count: number
          last_updated: string
        }
        Update: {
          total_users?: number | null
          active_users_30d?: number | null
          active_users_7d?: number | null
          active_users_24h?: number | null
          total_questions?: number | null
          real_exam_questions?: number | null
          ai_generated_questions?: number | null
          total_completed_imports?: number | null
          total_failed_imports?: number | null
          last_import_date?: string | null
          avg_question_reputation?: number | null
          pending_feedback_count?: number | null
          last_updated?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      admin_dashboard_stats: {
        Row: Database['public']['Tables']['admin_dashboard_stats']['Row']
        Relationships: []
      }
    }
    Functions: {
      get_import_progress: {
        Args: { p_import_id: string }
        Returns: Array<{
          import_id: string
          status: string
          processed: number
          total: number
          progress_percent: number
          duplicate_count: number
          error_count: number
        }>
      }
      rollback_import: {
        Args: { p_import_id: string }
        Returns: Array<{
          success: boolean
          questions_deleted: number
          message: string
        }>
      }
      get_import_history: {
        Args: { p_admin_id: string; p_limit: number }
        Returns: Array<{
          import_id: string
          csv_filename: string
          total_rows: number
          successful_imports: number
          duplicate_count: number
          error_count: number
          status: string
          created_at: string
        }>
      }
      refresh_admin_dashboard_stats: {
        Args: {}
        Returns: void
      }
    }
    Enums: {
      import_status_enum: 'queued' | 'in_progress' | 'completed' | 'failed' | 'rollback'
      source_type_enum: 'real_exam' | 'ai_generated' | 'expert_approved'
    }
    CompositeTypes: {}
  }
}

export type Tables<
  PublicTableNameOrOptions extends
    | keyof Database["public"]["Tables"]
    | { schema: keyof Database }
    | { schema: keyof Omit<Database, "public"> }
    | Exclude<keyof Database, "Functions">,
  TableName extends PublicTableNameOrOptions extends { schema: infer S }
    ? S extends keyof Database
      ? keyof Database[S]["Tables"]
      : never
    : PublicTableNameOrOptions extends keyof Database["public"]["Tables"]
      ? PublicTableNameOrOptions
      : never = never,
> = PublicTableNameOrOptions extends { schema: infer S }
  ? S extends keyof Database
    ? Database[S]["Tables"][TableName] extends {
        Row: infer R;
      }
      ? R
      : never
    : never
  : PublicTableNameOrOptions extends keyof Database["public"]["Tables"]
    ? Database["public"]["Tables"][PublicTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

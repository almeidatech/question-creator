#!/usr/bin/env node

/**
 * Generate TypeScript types from SQL migration files
 * This is a fallback when direct database connection is not available
 *
 * Usage: node scripts/gen-types-from-sql.js
 */

const fs = require("fs");
const path = require("path");

// Table definitions extracted from SQL schema
const tableDefinitions = {
  users: {
    id: "string",
    email: "string",
    full_name: "string | null",
    user_role: "string",
    subscription_tier: "string",
    avatar_url: "string | null",
    is_active: "boolean",
    created_at: "string",
    last_login: "string | null",
    updated_at: "string",
  },
  domains: {
    id: "string",
    name: "string",
    slug: "string",
    description: "string | null",
    display_order: "number",
    is_active: "boolean",
  },
  subjects: {
    id: "string",
    domain_id: "string",
    name: "string",
    slug: "string",
    description: "string | null",
    display_order: "number",
    is_active: "boolean",
  },
  topics: {
    id: "string",
    subject_id: "string",
    name: "string",
    slug: "string",
    description: "string | null",
    display_order: "number",
    is_active: "boolean",
  },
  question_bank_versions: {
    id: "string",
    version_name: "string",
    csv_file_path: "string | null",
    imported_at: "string",
    total_questions: "number",
    is_active: "boolean",
    created_at: "string",
  },
  questions: {
    id: "string",
    question_bank_version_id: "string",
    question_text: "string",
    option_a: "string",
    option_b: "string",
    option_c: "string",
    option_d: "string | null",
    option_e: "string | null",
    correct_answer: "string",
    difficulty: "string",
    source_type: "string",
    subject_id: "string | null",
    created_at: "string",
    updated_at: "string",
  },
  question_topics: {
    id: "string",
    question_id: "string",
    topic_id: "string",
    relevance_score: "number | null",
    created_at: "string",
  },
  question_reputation: {
    id: "string",
    question_id: "string",
    current_score: "number",
    status: "string",
    total_attempts: "number",
    correct_attempts: "number",
    created_at: "string",
    updated_at: "string",
  },
  question_feedback: {
    id: "string",
    question_id: "string",
    user_id: "string",
    category: "string",
    feedback_text: "string",
    status: "string",
    is_priority: "boolean",
    reviewer_notes: "string | null",
    submitted_at: "string",
    created_at: "string",
  },
  question_reviews: {
    id: "string",
    question_id: "string",
    reviewer_id: "string",
    decision: "string",
    notes: "string | null",
    reviewed_at: "string",
    created_at: "string",
  },
  user_question_history: {
    id: "string",
    user_id: "string",
    question_id: "string",
    selected_answer: "string",
    is_correct: "boolean",
    response_time_ms: "number | null",
    session_id: "string | null",
    context: "string | null",
    created_at: "string",
  },
  subscriptions: {
    id: "string",
    user_id: "string",
    plan_tier: "string",
    started_at: "string",
    expires_at: "string | null",
    created_at: "string",
  },
  exams: {
    id: "string",
    created_by: "string",
    name: "string",
    description: "string | null",
    is_public: "boolean",
    created_at: "string",
    updated_at: "string",
  },
  exam_questions: {
    id: "string",
    exam_id: "string",
    question_id: "string",
    order_index: "number",
    created_at: "string",
  },
  user_exam_attempts: {
    id: "string",
    exam_id: "string",
    user_id: "string",
    is_completed: "boolean",
    started_at: "string",
    completed_at: "string | null",
    created_at: "string",
  },
  user_exam_answers: {
    id: "string",
    attempt_id: "string",
    question_id: "string",
    selected_answer: "string",
    is_correct: "boolean | null",
    created_at: "string",
  },
  question_sources: {
    id: "string",
    question_id: "string",
    source_type: "string",
    rag_eligible: "boolean",
    created_at: "string",
    approved_at: "string | null",
    approved_by: "string | null",
  },
  audit_log: {
    id: "string",
    table_name: "string",
    operation: "string",
    record_id: "string",
    old_value: "Record<string, unknown> | null",
    new_value: "Record<string, unknown> | null",
    changed_by: "string | null",
    changed_at: "string",
  },
  question_imports: {
    id: "string",
    admin_id: "string",
    csv_filename: "string",
    total_rows: "number",
    successful_imports: "number",
    duplicate_count: "number",
    error_count: "number",
    status: "string",
    error_details: "Record<string, unknown> | null",
    estimated_completion_time: "string | null",
    started_at: "string",
    completed_at: "string | null",
    created_at: "string",
  },
  import_question_mapping: {
    id: "string",
    import_id: "string",
    question_id: "string",
    created_at: "string",
  },
  admin_dashboard_stats: {
    total_users: "number",
    active_users_30d: "number",
    active_users_7d: "number",
    active_users_24h: "number",
    total_questions: "number",
    real_exam_questions: "number",
    ai_generated_questions: "number",
    total_completed_imports: "number",
    total_failed_imports: "number",
    last_import_date: "string | null",
    avg_question_reputation: "number | null",
    pending_feedback_count: "number",
    last_updated: "string",
  },
};

/**
 * Generate TypeScript type definitions
 */
function generateTypes() {
  let output = `/**
 * Auto-generated types from database schema
 *
 * DO NOT EDIT MANUALLY
 * To regenerate, run: node scripts/gen-types-from-sql.js
 *
 * Generated: ${new Date().toISOString()}
 */

export type Json = Record<string, unknown> | null

export interface Database {
  public: {
    Tables: {
`;

  // Generate table types
  Object.entries(tableDefinitions).forEach(([tableName, columns]) => {
    output += `      ${tableName}: {
        Row: {
`;

    // Row type
    Object.entries(columns).forEach(([colName, colType]) => {
      output += `          ${colName}: ${colType}\n`;
    });

    output += `        }
        Insert: {
`;

    // Insert type (omit id, created_at, updated_at)
    Object.entries(columns).forEach(([colName, colType]) => {
      if (!["id", "created_at", "updated_at"].includes(colName)) {
        // Make nullable fields optional
        const isOptional = colType.includes("| null");
        const baseType = colType.replace(" | null", "");
        const typeStr = isOptional ? `${baseType} | null` : baseType;
        output += `          ${colName}${isOptional ? "?" : ""}: ${typeStr}\n`;
      }
    });

    output += `        }
        Update: {
`;

    // Update type (all fields except id, created_at)
    Object.entries(columns).forEach(([colName, colType]) => {
      if (!["id", "created_at"].includes(colName)) {
        const baseType = colType.replace(" | null", "");
        output += `          ${colName}?: ${baseType} | null\n`;
      }
    });

    output += `        }
        Relationships: []
      }
`;
  });

  output += `    }
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
`;

  return output;
}

/**
 * Main function
 */
function main() {
  console.log("🔄 Generating TypeScript types from schema...\n");

  try {
    const typeDefinitions = generateTypes();
    const outputPath = path.join(__dirname, "../src/database/database.types.ts");

    // Ensure directory exists
    const outputDir = path.dirname(outputPath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    fs.writeFileSync(outputPath, typeDefinitions, "utf-8");

    console.log(`✅ Types generated successfully!\n`);
    console.log(`📝 Output: ${outputPath}\n`);

    // Print summary
    console.log("Tables generated:");
    Object.keys(tableDefinitions).forEach((table) => {
      const colCount = Object.keys(tableDefinitions[table]).length;
      console.log(`  ✓ ${table} (${colCount} columns)`);
    });

    console.log("\n💡 Usage:");
    console.log(`  import type { Database, Tables } from '@/database/database.types'`);
    console.log(`  type User = Tables<'users'>`);
    console.log(`  type UserRow = Database['public']['Tables']['users']['Row']`);
  } catch (error) {
    console.error("\n❌ Error:", error.message);
    process.exit(1);
  }
}

main();

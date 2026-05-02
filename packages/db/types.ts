export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  audit: {
    Tables: {
      access_log: {
        Row: {
          action: string
          actor_id: string | null
          actor_role: Database["public"]["Enums"]["user_role"] | null
          details: Json | null
          id: number
          ip_address: unknown
          occurred_at: string
          row_id: string | null
          schema_name: string
          table_name: string
        }
        Insert: {
          action: string
          actor_id?: string | null
          actor_role?: Database["public"]["Enums"]["user_role"] | null
          details?: Json | null
          id?: never
          ip_address?: unknown
          occurred_at?: string
          row_id?: string | null
          schema_name: string
          table_name: string
        }
        Update: {
          action?: string
          actor_id?: string | null
          actor_role?: Database["public"]["Enums"]["user_role"] | null
          details?: Json | null
          id?: never
          ip_address?: unknown
          occurred_at?: string
          row_id?: string | null
          schema_name?: string
          table_name?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  clinical: {
    Tables: {
      care_team: {
        Row: {
          active: boolean
          clinician_id: string
          created_at: string
          id: string
          patient_id: string
          relationship: string
        }
        Insert: {
          active?: boolean
          clinician_id: string
          created_at?: string
          id?: string
          patient_id: string
          relationship?: string
        }
        Update: {
          active?: boolean
          clinician_id?: string
          created_at?: string
          id?: string
          patient_id?: string
          relationship?: string
        }
        Relationships: []
      }
      cgm_readings: {
        Row: {
          created_at: string
          created_by: string | null
          device: string | null
          glucose_mg_dl: number
          id: string
          patient_id: string
          reading_at: string
          source: string
          trend: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          device?: string | null
          glucose_mg_dl: number
          id?: string
          patient_id: string
          reading_at: string
          source?: string
          trend?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          device?: string | null
          glucose_mg_dl?: number
          id?: string
          patient_id?: string
          reading_at?: string
          source?: string
          trend?: string | null
        }
        Relationships: []
      }
      lab_results: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          loinc_code: string | null
          measured_at: string
          patient_id: string
          ref_high: number | null
          ref_low: number | null
          source: string | null
          test_name: string
          unit: string
          value: number
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          loinc_code?: string | null
          measured_at: string
          patient_id: string
          ref_high?: number | null
          ref_low?: number | null
          source?: string | null
          test_name: string
          unit: string
          value: number
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          loinc_code?: string | null
          measured_at?: string
          patient_id?: string
          ref_high?: number | null
          ref_low?: number | null
          source?: string | null
          test_name?: string
          unit?: string
          value?: number
        }
        Relationships: []
      }
      medications: {
        Row: {
          created_at: string
          created_by: string | null
          dose: string | null
          frequency: string | null
          id: string
          name: string
          notes: string | null
          patient_id: string
          prescribed_by: string | null
          rxnorm_code: string | null
          started_on: string | null
          stopped_on: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          dose?: string | null
          frequency?: string | null
          id?: string
          name: string
          notes?: string | null
          patient_id: string
          prescribed_by?: string | null
          rxnorm_code?: string | null
          started_on?: string | null
          stopped_on?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          dose?: string | null
          frequency?: string | null
          id?: string
          name?: string
          notes?: string | null
          patient_id?: string
          prescribed_by?: string | null
          rxnorm_code?: string | null
          started_on?: string | null
          stopped_on?: string | null
        }
        Relationships: []
      }
      patient_demographics: {
        Row: {
          created_at: string
          created_by: string | null
          date_of_birth: string | null
          diabetes_type: string | null
          diagnosis_date: string | null
          emirates_id_hash: string | null
          ethnicity: string | null
          height_cm: number | null
          nationality: string | null
          patient_id: string
          sex: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          date_of_birth?: string | null
          diabetes_type?: string | null
          diagnosis_date?: string | null
          emirates_id_hash?: string | null
          ethnicity?: string | null
          height_cm?: number | null
          nationality?: string | null
          patient_id: string
          sex?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          date_of_birth?: string | null
          diabetes_type?: string | null
          diagnosis_date?: string | null
          emirates_id_hash?: string | null
          ethnicity?: string | null
          height_cm?: number | null
          nationality?: string | null
          patient_id?: string
          sex?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      twin_predictions: {
        Row: {
          confidence: Json | null
          created_at: string
          horizon_minutes: number | null
          id: string
          model_name: string
          model_version: string
          output: Json
          patient_id: string
          predicted_at: string
        }
        Insert: {
          confidence?: Json | null
          created_at?: string
          horizon_minutes?: number | null
          id?: string
          model_name: string
          model_version: string
          output: Json
          patient_id: string
          predicted_at?: string
        }
        Update: {
          confidence?: Json | null
          created_at?: string
          horizon_minutes?: number | null
          id?: string
          model_name?: string
          model_version?: string
          output?: Json
          patient_id?: string
          predicted_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  external: {
    Tables: {
      mohap_diabetes_prevalence: {
        Row: {
          age_group: string | null
          emirate: string | null
          fetched_at: string
          id: string
          prevalence: number | null
          raw_payload: Json | null
          sex: string | null
          source_url: string
          year: number
        }
        Insert: {
          age_group?: string | null
          emirate?: string | null
          fetched_at?: string
          id?: string
          prevalence?: number | null
          raw_payload?: Json | null
          sex?: string | null
          source_url: string
          year: number
        }
        Update: {
          age_group?: string | null
          emirate?: string | null
          fetched_at?: string
          id?: string
          prevalence?: number | null
          raw_payload?: Json | null
          sex?: string | null
          source_url?: string
          year?: number
        }
        Relationships: []
      }
      raw_ingestions: {
        Row: {
          dataset: string
          fetched_at: string
          id: string
          payload: Json
          source: string
          status: string
        }
        Insert: {
          dataset: string
          fetched_at?: string
          id?: string
          payload: Json
          source: string
          status?: string
        }
        Update: {
          dataset?: string
          fetched_at?: string
          id?: string
          payload?: Json
          source?: string
          status?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      user_profiles: {
        Row: {
          created_at: string
          email: string
          emirate: string | null
          full_name: string | null
          id: string
          organization: string | null
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          emirate?: string | null
          full_name?: string | null
          id: string
          organization?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          emirate?: string | null
          full_name?: string | null
          id?: string
          organization?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      current_user_role: {
        Args: never
        Returns: Database["public"]["Enums"]["user_role"]
      }
    }
    Enums: {
      user_role: "patient" | "clinician" | "researcher" | "admin"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  research: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      cohort_overview: {
        Row: {
          age_band: string | null
          diabetes_type: string | null
          diagnosis_month: string | null
          ethnicity: string | null
          n: number | null
          sex: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  audit: {
    Enums: {},
  },
  clinical: {
    Enums: {},
  },
  external: {
    Enums: {},
  },
  public: {
    Enums: {
      user_role: ["patient", "clinician", "researcher", "admin"],
    },
  },
  research: {
    Enums: {},
  },
} as const


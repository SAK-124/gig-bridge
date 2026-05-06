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
  public: {
    Tables: {
      applications: {
        Row: {
          cover_letter: string | null
          created_at: string
          gig_id: string
          id: string
          status: Database["public"]["Enums"]["application_status"]
          student_id: string
          updated_at: string
        }
        Insert: {
          cover_letter?: string | null
          created_at?: string
          gig_id: string
          id?: string
          status?: Database["public"]["Enums"]["application_status"]
          student_id: string
          updated_at?: string
        }
        Update: {
          cover_letter?: string | null
          created_at?: string
          gig_id?: string
          id?: string
          status?: Database["public"]["Enums"]["application_status"]
          student_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "applications_gig_id_fkey"
            columns: ["gig_id"]
            isOneToOne: false
            referencedRelation: "gigs"
            referencedColumns: ["id"]
          },
        ]
      }
      bank_details: {
        Row: {
          account_title: string | null
          bank_name: string | null
          cnic: string | null
          created_at: string
          easypaisa: string | null
          iban: string | null
          id: string
          jazzcash: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          account_title?: string | null
          bank_name?: string | null
          cnic?: string | null
          created_at?: string
          easypaisa?: string | null
          iban?: string | null
          id?: string
          jazzcash?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          account_title?: string | null
          bank_name?: string | null
          cnic?: string | null
          created_at?: string
          easypaisa?: string | null
          iban?: string | null
          id?: string
          jazzcash?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      disputes: {
        Row: {
          admin_notes: string | null
          created_at: string
          evidence_urls: string[] | null
          hire_id: string
          id: string
          raised_by_id: string
          raised_by_role: string
          reason: string
          resolution: string | null
          resolved_at: string | null
          status: string
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string
          evidence_urls?: string[] | null
          hire_id: string
          id?: string
          raised_by_id: string
          raised_by_role: string
          reason: string
          resolution?: string | null
          resolved_at?: string | null
          status?: string
        }
        Update: {
          admin_notes?: string | null
          created_at?: string
          evidence_urls?: string[] | null
          hire_id?: string
          id?: string
          raised_by_id?: string
          raised_by_role?: string
          reason?: string
          resolution?: string | null
          resolved_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "disputes_hire_id_fkey"
            columns: ["hire_id"]
            isOneToOne: false
            referencedRelation: "hires"
            referencedColumns: ["id"]
          },
        ]
      }
      gigs: {
        Row: {
          acceptance_criteria: string | null
          attachments: string[] | null
          brief: Json | null
          budget: number
          business_id: string
          category: string | null
          created_at: string
          deliverables: string | null
          deadline: string | null
          description: string
          id: string
          location: Database["public"]["Enums"]["location_type"]
          required_skills: string[] | null
          slots: number
          status: Database["public"]["Enums"]["gig_status"]
          title: string
          updated_at: string
        }
        Insert: {
          acceptance_criteria?: string | null
          attachments?: string[] | null
          brief?: Json | null
          budget: number
          business_id: string
          category?: string | null
          created_at?: string
          deliverables?: string | null
          deadline?: string | null
          description: string
          id?: string
          location?: Database["public"]["Enums"]["location_type"]
          required_skills?: string[] | null
          slots?: number
          status?: Database["public"]["Enums"]["gig_status"]
          title: string
          updated_at?: string
        }
        Update: {
          acceptance_criteria?: string | null
          attachments?: string[] | null
          brief?: Json | null
          budget?: number
          business_id?: string
          category?: string | null
          created_at?: string
          deliverables?: string | null
          deadline?: string | null
          description?: string
          id?: string
          location?: Database["public"]["Enums"]["location_type"]
          required_skills?: string[] | null
          slots?: number
          status?: Database["public"]["Enums"]["gig_status"]
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      hires: {
        Row: {
          application_id: string | null
          business_id: string
          created_at: string
          gig_id: string
          id: string
          status: Database["public"]["Enums"]["hire_status"]
          student_id: string
          updated_at: string
        }
        Insert: {
          application_id?: string | null
          business_id: string
          created_at?: string
          gig_id: string
          id?: string
          status?: Database["public"]["Enums"]["hire_status"]
          student_id: string
          updated_at?: string
        }
        Update: {
          application_id?: string | null
          business_id?: string
          created_at?: string
          gig_id?: string
          id?: string
          status?: Database["public"]["Enums"]["hire_status"]
          student_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "hires_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hires_gig_id_fkey"
            columns: ["gig_id"]
            isOneToOne: false
            referencedRelation: "gigs"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          attachment_urls: string[] | null
          created_at: string
          hire_id: string
          id: string
          message_text: string
          sender_id: string
        }
        Insert: {
          attachment_urls?: string[] | null
          created_at?: string
          hire_id: string
          id?: string
          message_text: string
          sender_id: string
        }
        Update: {
          attachment_urls?: string[] | null
          created_at?: string
          hire_id?: string
          id?: string
          message_text?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_hire_id_fkey"
            columns: ["hire_id"]
            isOneToOne: false
            referencedRelation: "hires"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          admin_payout_proof_uploaded_at: string | null
          admin_payout_proof_url: string | null
          admin_verified_at: string | null
          admin_verified_by: string | null
          business_proof_reference: string | null
          business_proof_uploaded_at: string | null
          business_proof_url: string | null
          created_at: string
          currency: string
          gig_amount: number
          hire_id: string
          id: string
          paid_to_student_at: string | null
          payout_method: string | null
          payout_method_label: string | null
          payout_reference: string | null
          platform_fee: number
          shopify_checkout_url: string | null
          shopify_order_id: string | null
          status: Database["public"]["Enums"]["payment_status"]
          total_amount: number
          updated_at: string
        }
        Insert: {
          admin_payout_proof_uploaded_at?: string | null
          admin_payout_proof_url?: string | null
          admin_verified_at?: string | null
          admin_verified_by?: string | null
          business_proof_reference?: string | null
          business_proof_uploaded_at?: string | null
          business_proof_url?: string | null
          created_at?: string
          currency?: string
          gig_amount: number
          hire_id: string
          id?: string
          paid_to_student_at?: string | null
          payout_method?: string | null
          payout_method_label?: string | null
          payout_reference?: string | null
          platform_fee: number
          shopify_checkout_url?: string | null
          shopify_order_id?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          total_amount: number
          updated_at?: string
        }
        Update: {
          admin_payout_proof_uploaded_at?: string | null
          admin_payout_proof_url?: string | null
          admin_verified_at?: string | null
          admin_verified_by?: string | null
          business_proof_reference?: string | null
          business_proof_uploaded_at?: string | null
          business_proof_url?: string | null
          created_at?: string
          currency?: string
          gig_amount?: number
          hire_id?: string
          id?: string
          paid_to_student_at?: string | null
          payout_method?: string | null
          payout_method_label?: string | null
          payout_reference?: string | null
          platform_fee?: number
          shopify_checkout_url?: string | null
          shopify_order_id?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          total_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_hire_id_fkey"
            columns: ["hire_id"]
            isOneToOne: true
            referencedRelation: "hires"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_bank_accounts: {
        Row: {
          account_number: string | null
          account_title: string | null
          bank_name: string | null
          created_at: string
          easypaisa_number: string | null
          iban: string | null
          id: string
          instructions: string | null
          is_active: boolean
          jazzcash_number: string | null
          label: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          account_number?: string | null
          account_title?: string | null
          bank_name?: string | null
          created_at?: string
          easypaisa_number?: string | null
          iban?: string | null
          id?: string
          instructions?: string | null
          is_active?: boolean
          jazzcash_number?: string | null
          label: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          account_number?: string | null
          account_title?: string | null
          bank_name?: string | null
          created_at?: string
          easypaisa_number?: string | null
          iban?: string | null
          id?: string
          instructions?: string | null
          is_active?: boolean
          jazzcash_number?: string | null
          label?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      disputes: {
        Row: {
          admin_notes: string | null
          created_at: string
          evidence_urls: string[] | null
          hire_id: string
          id: string
          reason: string
          resolution: "release" | "refund" | "revision" | null
          resolved_at: string | null
          raised_by_id: string
          raised_by_role: "student" | "business"
          status: "open" | "reviewing" | "resolved"
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string
          evidence_urls?: string[] | null
          hire_id: string
          id?: string
          reason: string
          resolution?: "release" | "refund" | "revision" | null
          resolved_at?: string | null
          raised_by_id: string
          raised_by_role: "student" | "business"
          status?: "open" | "reviewing" | "resolved"
        }
        Update: {
          admin_notes?: string | null
          created_at?: string
          evidence_urls?: string[] | null
          hire_id?: string
          id?: string
          reason?: string
          resolution?: "release" | "refund" | "revision" | null
          resolved_at?: string | null
          raised_by_id?: string
          raised_by_role?: "student" | "business"
          status?: "open" | "reviewing" | "resolved"
        }
        Relationships: []
      }
      messages: {
        Row: {
          attachment_urls: string[] | null
          created_at: string
          hire_id: string
          id: string
          message_text: string
          sender_id: string
        }
        Insert: {
          attachment_urls?: string[] | null
          created_at?: string
          hire_id: string
          id?: string
          message_text: string
          sender_id: string
        }
        Update: {
          attachment_urls?: string[] | null
          created_at?: string
          hire_id?: string
          id?: string
          message_text?: string
          sender_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          availability: string | null
          avatar_url: string | null
          bio: string | null
          certifications: string[] | null
          company_description: string | null
          company_name: string | null
          company_website: string | null
          contact_email: string | null
          contact_number: string | null
          created_at: string
          degree: string | null
          full_name: string | null
          graduation_year: number | null
          id: string
          instagram_url: string | null
          is_business_verified: boolean
          is_student_verified: boolean
          linkedin_url: string | null
          portfolio_links: string[] | null
          preferred_work_type: Database["public"]["Enums"]["work_type"] | null
          resume_url: string | null
          skills: string[] | null
          university: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          availability?: string | null
          avatar_url?: string | null
          bio?: string | null
          certifications?: string[] | null
          company_description?: string | null
          company_name?: string | null
          company_website?: string | null
          contact_email?: string | null
          contact_number?: string | null
          created_at?: string
          degree?: string | null
          full_name?: string | null
          graduation_year?: number | null
          id?: string
          instagram_url?: string | null
          is_business_verified?: boolean
          is_student_verified?: boolean
          linkedin_url?: string | null
          portfolio_links?: string[] | null
          preferred_work_type?: Database["public"]["Enums"]["work_type"] | null
          resume_url?: string | null
          skills?: string[] | null
          university?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          availability?: string | null
          avatar_url?: string | null
          bio?: string | null
          certifications?: string[] | null
          company_description?: string | null
          company_name?: string | null
          company_website?: string | null
          contact_email?: string | null
          contact_number?: string | null
          created_at?: string
          degree?: string | null
          full_name?: string | null
          graduation_year?: number | null
          id?: string
          instagram_url?: string | null
          is_business_verified?: boolean
          is_student_verified?: boolean
          linkedin_url?: string | null
          portfolio_links?: string[] | null
          preferred_work_type?: Database["public"]["Enums"]["work_type"] | null
          resume_url?: string | null
          skills?: string[] | null
          university?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      reviews: {
        Row: {
          created_at: string
          hire_id: string
          id: string
          rating: number
          reviewer_id: string
          reviewer_role: string
          reviewee_id: string
          review_text: string | null
        }
        Insert: {
          created_at?: string
          hire_id: string
          id?: string
          rating: number
          reviewer_id: string
          reviewer_role: string
          reviewee_id: string
          review_text?: string | null
        }
        Update: {
          created_at?: string
          hire_id?: string
          id?: string
          rating?: number
          reviewer_id?: string
          reviewer_role?: string
          reviewee_id?: string
          review_text?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reviews_hire_id_fkey"
            columns: ["hire_id"]
            isOneToOne: false
            referencedRelation: "hires"
            referencedColumns: ["id"]
          },
        ]
      }
      submissions: {
        Row: {
          created_at: string
          file_url: string | null
          hire_id: string
          id: string
          link_url: string | null
          message: string | null
          status: Database["public"]["Enums"]["submission_status"]
        }
        Insert: {
          created_at?: string
          file_url?: string | null
          hire_id: string
          id?: string
          link_url?: string | null
          message?: string | null
          status?: Database["public"]["Enums"]["submission_status"]
        }
        Update: {
          created_at?: string
          file_url?: string | null
          hire_id?: string
          id?: string
          link_url?: string | null
          message?: string | null
          status?: Database["public"]["Enums"]["submission_status"]
        }
        Relationships: [
          {
            foreignKeyName: "submissions_hire_id_fkey"
            columns: ["hire_id"]
            isOneToOne: false
            referencedRelation: "hires"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "student" | "business" | "admin"
      application_status: "pending" | "shortlisted" | "rejected" | "hired"
      gig_status: "open" | "in_progress" | "completed" | "closed"
      hire_status:
        | "awaiting_payment"
        | "payment_received"
        | "in_progress"
        | "submitted"
        | "revision_requested"
        | "approved"
        | "payout_pending"
        | "paid"
        | "disputed"
      location_type: "remote" | "onsite" | "hybrid"
      payment_status:
        | "awaiting"
        | "received"
        | "refunded"
        | "payout_pending"
        | "paid"
        | "disputed"
      submission_status: "submitted" | "revision_requested" | "approved"
      work_type: "remote" | "onsite" | "either"
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
  public: {
    Enums: {
      app_role: ["student", "business", "admin"],
      application_status: ["pending", "shortlisted", "rejected", "hired"],
      gig_status: ["open", "in_progress", "completed", "closed"],
      hire_status: [
        "awaiting_payment",
        "payment_received",
        "in_progress",
        "submitted",
        "revision_requested",
        "approved",
        "payout_pending",
        "paid",
        "disputed",
      ],
      location_type: ["remote", "onsite", "hybrid"],
      payment_status: [
        "awaiting",
        "received",
        "refunded",
        "payout_pending",
        "paid",
        "disputed",
      ],
      submission_status: ["submitted", "revision_requested", "approved"],
      work_type: ["remote", "onsite", "either"],
    },
  },
} as const

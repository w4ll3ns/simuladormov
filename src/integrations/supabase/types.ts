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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      colaboradores: {
        Row: {
          ativo: boolean
          cargo: string
          chapa: string
          created_at: string
          id: string
          nome: string
          salario: number
          updated_at: string
          user_id: string
        }
        Insert: {
          ativo?: boolean
          cargo: string
          chapa: string
          created_at?: string
          id?: string
          nome: string
          salario: number
          updated_at?: string
          user_id: string
        }
        Update: {
          ativo?: boolean
          cargo?: string
          chapa?: string
          created_at?: string
          id?: string
          nome?: string
          salario?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      configuracoes: {
        Row: {
          categoria: string
          chave: string
          created_at: string
          descricao: string | null
          id: string
          updated_at: string
          user_id: string
          valor: string
        }
        Insert: {
          categoria?: string
          chave: string
          created_at?: string
          descricao?: string | null
          id?: string
          updated_at?: string
          user_id: string
          valor: string
        }
        Update: {
          categoria?: string
          chave?: string
          created_at?: string
          descricao?: string | null
          id?: string
          updated_at?: string
          user_id?: string
          valor?: string
        }
        Relationships: []
      }
      movimentacoes: {
        Row: {
          colaborador_destino_id: string | null
          colaborador_destino_snapshot: Json | null
          colaborador_origem_id: string | null
          colaborador_origem_snapshot: Json | null
          created_at: string
          funcao_nova_vaga: string | null
          id: string
          motivo_saida: Database["public"]["Enums"]["motivo_saida"] | null
          nova_funcao: string | null
          novo_salario: number | null
          observacoes: string | null
          ordem: number
          salario_nova_vaga: number | null
          simulacao_id: string
          tipo_evento: Database["public"]["Enums"]["tipo_evento"]
          tipo_movimentacao:
            | Database["public"]["Enums"]["tipo_movimentacao"]
            | null
          updated_at: string
        }
        Insert: {
          colaborador_destino_id?: string | null
          colaborador_destino_snapshot?: Json | null
          colaborador_origem_id?: string | null
          colaborador_origem_snapshot?: Json | null
          created_at?: string
          funcao_nova_vaga?: string | null
          id?: string
          motivo_saida?: Database["public"]["Enums"]["motivo_saida"] | null
          nova_funcao?: string | null
          novo_salario?: number | null
          observacoes?: string | null
          ordem: number
          salario_nova_vaga?: number | null
          simulacao_id: string
          tipo_evento: Database["public"]["Enums"]["tipo_evento"]
          tipo_movimentacao?:
            | Database["public"]["Enums"]["tipo_movimentacao"]
            | null
          updated_at?: string
        }
        Update: {
          colaborador_destino_id?: string | null
          colaborador_destino_snapshot?: Json | null
          colaborador_origem_id?: string | null
          colaborador_origem_snapshot?: Json | null
          created_at?: string
          funcao_nova_vaga?: string | null
          id?: string
          motivo_saida?: Database["public"]["Enums"]["motivo_saida"] | null
          nova_funcao?: string | null
          novo_salario?: number | null
          observacoes?: string | null
          ordem?: number
          salario_nova_vaga?: number | null
          simulacao_id?: string
          tipo_evento?: Database["public"]["Enums"]["tipo_evento"]
          tipo_movimentacao?:
            | Database["public"]["Enums"]["tipo_movimentacao"]
            | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "movimentacoes_colaborador_destino_id_fkey"
            columns: ["colaborador_destino_id"]
            isOneToOne: false
            referencedRelation: "colaboradores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "movimentacoes_colaborador_origem_id_fkey"
            columns: ["colaborador_origem_id"]
            isOneToOne: false
            referencedRelation: "colaboradores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "movimentacoes_simulacao_id_fkey"
            columns: ["simulacao_id"]
            isOneToOne: false
            referencedRelation: "simulacoes"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          id: string
          nome: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          id: string
          nome: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          nome?: string
          updated_at?: string
        }
        Relationships: []
      }
      simulacoes: {
        Row: {
          created_at: string
          descricao: string | null
          id: string
          nome: string
          status: Database["public"]["Enums"]["status_simulacao"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          descricao?: string | null
          id?: string
          nome: string
          status?: Database["public"]["Enums"]["status_simulacao"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          descricao?: string | null
          id?: string
          nome?: string
          status?: Database["public"]["Enums"]["status_simulacao"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      simulacoes_historico: {
        Row: {
          created_at: string
          dados_snapshot: Json
          id: string
          simulacao_id: string
          versao: number
        }
        Insert: {
          created_at?: string
          dados_snapshot: Json
          id?: string
          simulacao_id: string
          versao: number
        }
        Update: {
          created_at?: string
          dados_snapshot?: Json
          id?: string
          simulacao_id?: string
          versao?: number
        }
        Relationships: [
          {
            foreignKeyName: "simulacoes_historico_simulacao_id_fkey"
            columns: ["simulacao_id"]
            isOneToOne: false
            referencedRelation: "simulacoes"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      motivo_saida:
        | "demissao"
        | "desligamento"
        | "aposentadoria"
        | "transferencia"
        | "outro"
      status_simulacao: "rascunho" | "finalizada"
      tipo_evento:
        | "saida_inicial"
        | "substituicao_interna"
        | "nova_contratacao"
        | "fim_sem_reposicao"
      tipo_movimentacao: "promocao" | "lateral" | "reajuste"
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
      motivo_saida: [
        "demissao",
        "desligamento",
        "aposentadoria",
        "transferencia",
        "outro",
      ],
      status_simulacao: ["rascunho", "finalizada"],
      tipo_evento: [
        "saida_inicial",
        "substituicao_interna",
        "nova_contratacao",
        "fim_sem_reposicao",
      ],
      tipo_movimentacao: ["promocao", "lateral", "reajuste"],
    },
  },
} as const

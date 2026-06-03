export type ShortformExportStatusSummary = {
  pending_count: number;
  processing_count: number;
  completed_count: number;
  failed_count: number;
  failed_permanent_count: number;
  last_updated_at?: string | null;
  failed_items: Array<{
    id: string;
    title: string;
    user_id: string;
    export_status: string;
    retry_count: number;
    error_message?: string;
    updated_at?: string;
  }>;
};

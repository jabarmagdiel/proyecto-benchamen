// ─── Enums / tipos base ───────────────────────────────────────────────────────
export type UserRole = "administrador" | "gerencia" | "operativo" | "cliente";

export type ActivityStatus =
  | "pendiente"
  | "asignada"
  | "en_proceso"
  | "en_revision"
  | "observada"
  | "aprobada"
  | "cancelada"
  | "bloqueada";

export type ProjectStatus =
  | "planificado"
  | "en_proceso"
  | "en_pausa"
  | "finalizado"
  | "cancelado";

export type ActivityType =
  | "filmacion"
  | "edicion_video"
  | "diseno_grafico"
  | "fotografia"
  | "copywriting"
  | "publicacion_redes"
  | "planificacion_contenido"
  | "reunion_cliente"
  | "entrega_material"
  | "otro";

export type Priority = "baja" | "media" | "alta" | "urgente";
export type CompanyStatus = "activo" | "inactivo";
export type EvidenceType = "imagen" | "archivo" | "link_drive" | "link_externo";

// ─── Auth ─────────────────────────────────────────────────────────────────────
export interface AuthUser {
  access_token: string;
  token_type: string;
  user_id: number;
  /** Alias for user_id — convenience shorthand */
  id?: number;
  name: string;
  email: string;
  role: UserRole;
  company_id?: number;
}

// ─── User ─────────────────────────────────────────────────────────────────────
export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  position?: string;
  is_active: boolean;
  avatar_url?: string;
  company_id?: number;
  departments?: Department[];
  created_at: string;
}

export interface Department {
  id: number;
  name: string;
  description?: string;
  level?: number;
  is_active: boolean;
}

// ─── Company ──────────────────────────────────────────────────────────────────
export interface Company {
  id: number;
  name: string;
  contact_name?: string;
  phone?: string;
  email?: string;
  address?: string;
  description?: string;
  status: CompanyStatus;
  created_at: string;
  project_count?: number;
}

// ─── Project ──────────────────────────────────────────────────────────────────
export interface Project {
  id: number;
  company_id: number;
  name: string;
  description?: string;
  start_date?: string;
  deadline?: string;
  status: ProjectStatus;
  priority: Priority;
  main_responsible_id?: number;
  created_at: string;
  updated_at: string;
  company?: Company;
  main_responsible?: User;
  department_id?: number;
  department?: Department;
  activity_count?: number;
  progress?: number;
}

// ─── Activity ─────────────────────────────────────────────────────────────────
export interface Activity {
  id: number;
  project_id: number;
  title: string;
  description?: string;
  reference_link?: string;
  activity_type: ActivityType;
  node_type?: string;
  priority: Priority;
  status: ActivityStatus;
  current_stage_id?: number;
  current_stage?: WorkflowStage;
  workflow_id?: number;
  workflow?: Workflow;
  assigned_user_id: number | null;
  created_by_id: number;
  approved_by_id?: number;
  start_date?: string;
  deadline?: string;
  approved_at?: string;
  time_spent_seconds?: number;
  timer_started_at?: string;
  created_at: string;
  updated_at: string;
  assigned_user?: User;
  created_by?: User;
  approved_by?: User;
  evidence_count?: number;
  comment_count?: number;
  project_name?: string;
  company_id?: number | null;
  company_name?: string;
  latest_evidence_url?: string;
  latest_evidence_name?: string;
}

// ─── Evidence ─────────────────────────────────────────────────────────────────
export interface Evidence {
  id: number;
  activity_id: number;
  user_id: number;
  evidence_type: EvidenceType;
  file_url?: string;
  drive_url?: string;
  file_name?: string;
  file_size?: number;
  mime_type?: string;
  note?: string;
  created_at: string;
  user?: User;
}

// ─── Comment ──────────────────────────────────────────────────────────────────
export interface Comment {
  id: number;
  activity_id: number;
  user_id: number;
  content: string;
  created_at: string;
  user: User;
}

// ─── History ──────────────────────────────────────────────────────────────────
export interface ActivityHistory {
  id: number;
  activity_id: number;
  user_id: number;
  action: string;
  previous_status?: string;
  new_status?: string;
  description?: string;
  created_at: string;
  user?: User;
}

// ─── Workflow ─────────────────────────────────────────────────────────────────
export interface WorkflowAutomation {
  id: number;
  stage_id: number;
  trigger_event: string;
  action_type: string;
  action_payload?: any;
}

export interface WorkflowStage {
  id: number;
  workflow_id: number;
  name: string;
  description?: string;
  order: number;
  color: string;
  requires_approval: boolean;
  automations: WorkflowAutomation[];
  node_type?: 'start' | 'end' | 'task' | 'decision' | 'notification';
  department?: string;
  pos_x?: number;
  pos_y?: number;
}

export interface WorkflowEdge {
  id: number;
  workflow_id: number;
  source_stage_id: number;
  target_stage_id: number;
  condition?: string;
  label?: string;
}

export interface Workflow {
  id: number;
  name: string;
  description?: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
  stages: WorkflowStage[];
  edges: WorkflowEdge[];
}

// ─── Dashboard ────────────────────────────────────────────────────────────────
export interface DashboardStats {
  total_companies: number;
  total_projects: number;
  active_projects: number;
  pending_activities: number;
  in_progress_activities: number;
  in_review_activities: number;
  observed_activities: number;
  approved_activities: number;
  late_activities: number;
  cancelled_activities: number;
}

export interface StatusCount {
  status: string;
  count: number;
}

export interface UserActivityCount {
  user_id: number;
  user_name: string;
  count: number;
}

export interface LateActivity {
  id: number;
  title: string;
  deadline: string;
  status: string;
  assigned_user_name: string;
  project_name: string;
  company_name: string;
  days_late: number;
}

export interface DashboardFull {
  stats: DashboardStats;
  activity_by_status: StatusCount[];
  activity_by_user: UserActivityCount[];
  late_activities: LateActivity[];
}

// ─── Appointment ──────────────────────────────────────────────────────────────
export interface Appointment {
  id: number;
  admin_id: number;
  client_id?: number;
  date: string;
  start_time: string;
  end_time: string;
  status: "available" | "booked" | "cancelled" | "meeting";
  title?: string;
  notes?: string;
  meeting_link?: string;
  location?: string;
  meeting_type?: "presencial" | "virtual";
  is_group?: boolean;
  attendee_ids?: number[];
  attendees_names?: string[];
  client_name?: string;
  client_email?: string;
  company_name?: string;
  created_at: string;
  updated_at: string;
}

// ─── Service Package & Company Package ───────────────────────────────────────
export interface PackageItem {
  id?: number;
  package_id?: number;
  name: string;
  item_type: "por_cantidad" | "indefinido";
  quantity: number;
}

export interface CompanyPackageItem {
  id: number;
  name: string;
  item_type: "por_cantidad" | "indefinido";
  quantity_initial: number;
  quantity_remaining: number;
}

export interface ServicePackage {
  id: number;
  name: string;
  description?: string;
  offering_type: "package" | "individual_service";
  category: "marketing" | "diseno" | "software" | string;
  price_type: "fixed" | "custom_text";
  price_text?: string;
  base_price: number;
  is_active: boolean;
  items: PackageItem[];
  created_at: string;
}

export interface CompanyPackage {
  id: number;
  company_id: number;
  package_id: number;
  quantity: number;
  discount_percentage: number;
  final_price: number;
  status: "activo" | "expirado" | "cancelado";
  start_date?: string;
  end_date?: string;
  created_at: string;
  package?: ServicePackage;
  company?: { id: number; name: string; [key: string]: any };
  items: CompanyPackageItem[];
}

export interface PackageRequest {
  id: number;
  company_id: number;
  package_id: number;
  client_user_id: number;
  request_type: "subscription_payment" | "work_request";
  deliverable_type?: string;
  quantity_requested: number;
  status: "pendiente" | "aceptada" | "en_proceso" | "entregada" | "rechazada";
  payment_status: "pendiente_verificacion" | "pago_verificado" | "rechazado";
  payment_method?: string;
  payment_reference?: string;
  payment_receipt_url?: string;
  title?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  company?: Company;
  package?: ServicePackage;
  client_user?: User;
}

// ─── Helpers de labels ────────────────────────────────────────────────────────
export const ACTIVITY_TYPE_LABELS: Record<ActivityType, string> = {
  filmacion: "Filmación",
  edicion_video: "Edición de video",
  diseno_grafico: "Diseño gráfico",
  fotografia: "Fotografía",
  copywriting: "Copywriting",
  publicacion_redes: "Publicación en redes",
  planificacion_contenido: "Planificación de contenido",
  reunion_cliente: "Reunión con cliente",
  entrega_material: "Entrega de material",
  otro: "Otro",
};


export const ACTIVITY_STATUS_LABELS: Record<ActivityStatus, string> = {
  pendiente: "Pendiente",
  bloqueada: "Bloqueada",
  asignada: "Asignada",
  en_proceso: "En proceso",
  en_revision: "En revisión",
  observada: "Observada",
  aprobada: "Aprobada",
  cancelada: "Cancelada",
};

export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  planificado: "Planificado",
  en_proceso: "En Proceso",
  en_pausa: "En Pausa",
  finalizado: "Finalizado",
  cancelado: "Cancelado",
};

export const PRIORITY_LABELS: Record<Priority, string> = {
  baja: "Baja",
  media: "Media",
  alta: "Alta",
  urgente: "Urgente",
};

export const USER_ROLE_LABELS: Record<UserRole, string> = {
  administrador: "Administrador",
  gerencia: "Gerencia",
  operativo: "Operador",
  cliente: "Cliente",
};

export interface NotificationItem {
  id: number;
  user_id: number;
  title: string;
  message: string;
  link: string | null;
  is_read: boolean;
  created_at: string;
}

export interface OperativeAvailability {
  id: number;
  user_id: number;
  date: string;
  start_time: string;
  end_time: string;
  is_full_day: boolean;
  status: "busy" | "available" | string;
  reason?: string | null;
  created_at: string;
}

export interface OperativeAvailabilitySummary {
  user_id: number;
  user_name: string;
  user_email: string;
  user_role: string;
  user_position?: string | null;
  overall_status: "libre" | "ocupado" | "en_trabajo" | string;
  busy_blocks: OperativeAvailability[];
  assigned_activities_count: number;
  assigned_activities_titles: string[];
}

export type TransactionType = "ingreso" | "egreso";

export interface FinancialTransaction {
  id: number;
  type: TransactionType;
  title: string;
  description?: string | null;
  amount: number;
  category: string;
  payment_method?: string | null;
  payment_reference?: string | null;
  receipt_url?: string | null;
  receipt_drive_url?: string | null;
  transaction_date: string;
  company_id?: number | null;
  project_id?: number | null;
  created_by_id: number;
  created_at: string;
  updated_at: string;
  company?: Company | null;
  project?: Project | null;
  created_by?: User | null;
}

export interface CategorySummary {
  category: string;
  type: TransactionType;
  total_amount: number;
  count: number;
}

export interface MonthlyFlow {
  year: number;
  month: number;
  month_name: string;
  total_ingresos: number;
  total_egresos: number;
  balance: number;
}

export interface FinancialSummary {
  total_ingresos_manuales: number;
  total_ingresos_qr_verificados: number;
  total_ingresos_global: number;
  total_egresos_global: number;
  balance_neto: number;
  ingresos_count: number;
  egresos_count: number;
  categories_breakdown: CategorySummary[];
  monthly_flow: MonthlyFlow[];
}

// ─── WhatsApp Chat ─────────────────────────────────────────────────────────────
export interface WhatsAppMessage {
  id: number;
  phone_number: string;
  client_name: string;
  company_id?: number | null;
  admin_id?: number | null;
  direction: "outbound" | "inbound";
  message_text: string;
  media_url?: string | null;
  status: "sent" | "delivered" | "read";
  created_at: string;
  whatsapp_url?: string | null;
}

export interface WhatsAppChatSummary {
  phone_number: string;
  client_name: string;
  company_name?: string | null;
  company_id?: number | null;
  last_message: string;
  last_message_time: string;
  unread_count: number;
  unread: boolean;
}

export interface WhatsAppTemplate {
  id: string;
  title: string;
  category: string;
  content: string;
}

export interface WhatsAppConfig {
  id?: number;
  company_phone: string;
  phone_number_id?: string | null;
  waba_id?: string | null;
  access_token?: string | null;
  verify_token?: string | null;
  is_active: boolean;
  updated_at?: string;
}


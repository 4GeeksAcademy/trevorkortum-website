/**
 * Shared types for transversal project apps.
 * Extend with domain types (e.g. Location, Sale, Customer) as needed.
 */

export type Id = string;

export interface BaseEntity {
  id: Id;
  createdAt?: string;
  updatedAt?: string;
}

/** Centralized Incident Manager — Brasaland */

export type IncidentCategory =
  | "equipment_failure"
  | "supply_issue"
  | "customer_complaint"
  | "staff_issue"
  | "facility_issue"
  | "pos_system"
  | "delivery_issue"
  | "other";

export type IncidentStatus = "open" | "in_progress" | "resolved" | "discarded";

export type IncidentOrigin = "customer" | "branch" | "internal";

export type IncidentBranch =
  | "central"
  | "medellin_centro"
  | "medellin_laureles"
  | "medellin_envigado"
  | "medellin_bello"
  | "medellin_itagui"
  | "bogota_chapinero"
  | "bogota_usaquen"
  | "cali_granada"
  | "barranquilla_norte"
  | "miami_doral"
  | "miami_hialeah"
  | "miami_kendall"
  | "orlando_international"
  | "fort_lauderdale";

export interface Incident extends BaseEntity {
  id: Id;
  title: string;
  description: string;
  category: IncidentCategory;
  status: IncidentStatus;
  origin: IncidentOrigin;
  branch: IncidentBranch;
  created_at: string;
  updated_at: string;
}

export interface IncidentSummary {
  total: number;
  by_status: Record<IncidentStatus, number>;
  by_category: Record<IncidentCategory, number>;
  by_origin: Record<IncidentOrigin, number>;
  by_branch: Record<IncidentBranch, number>;
}

export const BRANCH_DISPLAY_NAMES: Record<IncidentBranch, string> = {
  central: "Central (Medellín / Miami)",
  medellin_centro: "Medellín Centro",
  medellin_laureles: "Medellín Laureles",
  medellin_envigado: "Medellín Envigado",
  medellin_bello: "Medellín Bello",
  medellin_itagui: "Medellín Itagüí",
  bogota_chapinero: "Bogotá Chapinero",
  bogota_usaquen: "Bogotá Usaquén",
  cali_granada: "Cali Granada",
  barranquilla_norte: "Barranquilla Norte",
  miami_doral: "Miami Doral",
  miami_hialeah: "Miami Hialeah",
  miami_kendall: "Miami Kendall",
  orlando_international: "Orlando International Drive",
  fort_lauderdale: "Fort Lauderdale",
};

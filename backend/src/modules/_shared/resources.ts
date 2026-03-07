// =============================================================
// FILE: src/modules/resources/types.ts
// FINAL — Resources module types
// =============================================================
import type { Id36 } from '@/modules/_shared';

export type ResourceId = string;

export type ResourceListItemDTO = {
  id: string;
  type: ResourceType | string;
  title: string;
  external_ref_id: string | null;
  is_active: 0 | 1;
  created_at: any;
  updated_at: any;
  label: string;
};


export const resourceTypeEnum = ['therapist', 'doctor', 'table', 'room', 'staff', 'other'] as const;
  
export type ResourceType = 'therapist' | 'doctor' | 'table' | 'room' | 'staff' | 'other';
// ✅ single source of truth for narrowing
export const RESOURCE_TYPES = new Set<ResourceType>([
  'therapist',
  'doctor',
  'table',
  'room',
  'staff',
  'other',
]);

export const bookingStatusEnum = [
  'new',
  'confirmed',
  'rejected',
  'completed',
  'cancelled',
  'expired',
] as const;


export type ResourceRowDTO = {
  id: Id36;
  type: ResourceType;
  title: string;
  capacity: number; // >= 1
  external_ref_id: Id36 | null;
  is_active: 0 | 1;
  created_at: any;
  updated_at: any;
  i18n?: ResourceI18nDTO[];
};

export type ResourceI18nDTO = {
  id: Id36;
  resource_id: Id36;
  locale: string;
  title: string;
  created_at: any;
  updated_at: any;
};

export type ResourcePublicItemDTO = {
  id: Id36;
  type: ResourceType;
  title: string;
  capacity: number;
  external_ref_id: Id36 | null;
  label: string;
};

export type ResourceAdminListItemDTO = ResourceRowDTO & {
  label: string;
};

export type ResourceAdminCreateInput = {
  type?: ResourceType | null;
  title: string;
  capacity?: number | null;
  external_ref_id?: Id36 | null;
  is_active?: 0 | 1;
  i18n?: Array<{
    locale: string;
    title: string;
  }>;
};

export type ResourceAdminUpdatePatch = Partial<{
  type: ResourceType;
  title: string;
  capacity: number;
  external_ref_id: Id36 | null;
  is_active: 0 | 1;
  i18n: Array<{
    locale: string;
    title: string;
  }>;
}>;



  

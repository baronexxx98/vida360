
export enum EmergencyStatus {
  IDLE = 'IDLE',
  ASSESSING = 'ASSESSING',
  ACTIVE = 'ACTIVE',
  SYSTEM_FAILURE = 'SYSTEM_FAILURE',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
}

export type EmergencyCategory = 
  | 'CLINICAL' 
  | 'TRAUMA' 
  | 'PEDIATRIC' 
  | 'OBSTETRIC' 
  | 'PSYCHIATRIC' 
  | 'ENVIRONMENTAL' 
  | 'DOMESTIC' 
  | 'LOCATION_SPECIFIC' 
  | 'VIOLENCE' 
  | 'SYSTEMIC_FAILURE';

export type SystemicFailureType = 
  | 'DELAYED_RESPONSE' // Atraso na chegada
  | 'EQUIPMENT_MISSING' // Falta de material
  | 'REFUSAL_OF_CARE' // Recusa de atendimento
  | 'COMMUNICATION_ERROR' // Erro na central/telefone
  | 'UNPROFESSIONAL_CONDUCT'; // Conduta inadequada

export interface EmergencyAction {
  id?: string;
  timestamp?: number;
  instruction: string;
  type: 'action' | 'check' | 'alert' | 'critical';
  completed: boolean;
}

export interface IncidentReport {
  id: string;
  evidenceHash: string; // Identificador único de auditoria
  startTime: number;
  endTime: number;
  category: EmergencyCategory;
  location: {
    lat: number;
    lng: number;
    address?: string;
    regionId?: string; // Para estatística por bairro/zona
  };
  symptoms: string[];
  diagnosis: string;
  actionsTaken: EmergencyAction[];
  emergencyServicesNotified: boolean;
  institutionalFailureObserved: boolean;
  failureDetails?: {
    type: SystemicFailureType;
    description: string;
    responseTimeSeconds?: number; // Dado crítico para estatística
  };
}

export interface UserProfile {
  name: string;
  age: number;
  bloodType: string;
  allergies: string[];
  medications: string[];
  emergencyContacts: {
    name: string;
    phone: string;
    relation: string;
  }[];
}

import { UBOSCredits } from '../treasury/credits';

export enum CitizenType {
  HUMAN_FOUNDER = 'HUMAN_FOUNDER',
  AI_STRATEGIST = 'AI_STRATEGIST',
  AI_ARCHITECT = 'AI_ARCHITECT',
  AI_AGENT = 'AI_AGENT',
  HUMAN_USER = 'HUMAN_USER',
}

export interface CitizenProfile {
  id: string;
  name?: string;
  type?: CitizenType | string;
  credits?: number;
  level?: number;
  platform?: string;
  model?: string;
  specialPowers?: string[];
  foundingDecree?: string;
  metadata?: Record<string, unknown>;
}

export interface FoundingCitizen extends CitizenProfile {
  specialPowers: string[];
  foundingDecree: string;
}

export class Citizen {
  public credits: UBOSCredits;

  constructor(public id: string) {
    this.credits = new UBOSCredits(id);
  }
}

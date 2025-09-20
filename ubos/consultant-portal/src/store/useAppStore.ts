import { create } from 'zustand';
import { log } from '@lib/logger';

export type UploadedFile = {
  name: string;
  size: number;
  type: string;
};

export type ComplianceResult = {
  check: string;
  status: 'pass' | 'warn' | 'fail';
  detail?: string;
};

export type DeadlineInfo = {
  program: string;
  deadline: string; // ISO date string or friendly
};

export type Opportunity = {
  id: string;
  title: string;
  program: string;
  amount: string;
  matchScore: number; // 0-100
};

type AppState = {
  files: UploadedFile[];
  compliance: ComplianceResult[];
  deadlines: DeadlineInfo[];
  opportunities: Opportunity[];
  setFiles: (files: UploadedFile[]) => void;
  analyze: () => void;
  generateDemoOpportunities: () => void;
  clear: () => void;
};

export const useAppStore = create<AppState>((set, get) => ({
  files: [],
  compliance: [],
  deadlines: [],
  opportunities: [],

  setFiles: (files) => {
    log('info', 'Setting uploaded files', { count: files.length });
    set({ files });
  },

  analyze: () => {
    try {
      const { files } = get();
      // Demo analysis: fabricate results based on file presence
      const hasFiles = files.length > 0;
      const compliance: ComplianceResult[] = [
        { check: 'Eligibility criteria matched', status: hasFiles ? 'pass' : 'warn', detail: hasFiles ? 'Docs parsed' : 'Upload docs to verify' },
        { check: 'SME status confirmed', status: 'pass' },
        { check: 'Regional fit', status: 'warn', detail: 'Pending location details' },
      ];
      const deadlines: DeadlineInfo[] = [
        { program: 'Horizon Europe', deadline: '2025-02-15' },
        { program: 'Digital Europe', deadline: '2025-03-01' },
      ];
      set({ compliance, deadlines });
      log('info', 'Analysis completed', { complianceCount: compliance.length, deadlines: deadlines.length });
    } catch (err) {
      log('error', 'Analysis failed', err);
    }
  },

  generateDemoOpportunities: () => {
    const opportunities: Opportunity[] = [
      { id: 'opp-1', title: 'AI for SMEs', program: 'Digital Europe', amount: '€200,000', matchScore: 86 },
      { id: 'opp-2', title: 'Green Transition', program: 'Horizon Europe', amount: '€500,000', matchScore: 74 },
      { id: 'opp-3', title: 'Regional Innovation', program: 'ERDF', amount: '€120,000', matchScore: 65 },
    ];
    set({ opportunities });
    log('info', 'Demo opportunities generated', { count: opportunities.length });
  },

  clear: () => set({ files: [], compliance: [], deadlines: [], opportunities: [] }),
}));


export interface ACDRoutine {
  name: string;
  tags: ACDTag[];
  ladderLogic: ACDLadderLogic;
}

export interface ACDProgram {
  name: string;
  routines: ACDRoutine[];
}

export interface ACDTag {
  name: string;
  type: string;
  scope: 'Local' | 'Global';
  description: string;
}

export interface ACDFile {
  version: string;
  programs: ACDProgram[];
  globalTags: ACDTag[];
}

// Ladder Logic Types
export interface ACDLadderLogic {
  rungs: ACDRung[];
}

export interface ACDRung {
  number: number;
  elements: ACDElement[];
  comment?: string;
}

export type ACDElementType = 
  | 'XIC'  // Examine if Closed (normally open contact)
  | 'XIO'  // Examine if Open (normally closed contact)
  | 'OTE'  // Output Energize (coil)
  | 'OTL'  // Output Latch
  | 'OTU'  // Output Unlatch
  | 'TON'  // Timer On Delay
  | 'TOF'  // Timer Off Delay
  | 'CTU'  // Counter Up
  | 'CTD'  // Counter Down
  | 'CMP'  // Compare
  | 'EQU'  // Equal
  | 'GRT'  // Greater Than
  | 'LES'  // Less Than
  | 'MOV'  // Move
  | 'ADD'  // Add
  | 'SUB'  // Subtract
  | 'MUL'  // Multiply
  | 'DIV'; // Divide

export interface ACDElement {
  type: ACDElementType;
  tag: string;
  position: {
    row: number;
    col: number;
  };
  parameters?: string[]; // For instructions that take additional parameters
} 
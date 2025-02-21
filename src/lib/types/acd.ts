export interface ACDRoutine {
  name: string;
  tags: ACDTag[];
  ladderLogic: string;
}

export interface ACDProgram {
  name: string;
  routines: ACDRoutine[];
}

export interface ACDTag {
  name: string;
  type: string;
  scope: 'Local' | 'Global';
  description?: string;
}

export interface ACDFile {
  programs: ACDProgram[];
  globalTags: ACDTag[];
  version: string;
} 
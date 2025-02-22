import { ACDFile, ACDProgram, ACDRoutine, ACDTag } from '../types/acd';
import { ACDBinaryReader, ACDSectionType } from './acdBinaryReader';
import { ProgramParser } from './programParser';
import { TagParser } from './tagParser';
import { LadderLogicParser } from './ladderLogicParser';

export class ACDParserService {
  private static generateMockTag(name: string, type = 'BOOL'): ACDTag {
    return {
      name,
      type,
      scope: 'Local',
      description: `Mock tag for ${name}`,
    };
  }

  private static generateMockRoutine(name: string): ACDRoutine {
    return {
      name,
      tags: [
        ACDParserService.generateMockTag(`${name}_Start`),
        ACDParserService.generateMockTag(`${name}_Stop`),
        ACDParserService.generateMockTag(`${name}_Status`, 'INT'),
      ],
      ladderLogic: { rungs: [] }, // Initialize with empty rungs
    };
  }

  private static generateMockProgram(name: string): ACDProgram {
    return {
      name,
      routines: [
        ACDParserService.generateMockRoutine(`${name}_Main`),
        ACDParserService.generateMockRoutine(`${name}_Fault`),
      ],
    };
  }

  public static async parseFile(file: File): Promise<ACDFile> {
    try {
      const reader = await ACDBinaryReader.fromFile(file);
      const header = reader.readHeader();

      // Read programs section
      const programsSection = reader.findSection(ACDSectionType.Programs);
      const programs = programsSection
        ? ProgramParser.parsePrograms(programsSection.data)
        : [];

      // Read tags section
      const tagsSection = reader.findSection(ACDSectionType.Tags);
      const globalTags = tagsSection
        ? TagParser.parseTags(tagsSection.data).filter(tag => tag.scope === 'Global')
        : [];

      // Process local tags for each program
      if (tagsSection) {
        const localTags = TagParser.parseTags(tagsSection.data).filter(tag => tag.scope === 'Local');
        
        // Group local tags by program/routine based on naming convention
        // Example: ProgramName_RoutineName_TagName
        for (const tag of localTags) {
          const parts = tag.name.split('_');
          if (parts.length >= 2) {
            const programName = parts[0];
            const program = programs.find(p => p.name === programName);
            if (program) {
              // If tag name has format Program_Routine_TagName
              if (parts.length >= 3) {
                const routineName = parts[1];
                const routine = program.routines.find(r => r.name === routineName);
                if (routine) {
                  routine.tags.push(tag);
                }
              } else {
                // Tag belongs to program but not specific routine
                // Add to all routines for now
                program.routines.forEach(routine => routine.tags.push(tag));
              }
            }
          }
        }
      }

      // Read ladder logic section
      const ladderLogicSection = reader.findSection(ACDSectionType.LadderLogic);
      if (ladderLogicSection) {
        // The ladder logic section contains all routines' ladder logic
        // Each routine's ladder logic is prefixed with its program and routine name
        let offset = 0;
        while (offset < ladderLogicSection.data.length) {
          // Read program name
          const programNameLength = ladderLogicSection.data.readUInt16LE(offset);
          offset += 2;
          const programName = ladderLogicSection.data.subarray(offset, offset + programNameLength).toString('utf8');
          offset += programNameLength;

          // Read routine name
          const routineNameLength = ladderLogicSection.data.readUInt16LE(offset);
          offset += 2;
          const routineName = ladderLogicSection.data.subarray(offset, offset + routineNameLength).toString('utf8');
          offset += routineNameLength;

          // Read ladder logic length
          const ladderLogicLength = ladderLogicSection.data.readUInt32LE(offset);
          offset += 4;

          // Parse ladder logic for this routine
          const ladderLogicBuffer = ladderLogicSection.data.subarray(offset, offset + ladderLogicLength);
          const ladderLogic = LadderLogicParser.parseLadderLogic(ladderLogicBuffer);
          offset += ladderLogicLength;

          // Find the corresponding program and routine
          const program = programs.find(p => p.name === programName);
          if (program) {
            const routine = program.routines.find(r => r.name === routineName);
            if (routine) {
              routine.ladderLogic = ladderLogic;
            }
          }
        }
      }

      return {
        version: header.version,
        programs,
        globalTags,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to parse ACD file: ${message}`);
    }
  }
} 
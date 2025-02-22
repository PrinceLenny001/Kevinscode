import { Buffer } from 'buffer';
import { ACDProgram, ACDRoutine } from '../types/acd';

interface ProgramHeader {
  nameLength: number;
  routineCount: number;
  dataOffset: number;
}

export class ProgramParser {
  private static readProgramHeader(buffer: Buffer, offset: number): ProgramHeader | null {
    if (offset + 8 > buffer.length) {
      return null;
    }
    try {
      return {
        nameLength: buffer.readUInt16LE(offset),
        routineCount: buffer.readUInt16LE(offset + 2),
        dataOffset: buffer.readUInt32LE(offset + 4),
      };
    } catch (error) {
      return null;
    }
  }

  private static readString(buffer: Buffer, offset: number, maxLength: number): { value: string; nextOffset: number } | null {
    if (offset + 2 > buffer.length) {
      return null;
    }
    try {
      const length = buffer.readUInt16LE(offset);
      if (length > maxLength || offset + 2 + length > buffer.length) {
        return null;
      }
      return {
        value: buffer.subarray(offset + 2, offset + 2 + length).toString('utf8'),
        nextOffset: offset + 2 + length,
      };
    } catch (error) {
      return null;
    }
  }

  public static parsePrograms(buffer: Buffer): ACDProgram[] {
    if (!buffer || buffer.length === 0) {
      return [];
    }

    const programs: ACDProgram[] = [];
    let offset = 0;
    let lastDataOffset = 0;

    while (offset < buffer.length) {
      // Read program header
      const header = this.readProgramHeader(buffer, offset);
      if (!header) break;
      
      // Validate header values to prevent memory issues
      if (header.nameLength <= 0 || header.nameLength > 256 || 
          header.routineCount <= 0 || header.routineCount > 1000 ||
          header.dataOffset <= lastDataOffset || header.dataOffset > buffer.length) {
        break;
      }

      offset += 8;

      // Read program name
      const programName = this.readString(buffer, offset, header.nameLength);
      if (!programName) break;
      offset = programName.nextOffset;

      // Pre-allocate routines array with known size
      const routines: ACDRoutine[] = new Array(header.routineCount);
      let validRoutines = true;

      // Read routines
      for (let i = 0; i < header.routineCount; i++) {
        const routine = this.readString(buffer, offset, 256);
        if (!routine) {
          validRoutines = false;
          break;
        }
        routines[i] = {
          name: routine.value,
          tags: [], // Tags will be populated in Phase 2
          ladderLogic: { rungs: [] }, // Initialize with empty rungs array
        };
        offset = routine.nextOffset;
      }

      if (validRoutines) {
        programs.push({
          name: programName.value,
          routines,
        });
      }

      // Move to next program's data section
      lastDataOffset = offset;
      offset = header.dataOffset;
    }

    return programs;
  }
} 
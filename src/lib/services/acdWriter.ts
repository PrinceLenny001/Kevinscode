import { Buffer } from 'buffer';
import { ACDFile, ACDProgram, ACDRoutine, ACDTag, ACDLadderLogic, ACDRung, ACDElement, ACDElementType } from '../types/acd';

export class ACDWriterService {
  private static writeString(buffer: Buffer, offset: number, str: string): number {
    const strBuffer = Buffer.from(str, 'utf8');
    const length = strBuffer.length;
    buffer.writeUInt16LE(length, offset);
    strBuffer.copy(buffer, offset + 2);
    return offset + 2 + length;
  }

  private static calculateSize(file: ACDFile): number {
    let size = 256; // Header size

    // Programs section
    size += 5; // Section header (type + length)
    for (const program of file.programs) {
      size += 8; // Program header
      size += 2 + Buffer.byteLength(program.name, 'utf8'); // Program name
      for (const routine of program.routines) {
        size += 2 + Buffer.byteLength(routine.name, 'utf8'); // Routine name
      }
    }

    // Tags section
    size += 5; // Section header
    for (const tag of [...file.globalTags, ...file.programs.flatMap(p => p.routines.flatMap(r => r.tags))]) {
      size += 10; // Tag header
      size += 2 + Buffer.byteLength(tag.name, 'utf8'); // Tag name
      size += 2 + Buffer.byteLength(tag.type, 'utf8'); // Tag type
    }

    // Ladder logic section
    size += 5; // Section header
    for (const program of file.programs) {
      for (const routine of program.routines) {
        size += 2 + Buffer.byteLength(program.name, 'utf8'); // Program name
        size += 2 + Buffer.byteLength(routine.name, 'utf8'); // Routine name
        size += 4; // Ladder logic length
        size += this.calculateLadderLogicSize(routine.ladderLogic);
      }
    }

    return size;
  }

  private static calculateLadderLogicSize(ladderLogic: ACDLadderLogic): number {
    let size = 0;
    for (const rung of ladderLogic.rungs) {
      size += 12; // Rung header
      if (rung.comment) {
        size += 2 + Buffer.byteLength(rung.comment, 'utf8');
      }
      for (const element of rung.elements) {
        size += 10; // Element header
        size += 2 + Buffer.byteLength(element.tag, 'utf8');
        if (element.parameters) {
          for (const param of element.parameters) {
            size += 2 + Buffer.byteLength(param, 'utf8');
          }
        }
      }
    }
    return size;
  }

  private static writeHeader(buffer: Buffer, file: ACDFile): number {
    buffer.write('RSLogix5', 0, 8, 'ascii');
    buffer.write(file.version, 8, 4, 'ascii');
    const timestamp = BigInt(Date.now());
    buffer.writeBigUInt64LE(timestamp, 12);
    const metadata = JSON.stringify({
      lastModified: new Date().toISOString(),
    });
    this.writeString(buffer, 20, metadata);
    return 256;
  }

  private static writePrograms(buffer: Buffer, offset: number, programs: ACDProgram[]): number {
    // Write section header
    buffer.writeUInt8(0x02, offset); // Programs section type
    const sectionStart = offset + 5;
    let currentOffset = sectionStart;

    // Write programs
    for (const program of programs) {
      // Calculate offsets
      const nameLength = Buffer.byteLength(program.name, 'utf8');
      const routinesOffset = currentOffset + 8;
      const nextProgramOffset = routinesOffset + program.routines.reduce((acc, r) => {
        const routineNameLength = Buffer.byteLength(r.name, 'utf8');
        return acc + 2 + routineNameLength;
      }, 0);

      // Write program header
      buffer.writeUInt16LE(nameLength, currentOffset);
      buffer.writeUInt16LE(program.routines.length, currentOffset + 2);
      buffer.writeUInt32LE(nextProgramOffset, currentOffset + 4);
      currentOffset += 8;

      // Write program name using writeString
      currentOffset = this.writeString(buffer, currentOffset - 2, program.name);

      // Write routines
      for (const routine of program.routines) {
        currentOffset = this.writeString(buffer, currentOffset, routine.name);
      }

      currentOffset = nextProgramOffset;
    }

    // Write section length
    buffer.writeUInt32LE(currentOffset - sectionStart, offset + 1);
    return currentOffset;
  }

  private static writeTags(buffer: Buffer, offset: number, file: ACDFile): number {
    // Write section header
    buffer.writeUInt8(0x03, offset); // Tags section type
    const sectionStart = offset + 5;
    let currentOffset = sectionStart;

    // Write all tags (global and local)
    const allTags = [
      ...file.globalTags.map(tag => ({ ...tag, scope: 'Global' as const })),
      ...file.programs.flatMap(p => p.routines.flatMap(r => r.tags.map(tag => ({ ...tag, scope: 'Local' as const })))),
    ];

    for (const tag of allTags) {
      // Write tag header
      const nameLength = Buffer.byteLength(tag.name, 'utf8');
      const typeLength = Buffer.byteLength(tag.type, 'utf8');
      buffer.writeUInt16LE(nameLength, currentOffset);
      buffer.writeUInt16LE(typeLength, currentOffset + 2);
      buffer.writeUInt16LE(tag.scope === 'Global' ? 1 : 0, currentOffset + 4);
      const dataOffset = currentOffset + 10 + nameLength + typeLength;
      buffer.writeUInt32LE(dataOffset, currentOffset + 6);
      currentOffset += 10;

      // Write tag name and type
      currentOffset = this.writeString(buffer, currentOffset - 2, tag.name);
      currentOffset = this.writeString(buffer, currentOffset, tag.type);
    }

    // Write section length
    buffer.writeUInt32LE(currentOffset - sectionStart, offset + 1);
    return currentOffset;
  }

  private static writeLadderLogic(buffer: Buffer, offset: number, file: ACDFile): number {
    // Write section header
    buffer.writeUInt8(0x04, offset); // Ladder logic section type
    const sectionStart = offset + 5;
    let currentOffset = sectionStart;

    // Write ladder logic for each routine
    for (const program of file.programs) {
      for (const routine of program.routines) {
        // Write program and routine names
        currentOffset = this.writeString(buffer, currentOffset, program.name);
        currentOffset = this.writeString(buffer, currentOffset, routine.name);

        // Write ladder logic length
        const ladderLogicStart = currentOffset + 4;
        let ladderOffset = ladderLogicStart;

        // Write rungs
        for (const rung of routine.ladderLogic.rungs) {
          // Write rung header
          buffer.writeUInt16LE(rung.number, ladderOffset);
          buffer.writeUInt16LE(rung.elements.length, ladderOffset + 2);
          const commentLength = rung.comment ? Buffer.byteLength(rung.comment, 'utf8') : 0;
          buffer.writeUInt16LE(commentLength, ladderOffset + 4);
          const rungDataOffset = ladderOffset + 12 + commentLength +
            rung.elements.reduce((acc, e) => acc + 10 + Buffer.byteLength(e.tag, 'utf8') +
              (e.parameters?.reduce((p, param) => p + 2 + Buffer.byteLength(param, 'utf8'), 0) || 0), 0);
          buffer.writeUInt32LE(rungDataOffset, ladderOffset + 8);
          ladderOffset += 12;

          // Write rung comment if present
          if (rung.comment) {
            ladderOffset = this.writeString(buffer, ladderOffset - 2, rung.comment);
          }

          // Write elements
          for (const element of rung.elements) {
            // Write element header
            const elementType = Object.entries(this.elementTypeMap)
              .find(([_, type]) => type === element.type)?.[0];
            if (!elementType) throw new Error(`Invalid element type: ${element.type}`);

            buffer.writeUInt16LE(parseInt(elementType, 16), ladderOffset);
            const tagLength = Buffer.byteLength(element.tag, 'utf8');
            buffer.writeUInt16LE(tagLength, ladderOffset + 2);
            buffer.writeUInt16LE(element.parameters?.length || 0, ladderOffset + 4);
            buffer.writeUInt8(element.position.row, ladderOffset + 6);
            buffer.writeUInt8(element.position.col, ladderOffset + 7);
            ladderOffset += 10;

            // Write tag name
            ladderOffset = this.writeString(buffer, ladderOffset - 2, element.tag);

            // Write parameters if present
            if (element.parameters) {
              for (const param of element.parameters) {
                ladderOffset = this.writeString(buffer, ladderOffset, param);
              }
            }
          }
        }

        // Write ladder logic length
        buffer.writeUInt32LE(ladderOffset - ladderLogicStart, currentOffset);
        currentOffset = ladderOffset;
      }
    }

    // Write section length
    buffer.writeUInt32LE(currentOffset - sectionStart, offset + 1);
    return currentOffset;
  }

  private static elementTypeMap: { [key: string]: ACDElementType } = {
    '01': 'XIC',
    '02': 'XIO',
    '03': 'OTE',
    '04': 'OTL',
    '05': 'OTU',
    '06': 'TON',
    '07': 'TOF',
    '08': 'CTU',
    '09': 'CTD',
    '0A': 'CMP',
    '0B': 'EQU',
    '0C': 'GRT',
    '0D': 'LES',
    '0E': 'MOV',
    '0F': 'ADD',
    '10': 'SUB',
    '11': 'MUL',
    '12': 'DIV',
  };

  public static writeFile(file: ACDFile): Buffer {
    const size = this.calculateSize(file);
    const buffer = Buffer.alloc(size);

    let offset = this.writeHeader(buffer, file);
    offset = this.writePrograms(buffer, offset, file.programs);
    offset = this.writeTags(buffer, offset, file);
    offset = this.writeLadderLogic(buffer, offset, file);

    return buffer;
  }
} 
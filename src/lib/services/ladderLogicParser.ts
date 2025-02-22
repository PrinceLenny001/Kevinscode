import { Buffer } from 'buffer';
import { ACDElement, ACDElementType, ACDLadderLogic, ACDRung } from '../types/acd';

interface RungHeader {
  number: number;
  elementCount: number;
  commentLength: number;
  dataOffset: number;
}

interface ElementHeader {
  type: number;
  tagLength: number;
  parameterCount: number;
  row: number;
  col: number;
}

export class LadderLogicParser {
  private static elementTypeMap: { [key: number]: ACDElementType } = {
    0x01: 'XIC',
    0x02: 'XIO',
    0x03: 'OTE',
    0x04: 'OTL',
    0x05: 'OTU',
    0x06: 'TON',
    0x07: 'TOF',
    0x08: 'CTU',
    0x09: 'CTD',
    0x0A: 'CMP',
    0x0B: 'EQU',
    0x0C: 'GRT',
    0x0D: 'LES',
    0x0E: 'MOV',
    0x0F: 'ADD',
    0x10: 'SUB',
    0x11: 'MUL',
    0x12: 'DIV',
  };

  private static readRungHeader(buffer: Buffer, offset: number): RungHeader | null {
    if (offset + 12 > buffer.length) {
      console.log(`Invalid rung header offset: ${offset}, buffer length: ${buffer.length}`);
      return null;
    }
    try {
      const header = {
        number: buffer.readUInt16LE(offset),
        elementCount: buffer.readUInt16LE(offset + 2),
        commentLength: buffer.readUInt16LE(offset + 4),
        dataOffset: buffer.readUInt32LE(offset + 8),
      };
      console.log(`Read rung header at offset ${offset}:`, header);
      return header;
    } catch (error) {
      console.error(`Error reading rung header at offset ${offset}:`, error);
      return null;
    }
  }

  private static readElementHeader(buffer: Buffer, offset: number): ElementHeader | null {
    if (offset + 10 > buffer.length) {
      console.log(`Invalid element header offset: ${offset}, buffer length: ${buffer.length}`);
      return null;
    }
    try {
      const header = {
        type: buffer.readUInt16LE(offset),
        tagLength: buffer.readUInt16LE(offset + 2),
        parameterCount: buffer.readUInt16LE(offset + 4),
        row: buffer.readUInt8(offset + 6),
        col: buffer.readUInt8(offset + 7),
      };
      console.log(`Read element header at offset ${offset}:`, header);
      return header;
    } catch (error) {
      console.error(`Error reading element header at offset ${offset}:`, error);
      return null;
    }
  }

  private static readString(buffer: Buffer, offset: number, maxLength: number): { value: string; nextOffset: number } | null {
    if (offset + 2 > buffer.length) {
      console.log(`Invalid string offset: ${offset}, buffer length: ${buffer.length}`);
      return null;
    }
    try {
      const length = buffer.readUInt16LE(offset);
      if (length > maxLength || offset + 2 + length > buffer.length) {
        console.log(`Invalid string length: ${length}, max: ${maxLength}, offset: ${offset}`);
        return null;
      }
      const value = buffer.subarray(offset + 2, offset + 2 + length).toString('utf8');
      console.log(`Read string at offset ${offset}: "${value}", length: ${length}`);
      return {
        value,
        nextOffset: offset + 2 + length,
      };
    } catch (error) {
      console.error(`Error reading string at offset ${offset}:`, error);
      return null;
    }
  }

  public static parseLadderLogic(buffer: Buffer): ACDLadderLogic {
    if (!buffer || buffer.length === 0) {
      console.log('Empty or null buffer');
      return { rungs: [] };
    }

    console.log(`Starting to parse ladder logic buffer of length ${buffer.length}`);
    const rungs: ACDRung[] = [];
    let offset = 0;

    while (offset < buffer.length) {
      console.log(`\nProcessing rung at offset ${offset}`);
      
      // Read rung header
      const rungHeader = this.readRungHeader(buffer, offset);
      if (!rungHeader) {
        console.log('Failed to read rung header, stopping');
        break;
      }

      // Validate header values
      if (rungHeader.elementCount <= 0 || rungHeader.elementCount > 100 ||
          rungHeader.commentLength > 1000 ||
          rungHeader.dataOffset > buffer.length) {
        console.log('Invalid rung header values:', rungHeader);
        break;
      }

      offset += 12;

      // Read rung comment if present
      let comment: string | undefined;
      if (rungHeader.commentLength > 0) {
        const commentResult = this.readString(buffer, offset, rungHeader.commentLength);
        if (commentResult) {
          comment = commentResult.value;
          offset = commentResult.nextOffset;
        }
      }

      // Read elements
      const elements: ACDElement[] = [];
      for (let i = 0; i < rungHeader.elementCount; i++) {
        // Read element header
        const elementHeader = this.readElementHeader(buffer, offset);
        if (!elementHeader) {
          console.log(`Failed to read element header at index ${i}`);
          break;
        }

        offset += 10;

        // Read tag name
        const tagResult = this.readString(buffer, offset, elementHeader.tagLength);
        if (!tagResult) {
          console.log(`Failed to read tag name for element at index ${i}`);
          break;
        }
        offset = tagResult.nextOffset;

        // Read parameters if any
        const parameters: string[] = [];
        for (let j = 0; j < elementHeader.parameterCount; j++) {
          const paramResult = this.readString(buffer, offset, 256);
          if (!paramResult) {
            console.log(`Failed to read parameter ${j} for element at index ${i}`);
            break;
          }
          parameters.push(paramResult.value);
          offset = paramResult.nextOffset;
        }

        // Map element type number to type string
        const type = this.elementTypeMap[elementHeader.type];
        if (!type) {
          console.log(`Unknown element type: ${elementHeader.type}`);
          continue;
        }

        // Create element
        const element: ACDElement = {
          type,
          tag: tagResult.value,
          position: {
            row: elementHeader.row,
            col: elementHeader.col,
          },
        };

        if (parameters.length > 0) {
          element.parameters = parameters;
        }

        elements.push(element);
      }

      // Create rung
      rungs.push({
        number: rungHeader.number,
        elements,
        comment,
      });

      // Move to next rung
      offset = rungHeader.dataOffset;
    }

    console.log(`Finished parsing ladder logic, found ${rungs.length} rungs`);
    return { rungs };
  }
} 
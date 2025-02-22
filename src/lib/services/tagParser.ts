import { Buffer } from 'buffer';
import { ACDTag } from '../types/acd';

interface TagHeader {
  nameLength: number;
  typeLength: number;
  scope: number;
  dataOffset: number;
}

export class TagParser {
  private static readTagHeader(buffer: Buffer, offset: number): TagHeader | null {
    if (offset + 10 > buffer.length) {
      console.log(`Invalid header offset: ${offset}, buffer length: ${buffer.length}`);
      return null;
    }
    try {
      const header = {
        nameLength: buffer.readUInt16LE(offset),
        typeLength: buffer.readUInt16LE(offset + 2),
        scope: buffer.readUInt16LE(offset + 4),
        dataOffset: buffer.readUInt32LE(offset + 6),
      };
      console.log(`Read header at offset ${offset}:`, header);
      return header;
    } catch (error) {
      console.error(`Error reading header at offset ${offset}:`, error);
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

  public static parseTags(buffer: Buffer): ACDTag[] {
    if (!buffer || buffer.length === 0) {
      console.log('Empty or null buffer');
      return [];
    }

    console.log(`Starting to parse buffer of length ${buffer.length}`);
    const tags: ACDTag[] = [];
    let offset = 0;

    while (offset < buffer.length) {
      console.log(`\nProcessing tag at offset ${offset}`);
      
      // Read tag header
      const header = this.readTagHeader(buffer, offset);
      if (!header) {
        console.log('Failed to read tag header, stopping');
        break;
      }

      // Validate header values to prevent memory issues
      if (header.nameLength <= 0 || header.nameLength > 256 ||
          header.typeLength <= 0 || header.typeLength > 64 ||
          header.dataOffset > buffer.length) {
        console.log('Invalid header values:', header);
        break;
      }

      offset += 10;

      // Read tag name
      const tagName = this.readString(buffer, offset, header.nameLength);
      if (!tagName) {
        console.log('Failed to read tag name');
        break;
      }
      offset = tagName.nextOffset;

      // Read tag type
      const tagType = this.readString(buffer, offset, header.typeLength);
      if (!tagType) {
        console.log('Failed to read tag type');
        break;
      }
      offset = tagType.nextOffset;

      // Create tag object
      const tag: ACDTag = {
        name: tagName.value,
        type: tagType.value,
        scope: header.scope === 0 ? 'Local' : 'Global',
        description: '', // Description will be added in a future phase
      };
      console.log('Created tag:', tag);
      tags.push(tag);

      // Move to next tag if there is one
      console.log(`Current offset: ${offset}, data offset: ${header.dataOffset}`);
      if (header.dataOffset >= offset) {
        offset = header.dataOffset;
        console.log(`Moving to next tag at offset ${offset}`);
      } else {
        console.log('No more tags to process');
        break;
      }
    }

    console.log(`Finished parsing, found ${tags.length} tags`);
    return tags;
  }
} 
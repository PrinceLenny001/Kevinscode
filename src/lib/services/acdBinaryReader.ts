import { Buffer } from 'buffer';

export enum ACDSectionType {
  Header = 0x01,
  Programs = 0x02,
  Tags = 0x03,
  LadderLogic = 0x04,
}

export interface ACDHeader {
  signature: string;
  version: string;
  timestamp: Date;
  metadata: Record<string, unknown>;
}

export interface ACDSection {
  type: ACDSectionType;
  offset: number;
  length: number;
  data: Buffer;
}

export class ACDBinaryReader {
  private buffer: Buffer;

  constructor(arrayBuffer: ArrayBuffer) {
    this.buffer = Buffer.from(arrayBuffer);
  }

  public static async fromFile(file: File): Promise<ACDBinaryReader> {
    const arrayBuffer = await file.arrayBuffer();
    return new ACDBinaryReader(arrayBuffer);
  }

  private readNullTerminatedString(buffer: Buffer, start: number, maxLength: number): string {
    let end = start;
    while (end < start + maxLength && buffer[end] !== 0) {
      end++;
    }
    return buffer.toString('utf8', start, end);
  }

  public readHeader(): ACDHeader {
    try {
      // Read first 256 bytes as header
      const headerBuffer = this.buffer.subarray(0, 256);
      
      // Basic validation - check for magic number/signature
      const signature = headerBuffer.toString('ascii', 0, 8);
      if (!signature.startsWith('RSLogix')) {
        throw new Error('Invalid ACD file signature');
      }

      // Extract version (bytes 8-12)
      const version = headerBuffer.toString('ascii', 8, 12);

      // Extract timestamp (bytes 12-20)
      const timestampMs = Number(headerBuffer.readBigUInt64LE(12));
      const timestamp = new Date(timestampMs);

      // Extract metadata (remaining bytes as JSON if present)
      let metadata: Record<string, unknown> = {};
      try {
        const metadataStr = this.readNullTerminatedString(headerBuffer, 20, 236);
        if (metadataStr) {
          metadata = JSON.parse(metadataStr);
        }
      } catch (e) {
        console.warn('Failed to parse metadata:', e);
      }

      return {
        signature,
        version,
        timestamp,
        metadata,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to read ACD header: ${message}`);
    }
  }

  public findSection(type: ACDSectionType): ACDSection | null {
    let offset = 256; // Start after header
    
    while (offset < this.buffer.length - 5) { // Ensure we can read type and length
      try {
        const sectionType = this.buffer.readUInt8(offset);
        const sectionLength = this.buffer.readUInt32LE(offset + 1);
        
        if (sectionType === type) {
          const dataOffset = offset + 5;
          if (dataOffset + sectionLength <= this.buffer.length) {
            return {
              type: sectionType,
              offset: dataOffset,
              length: sectionLength,
              data: this.buffer.subarray(dataOffset, dataOffset + sectionLength),
            };
          }
        }
        
        offset += 5 + sectionLength; // Move to next section
      } catch (error) {
        break; // Exit loop if we encounter any read errors
      }
    }
    
    return null; // Section not found or invalid data
  }

  public readSection(offset: number, length: number): Buffer {
    try {
      if (offset < 0 || length < 0 || offset + length > this.buffer.length) {
        throw new Error('Invalid section bounds');
      }
      return this.buffer.subarray(offset, offset + length);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to read section at offset ${offset}: ${message}`);
    }
  }
} 
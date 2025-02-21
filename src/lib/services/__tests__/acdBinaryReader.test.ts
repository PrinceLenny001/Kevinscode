import { ACDBinaryReader, ACDSectionType } from '../acdBinaryReader';
import { Buffer } from 'buffer';

describe('ACDBinaryReader', () => {
  let mockArrayBuffer: ArrayBuffer;

  beforeEach(() => {
    // Create a mock ACD file structure
    const buffer = Buffer.alloc(1024); // 1KB buffer

    // Write header
    buffer.write('RSLogix5', 0); // Signature
    buffer.write('1000', 8); // Version
    const timestamp = BigInt(Date.now());
    buffer.writeBigUInt64LE(timestamp, 12);
    
    // Write metadata with proper null termination
    const metadata = Buffer.from(JSON.stringify({ project: 'Test' }) + '\0');
    metadata.copy(buffer, 20, 0, Math.min(metadata.length, 236)); // Leave room for null termination

    // Write program section
    buffer.writeUInt8(ACDSectionType.Programs, 256);
    const programData = Buffer.from('TestProgram');
    buffer.writeUInt32LE(programData.length, 257);
    programData.copy(buffer, 261);

    mockArrayBuffer = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.length);
  });

  it('should read header correctly', () => {
    const reader = new ACDBinaryReader(mockArrayBuffer);
    const header = reader.readHeader();

    expect(header.signature).toMatch(/^RSLogix/);
    expect(header.version).toBe('1000');
    expect(header.metadata).toEqual({ project: 'Test' });
    expect(header.timestamp).toBeInstanceOf(Date);
  });

  it('should find program section', () => {
    const reader = new ACDBinaryReader(mockArrayBuffer);
    const section = reader.findSection(ACDSectionType.Programs);

    expect(section).not.toBeNull();
    expect(section?.type).toBe(ACDSectionType.Programs);
    expect(section?.data.toString()).toBe('TestProgram');
  });

  it('should return null for non-existent section', () => {
    const reader = new ACDBinaryReader(mockArrayBuffer);
    const section = reader.findSection(ACDSectionType.Tags);

    expect(section).toBeNull();
  });

  it('should throw error for invalid ACD file', () => {
    const invalidBuffer = new ArrayBuffer(256);
    const reader = new ACDBinaryReader(invalidBuffer);

    expect(() => reader.readHeader()).toThrow('Invalid ACD file signature');
  });
}); 
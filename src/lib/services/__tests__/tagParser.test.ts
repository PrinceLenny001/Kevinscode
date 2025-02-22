import { Buffer } from 'buffer';
import { TagParser } from '../tagParser';

describe('TagParser', () => {
  test('should parse a single local tag', () => {
    const buffer = Buffer.alloc(64);
    let offset = 0;

    // Write tag header
    buffer.writeUInt16LE(11, offset); // nameLength for "Motor_Start"
    buffer.writeUInt16LE(4, offset + 2); // typeLength for "BOOL"
    buffer.writeUInt16LE(0, offset + 4); // scope (0 = Local)
    buffer.writeUInt32LE(32, offset + 6); // dataOffset
    offset += 10;

    // Write tag name (length + string)
    buffer.writeUInt16LE(11, offset); // nameLength
    buffer.write('Motor_Start', offset + 2, 'utf8');
    offset += 13;

    // Write tag type (length + string)
    buffer.writeUInt16LE(4, offset); // typeLength
    buffer.write('BOOL', offset + 2, 'utf8');

    const tags = TagParser.parseTags(buffer);

    expect(tags).toHaveLength(1);
    expect(tags[0].name).toBe('Motor_Start');
    expect(tags[0].type).toBe('BOOL');
    expect(tags[0].scope).toBe('Local');
  });

  test('should parse multiple tags with different scopes', () => {
    const buffer = Buffer.alloc(128);
    let offset = 0;

    // First tag (Local)
    buffer.writeUInt16LE(11, offset); // nameLength
    buffer.writeUInt16LE(4, offset + 2); // typeLength
    buffer.writeUInt16LE(0, offset + 4); // scope (Local)
    buffer.writeUInt32LE(29, offset + 6); // dataOffset (points to next tag)
    offset += 10;

    // Write tag name (length + string)
    buffer.writeUInt16LE(11, offset); // nameLength
    buffer.write('Motor_Start', offset + 2, 'utf8');
    offset += 13;

    // Write tag type (length + string)
    buffer.writeUInt16LE(4, offset); // typeLength
    buffer.write('BOOL', offset + 2, 'utf8');
    offset = 29; // Move to next tag

    // Second tag (Global)
    buffer.writeUInt16LE(12, offset); // nameLength
    buffer.writeUInt16LE(3, offset + 2); // typeLength
    buffer.writeUInt16LE(1, offset + 4); // scope (Global)
    buffer.writeUInt32LE(58, offset + 6); // dataOffset (end of data)
    offset += 10;

    // Write tag name (length + string)
    buffer.writeUInt16LE(12, offset); // nameLength
    buffer.write('System_Ready', offset + 2, 'utf8');
    offset += 14;

    // Write tag type (length + string)
    buffer.writeUInt16LE(3, offset); // typeLength
    buffer.write('INT', offset + 2, 'utf8');

    const tags = TagParser.parseTags(buffer);

    expect(tags).toHaveLength(2);
    
    expect(tags[0].name).toBe('Motor_Start');
    expect(tags[0].type).toBe('BOOL');
    expect(tags[0].scope).toBe('Local');

    expect(tags[1].name).toBe('System_Ready');
    expect(tags[1].type).toBe('INT');
    expect(tags[1].scope).toBe('Global');
  });

  test('should handle empty or invalid buffer gracefully', () => {
    const emptyBuffer = Buffer.alloc(0);
    const emptyResult = TagParser.parseTags(emptyBuffer);
    expect(emptyResult).toHaveLength(0);

    const invalidBuffer = Buffer.from([0x01]); // Too short to contain valid data
    const invalidResult = TagParser.parseTags(invalidBuffer);
    expect(invalidResult).toHaveLength(0);
  });
}); 
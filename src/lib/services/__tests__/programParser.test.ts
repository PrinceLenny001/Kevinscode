import { Buffer } from 'buffer';
import { ProgramParser } from '../programParser';

describe('ProgramParser', () => {
  test('should parse a single program with one routine', () => {
    const buffer = Buffer.alloc(64);
    let offset = 0;

    // Write program header
    buffer.writeUInt16LE(11, offset); // nameLength for "MainProgram"
    buffer.writeUInt16LE(1, offset + 2); // routineCount
    buffer.writeUInt32LE(32, offset + 4); // dataOffset
    offset += 8;

    // Write program name (length + string)
    buffer.writeUInt16LE(11, offset); // nameLength
    buffer.write('MainProgram', offset + 2);
    offset += 13;

    // Write routine (length + string)
    buffer.writeUInt16LE(8, offset); // nameLength
    buffer.write('MainTask', offset + 2);

    const programs = ProgramParser.parsePrograms(buffer);

    expect(programs).toHaveLength(1);
    expect(programs[0].name).toBe('MainProgram');
    expect(programs[0].routines).toHaveLength(1);
    expect(programs[0].routines[0].name).toBe('MainTask');
  });

  test('should parse multiple programs with multiple routines', () => {
    const buffer = Buffer.alloc(128);
    let offset = 0;

    // First program
    buffer.writeUInt16LE(11, offset); // nameLength
    buffer.writeUInt16LE(2, offset + 2); // routineCount
    buffer.writeUInt32LE(40, offset + 4); // dataOffset (point to second program)
    offset += 8;

    // Write program name (length + string)
    buffer.writeUInt16LE(11, offset); // nameLength
    buffer.write('MainProgram', offset + 2);
    offset += 13;

    // Write first routine (length + string)
    buffer.writeUInt16LE(8, offset); // nameLength
    buffer.write('MainTask', offset + 2);
    offset += 10;

    // Write second routine (length + string)
    buffer.writeUInt16LE(7, offset); // nameLength
    buffer.write('Startup', offset + 2);
    offset += 9;

    // Second program (starts at offset 40)
    buffer.writeUInt16LE(13, offset); // nameLength
    buffer.writeUInt16LE(1, offset + 2); // routineCount
    buffer.writeUInt32LE(128, offset + 4); // dataOffset
    offset += 8;

    // Write program name (length + string)
    buffer.writeUInt16LE(13, offset); // nameLength
    buffer.write('SafetyProgram', offset + 2);
    offset += 15;

    // Write routine (length + string)
    buffer.writeUInt16LE(10, offset); // nameLength
    buffer.write('SafetyTask', offset + 2);

    const programs = ProgramParser.parsePrograms(buffer);

    expect(programs).toHaveLength(2);
    
    expect(programs[0].name).toBe('MainProgram');
    expect(programs[0].routines).toHaveLength(2);
    expect(programs[0].routines[0].name).toBe('MainTask');
    expect(programs[0].routines[1].name).toBe('Startup');

    expect(programs[1].name).toBe('SafetyProgram');
    expect(programs[1].routines).toHaveLength(1);
    expect(programs[1].routines[0].name).toBe('SafetyTask');
  });

  test('should handle empty or invalid buffer gracefully', () => {
    const emptyBuffer = Buffer.alloc(0);
    const emptyResult = ProgramParser.parsePrograms(emptyBuffer);
    expect(emptyResult).toHaveLength(0);

    const invalidBuffer = Buffer.from([0x01]); // Too short to contain valid data
    const invalidResult = ProgramParser.parsePrograms(invalidBuffer);
    expect(invalidResult).toHaveLength(0);
  });
}); 
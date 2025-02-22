import { Buffer } from 'buffer';
import { LadderLogicParser } from '../ladderLogicParser';
import { ACDElementType } from '../../types/acd';

describe('LadderLogicParser', () => {
  test('should parse a single rung with XIC and OTE', () => {
    const buffer = Buffer.alloc(128);
    let offset = 0;

    // Write rung header
    buffer.writeUInt16LE(1, offset); // rung number
    buffer.writeUInt16LE(2, offset + 2); // element count
    buffer.writeUInt16LE(13, offset + 4); // comment length
    buffer.writeUInt32LE(128, offset + 8); // data offset (end of buffer)
    offset += 12;

    // Write rung comment
    buffer.writeUInt16LE(13, offset); // comment length
    buffer.write('Start Circuit', offset + 2, 'utf8');
    offset += 15;

    // First element (XIC)
    buffer.writeUInt16LE(0x01, offset); // type (XIC)
    buffer.writeUInt16LE(10, offset + 2); // tag length
    buffer.writeUInt16LE(0, offset + 4); // parameter count
    buffer.writeUInt8(0, offset + 6); // row
    buffer.writeUInt8(0, offset + 7); // col
    offset += 10;

    // Write XIC tag name
    buffer.writeUInt16LE(10, offset); // tag length
    buffer.write('Start_Push', offset + 2, 'utf8');
    offset += 12;

    // Second element (OTE)
    buffer.writeUInt16LE(0x03, offset); // type (OTE)
    buffer.writeUInt16LE(10, offset + 2); // tag length
    buffer.writeUInt16LE(0, offset + 4); // parameter count
    buffer.writeUInt8(0, offset + 6); // row
    buffer.writeUInt8(1, offset + 7); // col
    offset += 10;

    // Write OTE tag name
    buffer.writeUInt16LE(10, offset); // tag length
    buffer.write('Motor_Run1', offset + 2, 'utf8');

    const result = LadderLogicParser.parseLadderLogic(buffer);

    expect(result.rungs).toHaveLength(1);
    expect(result.rungs[0].number).toBe(1);
    expect(result.rungs[0].comment).toBe('Start Circuit');
    expect(result.rungs[0].elements).toHaveLength(2);

    const [xic, ote] = result.rungs[0].elements;
    expect(xic.type).toBe('XIC');
    expect(xic.tag).toBe('Start_Push');
    expect(xic.position).toEqual({ row: 0, col: 0 });

    expect(ote.type).toBe('OTE');
    expect(ote.tag).toBe('Motor_Run1');
    expect(ote.position).toEqual({ row: 0, col: 1 });
  });

  test('should parse a rung with timer instruction and parameters', () => {
    const buffer = Buffer.alloc(256);
    let offset = 0;

    // Write rung header
    buffer.writeUInt16LE(1, offset); // rung number
    buffer.writeUInt16LE(1, offset + 2); // element count
    buffer.writeUInt16LE(0, offset + 4); // no comment
    buffer.writeUInt32LE(256, offset + 8); // data offset (end of buffer)
    offset += 12;

    // Timer element (TON)
    buffer.writeUInt16LE(0x06, offset); // type (TON)
    buffer.writeUInt16LE(9, offset + 2); // tag length
    buffer.writeUInt16LE(2, offset + 4); // parameter count (preset, accumulated)
    buffer.writeUInt8(0, offset + 6); // row
    buffer.writeUInt8(0, offset + 7); // col
    offset += 10;

    // Write timer tag name
    buffer.writeUInt16LE(9, offset); // tag length
    buffer.write('Timer_001', offset + 2, 'utf8');
    offset += 11;

    // Write preset parameter
    buffer.writeUInt16LE(2, offset); // parameter length
    buffer.write('10', offset + 2, 'utf8');
    offset += 4;

    // Write accumulated parameter
    buffer.writeUInt16LE(1, offset); // parameter length
    buffer.write('0', offset + 2, 'utf8');

    const result = LadderLogicParser.parseLadderLogic(buffer);

    expect(result.rungs).toHaveLength(1);
    expect(result.rungs[0].elements).toHaveLength(1);

    const [timer] = result.rungs[0].elements;
    expect(timer.type).toBe('TON');
    expect(timer.tag).toBe('Timer_001');
    expect(timer.parameters).toEqual(['10', '0']);
  });

  test('should handle empty or invalid buffer gracefully', () => {
    const emptyBuffer = Buffer.alloc(0);
    const emptyResult = LadderLogicParser.parseLadderLogic(emptyBuffer);
    expect(emptyResult.rungs).toHaveLength(0);

    const invalidBuffer = Buffer.from([0x01]); // Too short to contain valid data
    const invalidResult = LadderLogicParser.parseLadderLogic(invalidBuffer);
    expect(invalidResult.rungs).toHaveLength(0);
  });
}); 
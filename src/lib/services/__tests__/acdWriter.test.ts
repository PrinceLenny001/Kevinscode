import { ACDWriterService } from '../acdWriter';
import { ACDFile } from '../../types/acd';
import { ACDBinaryReader } from '../acdBinaryReader';

describe('ACDWriterService', () => {
  const sampleFile: ACDFile = {
    version: '1000',
    programs: [
      {
        name: 'MainProgram',
        routines: [
          {
            name: 'MainRoutine',
            tags: [
              {
                name: 'Motor_Start',
                type: 'BOOL',
                scope: 'Local',
                description: 'Motor start command',
              },
              {
                name: 'Motor_Running',
                type: 'BOOL',
                scope: 'Local',
                description: 'Motor running status',
              },
            ],
            ladderLogic: {
              rungs: [
                {
                  number: 1,
                  elements: [
                    {
                      type: 'XIC',
                      tag: 'Motor_Start',
                      position: { row: 0, col: 0 },
                    },
                    {
                      type: 'OTE',
                      tag: 'Motor_Running',
                      position: { row: 0, col: 1 },
                    },
                  ],
                  comment: 'Motor start circuit',
                },
              ],
            },
          },
        ],
      },
    ],
    globalTags: [
      {
        name: 'System_Ready',
        type: 'BOOL',
        scope: 'Global',
        description: 'System ready status',
      },
    ],
  };

  test('should write and read back the same file structure', () => {
    // Write the file
    const buffer = ACDWriterService.writeFile(sampleFile);

    // Read it back
    const reader = new ACDBinaryReader(buffer.buffer);
    const header = reader.readHeader();

    // Verify header
    expect(header.signature).toMatch(/^RSLogix/);
    expect(header.version).toBe(sampleFile.version);
    expect(header.metadata).toBeDefined();
    expect(typeof header.metadata).toBe('object');

    // Read programs section
    const programsSection = reader.findSection(0x02);
    expect(programsSection).not.toBeNull();
    if (!programsSection) return;

    // Verify program data
    let offset = 0;
    const nameLength = programsSection.data.readUInt16LE(offset);
    expect(nameLength).toBe(Buffer.byteLength(sampleFile.programs[0].name, 'utf8'));
    offset += 2;

    const routineCount = programsSection.data.readUInt16LE(offset);
    expect(routineCount).toBe(sampleFile.programs[0].routines.length);
    offset += 2;

    // Read tags section
    const tagsSection = reader.findSection(0x03);
    expect(tagsSection).not.toBeNull();
    if (!tagsSection) return;

    // Verify tag data
    offset = 0;
    const tagNameLength = tagsSection.data.readUInt16LE(offset);
    expect(tagNameLength).toBeGreaterThan(0);

    // Read ladder logic section
    const ladderLogicSection = reader.findSection(0x04);
    expect(ladderLogicSection).not.toBeNull();
    if (!ladderLogicSection) return;

    // Verify ladder logic data
    offset = 0;
    const programNameLength = ladderLogicSection.data.readUInt16LE(offset);
    expect(programNameLength).toBe(Buffer.byteLength(sampleFile.programs[0].name, 'utf8'));
  });

  test('should handle empty programs and tags', () => {
    const emptyFile: ACDFile = {
      version: '1000',
      programs: [],
      globalTags: [],
    };

    const buffer = ACDWriterService.writeFile(emptyFile);
    expect(buffer.length).toBeGreaterThan(256); // At least header size

    const reader = new ACDBinaryReader(buffer.buffer);
    const header = reader.readHeader();
    expect(header.signature).toMatch(/^RSLogix/);
    expect(header.version).toBe(emptyFile.version);
  });

  test('should handle special characters in strings', () => {
    const fileWithSpecialChars: ACDFile = {
      version: '1000',
      programs: [
        {
          name: 'Test_Program_123!@#',
          routines: [
            {
              name: 'Test_Routine_456$%^',
              tags: [],
              ladderLogic: { rungs: [] },
            },
          ],
        },
      ],
      globalTags: [],
    };

    const buffer = ACDWriterService.writeFile(fileWithSpecialChars);
    const reader = new ACDBinaryReader(buffer.buffer);
    const programsSection = reader.findSection(0x02);
    expect(programsSection).not.toBeNull();
    if (!programsSection) return;

    // Read program name length
    const nameLength = programsSection.data.readUInt16LE(0);
    expect(nameLength).toBe(Buffer.byteLength(fileWithSpecialChars.programs[0].name, 'utf8'));

    // Read program name
    const programName = programsSection.data.subarray(2, 2 + nameLength).toString('utf8');
    expect(programName).toBe(fileWithSpecialChars.programs[0].name);

    // Read routine count
    const routineCount = programsSection.data.readUInt16LE(2 + nameLength);
    expect(routineCount).toBe(fileWithSpecialChars.programs[0].routines.length);

    // Read routine name length
    const routineNameLength = programsSection.data.readUInt16LE(2 + nameLength + 6);
    expect(routineNameLength).toBe(Buffer.byteLength(fileWithSpecialChars.programs[0].routines[0].name, 'utf8'));

    // Read routine name
    const routineName = programsSection.data.subarray(2 + nameLength + 8, 2 + nameLength + 8 + routineNameLength).toString('utf8');
    expect(routineName).toBe(fileWithSpecialChars.programs[0].routines[0].name);
  });
}); 
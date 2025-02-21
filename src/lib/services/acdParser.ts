import { ACDFile, ACDProgram, ACDRoutine, ACDTag } from '../types/acd';

export class ACDParserService {
  private static generateMockTag(name: string, type = 'BOOL'): ACDTag {
    return {
      name,
      type,
      scope: 'Local',
      description: `Mock tag for ${name}`,
    };
  }

  private static generateMockRoutine(name: string): ACDRoutine {
    return {
      name,
      tags: [
        ACDParserService.generateMockTag(`${name}_Start`),
        ACDParserService.generateMockTag(`${name}_Stop`),
        ACDParserService.generateMockTag(`${name}_Status`, 'INT'),
      ],
      ladderLogic: `XIC(${name}_Start)OTE(${name}_Status)`,
    };
  }

  private static generateMockProgram(name: string): ACDProgram {
    return {
      name,
      routines: [
        ACDParserService.generateMockRoutine(`${name}_Main`),
        ACDParserService.generateMockRoutine(`${name}_Fault`),
      ],
    };
  }

  public static async parseFile(file: File): Promise<ACDFile> {
    // In a real implementation, we would read and parse the binary ACD file
    // For now, we return mock data
    return {
      version: '1.0.0',
      programs: [
        ACDParserService.generateMockProgram('MainProgram'),
        ACDParserService.generateMockProgram('SafetyProgram'),
      ],
      globalTags: [
        ACDParserService.generateMockTag('SystemOK', 'BOOL'),
        ACDParserService.generateMockTag('HeartBeat', 'DINT'),
      ],
    };
  }
} 
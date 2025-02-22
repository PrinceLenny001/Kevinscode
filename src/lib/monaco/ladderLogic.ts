import * as monaco from 'monaco-editor';

interface ElementDoc {
  description: string;
  parameters?: string[];
}

const elementDocs: Record<string, ElementDoc> = {
  XIC: {
    description: 'Examine if Closed - Checks if a bit is ON (1)',
  },
  XIO: {
    description: 'Examine if Open - Checks if a bit is OFF (0)',
  },
  OTE: {
    description: 'Output Energize - Sets a bit ON when rung is true, OFF when rung is false',
  },
  OTL: {
    description: 'Output Latch - Sets a bit ON when rung is true, remains ON until reset',
  },
  OTU: {
    description: 'Output Unlatch - Sets a bit OFF when rung is true',
  },
  TON: {
    description: 'Timer On Delay - Delays turning ON for specified time',
    parameters: ['Preset', 'Accumulated']
  },
  TOF: {
    description: 'Timer Off Delay - Delays turning OFF for specified time',
    parameters: ['Preset', 'Accumulated']
  },
  CTU: {
    description: 'Count Up - Increments counter when rung transitions from false to true',
    parameters: ['Preset', 'Accumulated']
  },
  CTD: {
    description: 'Count Down - Decrements counter when rung transitions from false to true',
    parameters: ['Preset', 'Accumulated']
  },
  CMP: {
    description: 'Compare - Compares two values',
    parameters: ['Source A', 'Source B']
  },
  EQU: {
    description: 'Equal - Tests if two values are equal',
    parameters: ['Source A', 'Source B']
  },
  GRT: {
    description: 'Greater Than - Tests if Source A > Source B',
    parameters: ['Source A', 'Source B']
  },
  LES: {
    description: 'Less Than - Tests if Source A < Source B',
    parameters: ['Source A', 'Source B']
  },
  MOV: {
    description: 'Move - Copies source value to destination',
    parameters: ['Source', 'Destination']
  },
  ADD: {
    description: 'Add - Adds two values',
    parameters: ['Source A', 'Source B', 'Destination']
  },
  SUB: {
    description: 'Subtract - Subtracts Source B from Source A',
    parameters: ['Source A', 'Source B', 'Destination']
  },
  MUL: {
    description: 'Multiply - Multiplies two values',
    parameters: ['Source A', 'Source B', 'Destination']
  },
  DIV: {
    description: 'Divide - Divides Source A by Source B',
    parameters: ['Source A', 'Source B', 'Destination']
  }
};

export const registerLadderLogicLanguage = () => {
  // Only register if we're in the browser
  if (typeof window === 'undefined') return;

  // Register a new language
  monaco.languages.register({ id: 'ladderLogic' });

  // Register a tokens provider for the language
  monaco.languages.setMonarchTokensProvider('ladderLogic', {
    defaultToken: 'invalid',
    ignoreCase: false,

    tokenizer: {
      root: [
        // Instructions by category
        [/(XIC|XIO)(?=\()/, 'instruction.contact'],  // Contact instructions
        [/(OTE|OTL|OTU)(?=\()/, 'instruction.output'],  // Output instructions
        [/(TON|TOF)(?=\()/, 'instruction.timer'],  // Timer instructions
        [/(CTU|CTD)(?=\()/, 'instruction.counter'],  // Counter instructions
        [/(CMP|EQU|GRT|LES)(?=\()/, 'instruction.compare'],  // Compare instructions
        [/(MOV|ADD|SUB|MUL|DIV)(?=\()/, 'instruction.math'],  // Math instructions
        
        // Tag names with validation
        [/[a-zA-Z_][a-zA-Z0-9_]*(?=\))/, 'tag.valid'],
        [/[a-zA-Z_][a-zA-Z0-9_]*(?=,)/, 'parameter.name'],
        
        // Numbers with validation
        [/\d+(\.\d+)?/, 'number'],
        
        // Comments
        [/\/\/.*$/, 'comment'],
        
        // Delimiters
        [/[\(\)]/, 'delimiter.parenthesis'],
        [/,/, 'delimiter.comma'],
        
        // Invalid characters
        [/[^\s]/, 'invalid'],
      ],
    },
  });

  // Define the language configuration
  monaco.languages.setLanguageConfiguration('ladderLogic', {
    brackets: [['(', ')']],
    autoClosingPairs: [{ open: '(', close: ')' }],
    surroundingPairs: [{ open: '(', close: ')' }],
    comments: {
      lineComment: '//',
    },
  });

  // Register a theme for the language
  monaco.editor.defineTheme('ladderLogic', {
    base: 'vs',
    inherit: true,
    rules: [
      // Instructions by category
      { token: 'instruction.contact', foreground: '0000FF', fontStyle: 'bold' },  // Blue
      { token: 'instruction.output', foreground: '008000', fontStyle: 'bold' },   // Green
      { token: 'instruction.timer', foreground: '800080', fontStyle: 'bold' },    // Purple
      { token: 'instruction.counter', foreground: '800080', fontStyle: 'bold' },  // Purple
      { token: 'instruction.compare', foreground: 'A31515', fontStyle: 'bold' },  // Dark Red
      { token: 'instruction.math', foreground: 'A31515', fontStyle: 'bold' },     // Dark Red
      
      // Tags and parameters
      { token: 'tag.valid', foreground: '001188' },       // Dark Blue
      { token: 'parameter.name', foreground: '116644' },  // Dark Teal
      
      // Numbers
      { token: 'number', foreground: '098658' },  // Teal
      
      // Comments
      { token: 'comment', foreground: '008800', fontStyle: 'italic' },  // Green Italic
      
      // Delimiters
      { token: 'delimiter.parenthesis', foreground: '000000' },  // Black
      { token: 'delimiter.comma', foreground: '000000' },        // Black
      
      // Invalid
      { token: 'invalid', foreground: 'FF0000' },  // Red
    ],
    colors: {
      'editor.foreground': '#000000',
      'editor.background': '#FFFFFF',
      'editor.lineHighlightBackground': '#F8F8F8',
      'editorCursor.foreground': '#000000',
      'editor.selectionBackground': '#ADD6FF',
      'editorIndentGuide.background': '#D3D3D3',
      'editorIndentGuide.activeBackground': '#939393',
    },
  });

  // Register completion provider
  monaco.languages.registerCompletionItemProvider('ladderLogic', {
    provideCompletionItems: (model, position) => {
      const word = model.getWordUntilPosition(position);
      const range = {
        startLineNumber: position.lineNumber,
        endLineNumber: position.lineNumber,
        startColumn: word.startColumn,
        endColumn: word.endColumn
      };

      const suggestions = Object.entries(elementDocs).map(([type, doc]) => ({
        label: type,
        kind: monaco.languages.CompletionItemKind.Function,
        documentation: {
          value: [
            doc.description,
            doc.parameters ? `\nParameters: ${doc.parameters.join(', ')}` : ''
          ].join('\n'),
          isTrusted: true
        },
        insertText: doc.parameters ? 
          `${type}($\{1:tag\}${doc.parameters.map((p, i) => `,\${${i + 2}:${p}}`).join('')})` :
          `${type}($\{1:tag\})`,
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        range
      }));

      return { suggestions };
    }
  });

  // Register hover provider
  monaco.languages.registerHoverProvider('ladderLogic', {
    provideHover: (model, position) => {
      const word = model.getWordAtPosition(position);
      if (!word) return null;

      const elementDoc = elementDocs[word.word];
      if (!elementDoc) return null;

      return {
        contents: [
          { value: `**${word.word}**` },
          { value: elementDoc.description },
          ...(elementDoc.parameters ? [{ value: `\nParameters: ${elementDoc.parameters.join(', ')}` }] : [])
        ]
      };
    }
  });

  // Register formatting provider
  monaco.languages.registerDocumentFormattingEditProvider('ladderLogic', {
    provideDocumentFormattingEdits: (model) => {
      const edits: monaco.languages.TextEdit[] = [];
      const text = model.getValue();
      const lines = text.split('\n');

      lines.forEach((line, i) => {
        // Remove extra spaces around parentheses and commas
        const formattedLine = line
          .replace(/\s*\(\s*/g, '(')
          .replace(/\s*\)\s*/g, ')')
          .replace(/\s*,\s*/g, ',')
          .replace(/\s*\/\/\s*/g, ' // ');

        if (formattedLine !== line) {
          edits.push({
            range: {
              startLineNumber: i + 1,
              endLineNumber: i + 1,
              startColumn: 1,
              endColumn: line.length + 1
            },
            text: formattedLine
          });
        }
      });

      return edits;
    }
  });
}; 
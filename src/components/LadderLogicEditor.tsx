"use client";

import { useCallback, useState, useEffect } from 'react';
import { Save } from 'lucide-react';
import { ACDLadderLogic, ACDElementType } from '@/lib/types/acd';
import { DynamicEditor } from './DynamicEditor';
import { toast } from 'react-toastify';

interface LadderLogicEditorProps {
  initialValue?: ACDLadderLogic;
  onSave?: (value: ACDLadderLogic) => void;
}

const validElementTypes = new Set<ACDElementType>([
  'XIC', 'XIO', 'OTE', 'OTL', 'OTU', 'TON', 'TOF',
  'CTU', 'CTD', 'CMP', 'EQU', 'GRT', 'LES', 'MOV',
  'ADD', 'SUB', 'MUL', 'DIV'
]);

export const LadderLogicEditor = ({ initialValue = { rungs: [] }, onSave }: LadderLogicEditorProps) => {
  const [value, setValue] = useState(initialValue);
  const [isEditing, setIsEditing] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  useEffect(() => {
    // Dynamically import and register the language
    import('@/lib/monaco/ladderLogic').then(({ registerLadderLogicLanguage }) => {
      registerLadderLogicLanguage();
    });
  }, []);

  // Convert ladder logic to text representation
  const ladderLogicToText = useCallback((ladderLogic: ACDLadderLogic): string => {
    return ladderLogic.rungs.map(rung => {
      const elements = rung.elements.map(element => {
        const params = element.parameters ? `(${element.parameters.join(',')})` : '';
        return `${element.type}(${element.tag}${params})`;
      }).join('');
      return `${elements}${rung.comment ? ` // ${rung.comment}` : ''}`;
    }).join('\n');
  }, []);

  // Parse text back to ladder logic structure
  const textToLadderLogic = useCallback((text: string): ACDLadderLogic => {
    const newErrors: string[] = [];
    const rungs = text.split('\n').map((line, index) => {
      // Split comment if present
      const [code, comment] = line.split('//').map(part => part.trim());
      
      // Parse elements
      const elementRegex = /([A-Z]+)\(([^)]+)\)/g;
      const elements = [];
      let match;
      let col = 0;
      
      while ((match = elementRegex.exec(code)) !== null) {
        const [, type, tagAndParams] = match;
        const [tag, ...params] = tagAndParams.split(',').map(s => s.trim());
        
        // Validate element type
        if (!validElementTypes.has(type as ACDElementType)) {
          newErrors.push(`Invalid element type "${type}" in rung ${index + 1}`);
          continue;
        }

        // Validate tag name
        if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(tag)) {
          newErrors.push(`Invalid tag name "${tag}" in rung ${index + 1}`);
          continue;
        }

        // Validate parameters based on element type
        const needsParams = ['TON', 'TOF', 'CTU', 'CTD', 'CMP', 'MOV', 'ADD', 'SUB', 'MUL', 'DIV'];
        if (needsParams.includes(type) && params.length === 0) {
          newErrors.push(`Element "${type}" requires parameters in rung ${index + 1}`);
          continue;
        }

        elements.push({
          type: type as ACDElementType,
          tag,
          position: {
            row: 0,
            col: col++,
          },
          ...(params.length > 0 ? { parameters: params } : {}),
        });
      }

      // Validate rung structure
      if (elements.length === 0) {
        newErrors.push(`Empty rung at line ${index + 1}`);
      } else {
        const lastElement = elements[elements.length - 1];
        const outputTypes = ['OTE', 'OTL', 'OTU', 'MOV', 'ADD', 'SUB', 'MUL', 'DIV'];
        if (!outputTypes.includes(lastElement.type)) {
          newErrors.push(`Rung ${index + 1} must end with an output instruction`);
        }
      }

      return {
        number: index + 1,
        elements,
        ...(comment ? { comment } : {}),
      };
    });

    setErrors(newErrors);
    if (newErrors.length > 0) {
      toast.error('Invalid ladder logic syntax. Check the errors below.');
      throw new Error('Invalid ladder logic syntax');
    }

    return { rungs };
  }, []);

  const handleEditorChange = useCallback((newValue: string | undefined) => {
    if (newValue !== undefined) {
      try {
        const newLadderLogic = textToLadderLogic(newValue);
        setValue(newLadderLogic);
        setIsEditing(true);
        setErrors([]);
      } catch (error) {
        console.error('Failed to parse ladder logic:', error);
      }
    }
  }, [textToLadderLogic]);

  const handleSave = useCallback(() => {
    if (errors.length > 0) {
      toast.error('Cannot save ladder logic with errors');
      return;
    }
    onSave?.(value);
    setIsEditing(false);
    toast.success('Ladder logic saved successfully');
  }, [onSave, value, errors]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Ladder Logic Editor</h3>
        {isEditing && (
          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            disabled={errors.length > 0}
          >
            <Save className="w-4 h-4" />
            Save Changes
          </button>
        )}
      </div>
      <div className="h-[500px] border rounded-lg overflow-hidden">
        <DynamicEditor
          height="100%"
          defaultLanguage="ladderLogic"
          theme="ladderLogic"
          value={ladderLogicToText(value)}
          onChange={handleEditorChange}
          options={{
            minimap: { enabled: false },
            lineNumbers: 'on',
            scrollBeyondLastLine: false,
            wordWrap: 'on',
            automaticLayout: true,
            renderWhitespace: 'all',
            formatOnPaste: true,
            formatOnType: true,
          }}
        />
      </div>
      {errors.length > 0 && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <h4 className="text-red-700 font-semibold mb-2">Validation Errors:</h4>
          <ul className="list-disc list-inside text-red-600 text-sm">
            {errors.map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}; 
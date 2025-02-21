"use client";

import { useCallback, useState } from 'react';
import Editor from '@monaco-editor/react';
import { Save } from 'lucide-react';

interface LadderLogicEditorProps {
  initialValue?: string;
  onSave?: (value: string) => void;
}

export const LadderLogicEditor = ({ initialValue = '', onSave }: LadderLogicEditorProps) => {
  const [value, setValue] = useState(initialValue);
  const [isEditing, setIsEditing] = useState(false);

  const handleEditorChange = useCallback((newValue: string | undefined) => {
    if (newValue !== undefined) {
      setValue(newValue);
      setIsEditing(true);
    }
  }, []);

  const handleSave = useCallback(() => {
    onSave?.(value);
    setIsEditing(false);
  }, [onSave, value]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Ladder Logic Editor</h3>
        {isEditing && (
          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            <Save className="w-4 h-4" />
            Save Changes
          </button>
        )}
      </div>
      <div className="h-[500px] border rounded-lg overflow-hidden">
        <Editor
          height="100%"
          defaultLanguage="plaintext"
          theme="vs-dark"
          value={value}
          onChange={handleEditorChange}
          options={{
            minimap: { enabled: false },
            lineNumbers: 'on',
            scrollBeyondLastLine: false,
            wordWrap: 'on',
            automaticLayout: true,
          }}
        />
      </div>
    </div>
  );
}; 
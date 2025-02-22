"use client";

import { useState } from 'react';
import { ACDFile, ACDLadderLogic } from '@/lib/types/acd';
import { LadderLogicEditor } from '@/components/LadderLogicEditor';
import { Upload } from 'lucide-react';

export default function Home() {
  const [acdFile, setAcdFile] = useState<ACDFile | null>(null);
  const [selectedProgram, setSelectedProgram] = useState<string | null>(null);
  const [selectedRoutine, setSelectedRoutine] = useState<string | null>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      const buffer = e.target?.result as ArrayBuffer;
      // Here you would parse the buffer using your ACD parser
      // For now, we'll just set some mock data
      setAcdFile({
        version: '1.0.0',
        programs: [
          {
            name: 'MainProgram',
            routines: [
              {
                name: 'MainRoutine',
                tags: [],
                ladderLogic: {
                  rungs: [
                    {
                      number: 1,
                      elements: [
                        {
                          type: 'XIC',
                          tag: 'Motor_Start',
                          position: { row: 0, col: 0 }
                        }
                      ]
                    }
                  ]
                }
              }
            ]
          }
        ],
        globalTags: []
      });
    };
    reader.readAsArrayBuffer(file);
  };

  const handleSaveLogic = (newLogic: ACDLadderLogic) => {
    if (!acdFile || !selectedProgram || !selectedRoutine) return;

    setAcdFile(prev => {
      if (!prev) return prev;

      return {
        ...prev,
        programs: prev.programs.map(program => {
          if (program.name !== selectedProgram) return program;

          return {
            ...program,
            routines: program.routines.map(routine => {
              if (routine.name !== selectedRoutine) return routine;

              return {
                ...routine,
                ladderLogic: newLogic
              };
            })
          };
        })
      };
    });
  };

  const selectedLadderLogic = acdFile?.programs
    .find(p => p.name === selectedProgram)
    ?.routines.find(r => r.name === selectedRoutine)
    ?.ladderLogic;

  return (
    <main className="container mx-auto p-4">
      <div className="flex flex-col gap-8">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Rockwell .ACD File Editor</h1>
          <label className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors cursor-pointer">
            <Upload className="w-4 h-4" />
            Upload .ACD File
            <input
              type="file"
              accept=".acd"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
        </div>

        {acdFile && (
          <div className="grid grid-cols-[250px_1fr] gap-8">
            <div className="flex flex-col gap-4">
              <h2 className="text-lg font-semibold">Programs</h2>
              <div className="flex flex-col gap-2">
                {acdFile.programs.map(program => (
                  <button
                    key={program.name}
                    onClick={() => setSelectedProgram(program.name)}
                    className={`text-left px-4 py-2 rounded-lg transition-colors ${
                      selectedProgram === program.name
                        ? 'bg-blue-500 text-white'
                        : 'hover:bg-gray-100'
                    }`}
                  >
                    {program.name}
                  </button>
                ))}
              </div>

              {selectedProgram && (
                <>
                  <h2 className="text-lg font-semibold">Routines</h2>
                  <div className="flex flex-col gap-2">
                    {acdFile.programs
                      .find(p => p.name === selectedProgram)
                      ?.routines.map(routine => (
                        <button
                          key={routine.name}
                          onClick={() => setSelectedRoutine(routine.name)}
                          className={`text-left px-4 py-2 rounded-lg transition-colors ${
                            selectedRoutine === routine.name
                              ? 'bg-blue-500 text-white'
                              : 'hover:bg-gray-100'
                          }`}
                        >
                          {routine.name}
                        </button>
                      ))}
                  </div>
                </>
              )}
            </div>

            <div className="flex flex-col gap-4">
              {selectedLadderLogic ? (
                <LadderLogicEditor
                  initialValue={selectedLadderLogic}
                  onSave={handleSaveLogic}
                />
              ) : (
                <div className="flex items-center justify-center h-[500px] border rounded-lg">
                  <p className="text-gray-500">
                    Select a program and routine to edit ladder logic
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

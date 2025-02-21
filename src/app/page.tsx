"use client";

import { FileUpload } from '@/components/FileUpload';
import { LadderLogicEditor } from '@/components/LadderLogicEditor';
import { ACDParserService } from '@/lib/services/acdParser';
import { toast } from 'react-toastify';
import { useState } from 'react';
import type { ACDFile } from '@/lib/types/acd';

export default function Home() {
  const [acdFile, setAcdFile] = useState<ACDFile | null>(null);
  const [selectedRoutine, setSelectedRoutine] = useState<string | null>(null);

  const handleFileSelect = async (file: File) => {
    try {
      const parsedFile = await ACDParserService.parseFile(file);
      setAcdFile(parsedFile);
      toast.success('File uploaded successfully!');
    } catch (error) {
      console.error('Error parsing file:', error);
      toast.error('Error uploading file. Please try again.');
    }
  };

  const handleSaveLogic = (value: string) => {
    toast.success('Changes saved successfully!');
    // In a real implementation, we would update the ACD file data here
  };

  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Rockwell ACD File Editor</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <div className="max-w-2xl">
            <FileUpload onFileSelect={handleFileSelect} />
          </div>

          {acdFile && (
            <div className="mt-8">
              <h2 className="text-2xl font-semibold mb-4">Programs</h2>
              <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                {acdFile.programs.map((program) => (
                  <div key={program.name} className="mb-4">
                    <h3 className="text-lg font-medium mb-2">{program.name}</h3>
                    <div className="pl-4 space-y-2">
                      {program.routines.map((routine) => (
                        <button
                          key={routine.name}
                          onClick={() => setSelectedRoutine(routine.name)}
                          className={`block w-full text-left px-3 py-2 rounded-lg transition-colors ${
                            selectedRoutine === routine.name
                              ? 'bg-blue-500 text-white'
                              : 'hover:bg-gray-200 dark:hover:bg-gray-700'
                          }`}
                        >
                          {routine.name}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {acdFile && selectedRoutine && (
          <div>
            <LadderLogicEditor
              initialValue={
                acdFile.programs
                  .flatMap((p) => p.routines)
                  .find((r) => r.name === selectedRoutine)?.ladderLogic || ''
              }
              onSave={handleSaveLogic}
            />
          </div>
        )}
      </div>
    </main>
  );
}

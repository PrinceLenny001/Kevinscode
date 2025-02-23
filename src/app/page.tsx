"use client";

import { useState } from 'react';
import { ACDFile, ACDLadderLogic, ACDTag } from '@/lib/types/acd';
import { LadderLogicEditor } from '@/components/LadderLogicEditor';
import { TagBrowser } from '@/components/TagBrowser';
import { FileUpload } from '@/components/FileUpload';
import { Upload, FileText, Tag, Code, Grid2X2 } from 'lucide-react';
import { ACDParserService } from '@/lib/services/acdParser';
import { ACDWriterService } from '@/lib/services/acdWriter';
import { toast } from 'react-toastify';

export default function Home() {
  const [acdFile, setAcdFile] = useState<ACDFile | null>(null);
  const [selectedProgram, setSelectedProgram] = useState<string | null>(null);
  const [selectedRoutine, setSelectedRoutine] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleFileSelect = async (file: File) => {
    try {
      setIsLoading(true);
      const parsedFile = await ACDParserService.parseFile(file);
      setAcdFile(parsedFile);
      toast.success('File loaded successfully');
    } catch (error) {
      console.error('Failed to parse file:', error);
      toast.error('Failed to load file. Please check the file format.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveLogic = (newLogic: ACDLadderLogic) => {
    if (!acdFile || !selectedProgram || !selectedRoutine) return;

    setAcdFile(prev => {
      if (!prev) return prev;

      const newFile = {
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

      // Save to file
      try {
        const buffer = ACDWriterService.writeFile(newFile);
        const blob = new Blob([buffer], { type: 'application/octet-stream' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'updated.acd';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toast.success('Changes saved successfully');
      } catch (error) {
        console.error('Failed to save file:', error);
        toast.error('Failed to save changes');
      }

      return newFile;
    });
  };

  const handleTagSelect = (tag: ACDTag) => {
    // For now, just log the selected tag
    console.log('Selected tag:', tag);
  };

  const selectedLadderLogic = acdFile?.programs
    .find(p => p.name === selectedProgram)
    ?.routines.find(r => r.name === selectedRoutine)
    ?.ladderLogic;

  const selectedRoutineTags = acdFile?.programs
    .find(p => p.name === selectedProgram)
    ?.routines.find(r => r.name === selectedRoutine)
    ?.tags || [];

  const allTags = acdFile ? [
    ...selectedRoutineTags,
    ...(acdFile.globalTags || [])
  ] : [];

  return (
    <main className="min-h-screen bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-gray-950">
      <div className="container mx-auto p-4">
        <div className="flex flex-col gap-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-blue-800 dark:from-blue-400 dark:to-blue-600">
                Rockwell .ACD Editor
              </h1>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                Edit your Rockwell Automation Studio 5000 Logix Designer files
              </p>
            </div>
          </div>

          {!acdFile ? (
            <div className="mt-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="flex flex-col gap-4">
                  <h2 className="text-2xl font-semibold">Get Started</h2>
                  <p className="text-gray-600 dark:text-gray-400">
                    Upload your .ACD file to start editing. The editor supports:
                  </p>
                  <ul className="space-y-4">
                    <li className="flex items-center gap-3">
                      <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900">
                        <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      </div>
                      <span>Program and routine management</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900">
                        <Tag className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      </div>
                      <span>Tag browsing and editing</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900">
                        <Code className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      </div>
                      <span>Text-based ladder logic editing</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900">
                        <Grid2X2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      </div>
                      <span>Graphical ladder logic editing</span>
                    </li>
                  </ul>
                </div>
                <div className="flex items-center justify-center">
                  <FileUpload
                    onFileSelect={handleFileSelect}
                    accept=".acd"
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-[250px_1fr_300px] gap-8">
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold">Programs</h2>
                  <button
                    onClick={() => setAcdFile(null)}
                    className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    Change File
                  </button>
                </div>
                <div className="flex flex-col gap-2">
                  {acdFile.programs.map(program => (
                    <button
                      key={program.name}
                      onClick={() => setSelectedProgram(program.name)}
                      className={`text-left px-4 py-2 rounded-lg transition-colors ${
                        selectedProgram === program.name
                          ? 'bg-blue-500 text-white'
                          : 'hover:bg-gray-100 dark:hover:bg-gray-800'
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
                                : 'hover:bg-gray-100 dark:hover:bg-gray-800'
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
                  <div className="flex items-center justify-center h-[500px] border rounded-lg bg-white dark:bg-gray-800">
                    <p className="text-gray-500 dark:text-gray-400">
                      Select a program and routine to edit ladder logic
                    </p>
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-4">
                <TagBrowser
                  tags={allTags}
                  onTagSelect={handleTagSelect}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

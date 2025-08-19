
import React, { useState } from 'react';
import { FileTabs } from './FileTabs';
import { CodeBlock } from './CodeBlock';
import { LoadingSpinner } from './LoadingSpinner';
import type { GenerationState } from '../types';

interface GeneratedCodeViewerProps {
  generationState: GenerationState;
  generatedFiles: Record<string, string> | null;
  error: string | null;
}

const StateMessage: React.FC<{ icon: string; title: string; message: string; }> = ({ icon, title, message }) => (
    <div className="text-center text-gray-400">
        <div className="text-6xl mb-4">{icon}</div>
        <h3 className="text-xl font-semibold text-gray-200 mb-2">{title}</h3>
        <p>{message}</p>
    </div>
);

export const GeneratedCodeViewer: React.FC<GeneratedCodeViewerProps> = ({ generationState, generatedFiles, error }) => {
  const [activeFile, setActiveFile] = useState<string | null>(null);

  React.useEffect(() => {
    if (generatedFiles && Object.keys(generatedFiles).length > 0) {
      setActiveFile('package.json');
    } else {
      setActiveFile(null);
    }
  }, [generatedFiles]);

  const renderContent = () => {
    switch (generationState) {
      case 'IDLE':
        return <StateMessage icon="✨" title="Ready to Build" message="Describe your app above and click 'Generate App' to begin." />;
      case 'GENERATING_SPEC':
        return <div className="flex flex-col items-center"><LoadingSpinner size="h-10 w-10" /><p className="mt-4 text-gray-300">Generating app specification from AI...</p></div>;
      case 'GENERATING_CODE':
        return <div className="flex flex-col items-center"><LoadingSpinner size="h-10 w-10" /><p className="mt-4 text-gray-300">Generating React Native code...</p></div>;
      case 'SUCCESS':
        if (!generatedFiles || !activeFile) return null;
        return (
          <>
            <FileTabs
              files={Object.keys(generatedFiles)}
              activeFile={activeFile}
              onSelectFile={setActiveFile}
            />
            <CodeBlock code={generatedFiles[activeFile]} filename={activeFile} />
          </>
        );
      case 'ERROR':
        return <div className="text-center text-red-400 bg-red-900/20 p-4 rounded-lg border border-red-500"><h3 className="font-bold text-lg mb-2">Generation Failed</h3><p>{error}</p></div>;
      default:
        return null;
    }
  };

  return (
    <div className="flex-grow bg-gray-800 rounded-lg shadow-xl p-6 border border-gray-700 flex flex-col items-center justify-center min-h-[400px]">
      {renderContent()}
    </div>
  );
};


import React from 'react';

interface FileTabsProps {
  files: string[];
  activeFile: string;
  onSelectFile: (file: string) => void;
}

export const FileTabs: React.FC<FileTabsProps> = ({ files, activeFile, onSelectFile }) => {
  const sortedFiles = [...files].sort((a,b) => {
    if (a.includes('package.json')) return -1;
    if (b.includes('package.json')) return 1;
    if (a.includes('app.json')) return -1;
    if (b.includes('app.json')) return 1;
    if (a.startsWith('app/')) return -1;
    if (b.startsWith('app/')) return 1;
    return a.localeCompare(b);
  });

  return (
    <div className="w-full border-b border-gray-700 mb-2">
      <div className="flex space-x-2 -mb-px">
        {sortedFiles.map(file => (
          <button
            key={file}
            onClick={() => onSelectFile(file)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors duration-200 ${
              activeFile === file
                ? 'border-cyan-400 text-cyan-400'
                : 'border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-500'
            }`}
          >
            {file}
          </button>
        ))}
      </div>
    </div>
  );
};

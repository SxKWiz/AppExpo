
import React from 'react';
import { LoadingSpinner } from './LoadingSpinner';

interface GenerationControlsProps {
  onGenerate: () => void;
  isLoading: boolean;
}

export const GenerationControls: React.FC<GenerationControlsProps> = ({ onGenerate, isLoading }) => {
  return (
    <div className="flex justify-end items-center">
      <button
        onClick={onGenerate}
        disabled={isLoading}
        className="flex items-center justify-center bg-cyan-500 hover:bg-cyan-600 text-white font-bold py-3 px-6 rounded-lg transition-all duration-300 disabled:bg-gray-600 disabled:cursor-not-allowed transform hover:scale-105"
      >
        {isLoading ? (
          <>
            <LoadingSpinner />
            <span className="ml-2">Generating...</span>
          </>
        ) : (
          'Generate App'
        )}
      </button>
    </div>
  );
};

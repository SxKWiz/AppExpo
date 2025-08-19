
import React from 'react';

interface PromptInputProps {
  value: string;
  onChange: (value: string) => void;
}

export const PromptInput: React.FC<PromptInputProps> = ({ value, onChange }) => {
  return (
    <div className="mb-4">
      <label htmlFor="prompt" className="block text-lg font-medium mb-2 text-cyan-400">
        Describe Your App
      </label>
      <textarea
        id="prompt"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="e.g., Create a simple two-screen app for a to-do list..."
        className="w-full h-40 p-4 bg-gray-900 border border-gray-600 rounded-md focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-colors duration-200 text-gray-200 resize-none"
      />
    </div>
  );
};

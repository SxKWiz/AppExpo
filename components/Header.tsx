
import React from 'react';

export const Header: React.FC = () => {
  return (
    <header className="bg-gray-800 border-b border-gray-700 shadow-lg">
      <div className="container mx-auto px-4 md:px-8 py-4">
        <h1 className="text-3xl font-bold text-cyan-400 tracking-wider">
          AI App Builder
        </h1>
        <p className="text-gray-400 mt-1">
          Generate React Native apps from a simple text prompt.
        </p>
      </div>
    </header>
  );
};

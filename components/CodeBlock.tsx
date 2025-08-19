
import React, { useState, useEffect } from 'react';

interface CodeBlockProps {
  code: string;
  filename: string;
}

export const CodeBlock: React.FC<CodeBlockProps> = ({ code, filename }) => {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setCopied(false);
  }, [code, filename]);

  const handleCopy = () => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
  
  const getLanguage = (filename: string) => {
    if(filename.endsWith('.tsx')) return 'jsx';
    if(filename.endsWith('.json')) return 'json';
    if(filename.endsWith('.js')) return 'javascript';
    return 'bash';
  }

  return (
    <div className="w-full bg-gray-900 rounded-b-lg overflow-hidden">
      <div className="flex justify-between items-center px-4 py-2 bg-gray-700">
        <span className="text-gray-400 text-sm">{filename}</span>
        <button
          onClick={handleCopy}
          className="bg-gray-600 hover:bg-gray-500 text-white px-3 py-1 text-xs rounded transition-colors duration-200"
        >
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
      <pre className="p-4 text-sm overflow-x-auto max-h-[500px]">
        <code className={`language-${getLanguage(filename)}`}>
          {code}
        </code>
      </pre>
    </div>
  );
};

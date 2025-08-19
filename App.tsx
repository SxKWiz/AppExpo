
import React, { useState, useCallback } from 'react';
import { Header } from './components/Header';
import { PromptInput } from './components/PromptInput';
import { GenerationControls } from './components/GenerationControls';
import { GeneratedCodeViewer } from './components/GeneratedCodeViewer';
import { generateAppSpecification } from './services/geminiService';
import { generateProjectFiles } from './services/codeGeneratorService';
import type { AppSpecification } from './types';
import { GenerationState } from './types';

const App: React.FC = () => {
  const [prompt, setPrompt] = useState<string>(
    `Create a 2-screen application for a coffee shop. 
The first screen, 'Home', should have a title 'Welcome to AI Brews' and a button 'View Menu' that navigates to the 'Menu' screen.
The second screen, 'Menu', should display a title 'Our Menu' and a list of three coffee items: 'Latte', 'Espresso', and 'Cappuccino'.`
  );
  const [generationState, setGenerationState] = useState<GenerationState>(GenerationState.IDLE);
  const [generatedFiles, setGeneratedFiles] = useState<Record<string, string> | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGenerateApp = useCallback(async () => {
    if (!prompt.trim()) {
      setError("Please enter a description for your app.");
      return;
    }
    setError(null);
    setGeneratedFiles(null);
    setGenerationState(GenerationState.GENERATING_SPEC);

    try {
      const specJson = await generateAppSpecification(prompt);
      const appSpec: AppSpecification = JSON.parse(specJson);

      setGenerationState(GenerationState.GENERATING_CODE);
      const files = generateProjectFiles(appSpec);
      setGeneratedFiles(files);
      setGenerationState(GenerationState.SUCCESS);
    } catch (err) {
      console.error(err);
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      setError(`Failed to generate app: ${errorMessage}`);
      setGenerationState(GenerationState.ERROR);
    }
  }, [prompt]);

  return (
    <div className="min-h-screen bg-gray-900 font-sans flex flex-col">
      <Header />
      <main className="flex-grow container mx-auto p-4 md:p-8 flex flex-col">
        <div className="bg-gray-800 rounded-lg shadow-xl p-6 mb-8 border border-gray-700">
          <PromptInput value={prompt} onChange={setPrompt} />
          <GenerationControls
            onGenerate={handleGenerateApp}
            isLoading={generationState === GenerationState.GENERATING_SPEC || generationState === GenerationState.GENERATING_CODE}
          />
        </div>
        <GeneratedCodeViewer
          generationState={generationState}
          generatedFiles={generatedFiles}
          error={error}
        />
      </main>
      <footer className="text-center p-4 text-gray-500 text-sm">
        <p>Powered by Gemini & React</p>
      </footer>
    </div>
  );
};

export default App;

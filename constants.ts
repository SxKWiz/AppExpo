
import { Type } from "@google/genai";

export const GEMINI_SYSTEM_INSTRUCTION = `You are an expert React Native developer specializing in Expo Router.
Your task is to take a user's natural language description of a mobile app and convert it into a structured JSON object.
This JSON object will define the app's structure, including screens, components, and dependencies.
Follow these rules:
1.  The 'appName' should be a single, PascalCase word derived from the user's prompt.
2.  The 'dependencies' array should always include 'expo', 'expo-status-bar', 'react', 'react-native', 'expo-router', 'react-native-safe-area-context', 'react-native-screens'. Add other dependencies only if absolutely necessary.
3.  Each screen must have a 'name' (PascalCase) and a 'path' (kebab-case, e.g., 'index', 'details', 'user-profile'). The first screen's path should be 'index'.
4.  Supported component 'type' values are: 'Title', 'Text', 'Button', 'List'.
5.  For a 'Button' component, if it navigates to another screen, include the 'navigateTo' property with the destination screen's path.
6.  For a 'List' component, the 'content' should be an array of strings.
7.  Ensure the output is a single, valid JSON object that strictly adheres to the provided schema. Do not include any markdown formatting like \`\`\`json.
`;

export const APP_SPEC_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    appName: {
      type: Type.STRING,
      description: "The name of the application in PascalCase.",
    },
    dependencies: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "A list of npm dependencies for the project.",
    },
    screens: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: {
            type: Type.STRING,
            description: "The name of the screen in PascalCase.",
          },
          path: {
            type: Type.STRING,
            description: "The file-based route path for the screen (e.g., 'index', 'details').",
          },
          components: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                type: {
                  type: Type.STRING,
                  description: "The type of UI component (e.g., 'Title', 'Text', 'Button', 'List').",
                },
                content: {
                  type: Type.ANY, // Using ANY because it can be string or array of strings
                  description: "The text content for the component, or an array of strings for a List.",
                },
                navigateTo: {
                  type: Type.STRING,
                  description: "Optional: The path of the screen to navigate to when a button is pressed.",
                },
              },
              required: ["type", "content"],
            },
          },
        },
        required: ["name", "path", "components"],
      },
    },
  },
  required: ["appName", "dependencies", "screens"],
};

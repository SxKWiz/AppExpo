import express from 'express';
import Joi from 'joi';
import { generateAppSpecification, generateIterativeUpdate } from '../services/geminiService.js';
import { AuthenticatedRequest } from '../middleware/auth.js';

const router = express.Router();

// Enhanced system instruction with expanded component support
const ENHANCED_SYSTEM_INSTRUCTION = `You are an AI assistant that generates React Native app specifications based on user prompts.

IMPORTANT: You must respond with valid JSON that matches the exact schema provided. Do not include any explanations or additional text.

Supported component types and their properties:
1. Title: { type: "Title", content: string, style?: object }
2. Text: { type: "Text", content: string, style?: object }
3. Button: { type: "Button", content: string, navigateTo?: string, onPress?: string, style?: object }
4. List: { type: "List", content: string[], renderItem?: string, style?: object }
5. TextInput: { type: "TextInput", placeholder: string, value?: string, onChangeText?: string, style?: object }
6. Image: { type: "Image", source: string, alt?: string, style?: object }
7. Card: { type: "Card", children: AppComponent[], style?: object }
8. ScrollView: { type: "ScrollView", children: AppComponent[], style?: object }
9. View: { type: "View", children: AppComponent[], style?: object }
10. TouchableOpacity: { type: "TouchableOpacity", children: AppComponent[], onPress?: string, style?: object }
11. FlatList: { type: "FlatList", data: any[], renderItem: string, keyExtractor?: string, style?: object }
12. SafeAreaView: { type: "SafeAreaView", children: AppComponent[], style?: object }

For navigation, use navigateTo with screen names. For interactivity, include state management:
- Include useState hooks for interactive components
- Include useEffect hooks when needed
- Generate proper event handlers

Generate realistic, functional React Native apps with proper state management and navigation.`;

const APP_SPEC_SCHEMA = {
  type: "object",
  properties: {
    appName: { type: "string" },
    dependencies: { 
      type: "array",
      items: { type: "string" }
    },
    screens: {
      type: "array",
      items: {
        type: "object",
        properties: {
          name: { type: "string" },
          path: { type: "string" },
          components: {
            type: "array",
            items: {
              type: "object",
              properties: {
                type: { type: "string" },
                content: { 
                  oneOf: [
                    { type: "string" },
                    { type: "array", items: { type: "string" } }
                  ]
                },
                navigateTo: { type: "string" },
                onPress: { type: "string" },
                placeholder: { type: "string" },
                value: { type: "string" },
                onChangeText: { type: "string" },
                source: { type: "string" },
                alt: { type: "string" },
                children: { type: "array" },
                data: { type: "array" },
                renderItem: { type: "string" },
                keyExtractor: { type: "string" },
                style: { type: "object" }
              },
              required: ["type"]
            }
          },
          state: {
            type: "array",
            items: {
              type: "object",
              properties: {
                name: { type: "string" },
                initialValue: {},
                type: { type: "string" }
              }
            }
          },
          effects: {
            type: "array",
            items: {
              type: "object",
              properties: {
                dependencies: { type: "array" },
                code: { type: "string" }
              }
            }
          }
        },
        required: ["name", "path", "components"]
      }
    }
  },
  required: ["appName", "dependencies", "screens"]
};

const generateSchema = Joi.object({
  prompt: Joi.string().min(10).max(5000).required(),
});

const iterateSchema = Joi.object({
  originalSpec: Joi.object().required(),
  modificationPrompt: Joi.string().min(5).max(2000).required(),
});

// Generate new app specification
router.post('/generate', async (req: AuthenticatedRequest, res, next) => {
  try {
    const { error, value } = generateSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { prompt } = value;

    const specJson = await generateAppSpecification(prompt, {
      systemInstruction: ENHANCED_SYSTEM_INSTRUCTION,
      responseSchema: APP_SPEC_SCHEMA,
    });

    // Validate the generated JSON
    const appSpec = JSON.parse(specJson);
    
    res.json({
      specification: appSpec,
      rawJson: specJson,
    });
  } catch (error) {
    console.error('AI generation error:', error);
    next(error);
  }
});

// Generate iterative update
router.post('/iterate', async (req: AuthenticatedRequest, res, next) => {
  try {
    const { error, value } = iterateSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { originalSpec, modificationPrompt } = value;

    const specJson = await generateIterativeUpdate(originalSpec, modificationPrompt, {
      systemInstruction: ENHANCED_SYSTEM_INSTRUCTION,
      responseSchema: APP_SPEC_SCHEMA,
    });

    const appSpec = JSON.parse(specJson);
    
    res.json({
      specification: appSpec,
      rawJson: specJson,
    });
  } catch (error) {
    console.error('AI iteration error:', error);
    next(error);
  }
});

export default router;
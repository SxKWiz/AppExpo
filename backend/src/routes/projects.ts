import express from 'express';
import Joi from 'joi';
import archiver from 'archiver';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../config/database.js';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { generateProjectFiles } from '../services/codeGeneratorService.js';

const router = express.Router();

const createProjectSchema = Joi.object({
  name: Joi.string().min(1).max(100).required(),
  description: Joi.string().max(500).optional(),
  originalPrompt: Joi.string().min(10).max(5000).required(),
  appSpecification: Joi.object().required(),
});

const updateProjectSchema = Joi.object({
  name: Joi.string().min(1).max(100).optional(),
  description: Joi.string().max(500).optional(),
});

const iterateProjectSchema = Joi.object({
  modificationPrompt: Joi.string().min(5).max(2000).required(),
  appSpecification: Joi.object().required(),
});

// Get all projects for user
router.get('/', async (req: AuthenticatedRequest, res, next) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const offset = (page - 1) * limit;

    const projects = await db('projects')
      .where({ user_id: req.userId })
      .orderBy('updated_at', 'desc')
      .limit(limit)
      .offset(offset)
      .select('id', 'name', 'description', 'version', 'created_at', 'updated_at');

    const totalCount = await db('projects')
      .where({ user_id: req.userId })
      .count('* as count')
      .first();

    res.json({
      projects,
      pagination: {
        page,
        limit,
        total: parseInt(totalCount?.count as string) || 0,
        totalPages: Math.ceil((parseInt(totalCount?.count as string) || 0) / limit),
      },
    });
  } catch (error) {
    next(error);
  }
});

// Get specific project
router.get('/:id', async (req: AuthenticatedRequest, res, next) => {
  try {
    const project = await db('projects')
      .where({ id: req.params.id, user_id: req.userId })
      .first();

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    res.json({ project });
  } catch (error) {
    next(error);
  }
});

// Create new project
router.post('/', async (req: AuthenticatedRequest, res, next) => {
  try {
    const { error, value } = createProjectSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { name, description, originalPrompt, appSpecification } = value;

    // Generate project files
    const generatedFiles = generateProjectFiles(appSpecification);

    const [project] = await db('projects').insert({
      user_id: req.userId,
      name,
      description,
      original_prompt: originalPrompt,
      app_specification: JSON.stringify(appSpecification),
      generated_files: JSON.stringify(generatedFiles),
    }).returning('*');

    res.status(201).json({ 
      message: 'Project created successfully',
      project: {
        ...project,
        app_specification: JSON.parse(project.app_specification),
        generated_files: JSON.parse(project.generated_files),
      }
    });
  } catch (error) {
    next(error);
  }
});

// Update project
router.put('/:id', async (req: AuthenticatedRequest, res, next) => {
  try {
    const { error, value } = updateProjectSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const project = await db('projects')
      .where({ id: req.params.id, user_id: req.userId })
      .first();

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const [updatedProject] = await db('projects')
      .where({ id: req.params.id })
      .update({
        ...value,
        updated_at: db.fn.now(),
      })
      .returning('*');

    res.json({ 
      message: 'Project updated successfully',
      project: {
        ...updatedProject,
        app_specification: JSON.parse(updatedProject.app_specification),
        generated_files: JSON.parse(updatedProject.generated_files),
      }
    });
  } catch (error) {
    next(error);
  }
});

// Iterate on project (create new version)
router.post('/:id/iterate', async (req: AuthenticatedRequest, res, next) => {
  try {
    const { error, value } = iterateProjectSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { modificationPrompt, appSpecification } = value;

    const project = await db('projects')
      .where({ id: req.params.id, user_id: req.userId })
      .first();

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Generate new project files
    const generatedFiles = generateProjectFiles(appSpecification);
    const newVersion = project.version + 1;

    // Start transaction
    await db.transaction(async (trx) => {
      // Save iteration
      await trx('project_iterations').insert({
        project_id: project.id,
        modification_prompt: modificationPrompt,
        app_specification: JSON.stringify(appSpecification),
        generated_files: JSON.stringify(generatedFiles),
        version: newVersion,
      });

      // Update main project
      await trx('projects')
        .where({ id: project.id })
        .update({
          app_specification: JSON.stringify(appSpecification),
          generated_files: JSON.stringify(generatedFiles),
          version: newVersion,
          updated_at: trx.fn.now(),
        });
    });

    const updatedProject = await db('projects')
      .where({ id: req.params.id })
      .first();

    res.json({
      message: 'Project iteration created successfully',
      project: {
        ...updatedProject,
        app_specification: JSON.parse(updatedProject.app_specification),
        generated_files: JSON.parse(updatedProject.generated_files),
      }
    });
  } catch (error) {
    next(error);
  }
});

// Download project as ZIP
router.get('/:id/download', async (req: AuthenticatedRequest, res, next) => {
  try {
    const project = await db('projects')
      .where({ id: req.params.id, user_id: req.userId })
      .first();

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const generatedFiles = JSON.parse(project.generated_files);
    const appSpec = JSON.parse(project.app_specification);

    // Create ZIP archive
    const archive = archiver('zip', {
      zlib: { level: 9 }
    });

    res.attachment(`${project.name.replace(/\s+/g, '_')}.zip`);
    archive.pipe(res);

    // Add generated files to archive
    Object.entries(generatedFiles).forEach(([filename, content]) => {
      archive.append(content as string, { name: filename });
    });

    // Add package.json with proper dependencies
    const packageJson = {
      name: appSpec.appName.toLowerCase().replace(/\s+/g, '-'),
      version: '1.0.0',
      main: 'index.js',
      scripts: {
        start: 'expo start',
        android: 'expo start --android',
        ios: 'expo start --ios',
        web: 'expo start --web'
      },
      dependencies: {
        expo: '~50.0.0',
        'react-native': '0.73.0',
        react: '18.2.0',
        '@react-navigation/native': '^6.1.0',
        '@react-navigation/stack': '^6.3.0',
        'react-native-screens': '~3.29.0',
        'react-native-safe-area-context': '4.8.2',
        ...appSpec.dependencies.reduce((acc: any, dep: string) => {
          acc[dep] = 'latest';
          return acc;
        }, {})
      },
      devDependencies: {
        '@babel/core': '^7.20.0'
      }
    };

    archive.append(JSON.stringify(packageJson, null, 2), { name: 'package.json' });

    // Add README
    const readme = `# ${appSpec.appName}

This React Native app was generated using AI App Builder.

## Getting Started

1. Install dependencies:
   \`\`\`
   npm install
   \`\`\`

2. Start the development server:
   \`\`\`
   npm start
   \`\`\`

3. Run on your device:
   - Scan the QR code with Expo Go (Android) or Camera app (iOS)
   - Or press 'a' for Android emulator, 'i' for iOS simulator

## Project Structure

- \`App.js\` - Main application component
- \`screens/\` - Individual screen components
- \`components/\` - Reusable UI components

Generated on: ${new Date().toISOString()}
`;

    archive.append(readme, { name: 'README.md' });

    await archive.finalize();
  } catch (error) {
    next(error);
  }
});

// Delete project
router.delete('/:id', async (req: AuthenticatedRequest, res, next) => {
  try {
    const project = await db('projects')
      .where({ id: req.params.id, user_id: req.userId })
      .first();

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    await db('projects').where({ id: req.params.id }).del();

    res.json({ message: 'Project deleted successfully' });
  } catch (error) {
    next(error);
  }
});

// Get project iterations
router.get('/:id/iterations', async (req: AuthenticatedRequest, res, next) => {
  try {
    const project = await db('projects')
      .where({ id: req.params.id, user_id: req.userId })
      .first();

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const iterations = await db('project_iterations')
      .where({ project_id: req.params.id })
      .orderBy('version', 'asc')
      .select('id', 'modification_prompt', 'version', 'created_at');

    res.json({ iterations });
  } catch (error) {
    next(error);
  }
});

export default router;
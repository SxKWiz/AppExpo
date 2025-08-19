
import type { AppSpecification, Screen, AppComponent } from '../types';

const generateComponentJsx = (component: AppComponent): string => {
  switch (component.type) {
    case 'Title':
      return `<Text style={{ fontSize: 32, fontWeight: 'bold', marginBottom: 16, color: '#fff' }}>${component.content}</Text>`;
    case 'Text':
      return `<Text style={{ fontSize: 16, marginBottom: 8, color: '#ccc' }}>${component.content}</Text>`;
    case 'Button':
      if (component.navigateTo) {
        return `
        <Link href="/${component.navigateTo}" asChild>
          <Pressable style={{ backgroundColor: '#06B6D4', paddingVertical: 12, paddingHorizontal: 24, borderRadius: 8, alignItems: 'center' }}>
            <Text style={{ color: 'white', fontSize: 16, fontWeight: 'bold' }}>${component.content}</Text>
          </Pressable>
        </Link>`;
      }
      return `
        <Pressable style={{ backgroundColor: '#06B6D4', paddingVertical: 12, paddingHorizontal: 24, borderRadius: 8, alignItems: 'center' }}>
          <Text style={{ color: 'white', fontSize: 16, fontWeight: 'bold' }}>${component.content}</Text>
        </Pressable>`;
    case 'List':
      if (Array.isArray(component.content)) {
        return `
        <View style={{ width: '100%', paddingHorizontal: 20 }}>
          ${component.content.map(item => `
            <View style={{ backgroundColor: '#2D2D2D', padding: 12, borderRadius: 6, marginBottom: 8 }}>
              <Text style={{ color: '#eee', fontSize: 16 }}>${item}</Text>
            </View>
          `).join('\n')}
        </View>`;
      }
      return '<Text style={{color: \'red\'}}>Error: List content is not an array.</Text>';
    default:
      return '';
  }
};

const generateScreenFile = (screen: Screen): string => {
  const imports = new Set<string>(['View', 'Text', 'StyleSheet', 'Pressable']);
  let hasLink = false;
  screen.components.forEach(c => {
    if (c.type === 'Button' && c.navigateTo) {
      hasLink = true;
    }
  });

  const linkImport = hasLink ? "import { Link } from 'expo-router';" : "";

  return `
import React from 'react';
import { ${Array.from(imports).join(', ')} } from 'react-native';
${linkImport}

export default function ${screen.name}Screen() {
  return (
    <View style={styles.container}>
      ${screen.components.map(generateComponentJsx).join('\n      ')}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#121212',
  },
});
`;
};

const generatePackageJson = (spec: AppSpecification): string => {
  const dependencies = spec.dependencies.reduce((acc, dep) => {
    // A real implementation would fetch latest versions, but we'll use placeholders
    acc[dep] = "*";
    return acc;
  }, {} as Record<string, string>);

  const pkg = {
    name: spec.appName.toLowerCase(),
    version: '1.0.0',
    main: 'expo-router/entry',
    scripts: {
      start: 'expo start',
      android: 'expo start --android',
      ios: 'expo start --ios',
      web: 'expo start --web',
    },
    dependencies,
    devDependencies: {
      '@babel/core': '^7.20.0',
      "typescript": "^5.1.3",
      "@types/react": "~18.2.45"
    },
    private: true,
  };
  return JSON.stringify(pkg, null, 2);
};

const generateAppJson = (spec: AppSpecification): string => {
  return JSON.stringify({
    expo: {
      name: spec.appName,
      slug: spec.appName.toLowerCase(),
      version: '1.0.0',
      orientation: 'portrait',
      scheme: 'myapp',
      userInterfaceStyle: 'automatic',
      splash: {
        resizeMode: 'contain',
        backgroundColor: '#ffffff',
      },
      ios: {
        supportsTablet: true,
      },
      android: {
        adaptiveIcon: {
          backgroundColor: '#ffffff',
        },
      },
      web: {},
      plugins: ['expo-router'],
    },
  }, null, 2);
};

const generateLayoutFile = (): string => {
  return `
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function RootLayout() {
  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: '#1E1E1E',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
          contentStyle: {
            backgroundColor: '#121212',
          }
        }}
      />
    </>
  );
}
`;
};

const generateBabelConfig = (): string => {
  return `
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: ['expo-router/babel'],
  };
};
`;
};

export const generateProjectFiles = (spec: AppSpecification): Record<string, string> => {
  const files: Record<string, string> = {
    'package.json': generatePackageJson(spec),
    'app.json': generateAppJson(spec),
    'babel.config.js': generateBabelConfig(),
    'app/_layout.tsx': generateLayoutFile(),
  };

  spec.screens.forEach(screen => {
    files[`app/${screen.path}.tsx`] = generateScreenFile(screen);
  });

  return files;
};

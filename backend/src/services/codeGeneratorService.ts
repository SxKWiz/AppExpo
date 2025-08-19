interface AppComponent {
  type: string;
  content?: string | string[];
  navigateTo?: string;
  onPress?: string;
  placeholder?: string;
  value?: string;
  onChangeText?: string;
  source?: string;
  alt?: string;
  children?: AppComponent[];
  data?: any[];
  renderItem?: string;
  keyExtractor?: string;
  style?: object;
}

interface Screen {
  name: string;
  path: string;
  components: AppComponent[];
  state?: Array<{
    name: string;
    initialValue: any;
    type: string;
  }>;
  effects?: Array<{
    dependencies: string[];
    code: string;
  }>;
}

interface AppSpecification {
  appName: string;
  dependencies: string[];
  screens: Screen[];
}

export const generateProjectFiles = (appSpec: AppSpecification): Record<string, string> => {
  const files: Record<string, string> = {};

  // Generate App.js (main navigation file)
  files['App.js'] = generateAppFile(appSpec);

  // Generate individual screen files
  appSpec.screens.forEach(screen => {
    files[`screens/${screen.name}Screen.js`] = generateScreenFile(screen, appSpec);
  });

  // Generate components if needed
  const componentFiles = generateComponentFiles(appSpec);
  Object.entries(componentFiles).forEach(([filename, content]) => {
    files[filename] = content;
  });

  // Generate app.json for Expo
  files['app.json'] = generateAppJson(appSpec);

  // Generate babel.config.js
  files['babel.config.js'] = generateBabelConfig();

  return files;
};

const generateAppFile = (appSpec: AppSpecification): string => {
  const imports = appSpec.screens.map(screen => 
    `import ${screen.name}Screen from './screens/${screen.name}Screen';`
  ).join('\n');

  return `import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
${imports}

const Stack = createStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator 
        initialRouteName="${appSpec.screens[0]?.name || 'Home'}"
        screenOptions={{
          headerStyle: {
            backgroundColor: '#6366f1',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      >
${appSpec.screens.map(screen => 
  `        <Stack.Screen 
          name="${screen.name}" 
          component={${screen.name}Screen}
          options={{ title: '${screen.name}' }}
        />`
).join('\n')}
      </Stack.Navigator>
    </NavigationContainer>
  );
}`;
};

const generateScreenFile = (screen: Screen, appSpec: AppSpecification): string => {
  const imports = new Set(['React']);
  const hasNavigation = screen.components.some(comp => comp.navigateTo);
  
  if (hasNavigation) {
    imports.add('{ useNavigation }');
  }

  // Determine required React Native imports based on components
  const rnImports = new Set<string>();
  const processComponents = (components: AppComponent[]) => {
    components.forEach(comp => {
      switch (comp.type) {
        case 'SafeAreaView':
          rnImports.add('SafeAreaView');
          break;
        case 'ScrollView':
          rnImports.add('ScrollView');
          break;
        case 'View':
          rnImports.add('View');
          break;
        case 'Text':
        case 'Title':
          rnImports.add('Text');
          break;
        case 'Button':
          rnImports.add('TouchableOpacity');
          rnImports.add('Text');
          break;
        case 'TouchableOpacity':
          rnImports.add('TouchableOpacity');
          break;
        case 'TextInput':
          rnImports.add('TextInput');
          break;
        case 'Image':
          rnImports.add('Image');
          break;
        case 'FlatList':
        case 'List':
          rnImports.add('FlatList');
          break;
        case 'Card':
          rnImports.add('View');
          break;
      }
      if (comp.children) {
        processComponents(comp.children);
      }
    });
  };

  processComponents(screen.components);
  rnImports.add('StyleSheet');

  // Generate state hooks
  const stateHooks = screen.state?.map(state => 
    `  const [${state.name}, set${state.name.charAt(0).toUpperCase() + state.name.slice(1)}] = useState(${JSON.stringify(state.initialValue)});`
  ).join('\n') || '';

  // Generate effect hooks
  const effectHooks = screen.effects?.map(effect => 
    `  useEffect(() => {
    ${effect.code}
  }, [${effect.dependencies.join(', ')}]);`
  ).join('\n\n') || '';

  if (screen.state?.length || screen.effects?.length) {
    imports.add('{ useState, useEffect }');
  }

  const componentCode = screen.components.map(comp => generateComponent(comp, 2)).join('\n');

  return `import React${Array.from(imports).filter(imp => imp !== 'React').join(', ')} from 'react';
import { ${Array.from(rnImports).join(', ')} } from 'react-native';${hasNavigation ? '\nimport { useNavigation } from \'@react-navigation/native\';' : ''}

export default function ${screen.name}Screen() {${hasNavigation ? '\n  const navigation = useNavigation();' : ''}
${stateHooks}
${effectHooks ? '\n' + effectHooks : ''}

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
${componentCode}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  content: {
    padding: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 16,
    textAlign: 'center',
  },
  text: {
    fontSize: 16,
    color: '#4b5563',
    marginBottom: 12,
    lineHeight: 24,
  },
  button: {
    backgroundColor: '#6366f1',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginVertical: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginVertical: 8,
    backgroundColor: '#ffffff',
  },
  listItem: {
    backgroundColor: '#ffffff',
    padding: 16,
    marginVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  listItemText: {
    fontSize: 16,
    color: '#374151',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  image: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginVertical: 8,
  },
});`;
};

const generateComponent = (component: AppComponent, indent: number = 0): string => {
  const spaces = '  '.repeat(indent);
  
  switch (component.type) {
    case 'Title':
      return `${spaces}<Text style={styles.title}>${component.content}</Text>`;
    
    case 'Text':
      return `${spaces}<Text style={styles.text}>${component.content}</Text>`;
    
    case 'Button':
      const onPressHandler = component.navigateTo 
        ? `onPress={() => navigation.navigate('${component.navigateTo}')}`
        : component.onPress 
        ? `onPress={() => ${component.onPress}}`
        : 'onPress={() => {}}';
      
      return `${spaces}<TouchableOpacity style={styles.button} ${onPressHandler}>
${spaces}  <Text style={styles.buttonText}>${component.content}</Text>
${spaces}</TouchableOpacity>`;
    
    case 'TextInput':
      const changeHandler = component.onChangeText || 'text => {}';
      return `${spaces}<TextInput
${spaces}  style={styles.input}
${spaces}  placeholder="${component.placeholder || ''}"
${spaces}  value={${component.value || "''"}}
${spaces}  onChangeText={${changeHandler}}
${spaces}/>`;
    
    case 'Image':
      return `${spaces}<Image
${spaces}  source={{ uri: '${component.source || 'https://via.placeholder.com/300x200'}' }}
${spaces}  style={styles.image}
${spaces}  resizeMode="cover"
${spaces}/>`;
    
    case 'List':
      if (Array.isArray(component.content)) {
        const data = component.content.map(item => `'${item}'`).join(', ');
        return `${spaces}<FlatList
${spaces}  data={[${data}]}
${spaces}  renderItem={({ item }) => (
${spaces}    <View style={styles.listItem}>
${spaces}      <Text style={styles.listItemText}>{item}</Text>
${spaces}    </View>
${spaces}  )}
${spaces}  keyExtractor={(item, index) => index.toString()}
${spaces}/>`;
      }
      return `${spaces}<Text style={styles.text}>${component.content}</Text>`;
    
    case 'FlatList':
      return `${spaces}<FlatList
${spaces}  data={${JSON.stringify(component.data || [])}}
${spaces}  renderItem={${component.renderItem || '({ item }) => <Text>{item}</Text>'}}
${spaces}  keyExtractor={${component.keyExtractor || '(item, index) => index.toString()'}}
${spaces}/>`;
    
    case 'Card':
      const cardChildren = component.children?.map(child => generateComponent(child, indent + 1)).join('\n') || '';
      return `${spaces}<View style={styles.card}>
${cardChildren}
${spaces}</View>`;
    
    case 'ScrollView':
      const scrollChildren = component.children?.map(child => generateComponent(child, indent + 1)).join('\n') || '';
      return `${spaces}<ScrollView>
${scrollChildren}
${spaces}</ScrollView>`;
    
    case 'View':
      const viewChildren = component.children?.map(child => generateComponent(child, indent + 1)).join('\n') || '';
      return `${spaces}<View>
${viewChildren}
${spaces}</View>`;
    
    case 'TouchableOpacity':
      const touchChildren = component.children?.map(child => generateComponent(child, indent + 1)).join('\n') || '';
      const touchHandler = component.onPress ? `onPress={() => ${component.onPress}}` : 'onPress={() => {}}';
      return `${spaces}<TouchableOpacity ${touchHandler}>
${touchChildren}
${spaces}</TouchableOpacity>`;
    
    case 'SafeAreaView':
      const safeChildren = component.children?.map(child => generateComponent(child, indent + 1)).join('\n') || '';
      return `${spaces}<SafeAreaView style={styles.container}>
${safeChildren}
${spaces}</SafeAreaView>`;
    
    default:
      return `${spaces}<Text style={styles.text}>Unsupported component: ${component.type}</Text>`;
  }
};

const generateComponentFiles = (appSpec: AppSpecification): Record<string, string> => {
  const files: Record<string, string> = {};
  
  // Generate common components if needed
  const hasCards = appSpec.screens.some(screen => 
    screen.components.some(comp => comp.type === 'Card')
  );
  
  if (hasCards) {
    files['components/Card.js'] = `import React from 'react';
import { View, StyleSheet } from 'react-native';

export default function Card({ children, style }) {
  return (
    <View style={[styles.card, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
});`;
  }
  
  return files;
};

const generateAppJson = (appSpec: AppSpecification): string => {
  return JSON.stringify({
    expo: {
      name: appSpec.appName,
      slug: appSpec.appName.toLowerCase().replace(/\s+/g, '-'),
      version: '1.0.0',
      orientation: 'portrait',
      icon: './assets/icon.png',
      userInterfaceStyle: 'light',
      splash: {
        image: './assets/splash.png',
        resizeMode: 'contain',
        backgroundColor: '#ffffff'
      },
      assetBundlePatterns: [
        '**/*'
      ],
      ios: {
        supportsTablet: true
      },
      android: {
        adaptiveIcon: {
          foregroundImage: './assets/adaptive-icon.png',
          backgroundColor: '#FFFFFF'
        }
      },
      web: {
        favicon: './assets/favicon.png'
      }
    }
  }, null, 2);
};

const generateBabelConfig = (): string => {
  return `module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
  };
};`;
};
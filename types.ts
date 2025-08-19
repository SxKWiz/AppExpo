
export enum GenerationState {
  IDLE = 'IDLE',
  CONNECTING = 'CONNECTING',
  GENERATING_SPEC = 'GENERATING_SPEC',
  GENERATING_CODE = 'GENERATING_CODE',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR',
}

export interface AppComponent {
  type: 'Title' | 'Text' | 'Button' | 'List' | 'TextInput' | 'Image' | 'Card' | 'ScrollView' | 'View' | 'TouchableOpacity' | 'FlatList' | 'SafeAreaView';
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

export interface Screen {
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

export interface AppSpecification {
  appName: string;
  dependencies: string[];
  screens: Screen[];
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  createdAt: string;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  originalPrompt: string;
  appSpecification: AppSpecification;
  generatedFiles: Record<string, string>;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectIteration {
  id: string;
  modificationPrompt: string;
  version: number;
  createdAt: string;
}

export interface Asset {
  id: string;
  filename: string;
  originalFilename: string;
  mimeType: string;
  fileSize: number;
  publicUrl: string;
  createdAt: string;
}

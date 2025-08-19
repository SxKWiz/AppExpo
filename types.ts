
export enum GenerationState {
  IDLE = 'IDLE',
  GENERATING_SPEC = 'GENERATING_SPEC',
  GENERATING_CODE = 'GENERATING_CODE',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR',
}

export interface AppComponent {
  type: 'Title' | 'Text' | 'Button' | 'List';
  content: string | string[]; // string for most, string[] for List
  navigateTo?: string; // For Button navigation
}

export interface Screen {
  name: string;
  path: string;
  components: AppComponent[];
}

export interface AppSpecification {
  appName: string;
  dependencies: string[];
  screens: Screen[];
}

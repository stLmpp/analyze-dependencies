export interface Main {
  name: string;
  version: string;
  path: string;
  private: boolean;
  dependencies?: Record<string, Dependency>;
  devDependencies?: Record<string, Dependency>;
  unsavedDependencies?: Record<string, Dependency>;
}

export interface Dependency {
  name: string;
  from: string;
  version: string;
  resolved: string;
  path: string;
  dependencies?: Record<string, Dependency>;
}

export interface AnalyzedDependency {
  name: string;
  version: string;
  totalDependencies: number;
  directDependencies: number;
  dependencies: AnalyzedDependency[];
}

interface MainDependencyResponse {
  totalDependencies: number;
  directDependencies: number;
  dependencies: AnalyzedDependency[];
}

export interface MainResponse {
  name: string;
  version: string;
  dependencies: MainDependencyResponse;
  devDependencies: MainDependencyResponse;
  unsavedDependencies: MainDependencyResponse;
}

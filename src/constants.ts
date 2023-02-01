export type PackageRecord = Record<'name' | 'path' | 'version', string>;

export enum VersioningStrategy {
  independent = 'independent',
  fixed = 'fixed',
}

export enum ReleaseStrategy {
  combined = 'combined',
  independent = 'independent',
}

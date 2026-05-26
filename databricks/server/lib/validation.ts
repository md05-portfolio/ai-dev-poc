// Input validation utilities for UC object creation

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

// TODO: Implement validation functions for each UC type
// - validateCatalog()
// - validateSchema()
// - validateTable()
// - validateExternalLocation()
// - validateCredential()
// - validateVolume()
// - validateModel()
// - validateDeltaShare()

export function validateObjectName(name: string): ValidationResult {
  const errors: string[] = [];

  if (!name || name.trim().length === 0) {
    errors.push('Name is required');
  }

  if (!/^[a-zA-Z0-9_-]+$/.test(name)) {
    errors.push('Name can only contain alphanumeric characters, underscores, and hyphens');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

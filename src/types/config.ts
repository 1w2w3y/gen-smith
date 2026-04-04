export type AuthType = "apiKey" | "azureCli" | "managedIdentity";

export interface AuthConfig {
  type: AuthType;
  apiKey?: string;
  clientId?: string;
}

export interface ModelConfig {
  id: string;
  displayName: string;
  endpoint: string;
  deploymentName: string;
  apiVersion: string;
  auth: AuthConfig;
}

export interface ModelFamilyConfig {
  enabled: boolean;
  displayName: string;
  models: ModelConfig[];
}

export interface AppConfig {
  models: {
    "gpt-image"?: ModelFamilyConfig;
    "mai-image"?: ModelFamilyConfig;
    "flux-image"?: ModelFamilyConfig;
    tts?: ModelFamilyConfig;
  };
}

export interface SanitizedModelConfig {
  id: string;
  displayName: string;
}

export interface SanitizedModelFamilyConfig {
  enabled: boolean;
  displayName: string;
  models: SanitizedModelConfig[];
}

export interface SanitizedAppConfig {
  models: {
    "gpt-image"?: SanitizedModelFamilyConfig;
    "mai-image"?: SanitizedModelFamilyConfig;
    "flux-image"?: SanitizedModelFamilyConfig;
    tts?: SanitizedModelFamilyConfig;
  };
}

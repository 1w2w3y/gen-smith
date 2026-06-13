import type { ModelConfig } from "@/types/config";

export async function getApiKey(modelConfig: ModelConfig): Promise<string> {
  if (modelConfig.auth.type === "apiKey") {
    if (!modelConfig.auth.apiKey) {
      throw new Error(`API key is required for model ${modelConfig.id}`);
    }
    return modelConfig.auth.apiKey;
  }

  // azureCli or managedIdentity: get a token via @azure/identity
  const { AzureCliCredential, ManagedIdentityCredential } = await import(
    "@azure/identity"
  );

  const credential =
    modelConfig.auth.type === "azureCli"
      ? new AzureCliCredential()
      : new ManagedIdentityCredential(modelConfig.auth.clientId ? { clientId: modelConfig.auth.clientId } : undefined);

  const tokenResponse = await credential.getToken(
    "https://cognitiveservices.azure.com/.default"
  );
  return tokenResponse.token;
}

export async function getAuthHeaders(
  modelConfig: ModelConfig,
  apiKeyHeader: "api-key" | "bearer" = "bearer"
): Promise<Record<string, string>> {
  const secretOrToken = await getApiKey(modelConfig);

  if (modelConfig.auth.type === "apiKey" && apiKeyHeader === "api-key") {
    return { "api-key": secretOrToken };
  }

  return { Authorization: `Bearer ${secretOrToken}` };
}

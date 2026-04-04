import type { ModelConfig } from "@/types/config";

export async function getApiKey(modelConfig: ModelConfig): Promise<string> {
  if (modelConfig.auth.type === "apiKey") {
    return modelConfig.auth.apiKey!;
  }

  // azureCli or managedIdentity: get a token via @azure/identity
  const { AzureCliCredential, ManagedIdentityCredential } = await import(
    "@azure/identity"
  );

  const credential =
    modelConfig.auth.type === "azureCli"
      ? new AzureCliCredential()
      : new ManagedIdentityCredential(modelConfig.auth.clientId);

  const tokenResponse = await credential.getToken(
    "https://cognitiveservices.azure.com/.default"
  );
  return tokenResponse.token;
}

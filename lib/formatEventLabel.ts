function isEncryptedPromptField(value: unknown): boolean {
  return Boolean(
    value &&
      typeof value === "object" &&
      "iv" in value &&
      "encryptedData" in value &&
      "authTag" in value
  );
}

export function formatEventLabel(label: unknown): string {
  if (typeof label === "string") {
    const trimmed = label.trim();
    return trimmed || "Untitled prompt";
  }
  if (isEncryptedPromptField(label)) {
    return "Encrypted prompt";
  }
  if (label == null) {
    return "Untitled prompt";
  }
  return String(label);
}

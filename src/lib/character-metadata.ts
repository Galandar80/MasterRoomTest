export type CharacterMetadata = {
  archetype: string;
  origin: string;
  traits: string[];
  private_secret: string;
  bio: string;
  appearance: string;
  alignment: string;
  bond: string;
};

export function parseCharacterMetadata(rawPublicBackground: string | null | undefined): CharacterMetadata {
  const raw = rawPublicBackground?.trim() ?? "";
  try {
    if (raw.startsWith("{")) {
      const parsed = JSON.parse(raw);
      return {
        archetype: parsed.archetype ?? "",
        origin: parsed.origin ?? "",
        traits: Array.isArray(parsed.traits) ? parsed.traits : [],
        private_secret: parsed.private_secret ?? "",
        bio: parsed.bio ?? "",
        appearance: parsed.appearance ?? "",
        alignment: parsed.alignment ?? "Neutrale",
        bond: parsed.bond ?? ""
      };
    }
  } catch (e) {
    if (raw.startsWith("{")) {
      return {
        archetype: extractJsonishString(raw, "archetype"),
        origin: extractJsonishString(raw, "origin"),
        traits: extractJsonishArray(raw, "traits"),
        private_secret: extractJsonishString(raw, "private_secret"),
        bio: extractJsonishString(raw, "bio"),
        appearance: extractJsonishString(raw, "appearance"),
        alignment: extractJsonishString(raw, "alignment") || "Neutrale",
        bond: extractJsonishString(raw, "bond")
      };
    }
  }

  return {
    archetype: "",
    origin: "",
    traits: [],
    private_secret: "",
    bio: raw,
    appearance: "",
    alignment: "Neutrale",
    bond: ""
  };
}

export function stringifyCharacterMetadata(metadata: CharacterMetadata): string {
  return JSON.stringify(metadata);
}

function extractJsonishString(raw: string, key: string) {
  const match = raw.match(new RegExp(`"${key}"\\s*:\\s*"([^"]*)`, "i"));
  return match?.[1]?.trim() ?? "";
}

function extractJsonishArray(raw: string, key: string) {
  const match = raw.match(new RegExp(`"${key}"\\s*:\\s*\\[([^\\]]*)\\]`, "i"));
  if (!match) return [];
  return match[1]
    .split(",")
    .map((item) => item.replace(/^["'\s]+|["'\s]+$/g, "").trim())
    .filter(Boolean);
}

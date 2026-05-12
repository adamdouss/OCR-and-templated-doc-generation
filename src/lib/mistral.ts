import "server-only";

import { Mistral } from "@mistralai/mistralai";

let mistralClient: Mistral | undefined;

export function getMistralClient(): Mistral {
  const apiKey = process.env.MISTRAL_API_KEY;

  if (!apiKey) {
    throw new Error(
      "Missing MISTRAL_API_KEY environment variable. Add it to .env.local before calling Mistral.",
    );
  }

  mistralClient ??= new Mistral({ apiKey });
  return mistralClient;
}

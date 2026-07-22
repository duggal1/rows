/* eslint-disable @typescript-eslint/no-explicit-any */

import { GoogleGenAI } from "@google/genai"
import type { Stream } from "@google/genai"

export interface GeminiConfig {
  apiKey: string
}

export interface InteractionParams {
  model?: string
  systemInstruction?: string
  input: string
  thinkingLevel?: "minimal" | "low" | "medium" | "high"
  temperature?: number
  maxOutputTokens?: number
}

export interface StreamEvent {
  type: "text" | "start" | "complete"
  text?: string
}

export interface InteractionResult {
  text: string
  id: string
}

export class GeminiClient {
  private client: GoogleGenAI

  constructor(config: GeminiConfig) {
    this.client = new GoogleGenAI({ apiKey: config.apiKey })
  }

  async createInteraction(params: InteractionParams): Promise<InteractionResult> {
    const response = await this.client.interactions.create({
      model: params.model ?? "gemini-3.6-flash",
      system_instruction: params.systemInstruction,
      input: params.input,
      generation_config: {
        thinking_level: params.thinkingLevel ?? "medium",
        temperature: params.temperature,
        max_output_tokens: params.maxOutputTokens,
      },
    } as any)

    return {
      text: (response as any).output_text ?? "",
      id: (response as any).id ?? "",
    }
  }

  async createStreamingInteraction(
    params: InteractionParams,
    onEvent: (event: StreamEvent) => void,
  ): Promise<string> {
    const result = await this.client.interactions.create({
      model: params.model ?? "gemini-3.6-flash",
      system_instruction: params.systemInstruction,
      input: params.input,
      generation_config: {
        thinking_level: params.thinkingLevel ?? "medium",
        temperature: params.temperature,
        max_output_tokens: params.maxOutputTokens,
      },
      stream: true,
    } as any)
    const stream = result as unknown as Stream<any>

    let fullText = ""

    for await (const event of stream) {
      if (event.event_type === "step.delta") {
        if (event.delta?.type === "text" && event.delta.text) {
          fullText += event.delta.text
          onEvent({ type: "text", text: event.delta.text })
        }
      } else if (event.event_type === "step.start") {
        onEvent({ type: "start" })
      }
    }

    onEvent({ type: "complete" })
    return fullText
  }
}

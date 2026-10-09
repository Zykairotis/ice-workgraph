import type { ExtensionContext, ToolDefinition } from "@zykairotis/ice-coding-agent";
import type { TSchema } from "typebox";

/** The host-managed ICE mode is in session entries, not another extension's flags. */
export function canMutateWorkgraph(ctx: ExtensionContext): boolean {
  if (typeof ctx.isProjectTrusted !== "function" || !ctx.isProjectTrusted()) return false;
  const branch = ctx.sessionManager.getBranch();
  for (let i = branch.length - 1; i >= 0; i--) {
    const entry = branch[i];
    if (entry?.type !== "custom" || entry.customType !== "ice-safe-verify-state") continue;
    const data: unknown = entry.data;
    return !!data && typeof data === "object" && "mode" in data && data.mode === "build";
  }
  return false;
}

/**
 * Declare a tool's ICE mode policy class: ICE exposes `read` tools in plan and
 * build mode and `write` tools only in a trusted build session. Hosts without
 * the `access` field ignore it and keep the tool inactive under ICE modes.
 */
export function withIceAccess<TParams extends TSchema, TDetails, TState>(
  access: "read" | "write",
  tool: ToolDefinition<TParams, TDetails, TState>,
): ToolDefinition<TParams, TDetails, TState> {
  return { ...tool, access } as ToolDefinition<TParams, TDetails, TState>;
}

export function requireWorkgraphMutation(ctx: ExtensionContext): void {
  if (!canMutateWorkgraph(ctx)) {
    throw new Error("ICE Workgraph requires a trusted ICE build session for Beads mutations");
  }
}
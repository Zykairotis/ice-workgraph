import { describe, expect, it } from "vitest";
import { resolveConfig } from "./config.ts";
import { asExtensionAPI, makeMockPi } from "../test/helpers/mock-pi.ts";

describe("subagents routing config", () => {
  it("parses non-empty named-profile routes and drops malformed entries", () => {
    const mock = makeMockPi();
    mock.setFlag(
      "ice-workgraph-subagents-executor",
      JSON.stringify({
        enabled: true,
        versionRange: "0.34",
        routes: {
          oneshot: { implementer: " economy-worker ", reviewer: 42 },
          reviewed: { implementer: "worker", reviewer: "reviewer" },
          unknown: { implementer: "ignored" },
        },
      }),
    );

    expect(resolveConfig(asExtensionAPI(mock)).subagentsExecutor).toEqual({
      enabled: true,
      versionRange: "0.34",
      routes: {
        oneshot: { implementer: "economy-worker" },
        reviewed: { implementer: "worker", reviewer: "reviewer" },
      },
    });
  });
});

describe("native ICE subagents config", () => {
  const resolve = (value: string | undefined) => {
    const mock = makeMockPi();
    mock.setFlag("ice-workgraph-ice-subagents", value);
    return resolveConfig(asExtensionAPI(mock)).iceSubagentsExecutor;
  };

  it("is disabled by default and enables the built-in agents with true", () => {
    expect(resolve(undefined)).toBeUndefined();
    expect(resolve("false")).toBeUndefined();
    expect(resolve("true")).toEqual({
      enabled: true,
      agents: { planner: "plan", implementer: "worker", reviewer: "review", revision: "worker" },
      models: {},
    });
  });

  it("overrides agents and models per role and rejects malformed input", () => {
    expect(resolve('{"agents":{"reviewer":"strict-review"},"models":{"reviewer":"omni/other"}}')).toEqual({
      enabled: true,
      agents: { planner: "plan", implementer: "worker", reviewer: "strict-review", revision: "worker" },
      models: { reviewer: "omni/other" },
    });
    expect(resolve('{"agents":{"reviewer":"Bad Name"}}')).toBeUndefined();
    expect(resolve('{"agents":[]}')).toBeUndefined();
    expect(resolve("not json")).toBeUndefined();
  });
});

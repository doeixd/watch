import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { watch, click, getCurrentContext } from "../src/index";
import { on as onEventsSync } from "../src/api/events-sync";
import { on as onEvents } from "../src/api/events";

describe("Debug Click Function", () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement("div");
    container.id = "debug-container";
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  it("should test click function return value", async () => {
    const button = document.createElement("button");
    container.appendChild(button);

    let contextAvailable = false;
    let clickResult: any = null;
    let clickResultType = "";
    let isIterable = false;
    let isGenerator = false;
    let onEventsSyncResult: any = null;
    let onEventsResult: any = null;

    await watch(button, function* () {
      contextAvailable = !!getCurrentContext();

      console.log("=== FUNCTION COMPARISON DEBUG ===");

      // Test click() function
      clickResult = click(() => console.log("test handler"));
      clickResultType = typeof clickResult;
      isIterable =
        clickResult && typeof clickResult[Symbol.iterator] === "function";
      isGenerator = clickResult && typeof clickResult.next === "function";

      console.log("click() returned type:", clickResultType);
      console.log("click() is iterable:", isIterable);
      console.log("click() is generator:", isGenerator);

      // Test direct on() from events-sync
      onEventsSyncResult = onEventsSync("click", () =>
        console.log("test handler"),
      );
      console.log("onEventsSync() returned type:", typeof onEventsSyncResult);
      console.log(
        "onEventsSync() is iterable:",
        onEventsSyncResult &&
          typeof onEventsSyncResult[Symbol.iterator] === "function",
      );
      console.log(
        "onEventsSync() is generator:",
        onEventsSyncResult && typeof onEventsSyncResult.next === "function",
      );

      // Test direct on() from events
      onEventsResult = onEvents("click", () => console.log("test handler"));
      console.log("onEvents() returned type:", typeof onEventsResult);
      console.log(
        "onEvents() is iterable:",
        onEventsResult && typeof onEventsResult[Symbol.iterator] === "function",
      );
      console.log(
        "onEvents() is generator:",
        onEventsResult && typeof onEventsResult.next === "function",
      );

      if (clickResult) {
        console.log("clickResult constructor:", clickResult.constructor.name);
        console.log("clickResult keys:", Object.keys(clickResult));
      }

      // Try to use the working generator
      if (
        onEventsSyncResult &&
        typeof onEventsSyncResult[Symbol.iterator] === "function"
      ) {
        console.log("Using onEventsSync result with yield*");
        yield* onEventsSyncResult;
      } else if (isIterable && isGenerator) {
        console.log("Using click result with yield*");
        yield* clickResult;
      }
    });

    expect(contextAvailable).toBe(true);
    // Note: We'll check what actually works rather than forcing expectations
    console.log("Final results - clickResultType:", clickResultType);
  });
});

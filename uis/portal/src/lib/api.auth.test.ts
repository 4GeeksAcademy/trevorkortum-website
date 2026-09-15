/**
 * Portal auth utility tests (AUTH-088).
 * Run: npm --prefix uis/portal test
 */
import {
  getToken,
  setToken,
  clearToken,
  toUserMessage,
  ApiError,
  TOKEN_KEY,
} from "./api";

describe("portal auth utilities", () => {
  beforeEach(() => {
    localStorage.clear();
    // jsdom location is read-only for href assignment in some setups
    window.history.replaceState({}, "", "/");
  });

  it("happy: set/get/clear token roundtrip", () => {
    expect(getToken()).toBeNull();
    setToken("jwt-abc");
    expect(getToken()).toBe("jwt-abc");
    expect(localStorage.getItem(TOKEN_KEY)).toBe("jwt-abc");
    clearToken();
    expect(getToken()).toBeNull();
  });

  it("edge: toUserMessage allowlists safe API details", () => {
    expect(
      toUserMessage(new ApiError("Invalid credentials", 401), "fallback")
    ).toBe("Invalid credentials");
  });

  it("failure: toUserMessage maps unknown 500 to generic copy", () => {
    expect(
      toUserMessage(new ApiError("Traceback: /secret/path", 500), "fallback")
    ).toBe("Something went wrong on our side. Please try again.");
  });

  it("failure: toUserMessage handles network TypeError", () => {
    expect(toUserMessage(new TypeError("fetch failed"), "fallback")).toMatch(
      /Unable to reach the server/
    );
  });
});

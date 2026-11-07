/** Demo flags force failure branches: ?scanFail=1, ?topupFail=1, ?liveFail=1. Kept for the browser tab. */
export type DemoFlag = "scanFail" | "topupFail" | "liveFail";

const PREFIX = "demo:";

export function captureDemoFlags(search: string = window.location.search): void {
  const params = new URLSearchParams(search);
  (["scanFail", "topupFail", "liveFail"] as const).forEach((f) => {
    if (params.get(f) === "1") sessionStorage.setItem(PREFIX + f, "1");
    if (params.get(f) === "0") sessionStorage.removeItem(PREFIX + f);
  });
}

export function hasDemoFlag(flag: DemoFlag): boolean {
  return sessionStorage.getItem(PREFIX + flag) === "1";
}

/** Returns true once, then clears the flag, so a retry succeeds. */
export function consumeDemoFlag(flag: DemoFlag): boolean {
  const on = hasDemoFlag(flag);
  sessionStorage.removeItem(PREFIX + flag);
  return on;
}

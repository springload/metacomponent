export type Log = (...args: any[]) => void;

export function logFactory(haltOnErrors: boolean): Log {
  return (...args) => {
    if (haltOnErrors) {
      throw Array.from(args)
        .map((arg) => arg.toString())
        .join("\n");
    }
    console.log(...args, "");
  };
}

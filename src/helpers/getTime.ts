import { performance } from "perf_hooks";

export const getTime = async (fn: Function): Promise<number> => {
    const startTime = performance.now();
    await fn();
    const endTime = performance.now();

    return endTime - startTime;
};

export async function timeFunction(func) {
    const startTime = Date.now();
    const result = await func();
    const endTime = Date.now();
    const elapsed = endTime - startTime;
    console.log(`Function took ${elapsed} ms to execute.`);
    return result;
}

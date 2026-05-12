import { RESERVED_DATA_PROVIDERS, TOOLCHAIN_TASKS } from "./providers";
import type { ToolchainTask } from "./types";

export function getToolchainTaskConfig(task: ToolchainTask) {
  return TOOLCHAIN_TASKS[task];
}

export function listToolchainTaskConfigs() {
  return Object.values(TOOLCHAIN_TASKS);
}

export function listReservedDataProviders() {
  return RESERVED_DATA_PROVIDERS;
}

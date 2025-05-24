
export let CORE_WATER_RATE_PER_HOUR = 1200; // PKR per hour
export const APP_NAME = "AquaTrack Mobile";

export function updateCoreWaterRate(newRate: number): void {
  if (typeof newRate === 'number' && !isNaN(newRate) && newRate >= 0) {
    CORE_WATER_RATE_PER_HOUR = newRate;
    console.log(`Core water rate updated to: ${newRate}`);
  } else {
    console.error("Invalid new rate provided for core water rate.");
  }
}

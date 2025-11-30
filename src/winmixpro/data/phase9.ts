export interface WinmixPhase9SettingsState {
  collaborative: boolean;
  temporalDecay: number;
  crowdWeight: number;
  marketMode: "off" | "test" | "prod";
  freshnessMinutes: number;
}
export const winmixPhase9Defaults: WinmixPhase9SettingsState = {
  collaborative: true,
  temporalDecay: 32,
  crowdWeight: 38,
  marketMode: "test",
  freshnessMinutes: 24
};
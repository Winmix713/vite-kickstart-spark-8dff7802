export interface WinmixFeedbackEntry {
  id: string;
  submitter: string;
  channel: string;
  message: string;
  status: "nyitott" | "feldolgozva";
  priority: "magas" | "közepes" | "alacsony";
  submittedAt: string;
}
export const winmixFeedbackEntries: WinmixFeedbackEntry[] = [{
  id: "fb-1",
  submitter: "marton.szabo@winmix.hu",
  channel: "Slack #phase9",
  message: "Az új underdog jelzés túl agresszívan blokkol.",
  status: "nyitott",
  priority: "magas",
  submittedAt: "08:18"
}, {
  id: "fb-2",
  submitter: "eszter.pap@winmix.hu",
  channel: "Email",
  message: "Hiányzik női BL scoreboard a stat lapról.",
  status: "nyitott",
  priority: "közepes",
  submittedAt: "07:56"
}, {
  id: "fb-3",
  submitter: "lilla.kovacs@winmix.hu",
  channel: "Linear",
  message: "Dashboard hero chart mobilon elcsúszik.",
  status: "feldolgozva",
  priority: "alacsony",
  submittedAt: "06:42"
}];
import type { DeliverTo, HowMany, HowOften } from "src/shared/models";

/** The text of each "Deliver to" choice, as the Google Alerts options panel shows it. */
export const DELIVER_TO_LABELS: Readonly<Record<DeliverTo, string>> = {
  rss: "RSS feed",
  email: "Email",
};

/** The text of each "How often" choice, as the Google Alerts options panel shows it. */
export const HOW_OFTEN_LABELS: Readonly<Record<HowOften, string>> = {
  as_it_happens: "As-it-happens",
  daily: "At most once a day",
  weekly: "At most once a week",
};

/** The text of each "How many" choice, as the Google Alerts options panel shows it. */
export const HOW_MANY_LABELS: Readonly<Record<HowMany, string>> = {
  all: "All results",
  best: "Only the best results",
};

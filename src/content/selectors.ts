/** Every page selector and timing constant lives here. A Google layout change is a fix in this file. */
export const SELECTORS = {
  createForm: "#create-alert-div",
  queryInput: "#create-alert-div .query_div input",
  showOptionsToggle: "#create-alert-div .show_options",
  createButton: "#create_alert",
  updateButton: "#save_alert",
  updateButtonDisabledClass: "jfk-button-disabled",
  formCloseIcon: "#create-alert-div .close_icon",
  frequencySelect: "#create-alert-div .frequency_select",
  sourceSelect: "#create-alert-div .source_select",
  languageSelect: "#create-alert-div .language_select",
  regionSelect: "#create-alert-div .region_select",
  volumeSelect: "#create-alert-div .volume_select",
  deliverySelect: "#create-alert-div .delivery_select .goog-flat-menu-button",
  openMenuItem: ".goog-menu .goog-menuitem",
  alertRow: "li.alert_instance",
  alertRowQuery: ".query_div span",
  alertRowFeedLink: 'a[href*="alerts/feeds"]',
  alertRowDeleteButton: ".delete_button",
  alertRowEditButton: ".edit_button",
  showAllAlerts: ".show_all_alerts",
  deleteNotice: ".jfk-butterBar-shown",
} as const;

export const TIMING = {
  elementTimeoutMilliseconds: 8000,
  menuTimeoutMilliseconds: 3000,
  alertAppearTimeoutMilliseconds: 15000,
  alertDisappearTimeoutMilliseconds: 15000,
  settleMilliseconds: 150,
} as const;

/** Menu item text for each option value, as the form shows it. */
export const OPTION_LABELS = {
  howOften: {
    as_it_happens: "As-it-happens",
    daily: "At most once a day",
    weekly: "At most once a week",
  },
  howMany: { all: "All results", best: "Only the best results" },
  deliverToRss: "RSS feed",
} as const;

/** Text that marks a bot check page. */
export const BOT_CHECK_PATTERN: RegExp = /unusual traffic|not a robot|captcha/i;
export const BOT_CHECK_URL_FRAGMENT: string = "/sorry/";

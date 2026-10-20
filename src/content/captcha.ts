import { BOT_CHECK_PATTERN, BOT_CHECK_URL_FRAGMENT } from "src/content/selectors";
import { CaptchaError } from "src/shared/errors";

/** Report whether the page is a bot check. Pure over its inputs. */
export function looksLikeBotCheck({
  pageUrl,
  pageText,
}: {
  pageUrl: string;
  pageText: string;
}): boolean {
  return pageUrl.includes(BOT_CHECK_URL_FRAGMENT) || BOT_CHECK_PATTERN.test(pageText);
}

/** Throw CaptchaError when the current page is a bot check. Reads the page. */
export function throwIfBotCheck(): void {
  if (looksLikeBotCheck({ pageUrl: window.location.href, pageText: document.body.innerText })) {
    throw new CaptchaError();
  }
}

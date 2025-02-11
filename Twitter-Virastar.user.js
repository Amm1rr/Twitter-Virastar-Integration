// ==UserScript==
// @name         Twitter Virastar Integration
// @version      0.1
// @author       Mohammad Khani
// @description  ویراستارِ توییت‌های فارسی
// @homepage     https://www.github.com/amm1rr/
// @namespace    amm1rr.com.virastar
// @match        https://x.com/home
// @require      https://raw.githubusercontent.com/zoghal/virastar/refs/heads/master/lib/virastar.js
// @grant        none
// @updateURL    https://github.com/Amm1rr/Twitter-Virastar-Integration/raw/refs/heads/main/Twitter-Virastar.user.js
// ==/UserScript==

// توییتر از کتابخانه Draft.js برای فیلد متنی استفاده می‌کند، که مدیریت state در React را پیچیده می‌سازد.
// تغییر مستقیم مقدار فیلد ممکن است باعث اختلال در عملکرد کلیدهای Backspace و Delete شود،
// به‌ویژه زمانی که متن از طریق insertText یا روش‌های مشابه درج شود.
// برای جلوگیری از این مشکل، از DataTransfer استفاده می‌کنیم تا متن را به درستی در فیلد وارد کرده
// و از تداخل در مدیریت state در React جلوگیری کنیم.

(function () {
  "use strict";

  // تعریف ثابت‌های رنگ، سلکتورها و زمان‌بندی
  const COLORS = {
    GRAY: "#cccccc",
    GREEN: "#28a745",
    HIGHLIGHT: "#d4f8d4",
    TRANSPARENT: "transparent",
    TEXT_HIGHLIGHT: "#302f2f",
  };

  const SELECTORS = {
    TWEET_FIELD: '[data-testid="tweetTextarea_0"]',
    TWEET_BUTTON: '[data-testid="tweetButtonInline"]',
    VIRASTAR_BUTTON: "#virastar-button",
  };

  const TIMING = {
    PROCESSING_DELAY: 300,
    TEXT_HIGHLIGHT: 1000,
    RESET_DELAY: 1250,
    UI_UPDATE: 100,
  };

  // تابع کمکی: ایجاد تاخیر به صورت Promise
  const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  // بررسی اینکه متن با کاراکتر فارسی آغاز می‌شود یا خیر
  const isPersian = (text) => /^[\u0600-\u06FF\u0750-\u077F]/.test(text);

  // تابع پاکسازی فیلد توییت با استفاده از ClipboardEvent
  const clearTweetField = (tweetField) => {
    const selection = window.getSelection();
    const range = document.createRange();
    range.selectNodeContents(tweetField);
    selection.removeAllRanges();
    selection.addRange(range);

    const dt = new DataTransfer();
    dt.setData("text/plain", "");
    const pasteEvent = new ClipboardEvent("paste", {
      bubbles: true,
      cancelable: true,
      clipboardData: dt,
    });
    tweetField.dispatchEvent(pasteEvent);
  };

  // تابع برای چسباندن متن به فیلد توییت
  const pasteText = (tweetField, text) => {
    const dt = new DataTransfer();
    dt.setData("text/plain", text);
    const pasteEvent = new ClipboardEvent("paste", {
      bubbles: true,
      cancelable: true,
      clipboardData: dt,
    });
    tweetField.dispatchEvent(pasteEvent);
  };

  // قرار دادن کرسر در انتهای متن فیلد توییت
  const setCursorToEnd = (tweetField) => {
    const selection = window.getSelection();
    const range = document.createRange();
    range.selectNodeContents(tweetField);
    range.collapse(false);
    selection.removeAllRanges();
    selection.addRange(range);
  };

  // به‌روزرسانی فیلد توییت با متن پردازش‌شده و نمایش افکت بصری
  async function updateTweetText(processedText) {
    const tweetField = document.querySelector(SELECTORS.TWEET_FIELD);
    if (!tweetField) return;

    tweetField.focus();
    clearTweetField(tweetField);
    await delay(50);
    pasteText(tweetField, processedText);

    // نمایش افکت پس‌زمینه به عنوان بازخورد کاربر
    tweetField.style.transition = "background-color 0.5s ease";
    tweetField.style.backgroundColor = COLORS.HIGHLIGHT;
    requestAnimationFrame(() => {
      setTimeout(
        () => (tweetField.style.backgroundColor = COLORS.TRANSPARENT),
        TIMING.TEXT_HIGHLIGHT
      );
    });

    await delay(TIMING.UI_UPDATE);
    setCursorToEnd(tweetField);
  }

  // ایجاد دکمه ویراستار و تنظیم رویدادهای مربوطه
  function initVirastarButton() {
    const tweetField = document.querySelector(SELECTORS.TWEET_FIELD);
    const tweetButton = document.querySelector(SELECTORS.TWEET_BUTTON);
    if (!tweetField || document.getElementById("virastar-button")) return;

    // ایجاد دکمه ویراستار
    const editButton = document.createElement("button");
    editButton.id = "virastar-button";
    editButton.textContent = "ویراستار ✍️";
    editButton.disabled = true;
    editButton.style.cssText = `
      margin-left: 10px;
      padding: 8px 12px;
      border: none;
      border-radius: 9999px;
      background-color: ${COLORS.GRAY};
      color: white;
      cursor: default;
      font-size: 14px;
      transition: background-color 0.3s ease, transform 0.2s ease;
      width: 100px;
      text-align: center;
    `;

    // دریافت رنگ پس‌زمینه دکمه توییت اصلی
    const tweetButtonStyles = window.getComputedStyle(tweetButton);
    const tweetButtonBackgroundColor = tweetButtonStyles.backgroundColor;

    // اعمال افکت‌های hover برای دکمه ویراستار
    editButton.addEventListener("mouseover", () => {
      if (!editButton.disabled) {
        editButton.style.backgroundColor = COLORS.TEXT_HIGHLIGHT;
      }
    });
    editButton.addEventListener("mouseout", () => {
      if (!editButton.disabled) {
        editButton.style.backgroundColor = tweetButtonBackgroundColor;
      }
    });

    // بروزرسانی وضعیت دکمه بر اساس محتوای فیلد توییت
    const updateButtonState = () => {
      const text = tweetField.textContent.trim();
      const hasText = text.length > 0;
      editButton.disabled = !hasText;
      editButton.style.backgroundColor = hasText
        ? tweetButtonBackgroundColor
        : COLORS.GRAY;
      editButton.style.cursor = hasText ? "pointer" : "default";
      if (hasText) tweetField.style.direction = isPersian(text) ? "rtl" : "ltr";
    };

    // اتصال رویدادهای مربوط به تغییرات در فیلد توییت
    ["input", "keyup", "compositionend", "textInput"].forEach((event) =>
      tweetField.addEventListener(event, updateButtonState)
    );

    // رویداد کلیک روی دکمه ویراستار با استفاده از async/await
    editButton.addEventListener("click", async () => {
      if (editButton.disabled) return;
      editButton.disabled = true;
      editButton.textContent = "... ⏳";
      editButton.style.transform = "scale(0.95)";
      editButton.style.cursor = "default";

      await delay(TIMING.PROCESSING_DELAY);
      const processedText = new Virastar().cleanup(
        tweetField.textContent.trim()
      );
      await updateTweetText(processedText);
      editButton.textContent = "✅";
      editButton.style.backgroundColor = COLORS.GREEN;

      await delay(TIMING.RESET_DELAY);
      editButton.textContent = "ویراستار ✍️";
      editButton.style.backgroundColor = tweetButtonBackgroundColor;
      editButton.disabled = false;
      editButton.style.transform = "scale(1)";
      editButton.style.cursor = "pointer";
    });

    tweetButton.parentElement.appendChild(editButton);
    updateButtonState();
  }

  // استفاده از MutationObserver برای اجرای کد در زمانی که فیلد توییت موجود شود
  const observer = new MutationObserver(() => {
    if (document.querySelector(SELECTORS.TWEET_FIELD)) {
      initVirastarButton();
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });
})();

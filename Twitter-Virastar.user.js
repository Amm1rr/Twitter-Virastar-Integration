// ==UserScript==
// @name         Twitter Virastar Integration
// @version      0.1
// @author       Amm1rr
// @description  ویراستار توییت‌های فارسی
// @homepage     https://www.github.com/amm1rr/
// @namespace    amm1rr.com.virastar
// @match        https://x.com/*
// @require      https://raw.githubusercontent.com/zoghal/virastar/refs/heads/master/lib/virastar.js
// @grant        none
// @updateURL    https://gist.github.com/Amm1rr/a99724466256da42c4ef08c144a790d7/raw/e3a22769f09e3732aa5c61ce9060d768c4474326/youtube-custom-font.user.js
// ==/UserScript==

(function () {
  "use strict";
  // تابع تشخیص اولین کاراکتر فارسی/عربی یا غیر فارسی/عربی
  function isPersian(text) {
    const persianRegex = /^[\u0600-\u06FF\u0750-\u077F]/;
    return persianRegex.test(text);
  }

  // تابع افزودن دکمه ویراستار به صفحه
  function addVirastarButton() {
    const tweetField = document.querySelector(
      '[data-testid="tweetTextarea_0"]'
    );
    const tweetButton = document.querySelector(
      '[data-testid="tweetButtonInline"]'
    );

    // اگر المان‌های مورد نیاز موجود نباشند یا دکمه قبلاً اضافه شده باشد، کاری انجام نده
    if (!tweetField || !tweetButton) return;
    if (document.getElementById("virastar-button")) return;

    // ساخت دکمه ویراستار
    const editButton = document.createElement("button");
    editButton.id = "virastar-button";
    editButton.textContent = "ویراستار ✍️";
    editButton.disabled = true;
    editButton.style.marginLeft = "10px";
    editButton.style.padding = "8px 12px";
    editButton.style.border = "none";
    editButton.style.borderRadius = "5px";
    editButton.style.backgroundColor = "#cccccc"; // حالت اولیه: خاکستری (غیرفعال)
    editButton.style.color = "white";
    editButton.style.cursor = "default"; // حالت اولیه: cursor عادی
    editButton.style.fontSize = "14px";
    editButton.style.transition =
      "background-color 0.3s ease, transform 0.2s ease";

    // تابع به‌روز رسانی وضعیت دکمه با فراخوانی در رویدادهای input و keyup
    function updateButtonState() {
      const text = tweetField.innerText.trim();
      if (text.length > 0) {
        editButton.disabled = false;
        editButton.style.backgroundColor = "#1D9BF0";
        editButton.style.cursor = "pointer";

        const textClass = isPersian(text)
          ? "public-DraftStyleDefault-rtl"
          : "public-DraftStyleDefault-ltr";
        tweetField.style.direction = isPersian(text) ? "rtl" : "ltr";

        const textBlock = tweetField.querySelector(
          ".public-DraftStyleDefault-block"
        );
        if (textBlock) {
          textBlock.classList.remove(
            "public-DraftStyleDefault-rtl",
            "public-DraftStyleDefault-ltr"
          );
          textBlock.classList.add(textClass);
        }
      } else {
        editButton.disabled = true;
        editButton.style.backgroundColor = "#cccccc";
        editButton.style.cursor = "default";
      }
    }

    tweetField.addEventListener("input", updateButtonState);
    tweetField.addEventListener("keyup", updateButtonState);

    // رویداد کلیک روی دکمه ویراستار با جلوگیری از درخواست‌های همزمان
    editButton.addEventListener("click", () => {
      if (editButton.disabled) return; // جلوگیری از کلیک تکراری

      // غیرفعال کردن دکمه برای جلوگیری از کلیک‌های همزمان
      editButton.disabled = true;
      editButton.textContent = "در حال ویرایش... ⏳";
      editButton.style.backgroundColor = "#cccccc";
      editButton.style.transform = "scale(0.95)";
      editButton.style.cursor = "default";

      setTimeout(() => {
        const virastar = new Virastar();
        const processedText = virastar.cleanup(tweetField.innerText.trim());

        tweetField.focus();
        document.execCommand("selectAll", false, null);
        document.execCommand("insertText", false, processedText);

        // تنظیم وضعیت دکمه به "ویرایش شد" و تغییر cursor به default
        editButton.disabled = true;
        editButton.textContent = "✅ ویرایش شد!";
        editButton.style.backgroundColor = "#28a745";
        editButton.style.transform = "scale(1)";
        editButton.style.cursor = "default"; // cursor در حالت پردازش شده
        tweetField.style.transition = "background-color 0.5s ease";
        tweetField.style.backgroundColor = "#d4f8d4";
        setTimeout(() => {
          editButton.disabled = false;
          editButton.textContent = "ویراستار ✍️";
          editButton.style.cursor = "pointer"; // برگرداندن cursor به حالت کلیک
          tweetField.style.backgroundColor = "transparent";
          editButton.style.backgroundColor = "#1D9BF0";
        }, 1500);
      }, 800);
    });

    // اضافه کردن دکمه ویراستار در کنار دکمه ارسال
    tweetButton.parentElement.insertBefore(editButton, tweetButton);
  }

  // MutationObserver اولیه برای افزودن دکمه ویراستار پس از بارگذاری المان‌های مورد نیاز
  const initialObserver = new MutationObserver((mutations, observer) => {
    const tweetField = document.querySelector(
      '[data-testid="tweetTextarea_0"]'
    );
    const tweetButton = document.querySelector(
      '[data-testid="tweetButtonInline"]'
    );
    if (tweetField && tweetButton) {
      addVirastarButton();
      observer.disconnect();
    }
  });
  initialObserver.observe(document.body, { childList: true, subtree: true });

  // اضافه کردن دکمه ویراستار مجدد در صورت فشردن Esc (Discard شدن)
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      setTimeout(addVirastarButton, 100);
    }
  });

  // MutationObserver برای نظارت بر دکمه Discard (confirm modal)
  const discardObserver = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (node.nodeType === 1) {
          if (
            node.matches &&
            node.matches("button") &&
            node.textContent.trim().toLowerCase() === "discard"
          ) {
            node.addEventListener("click", () => {
              // بعد از کلیک روی Discard، دکمه ویراستار مجدداً اضافه می‌شود
              setTimeout(addVirastarButton, 100);
            });
          }
          // همچنین اگر دکمه در داخل یک المان دیگر قرار داشته باشد:
          const discardBtn = node.querySelector && node.querySelector("button");
          if (
            discardBtn &&
            discardBtn.textContent.trim().toLowerCase() === "discard"
          ) {
            discardBtn.addEventListener("click", () => {
              setTimeout(addVirastarButton, 100);
            });
          }
        }
      });
    });
  });
  discardObserver.observe(document.body, { childList: true, subtree: true });
})();

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

  function isPersian(text) {
    return /^[\u0600-\u06FF\u0750-\u077F]/.test(text);
  }

  function updateTweetText(processedText) {
    const tweetField = document.querySelector('[data-testid="tweetTextarea_0"]');
    if (!tweetField) return;

    tweetField.focus();

    const clearTweetField = () => {
      const selection = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(tweetField);
      selection.removeAllRanges();
      selection.addRange(range);

      let dt = new DataTransfer();
      dt.setData('text/plain', ''); // داده‌ی خالی برای پاکسازی
      const pasteEvent = new ClipboardEvent('paste', {
        bubbles: true,
        cancelable: true,
        clipboardData: dt
      });
      tweetField.dispatchEvent(pasteEvent);
    };

    clearTweetField();

    setTimeout(() => {
      let dt = new DataTransfer();
      dt.setData('text/plain', processedText);
      const pasteEvent = new ClipboardEvent('paste', {
        bubbles: true,
        cancelable: true,
        clipboardData: dt
      });
      tweetField.dispatchEvent(pasteEvent);

      tweetField.style.transition = "background-color 0.5s ease";
      tweetField.style.backgroundColor = "#d4f8d4";
      requestAnimationFrame(() => {
        setTimeout(() => tweetField.style.backgroundColor = "transparent", 500);
      });

      setTimeout(() => {
        const selection = window.getSelection();
        const range = document.createRange();
        range.selectNodeContents(tweetField);
        range.collapse(false);
        selection.removeAllRanges();
        selection.addRange(range);
      }, 100);
    }, 50);
  }

  function initVirastarButton() {
    const tweetField = document.querySelector('[data-testid="tweetTextarea_0"]');
    const tweetButton = document.querySelector('[data-testid="tweetButtonInline"]');
    if (!tweetField || document.getElementById('virastar-button')) return;

    const editButton = document.createElement('button');
    editButton.id = 'virastar-button';
    editButton.textContent = 'ویراستار ✍️';
    editButton.disabled = true;
    editButton.style = `
    margin-left: 10px;
    padding: 8px 12px;
    border: none;
    border-radius: 5px;
    background-color: #cccccc;
    color: white;
    cursor: default;
    font-size: 14px;
    transition: background-color 0.3s ease, transform 0.2s ease;
    width: 100px;
    text-align: center;
    `;

    const updateButtonState = () => {
      const text = tweetField.textContent.trim();
      const hasText = text.length > 0;
      editButton.disabled = !hasText;
      editButton.style.backgroundColor = hasText ? '#1D9BF0' : '#cccccc';
      editButton.style.cursor = hasText ? 'pointer' : 'default';
      if (hasText) tweetField.style.direction = isPersian(text) ? 'rtl' : 'ltr';
    };

      const setupEvents = () => {
        ['input', 'keyup', 'compositionend', 'textInput'].forEach(e =>
        tweetField.addEventListener(e, updateButtonState)
        );
        editButton.addEventListener('click', () => {
          if (editButton.disabled) return;
          editButton.disabled = true;
          editButton.textContent = '... ⏳';
          editButton.style.transform = 'scale(0.95)';
          editButton.style.cursor = "default";

          setTimeout(() => {
            const processedText = new Virastar().cleanup(tweetField.textContent.trim());
            updateTweetText(processedText);
            editButton.textContent = '✅';
            editButton.style.backgroundColor = '#28a745';

            setTimeout(() => {
              editButton.textContent = 'ویراستار ✍️';
              editButton.style.backgroundColor = '#1D9BF0';
              editButton.disabled = false;
              editButton.style.transform = 'scale(1)';
              editButton.style.cursor = "pointer";
            }, 1500);
          }, 300);
        });
      };

      tweetButton.parentElement.insertBefore(editButton, tweetButton);
      setupEvents();
      updateButtonState();
  }

  const observer = new MutationObserver(() => {
    if (document.querySelector('[data-testid="tweetTextarea_0"]')) {
      initVirastarButton();
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
})();

(() => {
  let config;
  let bannerContainer;
  let settingsContainer;

  const forceArray = (data) => {
    // eslint-disable-next-line no-restricted-globals
    if (data === undefined || data === null || (typeof data === "number" && isNaN(data))) return [];
    return Array.isArray(data) ? data : [data];
  };

  const removeParameter = (url, parameter) => {
    const urlparts = url.split("?");
    if (urlparts.length >= 2) {
      const prefix = `${encodeURIComponent(parameter)}=`;
      const parts = urlparts[1].split(/[&;]/g);

      for (let i = parts.length; i-- > 0;) {
        if (parts[i].lastIndexOf(prefix, 0) !== -1) {
          parts.splice(i, 1);
        }
      }
      return urlparts[0] + (parts.length > 0 ? `?${parts.join("&")}` : "");
    }
    return url;
  };

  const getCookieValue = (cookieName) => {
    const b = document.cookie.match(`(^|;)\\s*${cookieName}\\s*=\\s*([^;]+)`);
    return b ? b.pop() : "";
  };

  const setCookie = (name, value, days) => {
    let expires = "";
    if (days) {
      const date = new Date();
      date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
      expires = `; expires=${date.toUTCString()}`;
    }
    document.cookie = `${name}=${value || ""}${expires}; path=/`;
  };

  const saveCookieSettings = () => {
    forceArray(config.categories).forEach((category) => {
      const enabled = document.getElementById(category.id).checked;
      forceArray(category.cookies).forEach((cookie) => {
        const value = enabled ? cookie["cookie-value-accepted"] : cookie["cookie-value-rejected"];
        setCookie(cookie["cookie-name"], value);
      });
    });
    setCookie(config.controlCookie, "true");

    if (config.page.reloadOnSave) document.location.href = removeParameter(document.location.href, "cookie_settings");
  };

  const acceptAllCookies = () => {
    forceArray(config.categories).forEach((category) => {
      forceArray(category.cookies).forEach((cookie) => {
        setCookie(cookie["cookie-name"], cookie["cookie-value-accepted"]);
      });
    });
    setCookie(config.controlCookie, "true");

    if (config.page.reloadOnSave) document.location.href = removeParameter(document.location.href, "cookie_settings");
  };


  // ---
  const renderBanner = () => {
    const html = `<div class="cookie-panel-banner ${config.theme}" id="cookie-panel-banner">
    <div class="cookie-panel-banner__inner">
      ${config.title ? `<h2 class="cookie-panel-banner__title">${config.title}</h2>` : ""}
      ${config.description ? `<p class="cookie-panel-banner__description">${config.description}</p>` : ""}
      <div class="cookie-panel-banner__buttons">
        ${config.buttonOrder === "accept-left"
    ? `<button id="cookie-panel-banner-accept-button">${config.acceptLabel}</button><button id="cookie-panel-banner-settings-button">${config.settingsLabel}</button>`
    : `<button id="cookie-panel-banner-settings-button">${config.settingsLabel}</button><button id="cookie-panel-banner-accept-button">${config.acceptLabel}</button>`}
      </div>
    </div>
    </div>`;
    const banner = document.createElement("div");
    banner.innerHTML = html;
    document.body.prepend(banner);

    document.getElementById("cookie-panel-banner-accept-button").addEventListener("click", () => {
      document.getElementById("cookie-panel-banner").style.display = "none";
      acceptAllCookies();
    });

    document.getElementById("cookie-panel-banner-settings-button").addEventListener("click", () => {
      showCookiePanelSettings();
    });

    return banner;
  };

  const renderCategory = category => `
      <div class="cookie-panel-settings__categories__category">
        <div class="cookie-panel-settings__categories__category-header">
          <label class="cookie-panel-switch">
            <input ${(category.default ? "checked disabled" : "")} type="checkbox" id="${category.id}">
            <span class="cookie-panel-switch__toggle"></span>
          </label>
          <h3>${category.title || ""}</h3>
        </div>
        <p>${category.description || ""}</p>
        <hr/>
      </div>`;

  const renderCategories = (categories) => {
    let html = "";

    categories.forEach((category) => {
      html += renderCategory(category);
    });

    return html;
  };

  const renderSettingsPanel = () => {
    const html = `
      <div class="cookie-panel-settings" id="cookie-panel-settings">
        <div class="cookie-panel-settings__inner">
          <h2>${config.title}</h2>
          <div class="cookie-panel-settings__categories">${renderCategories(config.categories)}</div>
          <div class="cookie-panel-settings__buttons">
            <a href="${config.readMoreLink}">${config.readMoreLabel}</a>
            <button id="cookie-panel-settings-save-button">${config.saveLabel}</button>
          </div>
        </div>
      </div>`;

    const settingsPanel = document.createElement("div");
    settingsPanel.innerHTML = html;
    document.body.prepend(settingsPanel);

    // Loop through category cookies and sync switches
    forceArray(config.categories).forEach((category) => {
      forceArray(category.cookies).forEach((cookie) => {
        const value = getCookieValue(cookie["cookie-name"]);
        if (value === cookie["cookie-value-accepted"]) {
          document.getElementById(category.id).checked = true;
        }
      });
    });

    document.getElementById("cookie-panel-settings-save-button").addEventListener("click", () => {
      document.getElementById("cookie-panel-settings").style.display = "none";
      saveCookieSettings();
    });

    return settingsPanel;
  };

  const getData = (selector) => {
    let data = {};
    try {
      const json = document.querySelector(
        `script[type="application/json"][data-cookie-panel-selector="${selector}"]`
      );
      data = JSON.parse(json.textContent);
    } catch (err) {
      // Ignore errors here
    }
    return data;
  };

  const showCookiePanelSettings = () => {
    if (!settingsContainer) {
      settingsContainer = renderSettingsPanel();
    }
    if (bannerContainer) bannerContainer.style.display = "none";
    settingsContainer.style.display = "block";

    // TODO Focus
  };

  const runSetup = () => {
    config = getData("config");
    config.page = getData("page-config");

    if (!config.accepted) {
      bannerContainer = renderBanner();
    }

    // Add event listeners to all elements with data-cookie-panel-selector="open-settings"
    Array.prototype.slice.call(document.querySelectorAll("[data-cookie-panel-selector=\"open-settings\"]")).forEach((element) => {
      element.addEventListener("click", showCookiePanelSettings);
    });

    if (config.showSettings) showCookiePanelSettings();
  };

  if (document.readyState !== "loading") {
    runSetup();
  } else {
    document.addEventListener("DOMContentLoaded", runSetup);
  }
})();

// ==UserScript==
// @name         Taobao Clean Promo Links
// @namespace    local.tony.taobao
// @version      1.0.0
// @description  将淘宝推广跳转链接改写为干净商品链接。
// @match        https://www.taobao.com/*
// @match        https://*.taobao.com/*
// @match        https://www.tmall.com/*
// @match        https://*.tmall.com/*
// @run-at       document-start
// @grant        none
// ==/UserScript==

(() => {
  'use strict';

  const AD_HOSTS = [
    /(^|\.)simba\.taobao\.com$/i,
    /^s\.click\.taobao\.com$/i,
    /^g\.click\.taobao\.com$/i,
    /^i\.click\.taobao\.com$/i,
    /^click\.taobao\.com$/i
  ];

  function isAdHost(hostname) {
    return AD_HOSTS.some(re => re.test(hostname));
  }

  function repeatedlyDecode(text, maxRounds = 5) {
    let out = String(text ?? '');
    for (let i = 0; i < maxRounds; i++) {
      try {
        const next = decodeURIComponent(out);
        if (next === out) break;
        out = next;
      } catch {
        break;
      }
    }
    return out;
  }

  function extractItemId(rawUrl) {
    if (!rawUrl) return null;

    try {
      const u = new URL(rawUrl, location.href);

      const id = u.searchParams.get('id');
      if (id && /^\d{6,}$/.test(id)) return id;

      for (const key of ['itemId', 'item_id', 'itemid']) {
        const v = u.searchParams.get(key);
        if (v && /^\d{6,}$/.test(v)) return v;
      }
    } catch {}

    const decoded = repeatedlyDecode(rawUrl);

    const patterns = [
      /(?:^|[?&#"'=:,\s])x_object_id(?:=|["':\s]+)(\d{6,})/i,
      /(?:^|[?&#"'=:,\s])item[_-]?id(?:=|["':\s]+)(\d{6,})/i,
      /(?:^|[?&#])id=(\d{6,})(?:[&#]|$)/i
    ];

    for (const re of patterns) {
      const m = decoded.match(re);
      if (m) return m[1];
    }

    return null;
  }

  function cleanProductUrl(itemId) {
    return `https://item.taobao.com/item.htm?id=${itemId}`;
  }

  function rewriteAnchor(anchor) {
    if (!(anchor instanceof HTMLAnchorElement)) return false;

    const raw = anchor.getAttribute('href');
    if (!raw || raw.startsWith('#') || raw.startsWith('javascript:')) {
      return false;
    }

    let u;
    try {
      u = new URL(raw, location.href);
    } catch {
      return false;
    }

    if (!isAdHost(u.hostname)) return false;

    const itemId = extractItemId(u.href);
    if (!itemId) return false;

    if (!anchor.dataset.taobaoPromoOriginal) {
      anchor.dataset.taobaoPromoOriginal = u.href;
    }

    anchor.href = cleanProductUrl(itemId);
    anchor.dataset.taobaoPromoCleaned = '1';
    return true;
  }

  function scan(root = document) {
    if (!root) return;

    if (root instanceof HTMLAnchorElement) {
      rewriteAnchor(root);
      return;
    }

    if (root.querySelectorAll) {
      root.querySelectorAll('a[href]').forEach(rewriteAnchor);
    }
  }

  for (const eventName of ['pointerdown', 'mousedown', 'auxclick', 'click']) {
    document.addEventListener(
      eventName,
      event => {
        const target = event.target;
        if (!(target instanceof Element)) return;

        const anchor = target.closest('a[href]');
        if (anchor) rewriteAnchor(anchor);
      },
      true
    );
  }

  const observer = new MutationObserver(mutations => {
    for (const mutation of mutations) {
      if (mutation.type === 'attributes') {
        rewriteAnchor(mutation.target);
        continue;
      }

      for (const node of mutation.addedNodes) {
        if (node instanceof Element) scan(node);
      }
    }
  });

  function start() {
    scan(document);

    observer.observe(document.documentElement || document, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ['href']
    });
  }

  if (document.documentElement) {
    start();
  } else {
    document.addEventListener('DOMContentLoaded', start, { once: true });
  }

  window.TaobaoCleanPromo = {
    extract: extractItemId,
    clean: cleanProductUrl,
    scan
  };
})();

// =========================================================
// mobile.js — Mobile sidebar toggle + bottom tab bar sync
// =========================================================

import { S } from './state.js';
import { $ } from './utils.js';

export function toggleSidebar(){
  $('sidebar').classList.toggle('open');
  $('sb-overlay').classList.toggle('show');
}
export function closeSidebar(){
  $('sidebar').classList.remove('open');
  $('sb-overlay').classList.remove('show');
}

export function updateMobileTabBar(){
  try {
    document.querySelectorAll('.mobile-tabbar .m-tab').forEach(b => {
      const v = b.getAttribute('data-view');
      if(v && v === S.view) b.classList.add('active');
      else b.classList.remove('active');
    });
  } catch(_) {}
}

// Viewport helpers
export function isMobile(){
  return window.matchMedia && window.matchMedia('(max-width:720px)').matches;
}
export function isDesktopForGraph(){
  return window.innerWidth > 1024;
}

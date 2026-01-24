import type { StickyEntityInfo } from "../../../plugins/StickyInfoPlugin";

export interface PopupPosition {
  left: number;
  top: number;
}

export function calcStickyInfoPosition(info: StickyEntityInfo): PopupPosition | null {
  if (!info.screenPosition) return null;

  const offset = 10;
  // Sticky popup actual dimensions (smaller than EntityPopup)
  const stickyPopupWidth = 300;
  const stickyPopupHeight = 120; // Approximate height based on content

  let left = info.screenPosition.x + offset;
  let top = info.screenPosition.y + offset;

  const wouldOverflowRight = left + stickyPopupWidth > window.innerWidth;
  const wouldOverflowBottom = top + stickyPopupHeight > window.innerHeight;

  if (wouldOverflowRight) {
    left = info.screenPosition.x - stickyPopupWidth - offset;
  }

  if (wouldOverflowBottom) {
    top = info.screenPosition.y - stickyPopupHeight - offset;
  }

  left = Math.max(0, Math.min(left, window.innerWidth - stickyPopupWidth));
  top = Math.max(0, Math.min(top, window.innerHeight - stickyPopupHeight));

  return { left, top };
}

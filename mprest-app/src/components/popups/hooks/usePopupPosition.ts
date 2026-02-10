import { useMemo } from "react";
import type { EntityPopupInfo } from "../EntityPopup";

export function usePopupPosition(
  popupInfo: EntityPopupInfo | null,
  popupDimensions: { width: number; height: number }
) {
  return useMemo(() => {
    if (!popupInfo?.screenPosition) return null;

    const offset = 10;
    let left = popupInfo.screenPosition!.x + offset;
    let top = popupInfo.screenPosition!.y + offset;

    const popupWidth = popupDimensions.width;
    const popupHeight = popupDimensions.height;

    // Check if positioning to the right would go off-screen
    const wouldOverflowRight = left + popupWidth > window.innerWidth;
    const wouldOverflowBottom = top + popupHeight > window.innerHeight;

    // Adjust position based on available space
    if (wouldOverflowRight) {
      left = popupInfo.screenPosition!.x - popupWidth - offset;
    }

    if (wouldOverflowBottom) {
      top = popupInfo.screenPosition!.y - popupHeight - offset;
    }

    // Ensure popup stays within viewport bounds
    left = Math.max(0, Math.min(left, window.innerWidth - popupWidth));
    top = Math.max(0, Math.min(top, window.innerHeight - popupHeight));

    return { left, top };
  }, [popupInfo, popupDimensions]);
}
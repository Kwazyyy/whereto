"use client";

import { useState, useEffect } from "react";

export function usePhotoUrl(photoRef: string | null): string | null {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!photoRef) {
      setUrl(null);
      return;
    }
    let cancelled = false;
    fetch(`/api/places/photo?ref=${encodeURIComponent(photoRef)}`)
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled && data.photoUrl) setUrl(data.photoUrl);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [photoRef]);

  return url;
}

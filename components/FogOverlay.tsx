"use client";

import { useEffect, useRef, useCallback } from "react";

interface VisitedLocation {
    lat: number;
    lng: number;
}

interface FogOverlayProps {
    /** The raw google.maps.Map instance — passed from parent, NOT from useMap() */
    mapInstance: google.maps.Map | null;
    visitedLocations: VisitedLocation[];
    userLocation?: { lat: number; lng: number } | null;
    enabled: boolean;
    isDark?: boolean;
    /** Ref to the container div that this canvas should overlay */
    containerRef: React.RefObject<HTMLDivElement | null>;
}

/**
 * Fog-of-War canvas overlay.
 * Renders as a SIBLING of the Google Map (not inside it).
 * The canvas is absolutely positioned over the map container.
 */
export default function FogOverlay({
    mapInstance,
    visitedLocations,
    userLocation,
    enabled,
    isDark = false,
    containerRef,
}: FogOverlayProps) {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);

    // ── lat/lng → screen pixel (bounds-based, per user spec) ──────────
    const latLngToPixel = useCallback(
        (lat: number, lng: number): { x: number; y: number } | null => {
            if (!mapInstance) return null;
            const bounds = mapInstance.getBounds();
            if (!bounds) return null;
            const projection = mapInstance.getProjection();
            if (!projection) return null;

            const ne = bounds.getNorthEast();
            const sw = bounds.getSouthWest();
            const topRight = projection.fromLatLngToPoint(ne);
            const bottomLeft = projection.fromLatLngToPoint(sw);
            const worldPoint = projection.fromLatLngToPoint(
                new google.maps.LatLng(lat, lng)
            );
            if (!topRight || !bottomLeft || !worldPoint) return null;

            const scale = Math.pow(2, mapInstance.getZoom() ?? 0);
            const pixelX = (worldPoint.x - bottomLeft.x) * scale;
            const pixelY = (worldPoint.y - topRight.y) * scale;

            return { x: pixelX, y: pixelY };
        },
        [mapInstance]
    );

    // ── meters → pixels ───────────────────────────────────────────────
    const metersToPixels = useCallback(
        (meters: number, lat: number): number => {
            if (!mapInstance) return 0;
            const zoom = mapInstance.getZoom();
            if (zoom == null) return 0;
            const metersPerPixel =
                (156543.03392 * Math.cos((lat * Math.PI) / 180)) /
                Math.pow(2, zoom);
            return meters / metersPerPixel;
        },
        [mapInstance]
    );

    // ── Seeded cloud texture (stable per map center) ──────────────────
    const drawCloudTexture = useCallback(
        (ctx: CanvasRenderingContext2D, w: number, h: number) => {
            if (!mapInstance) return;
            const center = mapInstance.getCenter();
            // Simple seed from center coordinates
            const seed = center
                ? Math.abs(Math.floor(center.lat() * 1000) + Math.floor(center.lng() * 1000))
                : 42;

            ctx.globalCompositeOperation = "source-over";
            const COUNT = 40;
            for (let i = 0; i < COUNT; i++) {
                // Deterministic pseudo-random based on seed + index
                const hash = ((seed + i * 2654435761) >>> 0) % 10000;
                const px = (hash % 100) / 100;
                const py = ((hash * 7) % 100) / 100;
                const r = w * (0.08 + ((hash * 3) % 100) / 500);
                const opDelta = ((hash * 13) % 100) / 1000 - 0.05; // ±0.05

                const g = ctx.createRadialGradient(
                    w * px, h * py, 0,
                    w * px, h * py, r
                );
                if (isDark) {
                    g.addColorStop(0, `rgba(20, 25, 35, ${0.12 + opDelta})`);
                } else {
                    g.addColorStop(0, `rgba(200, 205, 215, ${0.10 + opDelta})`);
                }
                g.addColorStop(1, "rgba(0, 0, 0, 0)");
                ctx.fillStyle = g;
                ctx.beginPath();
                ctx.arc(w * px, h * py, r, 0, Math.PI * 2);
                ctx.fill();
            }
        },
        [mapInstance, isDark]
    );

    // ── Main draw function ────────────────────────────────────────────
    const drawFog = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas || !mapInstance) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const w = canvas.width;
        const h = canvas.height;
        if (w === 0 || h === 0) return;

        // console.log("[FogOverlay] drawFog called", { w, h, enabled, visits: visitedLocations.length });

        ctx.clearRect(0, 0, w, h);

        if (!enabled) return;

        // 1. Base fog colour
        ctx.fillStyle = isDark
            ? "rgba(14, 17, 22, 0.80)"
            : "rgba(180, 185, 195, 0.75)";
        ctx.fillRect(0, 0, w, h);

        // 2. Cloud texture
        drawCloudTexture(ctx, w, h);

        // 3. Cut clear circles via destination-out
        ctx.globalCompositeOperation = "destination-out";

        const punchHole = (lat: number, lng: number, radiusMeters: number) => {
            const pixel = latLngToPixel(lat, lng);
            if (!pixel) return;
            const rPx = metersToPixels(radiusMeters, lat);
            if (rPx < 1) return;

            // Off-screen culling
            if (pixel.x < -rPx || pixel.x > w + rPx ||
                pixel.y < -rPx || pixel.y > h + rPx) {
                return;
            }

            const grad = ctx.createRadialGradient(
                pixel.x, pixel.y, 0,
                pixel.x, pixel.y, rPx
            );
            grad.addColorStop(0, "rgba(0, 0, 0, 1)");
            grad.addColorStop(0.55, "rgba(0, 0, 0, 0.85)");
            grad.addColorStop(1, "rgba(0, 0, 0, 0)");

            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(pixel.x, pixel.y, rPx, 0, Math.PI * 2);
            ctx.fill();
        };

        // User GPS clear
        if (userLocation) {
            punchHole(userLocation.lat, userLocation.lng, 300);
        }

        // Visited places clear
        for (const loc of visitedLocations) {
            punchHole(loc.lat, loc.lng, 250);
        }

        ctx.globalCompositeOperation = "source-over";
    }, [mapInstance, visitedLocations, userLocation, enabled, isDark, latLngToPixel, metersToPixels, drawCloudTexture]);

    // Keep a stable ref so listeners don't go stale
    const drawFogRef = useRef(drawFog);
    useEffect(() => { drawFogRef.current = drawFog; }, [drawFog]);

    // ── Canvas sizing — observe the container div ─────────────────────
    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        function syncSize() {
            const c = canvasRef.current;
            const cont = containerRef.current;
            if (!c || !cont) return;

            const w = cont.clientWidth;
            const h = cont.clientHeight;
            if (w === 0 || h === 0) return;

            // Set canvas buffer to match container pixel size (1:1, no DPR scaling
            // so that latLngToPixel screen coords match canvas coords directly)
            if (c.width !== w || c.height !== h) {
                c.width = w;
                c.height = h;
                // console.log("[FogOverlay] canvas resized", { w, h });
            }
            drawFogRef.current();
        }

        const ro = new ResizeObserver(syncSize);
        ro.observe(container);
        syncSize();
        return () => ro.disconnect();
    }, [containerRef]);

    // ── Map event listeners ───────────────────────────────────────────
    useEffect(() => {
        if (!mapInstance) return;

        const redraw = () => drawFogRef.current();

        // Wait for tiles to fully load before first draw
        const tilesListener = mapInstance.addListener("tilesloaded", redraw);
        const idleListener = mapInstance.addListener("idle", redraw);
        const zoomListener = mapInstance.addListener("zoom_changed", redraw);
        const boundsListener = mapInstance.addListener("bounds_changed", redraw);
        const dragListener = mapInstance.addListener("drag", redraw);

        return () => {
            google.maps.event.removeListener(tilesListener);
            google.maps.event.removeListener(idleListener);
            google.maps.event.removeListener(zoomListener);
            google.maps.event.removeListener(boundsListener);
            google.maps.event.removeListener(dragListener);
        };
    }, [mapInstance]);

    // ── Redraw when data/theme changes ────────────────────────────────
    useEffect(() => {
        drawFog();
    }, [drawFog]);

    return (
        <canvas
            ref={canvasRef}
            style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                pointerEvents: "none",
                zIndex: 10,
                display: enabled ? "block" : "none",
            }}
        />
    );
}

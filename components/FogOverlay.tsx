"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { useMap } from "@vis.gl/react-google-maps";

interface VisitedLocation {
    lat: number;
    lng: number;
    isNew?: boolean;
}

interface FogOverlayProps {
    visitedLocations: VisitedLocation[];
    userLocation?: { lat: number; lng: number } | null;
    markerLocations?: { lat: number; lng: number }[];
    enabled: boolean;
    isDark?: boolean;
}

/** Deterministic hash for a grid cell — stable across renders */
function cellHash(gx: number, gy: number): number {
    return Math.abs((gx * 1973 + gy * 9277 + 13337) * 48271) % 10000;
}

/**
 * Returns reveal radius for a visited location based on nearest-neighbour density.
 * Dense areas (closest neighbour < 1 km) → 200 m; spread-out → 400 m.
 */
function computeRevealRadius(loc: VisitedLocation, all: VisitedLocation[]): number {
    if (all.length <= 1) return 400;
    const coslat = Math.cos(loc.lat * (Math.PI / 180));
    let minDist = Infinity;
    for (const other of all) {
        if (other.lat === loc.lat && other.lng === loc.lng) continue;
        const dlat = (loc.lat - other.lat) * 111000;
        const dlng = (loc.lng - other.lng) * 111000 * coslat;
        const d = Math.sqrt(dlat * dlat + dlng * dlng);
        if (d < minDist) minDist = d;
    }
    return minDist < 1000 ? 200 : 400;
}

export default function FogOverlay({
    visitedLocations,
    userLocation,
    markerLocations,
    enabled,
    isDark = false,
}: FogOverlayProps) {
    const map = useMap();
    // Canvas is created imperatively and injected into Google Maps' mapPane
    // so it sits below the markerLayer in the Maps internal z-index stack.
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const animatingRef = useRef<Map<string, number>>(new Map());
    const [, forceUpdate] = useState(0);
    const rafRef = useRef<number | null>(null);

    const metersToPixels = useCallback(
        (meters: number, lat: number) => {
            if (!map) return 0;
            const zoom = map.getZoom();
            if (zoom == null) return 0;
            const metersPerPixel =
                (156543.03 * Math.cos((lat * Math.PI) / 180)) / Math.pow(2, zoom);
            return meters / metersPerPixel;
        },
        [map]
    );

    const latLngToPixel = useCallback(
        (lat: number, lng: number) => {
            if (!map) return null;
            const projection = map.getProjection();
            if (!projection) return null;
            const bounds = map.getBounds();
            if (!bounds) return null;

            const topRight = projection.fromLatLngToPoint(bounds.getNorthEast());
            const bottomLeft = projection.fromLatLngToPoint(bounds.getSouthWest());
            const point = projection.fromLatLngToPoint(new google.maps.LatLng(lat, lng));
            if (!topRight || !bottomLeft || !point) return null;

            const scale = Math.pow(2, map.getZoom() ?? 0);
            const worldWidth = 256;
            let x = (point.x - bottomLeft.x) * scale;
            if (bottomLeft.x > topRight.x) {
                x = (point.x + worldWidth - bottomLeft.x) * scale;
            }
            const y = (point.y - topRight.y) * scale;
            const containerWidth =
                (topRight.x - bottomLeft.x + (bottomLeft.x > topRight.x ? worldWidth : 0)) * scale;
            const containerHeight = (bottomLeft.y - topRight.y) * scale;
            const canvas = canvasRef.current;
            if (!canvas) return null;
            return {
                x: (x / containerWidth) * canvas.width,
                y: (y / containerHeight) * canvas.height,
            };
        },
        [map]
    );

    const drawFog = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas || !map || !enabled) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        const { width, height } = canvas;
        if (width === 0 || height === 0) return;

        ctx.clearRect(0, 0, width, height);

        // ── 1. Base fog — theme-aware colour ─────────────────────────────
        ctx.fillStyle = isDark
            ? "rgba(14, 17, 22, 0.82)"
            : "rgba(155, 160, 172, 0.85)";
        ctx.fillRect(0, 0, width, height);

        // ── 2. World-space cloud texture ─────────────────────────────────
        const bounds = map.getBounds();
        if (bounds) {
            const ne = bounds.getNorthEast();
            const sw = bounds.getSouthWest();
            const midLat = (ne.lat() + sw.lat()) / 2;

            const GRID = 0.027;
            const minGx = Math.floor(sw.lng() / GRID) - 1;
            const maxGx = Math.ceil(ne.lng() / GRID) + 1;
            const minGy = Math.floor(sw.lat() / GRID) - 1;
            const maxGy = Math.ceil(ne.lat() / GRID) + 1;

            for (let gx = minGx; gx <= maxGx; gx++) {
                for (let gy = minGy; gy <= maxGy; gy++) {
                    const h = cellHash(gx, gy);
                    const lat = gy * GRID + GRID * 0.5 + ((h % 60) - 30) * GRID / 60;
                    const lng = gx * GRID + GRID * 0.5 + ((h * 7 % 60) - 30) * GRID / 60;
                    const radiusMeters = GRID * 111000 * (1.3 + (h % 60) / 100);
                    const radiusPx = metersToPixels(radiusMeters, midLat);
                    if (radiusPx <= 2) continue;
                    const pixel = latLngToPixel(lat, lng);
                    if (!pixel) continue;
                    if (pixel.x + radiusPx < 0 || pixel.x - radiusPx > width) continue;
                    if (pixel.y + radiusPx < 0 || pixel.y - radiusPx > height) continue;

                    const isPuffDark = (h % 5) === 0;
                    const opacity = isPuffDark
                        ? 0.12 + (h % 20) / 100
                        : 0.04 + (h % 18) / 220;
                    const grad = ctx.createRadialGradient(pixel.x, pixel.y, 0, pixel.x, pixel.y, radiusPx);
                    if (isPuffDark) {
                        const c = isDark ? "5, 8, 14" : "90, 95, 110";
                        grad.addColorStop(0, `rgba(${c}, ${opacity})`);
                        grad.addColorStop(1, `rgba(${c}, 0)`);
                    } else {
                        const c = isDark ? "22, 28, 40" : "215, 220, 232";
                        grad.addColorStop(0, `rgba(${c}, ${opacity})`);
                        grad.addColorStop(1, `rgba(${c}, 0)`);
                    }
                    ctx.fillStyle = grad;
                    ctx.beginPath();
                    ctx.arc(pixel.x, pixel.y, radiusPx, 0, Math.PI * 2);
                    ctx.fill();
                }
            }
        }

        // ── 3. User location — always-visible 300 m clear circle ─────────
        if (userLocation) {
            const pixel = latLngToPixel(userLocation.lat, userLocation.lng);
            if (pixel) {
                const radius = metersToPixels(300, userLocation.lat);
                if (radius >= 1) {
                    const glowGrad = ctx.createRadialGradient(
                        pixel.x, pixel.y, radius * 0.6,
                        pixel.x, pixel.y, radius * 1.5
                    );
                    glowGrad.addColorStop(0, "rgba(100, 160, 255, 0)");
                    glowGrad.addColorStop(0.3, "rgba(100, 160, 255, 0.45)");
                    glowGrad.addColorStop(0.7, "rgba(100, 160, 255, 0.18)");
                    glowGrad.addColorStop(1, "rgba(100, 160, 255, 0)");
                    ctx.fillStyle = glowGrad;
                    ctx.beginPath();
                    ctx.arc(pixel.x, pixel.y, radius * 1.5, 0, Math.PI * 2);
                    ctx.fill();

                    ctx.globalCompositeOperation = "destination-out";
                    const holeGrad = ctx.createRadialGradient(pixel.x, pixel.y, 0, pixel.x, pixel.y, radius);
                    holeGrad.addColorStop(0, "rgba(0,0,0,1)");
                    holeGrad.addColorStop(0.72, "rgba(0,0,0,1)");
                    holeGrad.addColorStop(1, "rgba(0,0,0,0)");
                    ctx.fillStyle = holeGrad;
                    ctx.beginPath();
                    ctx.arc(pixel.x, pixel.y, radius, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.globalCompositeOperation = "source-over";
                }
            }
        }

        // ── 4. Visited reveals: smart radius + orange glow ───────────────
        for (const loc of visitedLocations) {
            const pixel = latLngToPixel(loc.lat, loc.lng);
            if (!pixel) continue;

            const revealMeters = computeRevealRadius(loc, visitedLocations);
            let radius = metersToPixels(revealMeters, loc.lat);

            const key = `${loc.lat}_${loc.lng}`;
            if (loc.isNew && !animatingRef.current.has(key)) {
                animatingRef.current.set(key, 0);
            }
            const progress = animatingRef.current.get(key);
            if (progress !== undefined && progress < 1) {
                radius = radius * (1 - Math.pow(1 - progress, 3));
            }
            if (radius < 1) continue;

            const glowGrad = ctx.createRadialGradient(
                pixel.x, pixel.y, radius * 0.6,
                pixel.x, pixel.y, radius * 1.55
            );
            glowGrad.addColorStop(0, "rgba(232, 93, 42, 0)");
            glowGrad.addColorStop(0.3, "rgba(232, 93, 42, 0.55)");
            glowGrad.addColorStop(0.6, "rgba(232, 93, 42, 0.28)");
            glowGrad.addColorStop(1, "rgba(232, 93, 42, 0)");
            ctx.fillStyle = glowGrad;
            ctx.beginPath();
            ctx.arc(pixel.x, pixel.y, radius * 1.55, 0, Math.PI * 2);
            ctx.fill();

            ctx.globalCompositeOperation = "destination-out";
            const holeGrad = ctx.createRadialGradient(pixel.x, pixel.y, 0, pixel.x, pixel.y, radius);
            holeGrad.addColorStop(0, "rgba(0,0,0,1)");
            holeGrad.addColorStop(0.75, "rgba(0,0,0,1)");
            holeGrad.addColorStop(1, "rgba(0,0,0,0)");
            ctx.fillStyle = holeGrad;
            ctx.beginPath();
            ctx.arc(pixel.x, pixel.y, radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalCompositeOperation = "source-over";
        }

        // ── 5. Marker pin holes — screen-space radius so pins are always fully clear
        // The teardrop pin SVG is 36×46 px, anchored at its bottom tip.
        // We use a pixel-space hole (not meter-based) so it stays the right size
        // at all zoom levels.  Center is shifted up by ~pinOffsetY to cover the body.
        if (markerLocations && markerLocations.length > 0) {
            const dpr = window.devicePixelRatio || 1;
            const pinHoleR = 30 * dpr;   // 30 CSS-px radius covers the full teardrop
            const pinOffsetY = 18 * dpr; // shift centre above anchor (tip of teardrop)
            ctx.globalCompositeOperation = "destination-out";
            for (const loc of markerLocations) {
                const pixel = latLngToPixel(loc.lat, loc.lng);
                if (!pixel) continue;
                const cx = pixel.x;
                const cy = pixel.y - pinOffsetY;
                const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, pinHoleR);
                grad.addColorStop(0, "rgba(0,0,0,1)");
                grad.addColorStop(0.7, "rgba(0,0,0,1)");
                grad.addColorStop(1, "rgba(0,0,0,0)");
                ctx.fillStyle = grad;
                ctx.beginPath();
                ctx.arc(cx, cy, pinHoleR, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.globalCompositeOperation = "source-over";
        }
    }, [map, visitedLocations, userLocation, markerLocations, enabled, isDark, latLngToPixel, metersToPixels]);

    // Always keep a ref to the latest drawFog so the OverlayView closure never goes stale
    const drawFogRef = useRef(drawFog);
    useEffect(() => { drawFogRef.current = drawFog; }, [drawFog]);

    // ── Mount canvas inside Google Maps' mapPane via OverlayView ─────────
    // mapPane sits below markerLayer in the Maps internal z-index stack,
    // so markers always render on top of the fog canvas automatically.
    useEffect(() => {
        if (!map || !enabled) return;

        const canvas = document.createElement("canvas");
        canvas.style.position = "absolute";
        canvas.style.inset = "0";
        canvas.style.pointerEvents = "none";
        canvasRef.current = canvas;

        const overlay = new google.maps.OverlayView();

        overlay.onAdd = function () {
            const pane = this.getPanes()?.mapPane;
            if (pane) pane.appendChild(canvas);
        };

        // Called by Google Maps after pan/zoom (but NOT during drag)
        overlay.draw = function () {
            const pane = this.getPanes()?.mapPane;
            if (pane) {
                const dpr = window.devicePixelRatio || 1;
                const w = pane.clientWidth;
                const h = pane.clientHeight;
                if (canvas.width !== w * dpr || canvas.height !== h * dpr) {
                    canvas.width = w * dpr;
                    canvas.height = h * dpr;
                    canvas.style.width = `${w}px`;
                    canvas.style.height = `${h}px`;
                }
            }
            drawFogRef.current();
        };

        overlay.onRemove = function () {
            canvas.remove();
            canvasRef.current = null;
        };

        overlay.setMap(map);

        // overlay.draw() is not called during drag; add a drag listener for smoothness
        const dragListener = map.addListener("drag", () => drawFogRef.current());

        return () => {
            google.maps.event.removeListener(dragListener);
            overlay.setMap(null);
        };
    }, [map, enabled]);

    // Redraw whenever fog data (locations, theme) changes
    useEffect(() => {
        drawFog();
    }, [drawFog]);

    // Animation loop for new reveals
    useEffect(() => {
        if (!enabled) return;
        let animating = false;
        for (const loc of visitedLocations) {
            const key = `${loc.lat}_${loc.lng}`;
            if (loc.isNew && (animatingRef.current.get(key) ?? 0) < 1) {
                animating = true;
                break;
            }
        }
        if (!animating) return;

        const startTime = performance.now();
        const duration = 1500;

        function tick() {
            const elapsed = performance.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            for (const loc of visitedLocations) {
                if (!loc.isNew) continue;
                const key = `${loc.lat}_${loc.lng}`;
                animatingRef.current.set(key, progress);
            }
            drawFog();
            if (progress < 1) {
                rafRef.current = requestAnimationFrame(tick);
            } else {
                forceUpdate((n) => n + 1);
            }
        }

        rafRef.current = requestAnimationFrame(tick);
        return () => {
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
        };
    }, [visitedLocations, enabled, drawFog]);

    // Canvas is managed imperatively — nothing to render in the React tree
    return null;
}

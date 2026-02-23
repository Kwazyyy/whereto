"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { useMap } from "@vis.gl/react-google-maps";

interface VisitedLocation {
    lat: number;
    lng: number;
    isNew?: boolean; // triggers reveal animation
}

interface FogOverlayProps {
    visitedLocations: VisitedLocation[];
    enabled: boolean;
    revealRadiusMeters?: number;
}

/** Deterministic hash for a grid cell — stable across renders */
function cellHash(gx: number, gy: number): number {
    return Math.abs((gx * 1973 + gy * 9277 + 13337) * 48271) % 10000;
}

/**
 * Canvas overlay that renders a thick Civilization-style fog-of-war.
 * World-space cloud puffs move with the map on pan/zoom, giving a
 * realistic "clouds covering the map" look. Visited areas are cut as
 * clean circles with a warm orange glow at their edges.
 */
export default function FogOverlay({
    visitedLocations,
    enabled,
    revealRadiusMeters = 500,
}: FogOverlayProps) {
    const map = useMap();
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animatingRef = useRef<Map<string, number>>(new Map());
    const [, forceUpdate] = useState(0);
    const rafRef = useRef<number | null>(null);

    // Convert meters to pixels at the current zoom level
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

    // Convert lat/lng to pixel position relative to map container
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

        ctx.clearRect(0, 0, width, height);

        // ── 1. Dense base fog layer ──────────────────────────────────────
        ctx.fillStyle = "rgba(185, 190, 210, 0.94)";
        ctx.fillRect(0, 0, width, height);

        // ── 2. World-space cloud texture ─────────────────────────────────
        // Puffs are positioned in world coordinates so they move with the map.
        const bounds = map.getBounds();
        if (bounds) {
            const ne = bounds.getNorthEast();
            const sw = bounds.getSouthWest();
            const midLat = (ne.lat() + sw.lat()) / 2;

            // Grid spacing ≈ 2.7km. Each cell gets one cloud puff.
            const GRID = 0.027;
            const minGx = Math.floor(sw.lng() / GRID) - 1;
            const maxGx = Math.ceil(ne.lng() / GRID) + 1;
            const minGy = Math.floor(sw.lat() / GRID) - 1;
            const maxGy = Math.ceil(ne.lat() / GRID) + 1;

            for (let gx = minGx; gx <= maxGx; gx++) {
                for (let gy = minGy; gy <= maxGy; gy++) {
                    const h = cellHash(gx, gy);

                    // Jitter puff centre within its cell for an organic look
                    const lat = gy * GRID + GRID * 0.5 + ((h % 60) - 30) * GRID / 60;
                    const lng = gx * GRID + GRID * 0.5 + ((h * 7 % 60) - 30) * GRID / 60;

                    // Radius: 1.3–1.9× grid spacing converted to pixels
                    const radiusMeters = GRID * 111000 * (1.3 + (h % 60) / 100);
                    const radiusPx = metersToPixels(radiusMeters, midLat);
                    if (radiusPx <= 2) continue;

                    const pixel = latLngToPixel(lat, lng);
                    if (!pixel) continue;

                    // Cull puffs fully off canvas
                    if (pixel.x + radiusPx < 0 || pixel.x - radiusPx > width) continue;
                    if (pixel.y + radiusPx < 0 || pixel.y - radiusPx > height) continue;

                    // 20% dark shadow puffs, 80% light highlight puffs
                    const isDark = (h % 5) === 0;
                    const opacity = isDark
                        ? 0.14 + (h % 20) / 100   // 0.14–0.34 (shadow depth)
                        : 0.05 + (h % 18) / 220;  // 0.05–0.13 (subtle highlight)

                    const grad = ctx.createRadialGradient(
                        pixel.x, pixel.y, 0,
                        pixel.x, pixel.y, radiusPx
                    );
                    if (isDark) {
                        grad.addColorStop(0, `rgba(110, 115, 145, ${opacity})`);
                        grad.addColorStop(1, "rgba(110, 115, 145, 0)");
                    } else {
                        grad.addColorStop(0, `rgba(240, 243, 255, ${opacity})`);
                        grad.addColorStop(1, "rgba(240, 243, 255, 0)");
                    }
                    ctx.fillStyle = grad;
                    ctx.beginPath();
                    ctx.arc(pixel.x, pixel.y, radiusPx, 0, Math.PI * 2);
                    ctx.fill();
                }
            }
        }

        // ── 3. Visited reveals: orange glow + clear circle ───────────────
        for (const loc of visitedLocations) {
            const pixel = latLngToPixel(loc.lat, loc.lng);
            if (!pixel) continue;

            let radius = metersToPixels(revealRadiusMeters, loc.lat);

            // Animate new reveals (expand from 0 with ease-out cubic)
            const key = `${loc.lat}_${loc.lng}`;
            if (loc.isNew && !animatingRef.current.has(key)) {
                animatingRef.current.set(key, 0);
            }
            const progress = animatingRef.current.get(key);
            if (progress !== undefined && progress < 1) {
                const eased = 1 - Math.pow(1 - progress, 3);
                radius = radius * eased;
            }
            if (radius < 1) continue;

            // Warm orange glow halo around the clear edge
            // Inner radius starts at 60% of reveal so glow hugs the border.
            const glowGrad = ctx.createRadialGradient(
                pixel.x, pixel.y, radius * 0.6,
                pixel.x, pixel.y, radius * 1.55
            );
            glowGrad.addColorStop(0,    "rgba(232, 93, 42, 0)");
            glowGrad.addColorStop(0.3,  "rgba(232, 93, 42, 0.55)");
            glowGrad.addColorStop(0.6,  "rgba(232, 93, 42, 0.28)");
            glowGrad.addColorStop(1,    "rgba(232, 93, 42, 0)");
            ctx.fillStyle = glowGrad;
            ctx.beginPath();
            ctx.arc(pixel.x, pixel.y, radius * 1.55, 0, Math.PI * 2);
            ctx.fill();

            // Cut a clean hole through the fog (destination-out erases pixels)
            ctx.globalCompositeOperation = "destination-out";
            const holeGrad = ctx.createRadialGradient(
                pixel.x, pixel.y, 0,
                pixel.x, pixel.y, radius
            );
            // Hard clear centre, soft feathered edge in the outer 25%
            holeGrad.addColorStop(0,    "rgba(0, 0, 0, 1)");
            holeGrad.addColorStop(0.75, "rgba(0, 0, 0, 1)");
            holeGrad.addColorStop(1,    "rgba(0, 0, 0, 0)");
            ctx.fillStyle = holeGrad;
            ctx.beginPath();
            ctx.arc(pixel.x, pixel.y, radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalCompositeOperation = "source-over";
        }
    }, [map, visitedLocations, enabled, latLngToPixel, metersToPixels, revealRadiusMeters]);

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
        const duration = 1500; // 1.5s reveal

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

    // Redraw on map changes (pan / zoom)
    useEffect(() => {
        if (!map || !enabled) return;

        const listeners = [
            map.addListener("idle", drawFog),
            map.addListener("zoom_changed", drawFog),
            map.addListener("drag", drawFog),
            map.addListener("bounds_changed", drawFog),
        ];
        drawFog();

        return () => listeners.forEach((l) => google.maps.event.removeListener(l));
    }, [map, enabled, drawFog]);

    // Resize canvas to match map container
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const observer = new ResizeObserver(() => {
            const parent = canvas.parentElement;
            if (!parent) return;
            const dpr = window.devicePixelRatio || 1;
            canvas.width = parent.clientWidth * dpr;
            canvas.height = parent.clientHeight * dpr;
            canvas.style.width = `${parent.clientWidth}px`;
            canvas.style.height = `${parent.clientHeight}px`;
            drawFog();
        });

        const parent = canvas.parentElement;
        if (parent) observer.observe(parent);
        return () => observer.disconnect();
    }, [drawFog]);

    if (!enabled) return null;

    return (
        <canvas
            ref={canvasRef}
            style={{
                position: "absolute",
                inset: 0,
                zIndex: 5,
                pointerEvents: "none",
            }}
        />
    );
}

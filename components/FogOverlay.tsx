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

/**
 * Canvas overlay that renders a fog-of-war effect on top of the Google Map.
 * Clears circular areas around visited locations with soft feathered edges.
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
            // At equator, 1 pixel ≈ 156543.03 * cos(lat) / 2^zoom meters
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
            const point = projection.fromLatLngToPoint(
                new google.maps.LatLng(lat, lng)
            );

            if (!topRight || !bottomLeft || !point) return null;

            const scale = Math.pow(2, map.getZoom() ?? 0);
            const worldWidth = 256;

            let x = (point.x - bottomLeft.x) * scale;
            // Handle wrap-around
            if (bottomLeft.x > topRight.x) {
                x = (point.x + worldWidth - bottomLeft.x) * scale;
            }
            const y = (point.y - topRight.y) * scale;
            const containerWidth = (topRight.x - bottomLeft.x + (bottomLeft.x > topRight.x ? worldWidth : 0)) * scale;
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

    // Draw the fog
    const drawFog = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas || !map || !enabled) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const { width, height } = canvas;

        // Fill with dark overlay
        ctx.clearRect(0, 0, width, height);
        ctx.fillStyle = "rgba(0, 0, 0, 0.55)";
        ctx.fillRect(0, 0, width, height);

        // Use destination-out to "erase" circles
        ctx.globalCompositeOperation = "destination-out";

        for (const loc of visitedLocations) {
            const pixel = latLngToPixel(loc.lat, loc.lng);
            if (!pixel) continue;

            let radius = metersToPixels(revealRadiusMeters, loc.lat);

            // Handle animation for new reveals
            const key = `${loc.lat}_${loc.lng}`;
            if (loc.isNew && !animatingRef.current.has(key)) {
                animatingRef.current.set(key, 0);
            }
            const progress = animatingRef.current.get(key);
            if (progress !== undefined && progress < 1) {
                const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
                radius = radius * eased;
            }

            // Radial gradient for soft edges
            const gradient = ctx.createRadialGradient(
                pixel.x,
                pixel.y,
                0,
                pixel.x,
                pixel.y,
                radius
            );
            gradient.addColorStop(0, "rgba(0, 0, 0, 1)");
            gradient.addColorStop(0.6, "rgba(0, 0, 0, 1)");
            gradient.addColorStop(1, "rgba(0, 0, 0, 0)");

            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(pixel.x, pixel.y, radius, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.globalCompositeOperation = "source-over";
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
        const duration = 1000; // 1 second

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

    // Redraw on map changes (pan/zoom)
    useEffect(() => {
        if (!map || !enabled) return;

        const listener = map.addListener("idle", drawFog);
        const zoomListener = map.addListener("zoom_changed", drawFog);
        const dragListener = map.addListener("drag", drawFog);
        const boundsListener = map.addListener("bounds_changed", drawFog);

        drawFog();

        return () => {
            google.maps.event.removeListener(listener);
            google.maps.event.removeListener(zoomListener);
            google.maps.event.removeListener(dragListener);
            google.maps.event.removeListener(boundsListener);
        };
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

"use client";

import { useEffect, useRef, useCallback } from "react";
import { useMap } from "@vis.gl/react-google-maps";

interface VisitedLocation {
    lat: number;
    lng: number;
}

interface FogOverlayProps {
    visitedLocations: VisitedLocation[];
    userLocation?: { lat: number; lng: number } | null;
    enabled: boolean;
    isDark?: boolean;
}

export default function FogOverlay({
    visitedLocations,
    userLocation,
    enabled,
    isDark = false,
}: FogOverlayProps) {
    const map = useMap();
    const canvasRef = useRef<HTMLCanvasElement | null>(null);

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

            const point = projection.fromLatLngToPoint(new google.maps.LatLng(lat, lng));
            if (!point) return null;

            const center = map.getCenter();
            if (!center) return null;
            const centerPoint = projection.fromLatLngToPoint(center);
            if (!centerPoint) return null;

            const scale = Math.pow(2, map.getZoom() ?? 0);
            const worldWidth = 256;

            const canvas = canvasRef.current;
            if (!canvas) return null;

            let dx = point.x - centerPoint.x;
            // Handle wrap-around
            if (dx > worldWidth / 2) dx -= worldWidth;
            if (dx < -worldWidth / 2) dx += worldWidth;

            const dy = point.y - centerPoint.y;

            // The canvas is technically matching client width/height
            // So its center is exactly width/2 and height/2
            const screenX = canvas.clientWidth / 2 + dx * scale;
            const screenY = canvas.clientHeight / 2 + dy * scale;

            return { x: screenX, y: screenY };
        },
        [map]
    );

    const drawFog = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const dpr = window.devicePixelRatio || 1;
        if (canvas.width === 0 || canvas.height === 0) return;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        if (!map || !enabled) return;

        // 1. Base fog color
        ctx.fillStyle = isDark
            ? "rgba(14, 17, 22, 0.80)"
            : "rgba(180, 185, 195, 0.75)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // 2. Cloud texture
        ctx.globalCompositeOperation = "source-over";
        const w = canvas.width;
        const h = canvas.height;

        const g1 = ctx.createRadialGradient(w * 0.2, h * 0.3, 0, w * 0.2, h * 0.3, w * 0.8);
        g1.addColorStop(0, isDark ? "rgba(30,35,45,0.15)" : "rgba(255,255,255,0.15)");
        g1.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = g1;
        ctx.fillRect(0, 0, w, h);

        const g2 = ctx.createRadialGradient(w * 0.8, h * 0.7, 0, w * 0.8, h * 0.7, w * 0.6);
        g2.addColorStop(0, isDark ? "rgba(10,12,18,0.2)" : "rgba(150,155,165,0.15)");
        g2.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = g2;
        ctx.fillRect(0, 0, w, h);

        // 3. Clear cutouts
        ctx.globalCompositeOperation = "destination-out";

        const punchHole = (lat: number, lng: number, radiusMeters: number) => {
            const pixel = latLngToPixel(lat, lng);
            if (!pixel) return;
            const rPx = metersToPixels(radiusMeters, lat) * dpr;
            if (rPx < 1) return;

            // Cull if completely off screen
            if (pixel.x * dpr < -rPx || pixel.x * dpr > w + rPx ||
                pixel.y * dpr < -rPx || pixel.y * dpr > h + rPx) {
                return;
            }

            const cx = pixel.x * dpr;
            const cy = pixel.y * dpr;

            const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, rPx);
            grad.addColorStop(0, "rgba(0, 0, 0, 1)");
            grad.addColorStop(0.5, "rgba(0, 0, 0, 0.9)");
            grad.addColorStop(1, "rgba(0, 0, 0, 0)");

            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(cx, cy, rPx, 0, Math.PI * 2);
            ctx.fill();
        };

        if (userLocation) {
            punchHole(userLocation.lat, userLocation.lng, 300);
        }

        for (const loc of visitedLocations) {
            punchHole(loc.lat, loc.lng, 250);
        }

        ctx.globalCompositeOperation = "source-over";

    }, [map, visitedLocations, userLocation, enabled, isDark, latLngToPixel, metersToPixels]);

    const drawFogRef = useRef(drawFog);
    useEffect(() => { drawFogRef.current = drawFog; }, [drawFog]);

    // Redraw on map events
    useEffect(() => {
        if (!map) return;
        const listeners = [
            map.addListener("idle", () => drawFogRef.current()),
            map.addListener("drag", () => drawFogRef.current()),
            map.addListener("zoom_changed", () => drawFogRef.current()),
            map.addListener("bounds_changed", () => drawFogRef.current()),
        ];
        return () => {
            listeners.forEach((l) => google.maps.event.removeListener(l));
        };
    }, [map]);

    // Redraw on data changes
    useEffect(() => {
        drawFog();
    }, [drawFog]);

    // Canvas sizing observer (matches pixel density)
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        function syncSize() {
            const c = canvasRef.current;
            if (!c) return;
            const dpr = window.devicePixelRatio || 1;
            const w = c.clientWidth;
            const h = c.clientHeight;

            // Only update attributes if the element isn't zero-sized
            if (w === 0 || h === 0) return;

            const targetW = Math.floor(w * dpr);
            const targetH = Math.floor(h * dpr);

            if (c.width !== targetW || c.height !== targetH) {
                c.width = targetW;
                c.height = targetH;
            }
            drawFogRef.current();
        }

        const ro = new ResizeObserver(syncSize);
        ro.observe(canvas);
        syncSize();
        return () => ro.disconnect();
    }, []);

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
                display: enabled ? "block" : "none"
            }}
        />
    );
}

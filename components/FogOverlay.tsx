"use client";

import { useEffect, useRef } from "react";

interface VisitedLocation {
    lat: number;
    lng: number;
}

interface FogOverlayProps {
    mapInstance: google.maps.Map | null;
    visitedLocations: VisitedLocation[];
    userLocation?: { lat: number; lng: number } | null;
    enabled: boolean;
    isDark?: boolean;
    containerRef?: React.RefObject<HTMLDivElement | null>; // Kept for prop compat, but unused
}

export default function FogOverlay({
    mapInstance,
    visitedLocations,
    userLocation,
    enabled,
    isDark = false,
}: FogOverlayProps) {
    const overlayRef = useRef<google.maps.OverlayView | null>(null);

    // Keep data fresh for the OverlayView draw method without triggering constant re-mounts
    const dataRef = useRef({ visitedLocations, userLocation, enabled, isDark });
    useEffect(() => {
        dataRef.current = { visitedLocations, userLocation, enabled, isDark };
        if (overlayRef.current) {
            overlayRef.current.draw();
        }
    }, [visitedLocations, userLocation, enabled, isDark]);

    useEffect(() => {
        if (!mapInstance) return;

        class FogCanvasOverlay extends google.maps.OverlayView {
            canvas: HTMLCanvasElement;
            ctx: CanvasRenderingContext2D | null;

            constructor() {
                super();
                this.canvas = document.createElement("canvas");
                this.canvas.style.position = "absolute";
                this.canvas.style.pointerEvents = "none";
                this.canvas.style.border = "none";
                this.ctx = this.canvas.getContext("2d");
            }

            onAdd() {
                const panes = this.getPanes();
                if (panes) {
                    // overlayLayer sits BELOW markers, InfoWindows, and other overlays!
                    panes.overlayLayer.appendChild(this.canvas);
                }
            }

            draw() {
                const map = this.getMap() as google.maps.Map;
                const projection = this.getProjection();
                if (!map || !projection || !this.ctx) return;

                const div = map.getDiv();
                const width = div.clientWidth;
                const height = div.clientHeight;

                // Sync canvas resolution and size
                if (this.canvas.width !== width || this.canvas.height !== height) {
                    this.canvas.width = width;
                    this.canvas.height = height;
                    this.canvas.style.width = width + "px";
                    this.canvas.style.height = height + "px";
                }

                // Get the div pixel coordinate at the center of the viewport
                const center = map.getCenter();
                if (!center) return;
                const centerDivPx = projection.fromLatLngToDivPixel(center);
                if (!centerDivPx) return;

                // Position canvas so its center aligns exactly with the viewport center
                const left = centerDivPx.x - width / 2;
                const top = centerDivPx.y - height / 2;
                this.canvas.style.left = left + "px";
                this.canvas.style.top = top + "px";

                // --- Drawing logic ---
                const { visitedLocations, userLocation, enabled, isDark } = dataRef.current;
                const ctx = this.ctx;

                ctx.clearRect(0, 0, width, height);

                if (!enabled) return;

                // 1. Base Dense Fog
                ctx.fillStyle = isDark
                    ? "rgba(14, 17, 22, 0.92"
                    : "rgba(180, 185, 195, 0.85)";
                ctx.fillRect(0, 0, width, height);

                // 2. Cloud Texture
                const seed = Math.abs(Math.floor(center.lat() * 1000) + Math.floor(center.lng() * 1000)) || 42;
                ctx.globalCompositeOperation = "source-over";
                for (let i = 0; i < 40; i++) {
                    const hash = ((seed + i * 2654435761) >>> 0) % 10000;
                    const px = (hash % 100) / 100;
                    const py = ((hash * 7) % 100) / 100;
                    const r = width * (0.08 + ((hash * 3) % 100) / 500);
                    const opDelta = ((hash * 13) % 100) / 1000 - 0.05;

                    const g = ctx.createRadialGradient(width * px, height * py, 0, width * px, height * py, r);
                    if (isDark) {
                        g.addColorStop(0, `rgba(20, 25, 35, ${0.15 + opDelta})`);
                    } else {
                        g.addColorStop(0, `rgba(200, 205, 215, ${0.15 + opDelta})`);
                    }
                    g.addColorStop(1, "rgba(0, 0, 0, 0)");
                    ctx.fillStyle = g;
                    ctx.beginPath();
                    ctx.arc(width * px, height * py, r, 0, Math.PI * 2);
                    ctx.fill();
                }

                // 3. Clear Circles
                ctx.globalCompositeOperation = "destination-out";

                const zoom = map.getZoom() || 13;
                const punchHole = (lat: number, lng: number, radiusMeters: number) => {
                    const targetLatLng = new google.maps.LatLng(lat, lng);
                    const targetDivPx = projection.fromLatLngToDivPixel(targetLatLng);
                    if (!targetDivPx) return;

                    // Compute pixel coordinates relative to the canvas itself
                    const cx = targetDivPx.x - left;
                    const cy = targetDivPx.y - top;

                    const metersPerPixel = (156543.03392 * Math.cos((lat * Math.PI) / 180)) / Math.pow(2, zoom);
                    const rPx = radiusMeters / metersPerPixel;

                    if (rPx < 1) return;
                    if (cx < -rPx || cx > width + rPx || cy < -rPx || cy > height + rPx) return;

                    const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, rPx);
                    grad.addColorStop(0, "rgba(0, 0, 0, 1)");
                    grad.addColorStop(0.55, "rgba(0, 0, 0, 0.95)");
                    grad.addColorStop(1, "rgba(0, 0, 0, 0)");

                    ctx.fillStyle = grad;
                    ctx.beginPath();
                    ctx.arc(cx, cy, rPx, 0, Math.PI * 2);
                    ctx.fill();
                };

                if (userLocation) {
                    punchHole(userLocation.lat, userLocation.lng, 350);
                }
                for (const loc of visitedLocations) {
                    punchHole(loc.lat, loc.lng, 300);
                }

                ctx.globalCompositeOperation = "source-over";

                // 4. Subtle glow for user location in dark mode
                if (isDark && userLocation) {
                    const targetLatLng = new google.maps.LatLng(userLocation.lat, userLocation.lng);
                    const targetDivPx = projection.fromLatLngToDivPixel(targetLatLng);
                    if (targetDivPx) {
                        const cx = targetDivPx.x - left;
                        const cy = targetDivPx.y - top;

                        const metersPerPixel = (156543.03392 * Math.cos((userLocation.lat * Math.PI) / 180)) / Math.pow(2, zoom);
                        const rPx = 350 / metersPerPixel;

                        if (rPx >= 1 && cx >= -rPx && cx <= width + rPx && cy >= -rPx && cy <= height + rPx) {
                            ctx.globalCompositeOperation = "screen";
                            const glowGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, rPx);
                            glowGrad.addColorStop(0, "rgba(255, 255, 255, 0.12)");
                            glowGrad.addColorStop(0.5, "rgba(255, 255, 255, 0.04)");
                            glowGrad.addColorStop(1, "rgba(255, 255, 255, 0)");

                            ctx.fillStyle = glowGrad;
                            ctx.beginPath();
                            ctx.arc(cx, cy, rPx, 0, Math.PI * 2);
                            ctx.fill();
                            ctx.globalCompositeOperation = "source-over";
                        }
                    }
                }
            }

            onRemove() {
                if (this.canvas.parentNode) {
                    this.canvas.parentNode.removeChild(this.canvas);
                }
            }
        }

        const overlay = new FogCanvasOverlay();
        overlay.setMap(mapInstance);
        overlayRef.current = overlay;

        const listener = mapInstance.addListener("tilesloaded", () => {
            overlay.draw();
        });

        return () => {
            google.maps.event.removeListener(listener);
            overlay.setMap(null);
            overlayRef.current = null;
        };
    }, [mapInstance]);

    // Managed internally by OverlayView wrapper.
    return null;
}

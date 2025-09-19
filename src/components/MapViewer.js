import React, { useRef, useState, useEffect, useCallback } from "react";
import { RefreshCcw, Plus, Minus, MapPin } from "lucide-react";

export default function MapViewer({
  src,
  maxScale = 4,
  minScale = 1,
  step = 0.4,
  onPinPlaced,
}) {
  const containerRef = useRef(null);
  const imgRef = useRef(null);

  const [loaded, setLoaded] = useState(false);
  const [containerSize, setContainerSize] = useState({ w: 0, h: 0 });
  const [imgBaseSize, setImgBaseSize] = useState({ w: 0, h: 0 }); // displayed image size when scale = 1
  const [scale, setScale] = useState(1);
  const [tx, setTx] = useState(0);
  const [ty, setTy] = useState(0);

  const [pin, setPin] = useState(null); // {x, y} in image coords

  // helpers
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  // compute display size to fit img inside container at scale=1
  const recomputeSizes = useCallback(() => {
    const container = containerRef.current;
    const img = imgRef.current;
    if (!container || !img || !img.naturalWidth) return;

    const cw = container.clientWidth;
    const ch = container.clientHeight;
    const iw = img.naturalWidth;
    const ih = img.naturalHeight;

    // scaleToFit so image fits in container without cropping at base scale
    const fit = Math.min(cw / iw, ch / ih, 1);
    const displayW = iw * fit;
    const displayH = ih * fit;

    setContainerSize({ w: cw, h: ch });
    setImgBaseSize({ w: displayW, h: displayH });

    // center at base scale
    setScale(1);
    setTx((cw - displayW) / 2);
    setTy((ch - displayH) / 2);
  }, []);

  // on image load
  useEffect(() => {
    if (!imgRef.current) return;
    const img = imgRef.current;
    if (img.complete && img.naturalWidth) {
      setLoaded(true);
      recomputeSizes();
    }
  }, [src, recomputeSizes]);

  // listen resize
  useEffect(() => {
    const onResize = () => recomputeSizes();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [recomputeSizes]);

  // clamp translate given arbitrary newScale
  const clampTranslate = (newTx, newTy, newScale = scale) => {
    const scaledW = imgBaseSize.w * newScale;
    const scaledH = imgBaseSize.h * newScale;
    let minTx, maxTx, minTy, maxTy;

    if (scaledW > containerSize.w) {
      maxTx = 0;
      minTx = containerSize.w - scaledW;
    } else {
      // center horizontally
      minTx = maxTx = (containerSize.w - scaledW) / 2;
    }

    if (scaledH > containerSize.h) {
      maxTy = 0;
      minTy = containerSize.h - scaledH;
    } else {
      // center vertically
      minTy = maxTy = (containerSize.h - scaledH) / 2;
    }

    return {
      tx: clamp(newTx, minTx, maxTx),
      ty: clamp(newTy, minTy, maxTy),
    };
  };

  // wheel zoom (consistent additive step; zoom toward pointer)
  const onWheel = (e) => {
    if (!loaded) return;
    e.preventDefault();

    // normalize to single step per wheel event
    const delta = Math.sign(e.deltaY) || 0; // 1 or -1
    if (delta === 0) return;

    const rect = containerRef.current.getBoundingClientRect();
    const px = e.clientX - rect.left; // pointer within container
    const py = e.clientY - rect.top;

    const newScale = clamp(scale - delta * step, minScale, maxScale);

    // image coordinate under pointer (relative to image origin at tx,ty)
    const imgCoordX = (px - tx) / scale;
    const imgCoordY = (py - ty) / scale;

    // new translate to keep pointer focused
    const newTx = px - imgCoordX * newScale;
    const newTy = py - imgCoordY * newScale;

    const clamped = clampTranslate(newTx, newTy, newScale);
    setScale(newScale);
    setTx(clamped.tx);
    setTy(clamped.ty);
  };

  // pointer panning
  const panning = useRef(false);
  const dragMoved = useRef(false);
  const start = useRef({ x: 0, y: 0, tx: 0, ty: 0 });

  const onPointerDown = (e) => {
    if (!loaded) return;
    panning.current = true;
    dragMoved.current = false;
    start.current = { x: e.clientX, y: e.clientY, tx, ty };
    document.addEventListener("pointermove", onPointerMove);
    document.addEventListener("pointerup", onPointerUp);
  };

  const onPointerMove = (e) => {
    if (!panning.current) return;
    const dx = e.clientX - start.current.x;
    const dy = e.clientY - start.current.y;
    if (Math.abs(dx) > 2 || Math.abs(dy) > 2) dragMoved.current = true;
    const newTx = start.current.tx + dx;
    const newTy = start.current.ty + dy;
    const clamped = clampTranslate(newTx, newTy, scale);
    setTx(clamped.tx);
    setTy(clamped.ty);
  };

  const onPointerUp = (e) => {
    panning.current = false;
    document.removeEventListener("pointermove", onPointerMove);
    document.removeEventListener("pointerup", onPointerUp);
  };

  const onContainerClick = (e) => {
    if (!loaded) return;
    if (dragMoved.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;

    // Convert container click → viewer coords (account for pan + zoom)
    const viewerX = (px - tx) / scale;
    const viewerY = (py - ty) / scale;

    // Convert viewer coords → raw image coords (scaled to 1440×1440)
    const rawX = (viewerX / imgBaseSize.w) * 1440;
    const rawY = (viewerY / imgBaseSize.h) * 1440;

    const pinObj = { raw: { x: rawX, y: rawY } };

    console.log("Pin placed:", { px, py, viewerX, viewerY, rawX, rawY });

    setPin(pinObj);
    if (onPinPlaced) onPinPlaced(pinObj.raw);
  };

  // zoom buttons (centered zoom)
  const zoomTo = (direction) => {
    if (!loaded) return;
    const newScale = clamp(scale + direction * step, minScale, maxScale);
    const cx = containerSize.w / 2;
    const cy = containerSize.h / 2;
    const imgCoordX = (cx - tx) / scale;
    const imgCoordY = (cy - ty) / scale;
    const newTx = cx - imgCoordX * newScale;
    const newTy = cy - imgCoordY * newScale;
    const clamped = clampTranslate(newTx, newTy, newScale);
    setScale(newScale);
    setTx(clamped.tx);
    setTy(clamped.ty);
  };

  // expose zoom in/out helpers for buttons
  const zoomIn = () => zoomTo(+1);
  const zoomOut = () => zoomTo(-1);
  const reset = () => {
    recomputeSizes();
  };

  // transform style
  const transformStyle = {
    transform: `translate(${tx}px, ${ty}px) scale(${scale})`,
    transformOrigin: "0 0",
    willChange: "transform",
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full overflow-hidden bg-black"
      onWheel={onWheel}
      onClick={onContainerClick}
      onPointerDown={onPointerDown}
      style={{ touchAction: "none" }}
    >
      {/* Loading indicator */}
      {!loaded && (
        <div className="absolute inset-0 flex items-center justify-center z-10">
          <div className="animate-spin h-10 w-10 border-4 border-white rounded-full border-t-transparent"></div>
        </div>
      )}
      
      {/* transformed image */}
      <div style={transformStyle} className="absolute left-0 top-0">
        <img
          ref={imgRef}
          src={src}
          alt=""
          draggable={false}
          onLoad={() => {
            setLoaded(true);
            // recompute sizes after image load
            setTimeout(recomputeSizes, 0);
          }}
          style={{
            display: "block",
            width: imgBaseSize.w ? `${imgBaseSize.w}px` : "auto",
            height: imgBaseSize.h ? `${imgBaseSize.h}px` : "auto",
            maxWidth: "none",
            maxHeight: "none",
            userSelect: "none",
            pointerEvents: "none", // let container handle pointer events for panning
          }}
        />
      </div>
      {/* Pin icon absolutely positioned, not scaled */}
      {pin &&
        (() => {
          // Convert raw coords → viewer coords on the fly
          const left = tx + (pin.raw.x / 1440) * imgBaseSize.w * scale;
          const top = ty + (pin.raw.y / 1440) * imgBaseSize.h * scale;

          console.log("Rendering pin at", { raw: pin.raw, left, top });

          return (
            <MapPin
              className="absolute text-neutral-800 fill-neutral-800 stroke-1 stroke-neutral-200"
              style={{
                left: `${left}px`,
                top: `${top}px`,
                transform: "translate(-50%, -100%)",
                pointerEvents: "none",
              }}
              size={28}
            />
          );
        })()}

      {/* controls top-right */}
      <div className="absolute top-3 right-3 z-20 flex flex-col gap-2">
        <button
          onClick={(e) => {
            e.stopPropagation();
            zoomIn();
          }}
          className="cursor-pointer px-1.5 py-1.5 rounded bg-neutral-800 hover:bg-neutral-700 transition-all duration-250"
          title="Zoom in"
        >
          <Plus className="w-4 h-4" />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            zoomOut();
          }}
          className="cursor-pointer px-1.5 py-1.5 rounded bg-neutral-800 hover:bg-neutral-700 transition-all duration-250"
          title="Zoom out"
        >
          <Minus className="w-4 h-4" />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            reset();
          }}
          className="cursor-pointer px-1.5 py-1.5 rounded bg-neutral-800 hover:bg-neutral-700 transition-all duration-250"
          title="Reset"
        >
          <RefreshCcw className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

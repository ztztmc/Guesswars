"use client";

import { useEffect, useState } from "react";
import client from "@/api/client";

export default function DebugPage() {
  const [maps, setMaps] = useState([]);
  const [spots, setSpots] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      const { data: mapsData, error: mapsError } = await client
        .from("maps")
        .select("*");
      if (mapsError) console.error(mapsError);

      const { data: spotsData, error: spotsError } = await client
        .from("spots")
        .select("*");
      if (spotsError) console.error(spotsError);

      setMaps(mapsData);
      setSpots(spotsData);
    };

    fetchData();
  }, []);

  return (
    <div className="p-6 text-white">
      <h1 className="text-2xl font-bold">Game Debug Page</h1>

      <h2 className="mt-4 text-xl">Maps</h2>
      <pre>{JSON.stringify(maps, null, 2)}</pre>

      <h2 className="mt-4 text-xl">Spots</h2>
      <pre>{JSON.stringify(spots, null, 2)}</pre>

      {maps.map((map) => (
        <div key={map.id} className="mt-6">
          <h3 className="text-lg">{map.map_name}</h3>

          {/* Topdown image with coords overlay */}
          <div className="relative inline-block">
            <img
              id={`map-${map.id}`}
              src={map.topdown_image_url}
              alt={map.map_name}
              className="max-w-lg border"
              onLoad={(e) => {
                e.currentTarget.dataset.naturalWidth =
                  e.currentTarget.naturalWidth;
                e.currentTarget.dataset.naturalHeight =
                  e.currentTarget.naturalHeight;
              }}
            />

            {spots
              .filter((spot) => spot.map_name === map.map_name)
              .map((spot) =>
                spot.coords.map((c, idx) => {
                  const imgEl = document.getElementById(`map-${map.id}`);
                  if (!imgEl) return null;

                  const displayWidth = imgEl.clientWidth;
                  const displayHeight = imgEl.clientHeight;
                  const naturalWidth = imgEl.naturalWidth;
                  const naturalHeight = imgEl.naturalHeight;

                  const scaledX = (c.x / naturalWidth) * displayWidth;
                  const scaledY = (c.y / naturalHeight) * displayHeight;

                  return (
                    <div
                      key={`${spot.id}-${idx}`}
                      className="absolute w-4 h-4 rounded-full bg-red-500 opacity-70"
                      style={{
                        left: scaledX - 8,
                        top: scaledY - 8,
                      }}
                    />
                  );
                })
              )}
          </div>

          {/* Spot images */}
          <div className="mt-4 grid grid-cols-3 gap-4">
            {spots
              .filter((spot) => spot.map_name === map.map_name)
              .map((spot) => (
                <div key={spot.id} className="border p-2">
                  <h4 className="text-sm font-semibold">Spot {spot.id}</h4>
                  {spot.images &&
                    Object.entries(spot.images).map(([zoomKey, imgUrl]) => (
                      <img
                        key={zoomKey}
                        src={`${imgUrl}`}
                        alt={`${spot.id} ${zoomKey}`}
                        className="w-full border mt-2"
                      />
                    ))}
                </div>
              ))}
          </div>
        </div>
      ))}
    </div>
  );
}

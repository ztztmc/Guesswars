"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Sparkles, X } from "lucide-react";
import client from "@/api/client";
import MapViewer from "@/components/MapViewer";
import Footer from "@/components/Footer";

export default function GamePage() {
  const TOTAL_ROUNDS = 3;
  const ROUND_TIME = 42;
  const MAX_POINTS_PER_ROUND = 1000;

  const router = useRouter();
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [currentRound, setCurrentRound] = useState(1);
  const [roundScores, setRoundScores] = useState([]);
  const [currentSpot, setCurrentSpot] = useState(null);
  const [allSpots, setAllSpots] = useState([]);
  const [usedSpotIndices, setUsedSpotIndices] = useState([]);
  const [isRoundOver, setIsRoundOver] = useState(false);
  const [maps, setMaps] = useState([]);
  const [selectedMap, setSelectedMap] = useState(null);
  const [mapPinPlaced, setMapPinPlaced] = useState(false);
  const [lastGuess, setLastGuess] = useState(null); // {x, y, mapName}
  const [timer, setTimer] = useState(ROUND_TIME);
  const [loading, setLoading] = useState(true);
  const [showSpinner, setShowSpinner] = useState(true);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [showHintModal, setShowHintModal] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      // fetch maps
      const { data: mapsData, error: mapsError } = await client
        .from("maps")
        .select("*");
      if (mapsError) console.error(mapsError);
      else setMaps(mapsData);

      // fetch spots
      const { data: spotsData, error: spotsError } = await client
        .from("spots")
        .select("*");
      if (spotsError) {
        console.error("Error fetching spots:", spotsError);
        setLoading(false);
        return;
      }
      if (spotsData.length > 0) {
        setAllSpots(spotsData);
        const idx = Math.floor(Math.random() * spotsData.length);
        setCurrentSpot(spotsData[idx]);
        setUsedSpotIndices([idx]);
      }
      setLoading(false);
    };

    fetchData();
  }, []);

  useEffect(() => {
    if (showSpinner) {
      const timeout = setTimeout(() => setShowSpinner(false), 2500);
      return () => clearTimeout(timeout);
    }
  }, [showSpinner]);

  // countdown
  useEffect(() => {
    if (isRoundOver) return;
    if (timer <= 0) {
      handleRoundEnd();
      return;
    }
    const interval = setInterval(() => {
      setTimer((t) => (t > 0 ? t - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [timer, isRoundOver]);

  const handleExit = () => {
    router.push("/");
  };

  const [wrongMap, setWrongMap] = useState(false);

  const handleGuess = () => {
    // Check if the selected map matches the current spot's map
    if (
      lastGuess &&
      currentSpot &&
      lastGuess.mapName !== currentSpot.map_name
    ) {
      setWrongMap(true);
      // Give 0 points for wrong map and end the round
      setRoundScores((prev) => [...prev, 0]);
      setIsRoundOver(true);
    } else {
      setWrongMap(false);
      handleRoundEnd();
    }
  };

  const handleRoundEnd = () => {
    setShowHintModal(false);
    // Calculate score based on distance between guess and closest correct point
    let pointsEarned = 0;
    if (
      lastGuess &&
      currentSpot &&
      currentSpot.coords &&
      currentSpot.coords.length > 0
    ) {
      // Find closest correct point
      const guess = lastGuess;
      const correctPoints = currentSpot.coords;
      let minDist = Infinity;
      let closest = null;
      for (const c of correctPoints) {
        const dx = guess.x - c.x;
        const dy = guess.y - c.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < minDist) {
          minDist = dist;
          closest = c;
        }
      }
      // Use the diagonal of the map image as max distance
      const mapObj = maps.find((m) => m.map_name === currentSpot.map_name);
      const imgW = 1440;
      const imgH = 1440;
      const maxDist = Math.sqrt(imgW * imgW + imgH * imgH);
      pointsEarned = Math.round(
        MAX_POINTS_PER_ROUND * Math.exp(-4 * (minDist / maxDist))
      );

      // Apply hint penalty
      if (hintsUsed === 1) {
        pointsEarned = Math.round(pointsEarned * 0.75); // 25% reduction
      } else if (hintsUsed >= 2) {
        pointsEarned = Math.round(pointsEarned * 0.5); // 50% reduction
      }
    }
    setRoundScores((prev) => [...prev, pointsEarned]);
    setIsRoundOver(true);
  };

  const handleHintClick = () => {
    if (hintsUsed < 2) {
      setShowHintModal(true);
    }
  };

  const takeHint = () => {
    setShowSpinner(true);

    setTimeout(() => {
      setHintsUsed(hintsUsed + 1);
      setShowHintModal(false);

      setTimeout(() => {
        setShowSpinner(false);
      }, 1100);
    }, 100);
  };

  const [showResults, setShowResults] = useState(false);

  const handleNextRound = () => {
    if (currentRound < TOTAL_ROUNDS) {
      setIsTransitioning(true);
      setShowSpinner(true); // show spinner for 2s
      setTimeout(() => {
        // pick a new unused spot
        let unusedIndices = allSpots
          .map((_, i) => i)
          .filter((i) => !usedSpotIndices.includes(i));
        if (unusedIndices.length === 0) {
          // fallback: just reuse any spot (shouldn't happen unless not enough spots)
          unusedIndices = allSpots.map((_, i) => i);
        }
        const idx =
          unusedIndices[Math.floor(Math.random() * unusedIndices.length)];
        setCurrentSpot(allSpots[idx]);
        setUsedSpotIndices((prev) => [...prev, idx]);
        setCurrentRound((prev) => prev + 1);
        setTimer(ROUND_TIME);
        setSelectedMap(null);
        setLastGuess(null);
        setMapPinPlaced(false);
        setIsRoundOver(false);
        setHintsUsed(0);
        setWrongMap(false);
        setIsTransitioning(false);
      }, 2000);
    } else {
      setShowResults(true);
    }
  };

  if (loading || isTransitioning) {
    return (
      <div className="flex flex-col min-h-screen">
        <main className="flex-grow flex flex-col items-center justify-center text-center">
          <div className="animate-spin h-10 w-10 border-4 border-white rounded-full border-t-transparent"></div>
        </main>
        <Footer />
      </div>
    );
  }

  const totalScoreSoFar = roundScores.reduce((sum, s) => sum + s, 0);
  const maxScore = TOTAL_ROUNDS * MAX_POINTS_PER_ROUND;

  function RoundSummaryMap({ mapObj, guess, correctPoints }) {
    const canvasRef = useRef(null);

    useEffect(() => {
      if (!mapObj || !guess || !correctPoints?.length) {
        console.log("RoundSummaryMap: Missing data", {
          mapObj,
          guess,
          correctPoints,
        });
        return;
      }

      console.log("RoundSummaryMap: Rendering", {
        mapObj,
        guess,
        correctPointsCount: correctPoints.length,
      });

      const canvas = canvasRef.current;
      if (!canvas) {
        return;
      }

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        return;
      }

      const img = new window.Image();
      img.src = mapObj.topdown_image_url;

      img.onload = () => {
        // Fixed display size (debug-friendly)
        const displayW = 400;
        const displayH = Math.round((img.height / img.width) * displayW);
        canvas.width = displayW;
        canvas.height = displayH;

        // Clear + draw map
        ctx.clearRect(0, 0, displayW, displayH);
        ctx.drawImage(img, 0, 0, displayW, displayH);

        // Scale helpers
        const scaleX = displayW / 1440;
        const scaleY = displayH / 1440;

        // Find closest correct
        let minDist = Infinity;
        let closest = null;
        for (const c of correctPoints) {
          const dx = guess.x - c.x;
          const dy = guess.y - c.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < minDist) {
            minDist = dist;
            closest = c;
          }
        }

        if (!closest) return;

        const gx = guess.x * scaleX;
        const gy = guess.y * scaleY;
        const cx = closest.x * scaleX;
        const cy = closest.y * scaleY;

        // Set the shadow properties for the circles
        ctx.shadowColor = "rgba(0, 0, 0, 1)";
        ctx.shadowBlur = 10;

        // Draw the user guess circle (blue)
        ctx.beginPath();
        ctx.arc(gx, gy, 7, 0, 2 * Math.PI);
        ctx.fillStyle = "#2563eb";
        ctx.fill();

        // Draw the closest correct point circle (red)
        ctx.beginPath();
        ctx.arc(cx, cy, 6, 0, 2 * Math.PI);
        ctx.fillStyle = "rgba(239,68,68)";
        ctx.fill();

        // Reset shadow properties before drawing the line
        ctx.shadowColor = "transparent";
        ctx.shadowBlur = 0;

        // Create the gradient for the line
        let gradient = ctx.createLinearGradient(gx, gy, cx, cy);
        gradient.addColorStop(0, "#2563eb");
        gradient.addColorStop(1, "rgba(239,68,68)");

        // Draw the line with the gradient
        ctx.beginPath();
        ctx.moveTo(gx, gy);
        ctx.lineTo(cx, cy);
        ctx.strokeStyle = gradient;
        ctx.lineWidth = 4;
        ctx.stroke();
      };

      img.onerror = (err) => {
        console.error("❌ Failed to load map image", err);
      };
    }, [mapObj, guess, correctPoints]);

    return (
      <div className="flex flex-col items-center mb-6">
        <canvas
          ref={canvasRef}
          style={{
            width: 400,
            height: "auto",
            borderRadius: 12,
            border: "2px solid #222",
          }}
        />
      </div>
    );
  }

  // Game Results Screen
  if (showResults) {
    // Get map names for each round
    const roundMaps = usedSpotIndices.map((idx) => {
      const spot = allSpots[idx];
      const mapObj = maps.find((m) => m.map_name === spot.map_name);
      return mapObj ? mapObj.map_name : "Unknown";
    });

    return (
      <div className="flex flex-col min-h-screen">
        <main className="flex-grow flex flex-col items-center justify-center text-center">
          <h1 className="text-3xl font-bold mb-8">Game Results</h1>

          <div className="bg-neutral-900/80 rounded-xl p-6 mb-8 w-full max-w-md">
            <h2 className="text-2xl font-bold mb-6 text-white">
              <span className="text-white">
                {totalScoreSoFar}{" "}
                <span className="text-neutral-400 text-xl font-medium">
                  / {maxScore}
                </span>
              </span>
            </h2>

            <div className="space-y-4">
              {roundScores.map((score, index) => (
                <div
                  key={index}
                  className={`flex justify-between items-center pb-3 ${
                    index === roundScores.length - 1
                      ? ""
                      : "border-b border-neutral-800"
                  }`}
                >
                  <div className="text-left">
                    <div className="font-medium">Round {index + 1}</div>
                    <div className="text-sm text-neutral-400 capitalize">
                      {roundMaps[index]}
                    </div>
                  </div>
                  <div className="font-bold text-xl">{score}</div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <button
              onClick={handleExit}
              className="cursor-pointer py-2 px-4 mr-2.5 rounded-full text-neutral-200 font-medium bg-neutral-800/[0.75] hover:bg-neutral-800 duration-300 transition-all"
            >
              Exit to Home
            </button>
            <button
              onClick={() => window.location.reload()}
              className="cursor-pointer py-2 px-4 rounded-full font-medium text-black bg-white hover:bg-[#cecece] duration-300 transition-all"
            >
              Play Again
            </button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (isRoundOver) {
    // Find map object for current spot
    const mapObj = maps.find((m) => m.map_name === currentSpot.map_name);
    const guess = lastGuess;
    const correctPoints = currentSpot.coords;
    return (
      <div className="flex flex-col min-h-screen">
        <main className="flex-grow flex flex-col items-center justify-center text-center">
          <h1 className="text-3xl font-bold mb-4">Round {currentRound}</h1>
          {wrongMap ? (
            <div className="w-[300px] md:w-[400px] bg-[#230F0F] rounded-xl p-6 mb-6">
              <h2 className="text-xl font-bold mb-2">Wrong Map</h2>
              <p>
                You selected{" "}
                <span className="font-bold capitalize">
                  {lastGuess.mapName}
                </span>
              </p>
              <p>
                but this spot is on{" "}
                <span className="font-bold capitalize">
                  {currentSpot.map_name}
                </span>
              </p>
            </div>
          ) : (
            mapObj &&
            guess &&
            correctPoints?.length > 0 && (
              <RoundSummaryMap
                mapObj={mapObj}
                guess={guess}
                correctPoints={correctPoints}
              />
            )
          )}
          <h2 className="text-xl text-neutral-400 font-medium">
            You scored{" "}
            <span className="text-white">
              {roundScores[currentRound - 1]}{" "}
              <span className="text-[16px] text-[#929292]">
                / {MAX_POINTS_PER_ROUND}{" "}
              </span>
            </span>
            points this round
          </h2>
          <p className="text-xl mt-1 mb-6 text-neutral-400 font-medium">
            You now have{" "}
            <span className="text-white">
              {totalScoreSoFar}{" "}
              <span className="text-[16px] text-[#929292]">/ {maxScore} </span>
            </span>
            points in total
          </p>
          <div>
            <button
              onClick={handleExit}
              className="cursor-pointer py-2 px-4 mr-2.5 rounded-full text-neutral-200 font-medium bg-neutral-800/[0.75] hover:bg-neutral-800 duration-300 transition-all"
            >
              Leave Game
            </button>
            <button
              onClick={handleNextRound}
              className="cursor-pointer py-2 px-4 rounded-full font-medium text-black bg-white hover:bg-[#cecece] duration-300 transition-all"
            >
              {currentRound < TOTAL_ROUNDS ? "Next Round" : "View Results"}
            </button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!currentSpot) {
    return (
      <div className="flex items-center justify-center h-screen text-white">
        No spots available. Try again later.
      </div>
    );
  }

  const zoomImg = currentSpot.images?.zoom3;

  return (
    <>
      {/* Blur background when hint modal is active */}
      <div
        className={`fixed inset-0 z-40 bg-black/32 backdrop-blur-[5px] transition-all duration-300 ${
          showHintModal ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      ></div>

      {/* Modal with animations */}
      <div
        className={`fixed inset-0 z-50 flex items-center justify-center transition-opacity duration-300 ${
          showHintModal ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      >
        <div
          className={`bg-[#0F0F0F] rounded-xl px-4 py-3 max-w-[390px] w-full mx-4 shadow-2xl transition-all duration-300 transform ${
            showHintModal ? "scale-100" : "scale-90"
          }`}
        >
          <h2 className="text-2xl font-bold mb-2 text-center">Need a hint?</h2>
          {hintsUsed === 0 ? (
            <p className="text-neutral-400 mb-5 text-center font-medium">
              Taking a hint will zoom out the image, letting you see more of the
              map. However, it will give you{" "}
              <span className="text-white">25%</span> less points this round.
            </p>
          ) : (
            <p className="text-neutral-400 mb-5 text-center font-medium">
              Taking a second hint will give you{" "}
              <span className="text-white">50%</span> less points this round.
            </p>
          )}
          <div className="flex justify-center gap-3 mb-1.5">
            <button
              onClick={() => setShowHintModal(false)}
              className="cursor-pointer px-4 py-2 rounded-full bg-[#1A1A1A] hover:bg-neutral-800 transition-all text-white font-medium"
            >
              Cancel
            </button>
            <button
              onClick={takeHint}
              className="cursor-pointer px-4 py-2 rounded-full bg-white hover:bg-[#cecece] transition-all text-black font-medium"
            >
              Show hint
            </button>
          </div>
        </div>
      </div>

      {/* Spinner overlay */}
      {showSpinner && (
        <div className="fixed inset-0 z-50 flex flex-col bg-black">
          <main className="flex-grow flex flex-col items-center justify-center text-center">
            <div className="animate-spin h-10 w-10 border-4 border-white rounded-full border-t-transparent"></div>
          </main>
          <Footer />
        </div>
      )}
      <div className="flex flex-col h-screen bg-black text-white relative">
        {/* top bar */}
        <div className="flex items-center justify-between px-7 py-6">
          <button
            onClick={handleExit}
            className="px-2 py-1 transition-all cursor-pointer flex items-center gap-1 rounded-full text-neutral-200 bg-neutral-900 hover:bg-neutral-800 font-medium"
          >
            <ArrowLeft className="w-5 h-5" />
            <p className="mr-1">Leave game</p>
          </button>
          <div className="font-bold text-2xl mr-24">{timer}</div>
          <div className="font-semibold">
            Round {currentRound}/{TOTAL_ROUNDS}
          </div>
        </div>

        {/* Game content */}
        <div className="flex flex-col h-screen bg-black text-white relative p-4 select-none">
          <div className="flex-grow flex items-center justify-center">
            {/* wrapper: this will shrink to the displayed spot image (centered) */}
            <div className="relative inline-block">
              {/* SPOT IMAGE (large central game screenshot) */}
              <img
                src={
                  hintsUsed === 0
                    ? currentSpot.images?.zoom3
                    : hintsUsed === 1
                    ? currentSpot.images?.zoom2
                    : currentSpot.images?.zoom1
                }
                alt="Spot"
                className="max-h-[72vh] object-contain rounded-xl block"
                style={{ display: "block" }}
              />

              {/* Hint button centered below the image */}
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 backdrop-blur-md rounded-full">
                {hintsUsed < 2 ? (
                  <button
                    onClick={handleHintClick}
                    className="cursor-pointer px-3 py-1.5 rounded-full bg-neutral-900/88 hover:bg-neutral-800 text-white font-medium flex items-center gap-1 transition-all opacity-80"
                  >
                    <Sparkles className="w-5 h-5" />
                    Hint
                  </button>
                ) : (
                  <div className="px-4 py-2 rounded-full bg-neutral-800/70 text-neutral-400 font-medium flex items-center gap-2">
                    <X className="w-5 h-5" />
                    No hints available
                  </div>
                )}
              </div>

              {/* map panel OVERLAY inside the image wrapper (bottom-right) */}
              <div
                style={{
                  position: "absolute",
                  bottom: 74, // push up to make space for guess button below
                  right: 16,
                  width: 380,
                  height: 380,
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <div className="w-full h-full rounded-xl overflow-hidden backdrop-blur-md border border-neutral-800 bg-neutral-900/88">
                  {!selectedMap ? (
                    /* map list inside */
                    <div className="flex flex-col h-full">
                      <div className="py-3 px-4 border-neutral-800">
                        <h3 className="font-bold">Maps</h3>
                      </div>
                      <ul className="overflow-y-auto flex-1">
                        {maps.map((m) => (
                          <li
                            key={m.id}
                            className="py-2 px-3 hover:bg-neutral-900/65 cursor-pointer"
                            onClick={() => {
                              setSelectedMap(m);
                              setMapPinPlaced(false); // reset pin state when entering map viewer
                            }}
                          >
                            {m.map_name.charAt(0).toUpperCase() +
                              m.map_name.slice(1)}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : (
                    // topdown viewer inside the same fixed-size container
                    <div className="relative h-full">
                      <div className="absolute top-0 left-0 p-3 z-10">
                        <button
                          onClick={() => {
                            setSelectedMap(null);
                            setMapPinPlaced(false); // disable guess when leaving map viewer
                          }}
                          className="px-2.5 py-1 transition-all cursor-pointer flex items-center gap-1 rounded-full text-neutral-200 bg-neutral-800 hover:bg-neutral-700 font-medium"
                        >
                          <ArrowLeft className="w-5 h-5 -ml-1" />
                          {selectedMap.map_name.charAt(0).toUpperCase() +
                            selectedMap.map_name.slice(1)}
                        </button>
                      </div>
                      <div className="w-full h-full cursor-crosshair">
                        <MapViewer
                          src={selectedMap.topdown_image_url}
                          onPinPlaced={(pin) => {
                            setMapPinPlaced(true);
                            setLastGuess({
                              ...pin,
                              mapName: selectedMap.map_name,
                            });
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div
                style={{
                  position: "absolute",
                  bottom: 16,
                  right: 16,
                  width: 380,
                }}
              >
                <button
                  className={`w-full h-12.5 py-3 rounded-xl font-bold text-lg transition-all duration-200 border border-neutral-800 ${
                    selectedMap && mapPinPlaced
                      ? "opacity-100 bg-white hover:bg-[#cecece] text-black cursor-pointer"
                      : "opacity-60 bg-neutral-900 transition-all cursor-not-allowed"
                  }`}
                  disabled={!(selectedMap && mapPinPlaced)}
                  onClick={() => {
                    handleGuess();
                  }}
                >
                  Guess
                </button>
              </div>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    </>
  );
}

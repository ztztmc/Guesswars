"use client";

import Footer from "@/components/Footer";
import Image from "next/image";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex flex-grow gap-4 items-center min-h-full justify-center py-2 px-4 mt-10">
        <div className="flex flex-col gap-4">
          <h1 className="font-bold text-4xl max-w-lg">
            Guess where you are in Hypixel Bedwars
          </h1>
          <button
            onClick={() => router.push("/game")}
            className="cursor-pointer rounded-full transition-colors flex items-center justify-center w-fit bg-neutral-200 hover:bg-neutral-200/[0.8] text-black font-medium h-11 px-5 mt-2"
          >
            Play
          </button>
        </div>
        <div className="flex gap-1.5 text-center">
          <div className="rounded-l-2xl rounded-r-lg bg-neutral-900 px-2 py-1 flex flex-col items-center">
            <p className="font-medium text-neutral-300 max-w-[220px] mb-1">
              You&apos;ll see an image from a spot in a Bedwars map.
            </p>
            <Image
              src="/spot-example.png"
              width={210}
              height={210}
              alt="Spot image example"
              className="rounded-2xl mb-2"
            />
          </div>
          <div className="rounded-lg bg-neutral-900 px-2 py-1 flex flex-col items-center">
            <p className="font-medium text-neutral-300 max-w-[220px] mb-1">
              You have to guess the map and the location.
            </p>
            <Image
              src="/locate-example.png"
              width={210}
              height={210}
              alt="Spot image example"
              className="rounded-2xl mb-2"
            />
          </div>
          <div className="rounded-l-lg rounded-r-2xl bg-neutral-900 px-2 py-1 flex flex-col items-center">
            <p className="font-medium text-neutral-300 max-w-[220px] mb-1">
              Earn points based on how close you were.
            </p>
            <Image
              src="/result-example.png"
              width={210}
              height={210}
              alt="Spot image example"
              className="rounded-2xl mb-2"
            />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

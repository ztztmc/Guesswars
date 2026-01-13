"use client";

import Footer from "@/components/Footer";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex flex-col flex-grow gap-4 items-center text-center min-h-full justify-center py-20 px-4 mt-10">
        <h1 className="font-black text-5xl max-w-lg">
          Guess where you are in Bedwars
        </h1>
        <p className="mt-1 text-neutral-400 max-w-md font-medium">
          You&apos;ll see an image from a random spot in a random Hypixel
          Bedwars map. You have to guess the map and the location. Earn points
          based on how close you were.
        </p>
        <button
          onClick={() => router.push("/game")}
          className="cursor-pointer rounded-full transition-colors duration-300 flex items-center justify-center bg-neutral-800/[0.75] hover:bg-neutral-800 text-neutral-200 font-medium text-sm h-10 px-4 mt-2"
        >
          Play
        </button>
      </main>
      <Footer />
    </div>
  );
}

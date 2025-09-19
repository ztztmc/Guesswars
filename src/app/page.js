"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <div className="flex flex-col min-h-screen">
        <main className="flex-grow flex flex-col items-center justify-center text-center">
          <div className="animate-spin h-10 w-10 border-4 border-white rounded-full border-t-transparent"></div>
        </main>
        <footer className="w-full flex gap-6 flex-wrap items-center justify-center p-4 font-medium text-neutral-400">
          <a className="flex items-center gap-2">© 2025 ztzt</a>
          <a
            className="flex items-center gap-2 hover:bg-neutral-800 transition-colors duration-200 rounded-full px-4 py-2"
            href="https://youtube.com/@ztztbw"
            target="_blank"
            rel="noopener noreferrer"
          >
            youtube.com/@ztztbw
          </a>
          <a className="flex items-center gap-2">ztztalt@gmail.com</a>
        </footer>
      </div>
    );
  }

  if (session) {
    return (
      <div className="flex flex-col min-h-screen">
        <main className="flex flex-col flex-grow gap-4 items-center text-center min-h-full justify-center py-20 px-4 mt-10">
          <div className="flex flex-row items-center gap-2 bg-neutral-900 px-1.5 py-1 rounded-full">
            {session.user.image && (
              <img
                src={session.user.image}
                alt="Profile"
                className="w-8 h-8 rounded-full"
              />
            )}
            <span className="font-medium">{session.user.name}</span>
            <button
              onClick={() => signOut()}
              className="cursor-pointer rounded-full transition-colors duration-300 h-7 px-3 bg-neutral-800 hover:bg-[#313131] text-white font-medium text-sm"
            >
              Sign Out
            </button>
          </div>
          <h1 className="font-black text-5xl max-w-lg">Guesswars</h1>
          <div className="flex gap-4 items-center">
            <button
              onClick={() => {
                router.push("/game");
              }}
              className="cursor-pointer rounded-full transition-all duration-300 flex items-center justify-center bg-white hover:bg-[#cecece] text-black font-medium text-sm h-10 px-4 mt-2"
            >
              Play
            </button>
          </div>
        </main>
        <footer className="w-full flex gap-6 flex-wrap items-center justify-center p-4 font-medium text-neutral-400">
          <a className="flex items-center gap-2">© 2025 ztzt</a>
          <a
            className="flex items-center gap-2 hover:bg-neutral-800 transition-colors duration-200 rounded-full px-4 py-2"
            href="https://youtube.com/@ztztbw"
            target="_blank"
            rel="noopener noreferrer"
          >
            youtube.com/@ztztbw
          </a>
          <a className="flex items-center gap-2">ztztalt@gmail.com</a>
        </footer>
      </div>
    );
  }

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
        <div className="flex gap-2.5 items-center">
          <button
            onClick={() => signIn("discord")}
            className="cursor-pointer rounded-full transition-colors duration-300 flex items-center justify-center bg-white hover:bg-[#cecece] text-black font-medium text-sm h-10 px-4 mt-2"
          >
            Login with Discord
          </button>
          <button
            onClick={() => router.push("/game")}
            className="cursor-pointer rounded-full transition-colors duration-300 flex items-center justify-center bg-neutral-800/[0.75] hover:bg-neutral-800 text-neutral-200 font-medium text-sm h-10 px-4 mt-2"
          >
            Play as Guest
          </button>
        </div>
      </main>
      <footer className="w-full flex gap-6 flex-wrap items-center justify-center p-4 font-medium text-neutral-400">
        <a className="flex items-center gap-2">© 2025 ztzt</a>
        <a
          className="flex items-center gap-2 hover:bg-neutral-800 transition-colors duration-200 rounded-full px-4 py-2"
          href="https://youtube.com/@ztztbw"
          target="_blank"
          rel="noopener noreferrer"
        >
          youtube.com/@ztztbw
        </a>
        <a className="flex items-center gap-2">ztztalt@gmail.com</a>
      </footer>
    </div>
  );
}

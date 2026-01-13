import { ExternalLink } from "lucide-react";

export default function Footer() {
  return (
    <footer className="w-full flex gap-4 flex-wrap items-center justify-center p-4 font-medium text-neutral-400">
      <a
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2 hover:bg-neutral-800 rounded-full px-4 py-2 transition-colors"
        href="https://github.com/ztztmc/guesswars"
      >
        Github
        <ExternalLink width={17} />
      </a>
      <a
        className="flex items-center gap-2 hover:bg-neutral-800 duration-200 rounded-full px-4 py-2 transition-colors"
        href="https://youtube.com/@ztztbw"
        target="_blank"
        rel="noopener noreferrer"
      >
        youtube.com/@ztztbw
      </a>
      <a className="flex items-center gap-2">ztztalt@gmail.com</a>
    </footer>
  );
}

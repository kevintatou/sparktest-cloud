import Image from "next/image";
// Placeholder imports - let's test that they can actually be imported
import { SomeCore } from "@tatou/core";
import { SomeUIComponent } from "@tatou/ui";

export default function Home() {
  return (
    <div className="font-sans grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20">
      <main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start">
        <h1 className="text-3xl font-bold">SaaS Frontend - Next.js</h1>
        <p className="text-lg">This is the SaaS frontend application using Next.js</p>
        
        {/* Using tatou packages */}
        <div className="bg-blue-100 p-4 rounded">
          <p>Tatou Core Version: {SomeCore.version}</p>
          <p>UI Component: {SomeUIComponent()}</p>
        </div>
        
        <Image
          className="dark:invert"
          src="/next.svg"
          alt="Next.js logo"
          width={180}
          height={38}
          priority
        />
      </main>
    </div>
  );
}

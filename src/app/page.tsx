"use client";
import dynamic from "next/dynamic";

const ExcalidrawWrapper = dynamic(
  async () => (await import("@/excalidraw/index")).default,
  {
    loading: () => <div>Loading...</div>,
    ssr: false,
  }
);

export default function Home() {
  return (
    <>
      <ExcalidrawWrapper />
    </>
  );
}

import dynamic from "next/dynamic";

const ExcalidrawWrapper = dynamic(
  async () => (await import("@/excalidraw/index")).default,
  {
    ssr: false,
  },
);

export default function Home() {
  return (
    <>
      <ExcalidrawWrapper />
    </>
  );
}

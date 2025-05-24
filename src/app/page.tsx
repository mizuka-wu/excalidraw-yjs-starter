import dynamic from "next/dynamic";

const ExcalidrawWrapper = dynamic(
  async () => (await import("@/excalidraw/index")).default,
  {
    ssr: false,
  },
);

export default async function Home() {
  return (
    <>
      <ExcalidrawWrapper />
    </>
  );
}

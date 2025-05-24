"use client";
import dynamic from "next/dynamic";

const ExcalidrawWrapper = dynamic(
  async () => (await import("@/excalidraw/index")).default,
  {
    loading: () => <div>Loading...</div>,
    ssr: false,
  }
);

type Props = {
  params: { id: string };
  searchParams: { [key: string]: string | string[] | undefined };
};

export default function Page({ params, searchParams }: Props) {
  const { id } = params;
  const isUseIndexedDb = searchParams.indexeddb === "true";
  return (
    <>
      <ExcalidrawWrapper id={id} isUseIndexedDb={isUseIndexedDb} />
    </>
  );
}

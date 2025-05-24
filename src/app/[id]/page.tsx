import dynamic from "next/dynamic";

const ExcalidrawWrapper = dynamic(
  async () => (await import("@/excalidraw/index")).default,
  {
    ssr: false,
  },
);

export default async function Page(props: {
    params: {
        id: string;
    }
}) {
    const { id } = props.params;
    // const setApi = useCollab();
  return (
    <ExcalidrawWrapper />
  );
}
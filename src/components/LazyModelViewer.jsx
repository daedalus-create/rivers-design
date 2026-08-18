import { lazy, Suspense } from "react";

// three.js is the single biggest dependency in this app but only a
// handful of pages actually render a model — split it into its own
// chunk instead of shipping it on every route.
const ModelViewer = lazy(() => import("./ModelViewer"));

function Placeholder({ height }) {
  return <div className="model-frame" style={height ? { height } : undefined} />;
}

export default function LazyModelViewer(props) {
  return (
    <Suspense fallback={<Placeholder height={props.height} />}>
      <ModelViewer {...props} />
    </Suspense>
  );
}

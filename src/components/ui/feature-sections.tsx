import Image from "next/image";

interface FeatureCard {
  image: string;
  title: string;
  description: string;
}

const FEATURES: FeatureCard[] = [
  {
    image:
      "https://cdn.21st.dev/assets/mirror/be/be1b2e97582f627f0b12c78b4659a78dd89731065529b2d92f1d6aa7c7906c14.png",
    title: "Ask any assistant",
    description:
      "Search restaurants and order food from inside a chat, through the Bharat MCP server.",
  },
  {
    image:
      "https://cdn.21st.dev/assets/mirror/b6/b6e8f44114cb6b12a5b19ef51876a8217c76fe1fcf014b3251a004377453f29a.png",
    title: "One link, done",
    description:
      "Payment, confirmation and live tracking all live on a single order link.",
  },
  {
    image:
      "https://cdn.21st.dev/assets/mirror/48/48f0b980c99986438bdcc25df7482983be83095e483abe5d525595a6290ffd6e.png",
    title: "Real delivery, real time",
    description:
      "Restaurant and rider updates reach the customer within seconds, on any device.",
  },
];

/** Landing-page feature grid. Card content is Bharat MCP-specific; the
 *  photography is the placeholder set this design shipped with — swap it for
 *  product screenshots when there's real UI to show off. */
export default function FeatureSections() {
  return (
    <section className="w-full py-16">
      <div className="mx-auto mb-12 max-w-2xl text-center">
        <h2 className="text-3xl font-semibold">Powerful features</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Everything an order needs to move from a chat to your door, tracked at
          every step.
        </p>
      </div>

      <div className="flex flex-wrap items-start justify-center gap-10">
        {FEATURES.map((feature) => (
          <div
            key={feature.title}
            // min-w-0: without it, a flex item holding a sized <img> can't
            // shrink below the image's intrinsic width and overflows on narrow
            // screens even though the image itself is w-full.
            className="min-w-0 max-w-80 transition duration-300 hover:-translate-y-0.5"
          >
            <Image
              className="h-auto w-full rounded-xl"
              src={feature.image}
              alt=""
              width={320}
              height={200}
              unoptimized
            />
            <h3 className="mt-4 text-base font-semibold text-foreground">
              {feature.title}
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {feature.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

import { Metadata } from "next";
import { AFFILIATE_PRODUCTS } from "@/data/affiliateProducts";

export const metadata: Metadata = {
  title: "Affiliate Disclosure | Maple Insight Canada",
  description:
    "Learn how Maple Insight Canada uses affiliate links and how we maintain editorial independence while earning commissions on recommended products.",
  alternates: {
    canonical: "https://mapleinsight.ca/affiliate-disclosure",
  },
};

export default function AffiliateDisclosurePage() {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#FAFBFC",
        fontFamily: "var(--font-dm-sans, 'DM Sans', Helvetica, sans-serif)",
      }}
    >
      <header
        style={{
          background: "linear-gradient(165deg, #0F3D3A 0%, #1B5E58 40%, #1B7A4A 100%)",
          padding: "48px 24px 40px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            opacity: 0.04,
            backgroundImage:
              "radial-gradient(circle at 20% 50%, #fff 1px, transparent 1px), radial-gradient(circle at 80% 20%, #fff 1px, transparent 1px)",
            backgroundSize: "60px 60px, 40px 40px",
          }}
        />
        <div
          style={{
            maxWidth: 720,
            margin: "0 auto",
            position: "relative",
            zIndex: 1,
          }}
        >
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              background: "rgba(255,255,255,0.12)",
              borderRadius: 20,
              padding: "6px 16px",
              marginBottom: 18,
              backdropFilter: "blur(8px)",
            }}
          >
            <span
              style={{
                fontSize: 13,
                color: "rgba(255,255,255,0.85)",
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: 1,
              }}
            >
              Transparency
            </span>
          </div>
          <h1
            style={{
              fontFamily: "var(--font-dm-serif, 'DM Serif Display', Georgia, serif)",
              fontSize: 36,
              fontWeight: 700,
              color: "#fff",
              margin: "0 0 12px",
              lineHeight: 1.15,
              letterSpacing: -0.5,
            }}
          >
            Affiliate Disclosure
          </h1>
          <p
            style={{
              fontSize: 17,
              lineHeight: 1.7,
              color: "rgba(255,255,255,0.75)",
              margin: 0,
            }}
          >
            How we earn money, and why it doesn&apos;t affect our recommendations.
          </p>
        </div>
      </header>

      <main
        style={{
          maxWidth: 720,
          margin: "0 auto",
          padding: "48px 24px 80px",
        }}
      >
        <section style={{ marginBottom: 48 }}>
          <h2
            style={{
              fontFamily: "var(--font-dm-serif, 'DM Serif Display', Georgia, serif)",
              fontSize: 24,
              color: "#1B4F4A",
              fontWeight: 700,
              margin: "0 0 16px",
            }}
          >
            How We Make Money
          </h2>
          <p style={{ fontSize: 16, lineHeight: 1.75, color: "#374151", margin: "0 0 16px" }}>
            Maple Insight Canada is a free educational resource for newcomers to Canada. To keep the site
            running, we participate in affiliate marketing programs. This means that when you click
            a link on our site and sign up for a product or service, we may earn a small commission
            — at no extra cost to you.
          </p>
          <p style={{ fontSize: 16, lineHeight: 1.75, color: "#374151", margin: "0 0 16px" }}>
            Affiliate commissions help us pay for hosting, research, and the time it takes to write
            genuinely helpful content. Without them, we could not continue offering this resource
            for free.
          </p>
          <div
            style={{
              background: "#FDF6E3",
              borderLeft: "4px solid #B8860B",
              borderRadius: "0 12px 12px 0",
              padding: "16px 20px",
              fontSize: 14,
              lineHeight: 1.6,
              color: "#92400E",
            }}
          >
            <strong>Important:</strong> Affiliate links on Maple Insight Canada are clearly labelled with
            an &quot;Affiliate&quot; marker or an affiliate disclosure banner. You will always know
            when a link may earn us a commission.
          </div>
        </section>

        <section style={{ marginBottom: 48 }}>
          <h2
            style={{
              fontFamily: "var(--font-dm-serif, 'DM Serif Display', Georgia, serif)",
              fontSize: 24,
              color: "#1B4F4A",
              fontWeight: 700,
              margin: "0 0 16px",
            }}
          >
            Our Editorial Independence
          </h2>
          <p style={{ fontSize: 16, lineHeight: 1.75, color: "#374151", margin: "0 0 16px" }}>
            We only recommend products and services that we genuinely believe are useful for
            newcomers to Canada. Our editorial team evaluates products based on fees, features,
            newcomer-friendliness, and overall value — not on commission rates.
          </p>
          <p style={{ fontSize: 16, lineHeight: 1.75, color: "#374151", margin: "0 0 16px" }}>
            Affiliate relationships do not influence the content of our articles, our rankings, or
            our recommendations. We will never recommend a product simply because it pays us a
            higher commission, and we will always disclose known downsides of any product we
            feature.
          </p>
          <p style={{ fontSize: 16, lineHeight: 1.75, color: "#374151", margin: 0 }}>
            If a product stops being competitive or begins to poorly serve newcomers, we will update
            or remove it from our recommendations — regardless of any affiliate relationship.
          </p>
        </section>

        <section style={{ marginBottom: 48 }}>
          <h2
            style={{
              fontFamily: "var(--font-dm-serif, 'DM Serif Display', Georgia, serif)",
              fontSize: 24,
              color: "#1B4F4A",
              fontWeight: 700,
              margin: "0 0 16px",
            }}
          >
            Our Affiliate Partners
          </h2>
          <p style={{ fontSize: 16, lineHeight: 1.75, color: "#374151", margin: "0 0 20px" }}>
            Below is a list of the companies we currently have affiliate relationships with. This
            list may be updated as our partnerships change.
          </p>
          <div
            style={{
              background: "#fff",
              borderRadius: 16,
              border: "1px solid #E5E7EB",
              overflow: "hidden",
            }}
          >
            {AFFILIATE_PRODUCTS.map((p, i) => (
              <div
                key={p.id}
                style={{
                  padding: "16px 24px",
                  borderBottom: i < AFFILIATE_PRODUCTS.length - 1 ? "1px solid #F3F4F6" : "none",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: 8,
                }}
              >
                <div>
                  <div
                    style={{
                      fontWeight: 700,
                      fontSize: 15,
                      color: "#1B4F4A",
                      fontFamily: "var(--font-dm-sans, 'DM Sans', Helvetica, sans-serif)",
                    }}
                  >
                    {p.name}
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      color: "#9CA3AF",
                      textTransform: "capitalize",
                      marginTop: 2,
                    }}
                  >
                    {p.category}
                  </div>
                </div>
                <a
                  href={p.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    fontSize: 13,
                    color: "#1B7A4A",
                    textDecoration: "underline",
                    fontFamily: "var(--font-dm-sans, 'DM Sans', Helvetica, sans-serif)",
                  }}
                >
                  {p.url.replace("https://", "")}
                </a>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2
            style={{
              fontFamily: "var(--font-dm-serif, 'DM Serif Display', Georgia, serif)",
              fontSize: 24,
              color: "#1B4F4A",
              fontWeight: 700,
              margin: "0 0 16px",
            }}
          >
            Questions?
          </h2>
          <p style={{ fontSize: 16, lineHeight: 1.75, color: "#374151", margin: 0 }}>
            If you have any questions about our affiliate relationships or editorial process, please{" "}
            <a
              href="/contact"
              style={{ color: "#1B7A4A", textDecoration: "underline" }}
            >
              contact us
            </a>
            . We are committed to full transparency with our readers.
          </p>
        </section>
      </main>
    </div>
  );
}

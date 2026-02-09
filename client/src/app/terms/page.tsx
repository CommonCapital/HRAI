export default function TermsOfServicePage() {
  return (
    <main className="bg-white min-h-screen px-6 py-24">
      <section className="max-w-3xl mx-auto space-y-16">
        {/* Header */}
        <header className="space-y-6">
          <h1
            className="text-4xl md:text-5xl font-semibold tracking-tight"
            style={{ color: "#FF6A00" }}
          >
            Terms of Service
          </h1>

          <p
            className="text-sm font-light tracking-wide"
            style={{ color: "rgba(255,106,0,0.6)" }}
          >
            Last updated: February 2026
          </p>
        </header>

        {/* Intro */}
        <section className="space-y-6">
          <p
            className="text-base font-light leading-relaxed"
            style={{ color: "#FF6A00" }}
          >
            These Terms of Service (“Terms”) govern your access to and use of the
            HRAI platform, products, and services (“Services”). By accessing or
            using HRAI, you agree to be bound by these Terms.
          </p>

          <p
            className="text-base font-light leading-relaxed"
            style={{ color: "#FF6A00" }}
          >
            If you do not agree, do not use the Services.
          </p>
        </section>

        {/* Section */}
        <section className="space-y-10">
          <h2
            className="text-2xl font-medium tracking-tight"
            style={{ color: "#FF6A00" }}
          >
            1. Use of the Service
          </h2>

          <p
            className="text-base font-light leading-relaxed"
            style={{ color: "#FF6A00" }}
          >
            HRAI provides autonomous HR agents designed to assist with candidate
            screening, interviews, verification, and hiring decision support.
            You are responsible for configuring agents according to your own
            hiring standards and ensuring compliance with applicable laws.
          </p>

          <p
            className="text-base font-light leading-relaxed"
            style={{ color: "#FF6A00" }}
          >
            You may not use the Services for unlawful, discriminatory, or abusive
            practices.
          </p>
        </section>

        {/* Section */}
        <section className="space-y-10">
          <h2
            className="text-2xl font-medium tracking-tight"
            style={{ color: "#FF6A00" }}
          >
            2. Responsibility & Decision Making
          </h2>

          <p
            className="text-base font-light leading-relaxed"
            style={{ color: "#FF6A00" }}
          >
            HRAI produces structured outputs, evaluations, and recommendations.
            Final hiring decisions remain solely your responsibility. HRAI does
            not guarantee hiring outcomes or candidate performance.
          </p>
        </section>

        {/* Section */}
        <section className="space-y-10">
          <h2
            className="text-2xl font-medium tracking-tight"
            style={{ color: "#FF6A00" }}
          >
            3. Data & Privacy
          </h2>

          <p
            className="text-base font-light leading-relaxed"
            style={{ color: "#FF6A00" }}
          >
            You retain ownership of your data. By using the Services, you grant
            HRAI permission to process candidate and company data solely for the
            purpose of providing the Services.
          </p>

          <p
            className="text-base font-light leading-relaxed"
            style={{ color: "#FF6A00" }}
          >
            Data handling is governed by our Privacy Policy and applicable data
            protection laws.
          </p>
        </section>

        {/* Section */}
        <section className="space-y-10">
          <h2
            className="text-2xl font-medium tracking-tight"
            style={{ color: "#FF6A00" }}
          >
            4. Intellectual Property
          </h2>

          <p
            className="text-base font-light leading-relaxed"
            style={{ color: "#FF6A00" }}
          >
            All platform software, agent architecture, and underlying systems
            are the exclusive property of HRAI. You may not copy, reverse
            engineer, or resell the Services without written permission.
          </p>
        </section>

        {/* Section */}
        <section className="space-y-10">
          <h2
            className="text-2xl font-medium tracking-tight"
            style={{ color: "#FF6A00" }}
          >
            5. Limitation of Liability
          </h2>

          <p
            className="text-base font-light leading-relaxed"
            style={{ color: "#FF6A00" }}
          >
            To the maximum extent permitted by law, HRAI shall not be liable for
            indirect, incidental, or consequential damages arising from your
            use of the Services.
          </p>
        </section>

        {/* Section */}
        <section className="space-y-10">
          <h2
            className="text-2xl font-medium tracking-tight"
            style={{ color: "#FF6A00" }}
          >
            6. Termination
          </h2>

          <p
            className="text-base font-light leading-relaxed"
            style={{ color: "#FF6A00" }}
          >
            We may suspend or terminate access to the Services if you violate
            these Terms or misuse the platform.
          </p>
        </section>

        {/* Footer */}
        <footer className="pt-16 border-t"
          style={{ borderColor: "rgba(255,106,0,0.2)" }}
        >
          <p
            className="text-sm font-light tracking-wide"
            style={{ color: "rgba(255,106,0,0.6)" }}
          >
            © {new Date().getFullYear()} HRAI. All rights reserved.
          </p>
        </footer>
      </section>
    </main>
  );
}

export default function PrivacyPolicyPage() {
  return (
    <main className="bg-white min-h-screen px-6 py-24">
      <section className="max-w-3xl mx-auto space-y-16">
        {/* Header */}
        <header className="space-y-6">
          <h1
            className="text-4xl md:text-5xl font-semibold tracking-tight"
            style={{ color: "#FF6A00" }}
          >
            Privacy Policy
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
            This Privacy Policy explains how HRAI (“we”, “our”, “us”) collects,
            uses, and protects personal data when you access or use our platform
            and services (“Services”).
          </p>

          <p
            className="text-base font-light leading-relaxed"
            style={{ color: "#FF6A00" }}
          >
            We design our systems for control, auditability, and minimal data
            exposure. Privacy is infrastructure — not an afterthought.
          </p>
        </section>

        {/* Section */}
        <section className="space-y-10">
          <h2
            className="text-2xl font-medium tracking-tight"
            style={{ color: "#FF6A00" }}
          >
            1. Data We Collect
          </h2>

          <p
            className="text-base font-light leading-relaxed"
            style={{ color: "#FF6A00" }}
          >
            Depending on usage, we may process the following categories of data:
          </p>

          <ul
            className="space-y-4 pl-6 list-disc text-base font-light"
            style={{ color: "#FF6A00" }}
          >
            <li>Company account information</li>
            <li>Candidate-provided data (resumes, interview responses)</li>
            <li>Interview transcripts (text or voice)</li>
            <li>Hiring criteria, evaluation logic, and agent configurations</li>
            <li>Usage metadata necessary for system operation and security</li>
          </ul>
        </section>

        {/* Section */}
        <section className="space-y-10">
          <h2
            className="text-2xl font-medium tracking-tight"
            style={{ color: "#FF6A00" }}
          >
            2. How We Use Data
          </h2>

          <p
            className="text-base font-light leading-relaxed"
            style={{ color: "#FF6A00" }}
          >
            Data is processed strictly to provide and improve the Services,
            including:
          </p>

          <ul
            className="space-y-4 pl-6 list-disc text-base font-light"
            style={{ color: "#FF6A00" }}
          >
            <li>Executing autonomous hiring workflows</li>
            <li>Producing structured evaluations and fit scores</li>
            <li>Auditability and explainability of agent decisions</li>
            <li>System reliability, security, and abuse prevention</li>
          </ul>
        </section>

        {/* Section */}
        <section className="space-y-10">
          <h2
            className="text-2xl font-medium tracking-tight"
            style={{ color: "#FF6A00" }}
          >
            3. AI & Automated Processing
          </h2>

          <p
            className="text-base font-light leading-relaxed"
            style={{ color: "#FF6A00" }}
          >
            HRAI uses AI-driven agents to process candidate information and
            generate hiring-related outputs. These systems operate based on
            company-defined standards, not opaque global heuristics.
          </p>

          <p
            className="text-base font-light leading-relaxed"
            style={{ color: "#FF6A00" }}
          >
            Final hiring decisions are always made by humans. HRAI provides
            decision support, not autonomous employment decisions.
          </p>
        </section>

        {/* Section */}
        <section className="space-y-10">
          <h2
            className="text-2xl font-medium tracking-tight"
            style={{ color: "#FF6A00" }}
          >
            4. Data Sharing
          </h2>

          <p
            className="text-base font-light leading-relaxed"
            style={{ color: "#FF6A00" }}
          >
            We do not sell personal data. Data may be shared only with:
          </p>

          <ul
            className="space-y-4 pl-6 list-disc text-base font-light"
            style={{ color: "#FF6A00" }}
          >
            <li>Authorized service providers supporting platform operation</li>
            <li>Customers who own the hiring workflows and candidate data</li>
            <li>Authorities where legally required</li>
          </ul>
        </section>

        {/* Section */}
        <section className="space-y-10">
          <h2
            className="text-2xl font-medium tracking-tight"
            style={{ color: "#FF6A00" }}
          >
            5. Data Retention & Security
          </h2>

          <p
            className="text-base font-light leading-relaxed"
            style={{ color: "#FF6A00" }}
          >
            Data is retained only as long as necessary to provide the Services
            or meet legal obligations. We implement technical and organizational
            safeguards to protect data from unauthorized access.
          </p>
        </section>

        {/* Section */}
        <section className="space-y-10">
          <h2
            className="text-2xl font-medium tracking-tight"
            style={{ color: "#FF6A00" }}
          >
            6. Your Rights
          </h2>

          <p
            className="text-base font-light leading-relaxed"
            style={{ color: "#FF6A00" }}
          >
            Depending on jurisdiction, individuals may have rights to access,
            correct, or delete personal data. Requests should be directed to the
            company controlling the hiring process or to HRAI where applicable.
          </p>
        </section>

        {/* Footer */}
        <footer
          className="pt-16 border-t"
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

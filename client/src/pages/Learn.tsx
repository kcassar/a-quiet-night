import { useDocumentMeta } from "../lib/useDocumentMeta";
import { PageHeader } from "../components/PageHeader";
import { Button } from "../components/Button";
import { DisclaimerBanner } from "../components/DisclaimerBanner";
import { Accordion } from "../components/Accordion";
import { Takeaway } from "../components/Takeaway";
import { TableOfContents } from "../components/TableOfContents";
import { ReadingProgress } from "../components/ReadingProgress";

const TOC = [
  { id: "what-is",   label: "What is sleep apnoea?" },
  { id: "symptoms",  label: "Common symptoms" },
  { id: "types",     label: "Obstructive vs central" },
  { id: "matters",   label: "Why it matters" },
  { id: "doctor",    label: "When to see a doctor" },
  { id: "diagnosis", label: "Diagnosis overview" },
  { id: "treatments",label: "Treatment options" },
  { id: "faq",       label: "FAQ" },
];

export function Learn() {
  useDocumentMeta({
    title: "Sleep apnoea — a plain-English guide",
    description:
      "What sleep apnoea is, common symptoms, obstructive vs central, diagnosis, and treatment options — written without jargon.",
    path: "/learn",
  });

  return (
    <>
      <ReadingProgress />
      <PageHeader title="Sleep apnoea, in plain English" subtitle="A short guide for people who'd rather skip the jargon." />

      <div className="app-content">
        <DisclaimerBanner />

        <div className="with-toc">
          <TableOfContents items={TOC} />

          <article className="article">

            <section id="what-is">
              <h2>What is sleep apnoea?</h2>
              <p>
                Sleep apnoea is a common condition where your breathing repeatedly
                pauses or becomes very shallow during sleep. Each pause can briefly
                reduce the oxygen in your blood and disturb your sleep — usually
                without you remembering it. Over time it can leave you tired
                during the day and put strain on your heart and circulation.
              </p>
              <Takeaway title="In a sentence">
                Sleep apnoea is interrupted breathing during sleep. It's common, treatable, and worth taking seriously.
              </Takeaway>
            </section>

            <section id="symptoms">
              <h2>Common symptoms</h2>
              <ul>
                <li>Loud or interrupted snoring</li>
                <li>Waking up gasping or choking</li>
                <li>Feeling tired even after a long night's sleep</li>
                <li>Morning headaches</li>
                <li>Difficulty concentrating during the day</li>
                <li>Falling asleep easily during quiet activities</li>
                <li>Mood changes or low mood</li>
              </ul>
            </section>

            <section id="types">
              <h2>Obstructive vs central sleep apnoea</h2>
              <p>
                <strong>Obstructive sleep apnoea (OSA)</strong> is the most common form.
                The muscles around the airway relax and the airway physically narrows
                or collapses, blocking airflow.
              </p>
              <p>
                <strong>Central sleep apnoea (CSA)</strong> is less common. The
                breathing pause isn't caused by an airway blockage — instead the
                brain briefly stops sending the signal to breathe. CSA is treated
                differently and should always be assessed by a clinician.
              </p>
              <p>Many people have a mix of both.</p>
            </section>

            <section id="matters">
              <h2>Why untreated sleep apnoea matters</h2>
              <p>
                Long-term untreated sleep apnoea is associated with higher blood
                pressure, increased risk of heart disease and stroke, type 2
                diabetes, daytime fatigue, and an increased risk of road accidents
                from drowsy driving. The good news: it's treatable, and treatment
                usually works well.
              </p>
            </section>

            <section id="doctor">
              <h2>When to speak to a doctor</h2>
              <p>
                Speak to your GP or a sleep clinic if you (or your bed partner)
                notice any of the symptoms above, especially loud snoring with
                breathing pauses. Don't try to self-diagnose from a home gadget —
                a proper sleep study gives a much clearer picture.
              </p>
              <Takeaway title="Quick rule of thumb">
                Witnessed pauses, gasping, or choking + persistent daytime tiredness = ask for a referral.
              </Takeaway>
            </section>

            <section id="diagnosis">
              <h2>Diagnosis overview</h2>
              <p>Diagnosis usually involves a sleep study. There are two main types:</p>
              <ul>
                <li>
                  <strong>Home sleep test:</strong> a small device worn at home for one or two nights to record breathing, oxygen and movement.
                </li>
                <li>
                  <strong>In-lab polysomnography:</strong> a more detailed overnight study in a sleep lab when more information is needed.
                </li>
              </ul>
              <p>
                The result is usually expressed as an AHI (Apnoea-Hypopnoea Index) — see the glossary on the resources page.
              </p>
            </section>

            <section id="treatments">
              <h2>Treatment options</h2>
              <p>The right treatment depends on your diagnosis. Common options:</p>
              <ul>
                <li>
                  <strong>CPAP / APAP / BiPAP:</strong> a machine that gently keeps the airway open with pressurised air via a mask. The first-line treatment for moderate-to-severe OSA.
                </li>
                <li>
                  <strong>Mandibular advancement device (MAD):</strong> a custom mouthpiece that holds the lower jaw forward. Often used for milder OSA or when CPAP isn't tolerated.
                </li>
                <li>
                  <strong>Weight management:</strong> evidence suggests weight loss can reduce AHI for many people with OSA. Plan it with your GP, not alone.
                </li>
                <li>
                  <strong>Sleep position:</strong> some people experience apnoea mostly when sleeping on their back; positional therapy can help.
                </li>
                <li>
                  <strong>Surgery:</strong> a clinician-led option in specific cases (e.g. anatomical issues, hypoglossal nerve stimulation). Always discuss with a specialist.
                </li>
              </ul>
            </section>

            <section id="faq">
              <h2>FAQ</h2>
              <Accordion title="Does sleep apnoea always need treatment?">
                <p>Most diagnosed cases benefit from treatment. Whether and how is a clinical decision based on your AHI, symptoms and health risks.</p>
              </Accordion>
              <Accordion title="Is CPAP forever?">
                <p>Often yes, but not always. Weight loss, dental devices and positional therapy can reduce or replace the need in some cases.</p>
              </Accordion>
              <Accordion title="Can I drink alcohol with sleep apnoea?">
                <p>Alcohol relaxes the airway and tends to make sleep apnoea worse — even when treated. Many people see worse CPAP data on nights they've had alcohol close to bedtime.</p>
              </Accordion>
              <Accordion title="Is my partner's snoring sleep apnoea?">
                <p>Snoring alone isn't sleep apnoea, but witnessed pauses, gasping or choking are good reasons to ask a GP for a referral.</p>
              </Accordion>
            </section>

            <div className="card mt-8" style={{
              background: "linear-gradient(140deg, color-mix(in srgb, var(--accent-blue) 14%, var(--surface)), var(--surface))",
            }}>
              <h3 style={{ marginBottom: "var(--space-2)" }}>Next step</h3>
              <p className="muted">If you (or your partner) recognise symptoms here, the next move is talking to your GP about a sleep study referral. If you already have a CPAP machine, the beginner guide is the natural next read.</p>
              <div className="btn-row mt-3">
                <Button to="/cpap-guide" variant="primary">Read the CPAP guide</Button>
                <Button to="/resources" variant="secondary">Open the resources</Button>
              </div>
            </div>

          </article>
        </div>
      </div>
    </>
  );
}

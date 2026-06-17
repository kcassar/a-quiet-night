import { useDocumentMeta } from "../lib/useDocumentMeta";
import { PageHeader } from "../components/PageHeader";
import { Button } from "../components/Button";
import { DisclaimerBanner } from "../components/DisclaimerBanner";
import { Accordion } from "../components/Accordion";
import { Takeaway } from "../components/Takeaway";
import { TableOfContents } from "../components/TableOfContents";
import { ReadingProgress } from "../components/ReadingProgress";

const TOC = [
  { id: "what-cpap-does", label: "What CPAP does" },
  { id: "modes",          label: "CPAP vs APAP vs BiPAP" },
  { id: "masks",          label: "Mask types" },
  { id: "month-one",      label: "First-month problems" },
  { id: "cleaning",       label: "Cleaning" },
  { id: "travel",         label: "Travel" },
  { id: "clinic",         label: "Questions for your clinic" },
];

export function CpapGuide() {
  useDocumentMeta({
    title: "CPAP beginner guide",
    description:
      "Plain-English help for new CPAP users — masks, common first-month problems, cleaning, travel, and questions to take to your sleep clinic.",
    path: "/cpap-guide",
  });

  return (
    <>
      <ReadingProgress />
      <PageHeader title="CPAP beginner guide" subtitle="The first month is the hardest. Here's what helps." />

      <div className="app-content">
        <DisclaimerBanner />

        <div className="with-toc">
          <TableOfContents items={TOC} />
          <article className="article">

            <section id="what-cpap-does">
              <h2>What CPAP does</h2>
              <p>
                CPAP stands for <em>Continuous Positive Airway Pressure</em>. The
                machine gently blows pressurised air through a mask, keeping your
                airway open while you sleep. It doesn't push air into your lungs —
                it acts as a soft splint that prevents the airway from collapsing.
              </p>
              <Takeaway title="Mental model">
                CPAP is a splint, not a ventilator. It opens the airway; you do the breathing.
              </Takeaway>
            </section>

            <section id="modes">
              <h2>CPAP vs APAP vs BiPAP</h2>
              <ul>
                <li><strong>CPAP:</strong> one fixed pressure all night.</li>
                <li><strong>APAP (Auto-CPAP):</strong> the machine adjusts pressure within a clinician-set range, going up only when it detects events.</li>
                <li><strong>BiPAP / BiLevel:</strong> two pressures — a higher one for breathing in and a lower one for breathing out. Used for specific clinical needs.</li>
              </ul>
              <p className="muted">Your clinic chooses the mode based on your sleep study. We won't suggest you change it.</p>
            </section>

            <section id="masks">
              <h2>Mask types</h2>
              <h3>Nasal mask</h3>
              <p>Covers the nose only. A solid all-rounder for nose-breathers; allows higher pressures than nasal pillows.</p>
              <h3>Nasal pillows</h3>
              <p>Two small silicone "pillows" sit just inside the nostrils. Minimal, light, often easier for side sleepers — but can feel intense at high pressures.</p>
              <h3>Full face mask</h3>
              <p>Covers the nose and mouth. The right choice if you're a mouth breather, have allergies, or struggle with a blocked nose.</p>
              <Takeaway>
                Mask choice is personal. Ask your clinic to fit a few — small fit differences make a big difference at night.
              </Takeaway>
            </section>

            <section id="month-one">
              <h2>Common first-month problems</h2>
              <Accordion title="Mask leaks" defaultOpen>
                <p>Often a fit issue — wrong size, headgear too loose or too tight, or a worn cushion. Try adjusting in small steps with the machine on and pressure flowing.</p>
              </Accordion>
              <Accordion title="Dry mouth">
                <p>Most often due to mouth breathing. A heated humidifier, a chinstrap, or switching to a full face mask are common conversations to have with your clinic.</p>
              </Accordion>
              <Accordion title="Blocked nose">
                <p>Speak to your GP about treatable causes (allergies, polyps). Saline rinses help many people. A blocked nose makes nasal masks miserable.</p>
              </Accordion>
              <Accordion title="Pressure discomfort">
                <p>Most machines have a "ramp" feature that starts at a lower pressure and gradually increases. Your clinic can advise on expiratory relief settings if needed.</p>
              </Accordion>
              <Accordion title="Rainout (water in the hose)">
                <p>Caused by air cooling in the tube and condensing. Heated tubing or a tube cover usually fixes it.</p>
              </Accordion>
              <Accordion title="Removing the mask during sleep">
                <p>Very common at first. Often improves once mask comfort is solved. A bedside routine and a reminder to put it back on if you wake can help.</p>
              </Accordion>
              <Accordion title="Skin marks and irritation">
                <p>Usually a sign the mask is too tight or the wrong size. Mask liners can also help. Don't wash the cushion with harsh detergents.</p>
              </Accordion>
            </section>

            <section id="cleaning">
              <h2>Cleaning</h2>
              <ul>
                <li>Wipe the cushion daily with mild soapy water or unscented wipes.</li>
                <li>Wash the mask, headgear and hose weekly in warm soapy water.</li>
                <li>Empty and air-dry the humidifier chamber every day.</li>
                <li>Use distilled water in the humidifier if your tap water is hard.</li>
                <li>Replace filters per the manufacturer's schedule.</li>
              </ul>
              <p className="muted small">Avoid alcohol-based cleaners — they degrade the silicone.</p>
            </section>

            <section id="travel">
              <h2>Travel</h2>
              <ul>
                <li>CPAP machines are not counted as carry-on luggage in most countries.</li>
                <li>Carry the machine in the cabin in a padded case.</li>
                <li>Empty the humidifier before flying.</li>
                <li>Keep a copy of the prescription/letter with the device.</li>
                <li>Use distilled water where you can; tap water is okay short term.</li>
              </ul>
            </section>

            <section id="clinic">
              <h2>Questions for your sleep clinic</h2>
              <ul>
                <li>What pressure range am I currently set to?</li>
                <li>What does my AHI typically look like? Any patterns to watch?</li>
                <li>Is my leak rate okay, or should we change the mask?</li>
                <li>Am I getting central or obstructive events?</li>
                <li>Could a different mode (APAP / BiPAP) be appropriate?</li>
                <li>What is the plan if my therapy stops feeling effective?</li>
              </ul>
              <Takeaway title="Take this list with you">
                Print or screenshot before your next appointment — your time with the clinic is short, and a list keeps it focused.
              </Takeaway>
            </section>

            <div className="card mt-8" style={{
              background: "linear-gradient(140deg, color-mix(in srgb, var(--accent-peach) 16%, var(--surface)), var(--surface))",
            }}>
              <h3 style={{ marginBottom: "var(--space-2)" }}>Ready to look at your data?</h3>
              <p className="muted">Upload a ZIP from your CPAP SD card or an OSCAR export and we'll produce a clean dashboard you can take to your clinic.</p>
              <div className="btn-row mt-3">
                <Button to="/my-data/upload" variant="primary">Upload CPAP data</Button>
              </div>
            </div>

          </article>
        </div>
      </div>
    </>
  );
}

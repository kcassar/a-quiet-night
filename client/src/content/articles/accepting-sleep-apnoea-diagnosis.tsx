import { Link } from "react-router-dom";
import { Takeaway } from "../../components/Takeaway";
import type { ArticleMeta } from "./types";

// Article: "Accepting You Have Sleep Apnoea"
// First seeded article on the new Articles hub. Plain-English emotional
// guide for the first weeks after diagnosis.

export const meta: ArticleMeta = {
  slug: "accepting-sleep-apnoea-diagnosis",
  title: "Accepting you have sleep apnoea",
  description:
    "A calm, plain-English guide for the first few weeks after a sleep apnoea diagnosis. What to expect, what nobody tells you, and how acceptance usually begins.",
  summary:
    "A diagnosis can feel heavy at first. Here is what most people search for, worry about, and quietly feel in the first few weeks of CPAP therapy.",
  category: "Sleep Apnoea",
  tags: ["newly diagnosed", "first weeks", "emotional", "adjustment"],
  publishedAt: "2026-05-15",
  readingMinutes: 9,
  featured: true,
  toc: [
    { id: "emotional-side",       label: "The emotional side" },
    { id: "first-realisation",    label: "The first realisation" },
    { id: "what-you-look-for",    label: "What you start looking for" },
    { id: "first-purchases",      label: "Your first purchases" },
    { id: "obsession-phase",      label: "The obsession phase" },
    { id: "talking-to-partner",   label: "Talking to your partner" },
    { id: "first-good-morning",   label: "The first good morning" },
    { id: "what-to-do-next",      label: "What to do next" },
    { id: "final-thoughts",       label: "Final thoughts" },
  ],
};

export default function AcceptingSleepApnoeaArticle() {
  return (
    <>
      <p>You walk into the appointment expecting a conversation about snoring.</p>

      <p>Maybe stress. Maybe weight. Maybe getting older.</p>

      <p>Instead, the doctor looks at the report and says:</p>

      <blockquote>
        "You have severe sleep apnoea. You need CPAP therapy. You will need to use the machine every night."
      </blockquote>

      <p>And suddenly everything changes.</p>

      <p>
        You are forty. You work. You drive. You have responsibilities. You thought you were tired
        because life is busy. You did not expect to leave the appointment with a prescription for
        a machine that attaches to your face while you sleep.
      </p>

      <p>For many people, that moment feels surreal.</p>

      <p>Some feel embarrassed. Some panic. Some get angry. Some immediately start searching:</p>

      <ul>
        <li>"Will I need this forever?"</li>
        <li>"Will my partner still find me attractive?"</li>
        <li>"What if I can't sleep with it?"</li>
        <li>"What even is an AHI?"</li>
        <li>"How much is this going to cost?"</li>
        <li>"Do I really have to wear this every day?"</li>
      </ul>

      <p>If this sounds familiar, you are not alone.</p>

      <p>The first thing to understand is this. Sleep apnoea is common. Very common.</p>

      <p>
        Many people live with it for years before diagnosis. They normalise exhaustion, brain fog,
        headaches, irritability, poor concentration, and falling asleep on the sofa. Some only
        realise how bad things were after treatment starts.
      </p>

      <p>The shock is real. So is the improvement many people eventually feel.</p>

      <section id="emotional-side">
        <h2>The emotional side nobody talks about</h2>

        <p>When you first hear "severe sleep apnoea", your brain often goes into problem mode.</p>

        <p>
          You start researching everything at once. Machines, masks, tubes, humidifiers, distilled
          water, cleaning wipes, pressure settings, OSCAR software, mouth tape, chin straps, heated
          hoses. It quickly becomes overwhelming.
        </p>

        <p>You also start noticing something else. Sleep suddenly becomes medical.</p>

        <p>
          Your bedroom changes from a place of rest into a place with equipment, routines,
          settings, and maintenance. That can be difficult to accept emotionally, especially if
          you have always seen yourself as healthy or independent.
        </p>

        <p>Some people quietly grieve the idea of "normal sleep".</p>

        <p>That feeling passes with time.</p>

        <p>
          Because eventually, the machine stops feeling like a symbol of illness and starts feeling
          like something else.
        </p>

        <Takeaway>Relief.</Takeaway>
      </section>

      <section id="first-realisation">
        <h2>The first realisation</h2>

        <p>The machine is not the punishment.</p>

        <p>The untreated sleep apnoea was.</p>

        <p>That shift in thinking matters.</p>

        <p>Without treatment, severe sleep apnoea can affect:</p>

        <ul>
          <li>Blood pressure</li>
          <li>Heart health</li>
          <li>Mood</li>
          <li>Energy</li>
          <li>Memory</li>
          <li>Hormonal balance</li>
          <li>Weight management</li>
          <li>Driving safety</li>
          <li>Relationships</li>
        </ul>

        <p>
          You may have spent years running on poor sleep without realising how much it affected
          your day-to-day life.
        </p>

        <p>Many CPAP users describe the same moment a few weeks later:</p>

        <blockquote>"I didn't realise how exhausted I actually was."</blockquote>
      </section>

      <section id="what-you-look-for">
        <h2>What you start looking for</h2>

        <p>
          Once the diagnosis settles in, most people begin searching for the same practical things.
          Not advanced optimisation. Just basic survival questions.
        </p>

        <h3>Which CPAP machine should I buy?</h3>

        <p>This becomes the first obsession.</p>

        <p>
          You compare models for hours. You watch YouTube reviews late into the night. Suddenly
          you know more about humidifiers and airflow algorithms than you ever wanted to.
        </p>

        <p>Most people end up looking for:</p>

        <ul>
          <li>Quiet operation</li>
          <li>Easy cleaning</li>
          <li>Automatic pressure adjustment (APAP)</li>
          <li>Good humidification</li>
          <li>Data tracking support</li>
          <li>Comfort features</li>
          <li>Reliable warranty and support</li>
        </ul>

        <p>Machines from companies like ResMed and Philips are often the first names people encounter.</p>

        <p>Then comes the second major discovery. The mask matters almost more than the machine.</p>

        <h3>Finding a mask you can actually tolerate</h3>

        <p>This is where many people struggle early on.</p>

        <p>
          You imagine one giant uncomfortable hospital mask. In reality, there are several styles.
        </p>

        <p>
          <strong>Nasal pillows.</strong> Small inserts that sit under the nostrils. Good for less
          bulk, side sleepers, and people who feel claustrophobic. Less good for mouth breathing.
        </p>

        <p>
          <strong>Nasal masks.</strong> Cover only the nose. A common middle ground.
        </p>

        <p>
          <strong>Full-face masks.</strong> Cover the nose and mouth. Often needed if you breathe
          through your mouth, have nasal blockage, or use higher pressures.
        </p>

        <p>
          Most new users underestimate how personal mask comfort is. The "best" mask online may
          be terrible for you specifically.
        </p>

        <p>You often go through:</p>

        <ul>
          <li>Air leaks</li>
          <li>Skin irritation</li>
          <li>Dry mouth</li>
          <li>Strap marks</li>
          <li>Feeling claustrophobic</li>
          <li>Pulling the mask off during sleep</li>
        </ul>

        <p>This is normal. Very few people become comfortable immediately.</p>

        <h3>Looking for reassurance online</h3>

        <p>After diagnosis, many people quietly start searching forums and Reddit at 2am.</p>

        <p>
          Not because they want technical data. Because they want proof that someone else survived
          the adjustment period.
        </p>

        <p>You start searching things like:</p>

        <ul>
          <li>"Does CPAP get easier?"</li>
          <li>"Can't tolerate CPAP"</li>
          <li>"First week CPAP horrible"</li>
          <li>"CPAP anxiety"</li>
          <li>"Can't sleep with mask"</li>
        </ul>

        <p>And this is where expectations matter.</p>

        <p>
          The first few nights can genuinely be difficult. You may sleep worse initially. You may
          wake up more often. You may feel frustrated and emotional.
        </p>

        <p>
          That does not mean treatment is failing. It means your brain and body are adapting to
          sleeping differently.
        </p>
      </section>

      <section id="first-purchases">
        <h2>Your first purchases usually look like this</h2>

        <p>
          Based on typical new-user checklists, most people begin building a small setup around the
          machine itself.
        </p>

        <p>Common early purchases include:</p>

        <ul>
          <li>A CPAP machine with humidifier</li>
          <li>One or two mask styles</li>
          <li>Replacement filters</li>
          <li>Distilled water for humidification</li>
          <li>CPAP wipes or gentle soap</li>
          <li>Hose holder or hose cover</li>
          <li>Travel bag</li>
          <li>Backup mask cushions</li>
          <li>Cleaning supplies</li>
        </ul>

        <p>Later, some people also explore:</p>

        <ul>
          <li>Heated hoses</li>
          <li>Chin straps</li>
          <li>CPAP pillows</li>
          <li>Battery backups for travel</li>
          <li>SD cards for detailed sleep data tracking</li>
        </ul>

        <p>At first this can feel excessive. Then you realise something important.</p>

        <Takeaway>
          You are building a system that helps you breathe properly for nearly one third of your life.
        </Takeaway>
      </section>

      <section id="obsession-phase">
        <h2>The obsession phase</h2>

        <p>
          Many newly diagnosed people go through a phase where sleep apnoea becomes their entire
          personality for a few weeks.
        </p>

        <p>
          You read every forum. You watch every review. You check your AHI constantly. You learn
          pressure terminology. You compare leak rates. You analyse sleep scores every morning.
        </p>

        <p>That phase is understandable. You are trying to regain control.</p>

        <p>
          Eventually, most people settle into a healthier rhythm where the machine simply becomes
          part of their nightly routine. Like brushing teeth, or charging a phone.
        </p>
      </section>

      <section id="talking-to-partner">
        <h2>Talking to your partner</h2>

        <p>This is another hidden anxiety. Many newly diagnosed people worry:</p>

        <ul>
          <li>"Will this make me unattractive?"</li>
          <li>"Will the machine ruin intimacy?"</li>
          <li>"Will the noise bother them?"</li>
        </ul>

        <p>Ironically, many partners are relieved.</p>

        <p>
          Why? Because untreated sleep apnoea often means loud snoring, choking sounds,
          restlessness, exhaustion, irritability, and sometimes sleeping in separate rooms.
        </p>

        <p>
          Many couples end up sleeping better after treatment starts. And modern CPAP machines are
          much quieter than people expect.
        </p>
      </section>

      <section id="first-good-morning">
        <h2>The first good morning</h2>

        <p>For some people it happens in days. For others it takes months.</p>

        <p>
          But many CPAP users eventually experience a strange morning where they wake up and realise:
        </p>

        <ul>
          <li>Their head feels clearer</li>
          <li>They are less irritable</li>
          <li>They are not fighting sleep in the afternoon</li>
          <li>They did not wake up ten times overnight</li>
          <li>They actually dreamed again</li>
        </ul>

        <p>That moment matters.</p>

        <p>Because that is often when acceptance begins.</p>

        <p>
          Not when the doctor gives the diagnosis. Not when the machine arrives. But when your
          body finally experiences proper sleep again.
        </p>
      </section>

      <section id="what-to-do-next">
        <h2>What to do next</h2>

        <p>If you were recently diagnosed, focus on small wins. Not perfection.</p>

        <h3>In your first month</h3>

        <ul>
          <li>Use the machine every night, even if imperfectly</li>
          <li>Prioritise comfort over optimisation</li>
          <li>Try different masks if needed</li>
          <li>Use humidification if you get dryness</li>
          <li>Give yourself time to adapt</li>
          <li>Speak to your clinician before changing pressures</li>
          <li>Track patterns, not single bad nights</li>
        </ul>

        <p>Most importantly, do not judge CPAP therapy based on the first few nights.</p>

        <p>Very few people love it immediately.</p>

        <p>But many people later say the same thing:</p>

        <blockquote>"I wish I had started years earlier."</blockquote>
      </section>

      <section id="final-thoughts">
        <h2>Final thoughts</h2>

        <p>
          A sleep apnoea diagnosis can feel heavy at first. Especially when you are suddenly told
          that a machine is now part of your everyday life.
        </p>

        <p>
          But over time, many people stop seeing CPAP as a reminder of illness and start seeing it
          as something else.
        </p>

        <p>Support. Better sleep. Better mornings. More energy. More patience. More life.</p>

        <p>
          A Quiet Night exists to help people understand sleep apnoea without panic, jargon, or
          shame. You are adapting to a medical condition shared by millions of people. That
          adjustment takes time.
        </p>

        <p className="muted small" style={{ marginTop: "var(--space-6)" }}>
          If you are looking for the practical side of CPAP therapy, the{" "}
          <Link to="/cpap-therapy">CPAP Therapy section</Link> is built for the first few weeks.
          If you have not been diagnosed yet and want to understand what sleep apnoea actually is,
          start with the <Link to="/learn">Learn section</Link>.
        </p>
      </section>
    </>
  );
}

import { getCurrentUser, dashboardPathFor } from '@/lib/auth';
import LinkButton from '@/components/LinkButton/LinkButton';
import styles from './page.module.css';

const PURPOSE = [
  { title: 'Discover scholarships', text: 'See the scholarships and grants you may qualify for as a UA student.' },
  { title: 'Understand the requirements', text: 'Review eligibility rules and the documents you need before you apply.' },
  { title: 'Apply for financial assistance', text: 'Submit your application online and follow its status until a decision is made.' },
];

export default async function HomePage() {
  const current = await getCurrentUser();

  return (
    <>
      <section className={styles.hero}>
        <div className={styles.heroGlow} aria-hidden="true" />
        <div className={`container ${styles.heroInner}`}>
          <span className={styles.eyebrow}>University of the Assumption · UA Scholar</span>
          <h1 className={styles.heroTitle}>
            Your education, <span className={styles.highlight}>supported.</span>
          </h1>
          <p className={styles.heroText}>
            UA Scholar is the scholarship portal of the University of the Assumption. It helps eligible students
            discover scholarships, understand their requirements, and apply for financial assistance online.
          </p>
          <div className={styles.heroActions}>
            {current ? (
              <LinkButton href={dashboardPathFor(current.profile.role)} variant="secondary" size="lg">Go to my dashboard</LinkButton>
            ) : (
              <>
                <LinkButton href="/login" variant="secondary" size="lg">Log in</LinkButton>
                <LinkButton href="/register" variant="ghost" size="lg">Register</LinkButton>
              </>
            )}
          </div>
        </div>
      </section>

      <section className={`container ${styles.section}`} aria-labelledby="about-title">
        <div className={styles.about}>
          <div className={styles.aboutText}>
            <span className={styles.kicker}>About the university</span>
            <h2 id="about-title" className={styles.sectionTitle}>University of the Assumption</h2>
            <p>
              Founded in 1963 in the City of San Fernando, Pampanga, the University of the Assumption is the first
              archdiocesan Catholic university in Asia. It is committed to forming competent, compassionate and
              Christ-centered graduates who serve their communities.
            </p>
          </div>

          <div className={styles.purpose}>
            <h3 className={styles.purposeTitle}>What UA Scholar helps you do</h3>
            <ul className={styles.purposeList}>
              {PURPOSE.map((item) => (
                <li key={item.title}>
                  <strong>{item.title}</strong>
                  <span>{item.text}</span>
                </li>
              ))}
            </ul>
            {!current && (
              <p className={styles.purposeNote}>Log in or create an account to view the available scholarships.</p>
            )}
          </div>
        </div>
      </section>
    </>
  );
}

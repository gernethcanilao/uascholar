import { getCurrentUser, dashboardPathFor } from '@/lib/auth';
import LinkButton from '@/components/LinkButton/LinkButton';
import styles from './page.module.css';

const HIGHLIGHTS = [
  {
    title: 'Catholic education',
    text: 'The first archdiocesan Catholic university in Asia, forming students in faith, excellence and service.',
  },
  {
    title: 'Grade school to graduate school',
    text: 'Grade School, Junior High School, Senior High School, College and Graduate School programs in one campus.',
  },
  {
    title: 'Colleges and schools',
    text: 'Accountancy, Business, Education, Engineering and Architecture, Hospitality and Tourism, Information Technology, Nursing and Pharmacy, and Arts and Sciences.',
  },
];

export default async function HomePage() {
  const current = await getCurrentUser();

  return (
    <>
      <section className={styles.hero}>
        <div className="container">
          <h1 className={styles.heroTitle}>Welcome to the University of the Assumption</h1>
          <p className={styles.heroText}>
            UA Scholar is the official scholarship and grant portal of the University of the Assumption
            in the City of San Fernando, Pampanga. UA students can log in with their university account
            to view scholarships, apply online and track their applications.
          </p>
          <div className={styles.heroActions}>
            {current ? (
              <LinkButton href={dashboardPathFor(current.profile.role)} variant="secondary">Go to dashboard</LinkButton>
            ) : (
              <LinkButton href="/login" variant="secondary">Log in with your UA account</LinkButton>
            )}
          </div>
        </div>
      </section>

      <section className={`container ${styles.section}`}>
        <div className={styles.grid}>
          {HIGHLIGHTS.map((item) => (
            <article key={item.title} className={styles.card}>
              <h2 className={styles.cardTitle}>{item.title}</h2>
              <p className={styles.cardText}>{item.text}</p>
            </article>
          ))}
        </div>

        <h2 className={styles.sectionTitle}>About the University</h2>
        <p className={styles.about}>
          The University of the Assumption (UA) is a Catholic university of the Archdiocese of San Fernando,
          Pampanga. It offers basic education, undergraduate and graduate programs, and supports deserving
          students through scholarships and grants administered by the university.
        </p>
      </section>
    </>
  );
}

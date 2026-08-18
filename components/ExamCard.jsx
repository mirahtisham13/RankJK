import Link from 'next/link';
import { CONDUCTING_BODY_COLORS } from '@/lib/constants';

const BODY_ICONS = {
  JKSSB: '🏛️',
  JKPSC: '⚖️',
  SSC: '📋',
  UPSC: '🇮🇳',
  OTHER: '📝',
};

export default function ExamCard({ exam }) {
  const body = exam.conducting_body || 'OTHER';
  const colors = CONDUCTING_BODY_COLORS[body] || CONDUCTING_BODY_COLORS.OTHER;
  const icon = BODY_ICONS[body] || '📝';
  const postCount = exam.posts?.[0]?.count || 0;

  return (
    <Link href={`/predict/${exam.id}`} className="exam-card">
      <div className="exam-card-body">
        <div className="exam-card-header">
          <div className="exam-icon" style={{ background: colors.bg }}>
            {icon}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="exam-meta">
              <span
                className="badge"
                style={{
                  background: `${colors.accent}20`,
                  color: colors.accent,
                  border: `1px solid ${colors.accent}40`,
                  fontSize: '0.7rem',
                }}
              >
                {colors.text}
              </span>
            </div>
          </div>
        </div>

        <h3>{exam.name}</h3>
        <p>{exam.description || `${body} recruitment examination`}</p>

        <div className="exam-card-footer">
          <div className="exam-meta">
            {exam.total_vacancies && (
              <span className="badge badge-blue">
                {exam.total_vacancies.toLocaleString()} vacancies
              </span>
            )}
            <span className="badge badge-gray">
              {typeof postCount === 'number' ? postCount : exam.posts?.length || 0} posts
            </span>
          </div>
          <span style={{
            fontSize: '0.8rem', color: 'var(--text-accent)', fontWeight: 600,
            display: 'flex', alignItems: 'center', gap: '4px'
          }}>
            View Cutoff →
          </span>
        </div>
      </div>
    </Link>
  );
}

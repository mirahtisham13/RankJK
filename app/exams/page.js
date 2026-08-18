'use client';
import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ExamCard from '@/components/ExamCard';
import { getExams } from '@/lib/db';
import { CONDUCTING_BODIES } from '@/lib/constants';

function ExamsContent() {
  const searchParams = useSearchParams();
  const initialBody = searchParams.get('body') || 'ALL';

  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState(initialBody);
  const [search, setSearch] = useState('');

  useEffect(() => {
    getExams().then(data => {
      setExams(data || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const filtered = exams.filter(e => {
    const matchBody = filter === 'ALL' || e.conducting_body === filter;
    const matchSearch = !search || e.name.toLowerCase().includes(search.toLowerCase());
    return matchBody && matchSearch;
  });

  return (
    <>
      <div className="page-title">
        <h1>Browse All <span className="text-gradient">Exams</span></h1>
        <p>Select an exam to see real-time cutoff predictions based on community data</p>
      </div>

      {/* Search + Filter */}
      <div style={{ display: 'flex', gap: '16px', marginBottom: '32px', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ flex: '1', minWidth: '220px' }}>
          <input
            type="text"
            className="form-input"
            placeholder="🔍 Search exams..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {['ALL', ...CONDUCTING_BODIES].map(b => (
            <button
              key={b}
              className={`btn btn-sm ${filter === b ? 'btn-secondary' : 'btn-ghost'}`}
              onClick={() => setFilter(b)}
            >
              {b}
            </button>
          ))}
        </div>
      </div>

      {/* Results count */}
      <div style={{ marginBottom: '20px', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
        {!loading && `${filtered.length} exam${filtered.length !== 1 ? 's' : ''} found`}
      </div>

      {loading ? (
        <div className="grid-3">
          {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="skeleton skeleton-card" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🔍</div>
          <h3>No exams found</h3>
          <p>Try adjusting your search or filter.</p>
        </div>
      ) : (
        <div className="grid-3">
          {filtered.map(exam => <ExamCard key={exam.id} exam={exam} />)}
        </div>
      )}
    </>
  );
}

export default function ExamsPage() {
  return (
    <>
      <Navbar />
      <main className="page-wrapper">
        <div className="container">
          <Suspense fallback={<div className="skeleton skeleton-title" />}>
            <ExamsContent />
          </Suspense>
        </div>
      </main>
      <Footer />
    </>
  );
}

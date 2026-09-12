import { formatCount } from '../../utils/formatNumber'
import { TraceStatCard } from './TraceStatCard'

export const TraceStats = ({ stats, loading, error }) => {
  const cards = [
    {
      icon: 'doc',
      label: 'Total Traces',
      value: formatCount(stats.totalTraces),
      tone: 'blue',
    },
    {
      icon: 'check',
      label: 'Successful Traces',
      value: formatCount(stats.successfulTraces),
      tone: 'green',
      meta: `${stats.successRate}%`,
    },
    {
      icon: 'warning',
      label: 'Error Traces',
      value: formatCount(stats.errorTraces),
      tone: 'red',
      meta: `${stats.errorRate}%`,
    },
    {
      icon: 'clock',
      label: 'Avg. Duration',
      value: `${formatCount(stats.averageDuration)} ms`,
      tone: 'blue',
    },
  ]

  return (
    <section className="stats-grid" aria-label="Trace summary">
      {cards.map((card) => (
        <TraceStatCard key={card.label} {...card} loading={loading} error={error} />
      ))}
    </section>
  )
}

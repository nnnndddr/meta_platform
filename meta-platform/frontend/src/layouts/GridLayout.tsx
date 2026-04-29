import { Empty } from 'antd'
import type { LayoutProps } from '@/registries/layoutRegistry'
import { RecordCard } from '@/components/RecordCard'

export function GridLayout({ meta, records, onRecordClick }: LayoutProps) {
  if (!records.length) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 60 }}>
        <Empty description="No records yet" />
      </div>
    )
  }

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
      gap: 12,
      overflow: 'auto',
      height: '100%',
      alignContent: 'start',
    }}>
      {records.map((record) => (
        <RecordCard
          key={record.id}
          record={record}
          meta={meta}
          onClick={() => onRecordClick(record)}
        />
      ))}
    </div>
  )
}

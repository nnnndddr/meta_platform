import { Table, Empty } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import type { LayoutProps } from '@/registries/layoutRegistry'
import type { EntityRecord } from '@/types/meta'
import { FieldRenderer } from '@/renderers/FieldRenderer'

export function TableLayout({ meta, records, onRecordClick }: LayoutProps) {
  const columns: ColumnsType<EntityRecord> = meta.fields.map((field) => ({
    key: field.name,
    title: field.label,
    width: field['x-ui']?.width ?? undefined,
    render: (_, record) => (
      <FieldRenderer field={field} value={record.data[field.name]} compact />
    ),
  }))

  return (
    <Table<EntityRecord>
      columns={columns}
      dataSource={records}
      rowKey="id"
      size="small"
      pagination={false}
      scroll={{ y: 'calc(100vh - 200px)' }}
      locale={{ emptyText: <Empty description="No records yet" imageStyle={{ height: 40 }} /> }}
      onRow={(record) => ({
        onClick: () => onRecordClick(record),
        style: { cursor: 'pointer' },
      })}
    />
  )
}

import { useEffect, useState } from 'react'
import { Modal, Button, Popconfirm, Space, Typography, Divider, Alert, Form } from 'antd'
import { EditOutlined, DeleteOutlined } from '@ant-design/icons'
import type { EntityMeta, EntityRecord } from '@/types/meta'
import { AttachmentPanel } from '@/components/AttachmentPanel'
import { FormLayout } from '@/layouts/FormLayout'
import { FieldRenderer } from '@/renderers/FieldRenderer'
import { validateForm } from '@/utils/validateField'

export type ModalMode = 'create' | 'view' | 'edit'

interface RecordModalProps {
  meta: EntityMeta
  mode: ModalMode
  record?: EntityRecord
  onClose: () => void
  onSave?: (data: Record<string, unknown>) => Promise<void>
  onEdit?: () => void
  onDelete?: () => void
  isDeleting?: boolean
}

export function RecordModal({ meta, mode, record, onClose, onSave, onEdit, onDelete, isDeleting }: RecordModalProps) {
  const [formData, setFormData] = useState<Record<string, unknown>>({})
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    setError(null)
    setFieldErrors({})
    if (mode === 'create') {
      const defaults: Record<string, unknown> = {}
      meta.fields.forEach((f) => {
        if (f.default !== undefined && f.default !== null) defaults[f.name] = f.default
      })
      setFormData(defaults)
    } else if (record) {
      setFormData({ ...record.data })
    }
  }, [mode, record?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  function handleChange(name: string, value: unknown) {
    setFormData((prev) => ({ ...prev, [name]: value }))
    // Clear error for this field as user types
    setFieldErrors((prev) => { const next = { ...prev }; delete next[name]; return next })
    setError(null)
  }

  async function handleSubmit() {
    if (!onSave) return
    const errors = validateForm(meta.fields, formData)
    if (Object.keys(errors).length) {
      setFieldErrors(errors)
      setError('Please fix the errors below')
      return
    }
    setFieldErrors({})
    setSaving(true)
    setError(null)
    try {
      await onSave(formData)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  const titleField  = meta.fields.find((f) => f.name === 'title') ?? meta.fields[0]
  const recordTitle = (record?.data[titleField?.name ?? ''] as string) || meta.name

  const modalTitle: Record<ModalMode, string> = {
    create: `New ${meta.name}`,
    view: recordTitle,
    edit: `Edit: ${recordTitle}`,
  }

  const footer = (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      {/* Delete */}
      {(mode === 'view' || mode === 'edit') && onDelete ? (
        <Popconfirm
          title="Delete this record?"
          description="This cannot be undone."
          onConfirm={onDelete}
          okText="Delete"
          okButtonProps={{ danger: true, loading: isDeleting }}
          cancelText="Cancel"
        >
          <Button danger icon={<DeleteOutlined />} size="small">Delete</Button>
        </Popconfirm>
      ) : <span />}

      {/* Right side */}
      <Space>
        {mode === 'view' ? (
          <>
            {onEdit && (
              <Button icon={<EditOutlined />} onClick={onEdit} size="small">Edit</Button>
            )}
            <Button onClick={onClose} size="small">Close</Button>
          </>
        ) : (
          <>
            <Button onClick={onClose} size="small">Cancel</Button>
            <Button type="primary" onClick={handleSubmit} loading={saving} size="small">
              {mode === 'create' ? 'Create' : 'Save changes'}
            </Button>
          </>
        )}
      </Space>
    </div>
  )

  return (
    <Modal
      open
      title={
        <div>
          <Typography.Text type="secondary" style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block' }}>
            {meta.name}
          </Typography.Text>
          <span>{modalTitle[mode]}</span>
        </div>
      }
      onCancel={onClose}
      footer={footer}
      width={560}
      styles={{ body: { maxHeight: '65vh', overflowY: 'auto', padding: '16px 24px' } }}
    >
      {error && <Alert type="error" message={error} style={{ marginBottom: 16 }} showIcon />}

      {mode === 'view' && record ? (
        <>
          <ViewBody meta={meta} record={record} />
          {meta.allow_attachments && (
            <>
              <Divider style={{ margin: '16px 0' }} />
              <AttachmentPanel entityId={meta.id} recordId={record.id} />
            </>
          )}
        </>
      ) : (
        <>
          <FormLayout fields={meta.fields} data={formData} onChange={handleChange} errors={fieldErrors} />
          {mode === 'edit' && record && meta.allow_attachments && (
            <>
              <Divider style={{ margin: '16px 0' }} />
              <AttachmentPanel entityId={meta.id} recordId={record.id} />
            </>
          )}
        </>
      )}
    </Modal>
  )
}

function ViewBody({ meta, record }: { meta: EntityMeta; record: EntityRecord }) {
  return (
    <div>
      {meta.fields.map((field, i) => {
        const value = record.data[field.name]
        const empty = value === undefined || value === null || value === '' ||
          (Array.isArray(value) && value.length === 0)

        return (
          <div key={field.name}>
            {i > 0 && <Divider style={{ margin: '10px 0' }} />}
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <Typography.Text type="secondary" style={{ fontSize: 12, width: 120, flexShrink: 0, paddingTop: 2 }}>
                {field.label}
              </Typography.Text>
              <div style={{ flex: 1, minWidth: 0 }}>
                {empty
                  ? <Typography.Text type="secondary">—</Typography.Text>
                  : <FieldRenderer field={field} value={value} />}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

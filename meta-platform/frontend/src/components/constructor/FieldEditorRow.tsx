import { useEffect, useRef, useState } from 'react'
import { Card, Input, Select, Checkbox, Button, Space, Typography, InputNumber, Collapse, Divider } from 'antd'
import { DeleteOutlined } from '@ant-design/icons'
import type { FieldMeta, FieldType, FieldConstraints, XUIHints } from '@/types/meta'

const FIELD_TYPES: { value: FieldType; label: string }[] = [
  { value: 'text',        label: 'Text' },
  { value: 'textarea',    label: 'Textarea' },
  { value: 'select',      label: 'Select' },
  { value: 'multiselect', label: 'Multi-select' },
  { value: 'date',        label: 'Date' },
  { value: 'user',        label: 'User' },
  { value: 'tags',        label: 'Tags' },
  { value: 'number',      label: 'Number' },
  { value: 'progress',    label: 'Progress' },
  { value: 'checkbox',    label: 'Checkbox' },
]

const BADGE_COLORS = ['gray', 'blue', 'green', 'yellow', 'orange', 'red']

const COLOR_HEX: Record<string, string> = {
  gray:   '#9ca3af',
  blue:   '#3b82f6',
  green:  '#22c55e',
  yellow: '#eab308',
  orange: '#f97316',
  red:    '#ef4444',
}

interface Props {
  field: FieldMeta
  index: number
  onChange: (patch: Partial<FieldMeta>) => void
  onRemove: () => void
}

export function FieldEditorRow({ field, index, onChange, onRemove }: Props) {
  const xui: XUIHints = field['x-ui'] ?? {}

  const [rawOptions, setRawOptions] = useState(() => (field.options ?? []).join('\n'))
  const prevType = useRef(field.type)

  useEffect(() => {
    if (field.type !== prevType.current) {
      prevType.current = field.type
      setRawOptions('')
    }
  }, [field.type])

  function patchXui(patch: Partial<XUIHints>) {
    onChange({ 'x-ui': { ...xui, ...patch } })
  }

  const c = field.constraints ?? {}
  function patchC(patch: Partial<FieldConstraints>) {
    const next = { ...c, ...patch }
    // Remove undefined keys so we don't store empty constraints
    const cleaned = Object.fromEntries(
      Object.entries(next).filter(([, v]) => v !== undefined && v !== null && v !== '')
    ) as FieldConstraints
    onChange({ constraints: Object.keys(cleaned).length ? cleaned : undefined })
  }

  function handleOptionsChange(raw: string) {
    setRawOptions(raw)
    onChange({ options: raw.split('\n').map((s) => s.trim()).filter(Boolean) })
  }

  function handleOptionsBlur() {
    const cleaned = rawOptions.split('\n').map((s) => s.trim()).filter(Boolean)
    setRawOptions(cleaned.join('\n'))
    onChange({ options: cleaned })
  }

  const isSelect = field.type === 'select' || field.type === 'multiselect'
  const hasBadge  = isSelect && xui.widget === 'badge'

  return (
    <Card
      size="small"
      style={{ background: '#fafafa' }}
      styles={{ body: { padding: '10px 12px' } }}
      extra={
        <Button
          type="text"
          danger
          icon={<DeleteOutlined />}
          size="small"
          onClick={onRemove}
        />
      }
      title={<Typography.Text type="secondary" style={{ fontSize: 11 }}>Field {index + 1}</Typography.Text>}
    >
      {/* Main row */}
      <Space wrap style={{ width: '100%', marginBottom: 8 }}>
        <Input
          value={field.name}
          placeholder="field_name"
          onChange={(e) => onChange({ name: e.target.value.toLowerCase().replace(/\s+/g, '_') })}
          size="small"
          style={{ width: 140, fontFamily: 'monospace', fontSize: 12 }}
          addonBefore={<Typography.Text type="secondary" style={{ fontSize: 11 }}>#</Typography.Text>}
        />
        <Input
          value={field.label}
          placeholder="Display Label"
          onChange={(e) => onChange({ label: e.target.value })}
          size="small"
          style={{ width: 180 }}
        />
        <Select
          value={field.type}
          onChange={(v) => onChange({ type: v as FieldType, options: [], 'x-ui': {} })}
          options={FIELD_TYPES}
          size="small"
          style={{ width: 140 }}
        />
        <Checkbox
          checked={field.required ?? false}
          onChange={(e) => onChange({ required: e.target.checked })}
        >
          <Typography.Text style={{ fontSize: 12 }}>Required</Typography.Text>
        </Checkbox>
      </Space>

      {/* Type-specific options */}
      <div style={{ paddingLeft: 4, display: 'flex', flexDirection: 'column', gap: 8 }}>

        {/* Placeholder */}
        {(field.type === 'text' || field.type === 'textarea') && (
          <Space size={8} align="center">
            <Typography.Text type="secondary" style={{ fontSize: 12, width: 80 }}>Placeholder</Typography.Text>
            <Input
              value={xui.placeholder ?? ''}
              placeholder="Optional hint"
              onChange={(e) => patchXui({ placeholder: e.target.value || undefined })}
              size="small"
              style={{ width: 220 }}
            />
          </Space>
        )}

        {/* Textarea readonly */}
        {field.type === 'textarea' && (
          <Checkbox
            checked={xui.readonly ?? false}
            onChange={(e) => patchXui({ readonly: e.target.checked || undefined })}
          >
            <Typography.Text style={{ fontSize: 12 }}>Read-only</Typography.Text>
          </Checkbox>
        )}

        {/* Widget toggles */}
        {field.type === 'progress' && (
          <Checkbox
            checked={xui.widget === 'progress-bar'}
            onChange={(e) => patchXui({ widget: e.target.checked ? 'progress-bar' : undefined })}
          >
            <Typography.Text style={{ fontSize: 12 }}>Show as progress bar</Typography.Text>
          </Checkbox>
        )}
        {field.type === 'user' && (
          <Checkbox
            checked={xui.widget === 'avatar'}
            onChange={(e) => patchXui({ widget: e.target.checked ? 'avatar' : undefined })}
          >
            <Typography.Text style={{ fontSize: 12 }}>Show as avatar</Typography.Text>
          </Checkbox>
        )}
        {field.type === 'date' && (
          <Checkbox
            checked={xui.widget === 'date-picker'}
            onChange={(e) => patchXui({ widget: e.target.checked ? 'date-picker' : undefined })}
          >
            <Typography.Text style={{ fontSize: 12 }}>Show as date picker</Typography.Text>
          </Checkbox>
        )}

        {/* Select options */}
        {isSelect && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <Space size={8} align="start">
              <Typography.Text type="secondary" style={{ fontSize: 12, width: 80, paddingTop: 4 }}>Options</Typography.Text>
              <Input.TextArea
                value={rawOptions}
                placeholder={"Option A\nOption B\nOption C"}
                onChange={(e) => handleOptionsChange(e.target.value)}
                onBlur={handleOptionsBlur}
                rows={3}
                style={{ width: 220, fontFamily: 'monospace', fontSize: 12, resize: 'none' }}
              />
            </Space>

            <Checkbox
              checked={xui.widget === 'badge'}
              onChange={(e) => patchXui({
                widget: e.target.checked ? 'badge' : undefined,
                color_map: e.target.checked ? (xui.color_map ?? {}) : undefined,
              })}
            >
              <Typography.Text style={{ fontSize: 12 }}>Show as badge</Typography.Text>
            </Checkbox>

            {hasBadge && (field.options ?? []).length > 0 && (
              <div style={{ paddingLeft: 24, display: 'flex', flexDirection: 'column', gap: 6 }}>
                <Typography.Text type="secondary" style={{ fontSize: 11 }}>Badge colors</Typography.Text>
                {(field.options ?? []).map((opt) => (
                  <Space key={opt} size={6} align="center">
                    <Typography.Text style={{ fontSize: 12, width: 100, display: 'inline-block' }} ellipsis>
                      {opt}
                    </Typography.Text>
                    <Space size={4}>
                      {BADGE_COLORS.map((color) => {
                        const current = xui.color_map?.[opt] ?? 'gray'
                        return (
                          <div
                            key={color}
                            title={color}
                            onClick={() => patchXui({ color_map: { ...xui.color_map, [opt]: color } })}
                            style={{
                              width: 14,
                              height: 14,
                              borderRadius: '50%',
                              backgroundColor: COLOR_HEX[color],
                              cursor: 'pointer',
                              outline: current === color ? `2px solid ${COLOR_HEX[color]}` : 'none',
                              outlineOffset: 2,
                              opacity: current === color ? 1 : 0.5,
                              transition: 'opacity 0.15s',
                            }}
                          />
                        )
                      })}
                    </Space>
                  </Space>
                ))}
              </div>
            )}

            <Checkbox
              checked={xui.kanban_group ?? false}
              onChange={(e) => patchXui({ kanban_group: e.target.checked || undefined })}
            >
              <Typography.Text style={{ fontSize: 12 }}>Use as Kanban group column</Typography.Text>
            </Checkbox>
          </div>
        )}

        {/* ── Constraints ─────────────────────────────────────────────────── */}
        <ConstraintsSection field={field} c={c} patchC={patchC} />
      </div>
    </Card>
  )
}

// ─── Constraints UI ──────────────────────────────────────────────────────────

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <Space size={8} align="center" style={{ width: '100%' }}>
      <Typography.Text type="secondary" style={{ fontSize: 12, width: 90, display: 'inline-block' }}>
        {label}
      </Typography.Text>
      {children}
    </Space>
  )
}

import type React from 'react'

function ConstraintsSection({
  field,
  c,
  patchC,
}: {
  field: FieldMeta
  c: FieldConstraints
  patchC: (p: Partial<FieldConstraints>) => void
}) {
  const { type } = field
  const hasConstraints =
    type === 'text' || type === 'textarea' || type === 'user' ||
    type === 'number' || type === 'progress' ||
    type === 'date' ||
    type === 'multiselect' || type === 'tags'

  if (!hasConstraints) return null

  return (
    <Collapse
      size="small"
      ghost
      style={{ marginTop: 4 }}
      items={[{
        key: 'c',
        label: <Typography.Text type="secondary" style={{ fontSize: 12 }}>Constraints</Typography.Text>,
        children: (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>

            {/* text / textarea / user */}
            {(type === 'text' || type === 'textarea' || type === 'user') && (<>
              <Row label="Min length">
                <InputNumber
                  value={c.minLength}
                  min={0}
                  size="small"
                  style={{ width: 100 }}
                  placeholder="—"
                  onChange={(v) => patchC({ minLength: v ?? undefined })}
                />
              </Row>
              <Row label="Max length">
                <InputNumber
                  value={c.maxLength}
                  min={0}
                  size="small"
                  style={{ width: 100 }}
                  placeholder="—"
                  onChange={(v) => patchC({ maxLength: v ?? undefined })}
                />
              </Row>
              <Row label="Pattern">
                <Input
                  value={c.pattern ?? ''}
                  size="small"
                  style={{ width: 200, fontFamily: 'monospace', fontSize: 12 }}
                  placeholder="regex, e.g. ^[A-Z]"
                  onChange={(e) => patchC({ pattern: e.target.value || undefined })}
                />
              </Row>
            </>)}

            {/* number / progress */}
            {(type === 'number' || type === 'progress') && (<>
              <Row label="Min value">
                <InputNumber
                  value={c.min}
                  size="small"
                  style={{ width: 100 }}
                  placeholder="—"
                  onChange={(v) => patchC({ min: v ?? undefined })}
                />
              </Row>
              <Row label="Max value">
                <InputNumber
                  value={c.max}
                  size="small"
                  style={{ width: 100 }}
                  placeholder="—"
                  onChange={(v) => patchC({ max: v ?? undefined })}
                />
              </Row>
              <Row label="Step">
                <InputNumber
                  value={c.step}
                  min={0}
                  size="small"
                  style={{ width: 100 }}
                  placeholder="—"
                  onChange={(v) => patchC({ step: v ?? undefined })}
                />
              </Row>
            </>)}

            {/* date */}
            {type === 'date' && (<>
              <Row label="Min date">
                <Input
                  type="date"
                  value={c.minDate ?? ''}
                  size="small"
                  style={{ width: 160 }}
                  onChange={(e) => patchC({ minDate: e.target.value || undefined })}
                />
              </Row>
              <Row label="Max date">
                <Input
                  type="date"
                  value={c.maxDate ?? ''}
                  size="small"
                  style={{ width: 160 }}
                  onChange={(e) => patchC({ maxDate: e.target.value || undefined })}
                />
              </Row>
            </>)}

            {/* multiselect / tags */}
            {(type === 'multiselect' || type === 'tags') && (<>
              <Row label="Min items">
                <InputNumber
                  value={c.minItems}
                  min={0}
                  size="small"
                  style={{ width: 100 }}
                  placeholder="—"
                  onChange={(v) => patchC({ minItems: v ?? undefined })}
                />
              </Row>
              <Row label="Max items">
                <InputNumber
                  value={c.maxItems}
                  min={0}
                  size="small"
                  style={{ width: 100 }}
                  placeholder="—"
                  onChange={(v) => patchC({ maxItems: v ?? undefined })}
                />
              </Row>
            </>)}

          </div>
        ),
      }]}
    />
  )
}

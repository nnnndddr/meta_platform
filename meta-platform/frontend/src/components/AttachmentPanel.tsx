import { useEffect, useState } from 'react'
import { Button, List, Space, Typography, Upload, message } from 'antd'
import { DeleteOutlined, DownloadOutlined, PaperClipOutlined } from '@ant-design/icons'
import type { UploadRequestOption } from 'rc-upload/lib/interface'
import { useNotificationStore } from '@/store/notificationStore'

const API_BASE = 'http://localhost:8000'

interface Attachment {
  name: string
  size: number
  last_modified: string | null
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

interface Props {
  entityId: string
  recordId: string
}

export function AttachmentPanel({ entityId, recordId }: Props) {
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [loading, setLoading] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)

  const prefix = `${API_BASE}/api/attachments/${entityId}/${recordId}`

  async function fetchList() {
    setLoading(true)
    try {
      const res = await fetch(prefix)
      if (res.ok) setAttachments(await res.json())
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchList()
  }, [entityId, recordId]) // eslint-disable-line react-hooks/exhaustive-deps

  async function handleUpload(options: UploadRequestOption) {
    const { file, onSuccess, onError } = options
    const userId = useNotificationStore.getState().currentUser?.id
    const form = new FormData()
    form.append('file', file as File)
    try {
      const res = await fetch(prefix, {
        method: 'POST',
        headers: userId ? { 'X-User-ID': userId } : {},
        body: form,
      })
      if (!res.ok) throw new Error(await res.text())
      onSuccess?.({})
      message.success('File uploaded')
      await fetchList()
    } catch (e) {
      onError?.(e as Error)
      message.error('Upload failed')
    }
  }

  async function handleDownload(name: string) {
    try {
      const res = await fetch(`${prefix}/${encodeURIComponent(name)}/url`)
      const { url } = await res.json()
      window.open(url, '_blank')
    } catch {
      message.error('Could not get download link')
    }
  }

  async function handleDelete(name: string) {
    setDeleting(name)
    try {
      await fetch(`${prefix}/${encodeURIComponent(name)}`, { method: 'DELETE' })
      setAttachments((prev) => prev.filter((a) => a.name !== name))
    } catch {
      message.error('Delete failed')
    } finally {
      setDeleting(null)
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <Typography.Text strong style={{ fontSize: 13 }}>
          <PaperClipOutlined style={{ marginRight: 6 }} />
          Attachments
        </Typography.Text>
        <Upload customRequest={handleUpload} showUploadList={false} multiple>
          <Button size="small">Upload file</Button>
        </Upload>
      </div>

      <List
        size="small"
        loading={loading}
        locale={{ emptyText: 'No attachments' }}
        dataSource={attachments}
        renderItem={(item) => (
          <List.Item
            style={{ padding: '4px 0' }}
            actions={[
              <Button
                key="dl"
                type="text"
                size="small"
                icon={<DownloadOutlined />}
                onClick={() => handleDownload(item.name)}
              />,
              <Button
                key="del"
                type="text"
                size="small"
                danger
                icon={<DeleteOutlined />}
                loading={deleting === item.name}
                onClick={() => handleDelete(item.name)}
              />,
            ]}
          >
            <Space size={4}>
              <PaperClipOutlined style={{ color: '#6b7280', fontSize: 12 }} />
              <Typography.Text style={{ fontSize: 13 }}>{item.name}</Typography.Text>
              <Typography.Text type="secondary" style={{ fontSize: 11 }}>
                {formatSize(item.size)}
              </Typography.Text>
            </Space>
          </List.Item>
        )}
      />
    </div>
  )
}

import { useState } from 'react'
import type { FormEvent } from 'react'
import { PlusCircle, Search, Edit2, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '../contexts/AuthContext'
import { useSalon } from '../contexts/SalonContext'
import type { Client } from '../types'
import { useClients } from '../hooks/useClients'

export default function Clients() {
  const { user } = useAuth()
  const { salon } = useSalon()
  const { clients, isLoading: loading, addClient, updateClient, deleteClient } = useClients()
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  
  // form state
  const [editId, setEditId] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)

  const handleEdit = (c: Client) => {
    setEditId(c.id)
    setName(c.name)
    setPhone(c.phone || '')
    setEmail(c.email || '')
    setNotes(c.notes || '')
    setShowForm(true)
  }

  const resetForm = () => {
    setEditId(null)
    setName('')
    setPhone('')
    setEmail('')
    setNotes('')
    setShowForm(false)
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!salon || !user) return
    setSaving(true)
    
    const payload = {
      name, phone: phone || null, email: email || null, notes: notes || null,
      user_id: user.id
    }

    try {
      if (editId) {
        await updateClient.mutateAsync({ id: editId, ...payload })
        toast.success('Client updated')
      } else {
        await addClient.mutateAsync(payload)
        toast.success('Client added')
      }
      resetForm()
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this client?')) return
    try {
      await deleteClient.mutateAsync(id)
      toast.success('Client deleted')
    } catch (error: any) {
      toast.error(error.message)
    }
  }

  const filtered = clients.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) || 
    (c.phone && c.phone.includes(search)) ||
    (c.email && c.email.toLowerCase().includes(search.toLowerCase()))
  )

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Clients</h1>
        {!showForm && (
          <button onClick={() => setShowForm(true)}
            className="flex items-center gap-2 bg-pink-500 hover:bg-pink-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
            <PlusCircle size={16} /> Add Client
          </button>
        )}
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-xl p-5 mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">{editId ? 'Edit Client' : 'New Client'}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <input type="text" required value={name} onChange={e => setName(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input type="tel" value={phone} onChange={e => setPhone(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <input type="text" value={notes} onChange={e => setNotes(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500" />
            </div>
          </div>
          <div className="flex gap-3 justify-end">
            <button type="button" onClick={resetForm} className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 border border-gray-300 rounded-lg">Cancel</button>
            <button type="submit" disabled={saving} className="px-4 py-2 text-sm font-medium text-white bg-pink-500 hover:bg-pink-600 rounded-lg disabled:opacity-60">
              {saving ? 'Saving...' : 'Save Client'}
            </button>
          </div>
        </form>
      )}

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center gap-3 bg-gray-50">
          <Search size={18} className="text-gray-400" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search clients..."
            className="flex-1 bg-transparent border-none text-sm focus:outline-none focus:ring-0" />
        </div>
        {loading ? (
          <div className="flex justify-center py-10"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-pink-500" /></div>
        ) : filtered.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-8">No clients found</p>
        ) : (
          <div className="divide-y divide-gray-100">
            {filtered.map(c => (
              <div key={c.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-gray-50 transition-colors">
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">{c.name}</h3>
                  <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                    {c.phone && <span>{c.phone}</span>}
                    {c.email && <span>{c.email}</span>}
                  </div>
                  {c.notes && <p className="text-xs text-gray-400 mt-1 italic">{c.notes}</p>}
                </div>
                <div className="flex items-center gap-2 self-end md:self-auto">
                  <button onClick={() => handleEdit(c)} className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-md transition-colors">
                    <Edit2 size={16} />
                  </button>
                  <button onClick={() => handleDelete(c.id)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

import { useState } from 'react'
import type { FormEvent } from 'react'
import { PlusCircle, Search, Edit2, Trash2, Clock, Euro } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '../contexts/AuthContext'
import { useSalon } from '../contexts/SalonContext'
import type { Service } from '../types'
import { useServices } from '../hooks/useServices'

export default function Services() {
  const { user } = useAuth()
  const { salon, canManage } = useSalon()
  const { services, isLoading: loading, addService, updateService, deleteService } = useServices()
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  
  // form state
  const [editId, setEditId] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [duration, setDuration] = useState('60')
  const [price, setPrice] = useState('0')
  const [category, setCategory] = useState('')
  const [saving, setSaving] = useState(false)

  const handleEdit = (s: Service) => {
    setEditId(s.id)
    setName(s.name)
    setDuration(s.duration.toString())
    setPrice(s.price.toString())
    setCategory(s.category || '')
    setShowForm(true)
  }

  const resetForm = () => {
    setEditId(null)
    setName('')
    setDuration('60')
    setPrice('0')
    setCategory('')
    setShowForm(false)
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!salon || !user) return
    setSaving(true)
    
    const payload = {
      name, duration: Number(duration), price: Number(price), category: category || null,
      user_id: user.id
    }

    try {
      if (editId) {
        await updateService.mutateAsync({ id: editId, ...payload })
        toast.success('Service updated')
      } else {
        await addService.mutateAsync(payload)
        toast.success('Service added')
      }
      resetForm()
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this service?')) return
    try {
      await deleteService.mutateAsync(id)
      toast.success('Service deleted')
    } catch (error: any) {
      toast.error(error.message)
    }
  }

  const filtered = services.filter(s => 
    s.name.toLowerCase().includes(search.toLowerCase()) || 
    (s.category && s.category.toLowerCase().includes(search.toLowerCase()))
  )

  const categories = [...new Set(filtered.map(s => s.category || 'Uncategorized'))]

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Services</h1>
        {canManage && !showForm && (
          <button onClick={() => setShowForm(true)}
            className="flex items-center gap-2 bg-pink-500 hover:bg-pink-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
            <PlusCircle size={16} /> Add Service
          </button>
        )}
      </div>

      {showForm && canManage && (
        <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-xl p-5 mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">{editId ? 'Edit Service' : 'New Service'}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Service Name</label>
              <input type="text" required value={name} onChange={e => setName(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category (optional)</label>
              <input type="text" value={category} onChange={e => setCategory(e.target.value)} placeholder="e.g. Haircuts, Colouring"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Default Duration (mins)</label>
              <input type="number" required min="5" step="5" value={duration} onChange={e => setDuration(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Default Price (€)</label>
              <input type="number" required min="0" step="0.01" value={price} onChange={e => setPrice(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500" />
            </div>
          </div>
          <div className="flex gap-3 justify-end">
            <button type="button" onClick={resetForm} className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 border border-gray-300 rounded-lg">Cancel</button>
            <button type="submit" disabled={saving} className="px-4 py-2 text-sm font-medium text-white bg-pink-500 hover:bg-pink-600 rounded-lg disabled:opacity-60">
              {saving ? 'Saving...' : 'Save Service'}
            </button>
          </div>
        </form>
      )}

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center gap-3 bg-gray-50">
          <Search size={18} className="text-gray-400" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search services..."
            className="flex-1 bg-transparent border-none text-sm focus:outline-none focus:ring-0" />
        </div>
        {loading ? (
          <div className="flex justify-center py-10"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-pink-500" /></div>
        ) : filtered.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-8">No services found</p>
        ) : (
          <div className="divide-y divide-gray-100">
            {categories.map(cat => (
              <div key={cat}>
                <div className="bg-gray-50 px-4 py-2 border-b border-t border-gray-100 first:border-t-0">
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{cat}</h3>
                </div>
                <div className="divide-y divide-gray-50">
                  {filtered.filter(s => (s.category || 'Uncategorized') === cat).map(s => (
                    <div key={s.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">{s.name}</h4>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="flex items-center gap-1 text-xs text-gray-500"><Clock size={12} /> {s.duration}m</span>
                          <span className="flex items-center gap-1 text-xs text-gray-500"><Euro size={12} /> {Number(s.price).toFixed(2)}</span>
                        </div>
                      </div>
                      {canManage && (
                        <div className="flex items-center gap-2">
                          <button onClick={() => handleEdit(s)} className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-md transition-colors">
                            <Edit2 size={16} />
                          </button>
                          <button onClick={() => handleDelete(s.id)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

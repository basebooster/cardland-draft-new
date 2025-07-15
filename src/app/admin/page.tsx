'use client'

import React, { useState, useEffect } from 'react'
import Layout from '@/components/Layout'
import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Plus, Calendar, Users, Settings, Trash2, Edit, Save, X } from 'lucide-react'

interface Draft {
  id: string
  name: string
  description: string | null
  start_time: string
  status: 'pending' | 'active' | 'completed'
  timer_minutes: number
  created_at: string
}

export default function Admin() {
  const { user, userProfile, loading } = useAuth()
  const router = useRouter()
  const [drafts, setDrafts] = useState<Draft[]>([])
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingDraft, setEditingDraft] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    start_time: '',
    timer_minutes: 5
  })

  useEffect(() => {
    if (loading) return
    if (!user) {
      router.push('/login')
      return
    }
    if (userProfile && userProfile.role !== 'admin') {
      router.push('/')
      return
    }
    fetchDrafts()
  }, [user, userProfile, loading, router])

  const fetchDrafts = async () => {
    try {
      const { data, error } = await supabase
        .from('drafts')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setDrafts(data || [])
    } catch (error) {
      console.error('Error fetching drafts:', error)
    }
  }

  const handleCreateDraft = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const { data, error } = await supabase
        .from('drafts')
        .insert({
          name: formData.name,
          description: formData.description || null,
          start_time: formData.start_time,
          timer_minutes: formData.timer_minutes,
          created_by: user!.id,
          status: 'pending'
        })
        .select()
        .single()

      if (error) throw error

      setDrafts([data, ...drafts])
      setShowCreateForm(false)
      setFormData({ name: '', description: '', start_time: '', timer_minutes: 5 })
    } catch (error) {
      console.error('Error creating draft:', error)
    }
  }

  const handleUpdateDraft = async (draftId: string) => {
    try {
      const { error } = await supabase
        .from('drafts')
        .update({
          name: formData.name,
          description: formData.description || null,
          start_time: formData.start_time,
          timer_minutes: formData.timer_minutes
        })
        .eq('id', draftId)

      if (error) throw error

      setDrafts(drafts.map(draft => 
        draft.id === draftId 
          ? { ...draft, ...formData, description: formData.description || null }
          : draft
      ))
      setEditingDraft(null)
    } catch (error) {
      console.error('Error updating draft:', error)
    }
  }

  const handleDeleteDraft = async (draftId: string) => {
    if (!confirm('Are you sure you want to delete this draft?')) return

    try {
      const { error } = await supabase
        .from('drafts')
        .delete()
        .eq('id', draftId)

      if (error) throw error

      setDrafts(drafts.filter(draft => draft.id !== draftId))
    } catch (error) {
      console.error('Error deleting draft:', error)
    }
  }

  const startEditing = (draft: Draft) => {
    setEditingDraft(draft.id)
    setFormData({
      name: draft.name,
      description: draft.description || '',
      start_time: draft.start_time,
      timer_minutes: draft.timer_minutes
    })
  }

  const cancelEditing = () => {
    setEditingDraft(null)
    setFormData({ name: '', description: '', start_time: '', timer_minutes: 5 })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'active': return 'bg-green-100 text-green-800'
      case 'completed': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        </div>
      </Layout>
    )
  }

  if (userProfile?.role !== 'admin') {
    return (
      <Layout>
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold text-gray-900">Access Denied</h1>
          <p className="text-gray-600 mt-2">You need admin privileges to access this page.</p>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Admin Panel</h1>
            <p className="text-gray-600 mt-2">Manage drafts and configure settings</p>
          </div>
          <button
            onClick={() => setShowCreateForm(true)}
            className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-lg font-medium hover:from-purple-700 hover:to-pink-700 transition-all flex items-center space-x-2"
          >
            <Plus size={20} />
            <span>Create Draft</span>
          </button>
        </div>

        {/* Create Draft Form */}
        {showCreateForm && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Create New Draft</h2>
              <button
                onClick={() => setShowCreateForm(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateDraft} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Draft Name
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Enter draft name"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Start Time
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.start_time}
                    onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description (Optional)
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  rows={3}
                  placeholder="Enter draft description"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Timer (Minutes per pick)
                </label>
                <input
                  type="number"
                  value={formData.timer_minutes}
                  onChange={(e) => setFormData({ ...formData, timer_minutes: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  min="1"
                  max="60"
                  required
                />
              </div>

              <div className="flex space-x-3">
                <button
                  type="submit"
                  className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center space-x-2"
                >
                  <Save size={16} />
                  <span>Create Draft</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Drafts List */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-900">All Drafts</h2>
          
          {drafts.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
              <Calendar className="mx-auto text-gray-400 mb-4" size={48} />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No drafts created yet</h3>
              <p className="text-gray-600">Create your first draft to get started</p>
            </div>
          ) : (
            <div className="space-y-4">
              {drafts.map((draft) => (
                <div key={draft.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  {editingDraft === draft.id ? (
                    <form onSubmit={(e) => { e.preventDefault(); handleUpdateDraft(draft.id); }} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input
                          type="text"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          required
                        />
                        <input
                          type="datetime-local"
                          value={formData.start_time}
                          onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          required
                        />
                      </div>
                      <textarea
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        rows={2}
                        placeholder="Description"
                      />
                      <div className="flex space-x-2">
                        <button
                          type="submit"
                          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-1"
                        >
                          <Save size={16} />
                          <span>Save</span>
                        </button>
                        <button
                          type="button"
                          onClick={cancelEditing}
                          className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors flex items-center space-x-1"
                        >
                          <X size={16} />
                          <span>Cancel</span>
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">{draft.name}</h3>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(draft.status)}`}>
                            {draft.status}
                          </span>
                        </div>
                        {draft.description && (
                          <p className="text-gray-600 text-sm mb-2">{draft.description}</p>
                        )}
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <span className="flex items-center space-x-1">
                            <Calendar size={14} />
                            <span>{new Date(draft.start_time).toLocaleDateString()}</span>
                          </span>
                          <span className="flex items-center space-x-1">
                            <Users size={14} />
                            <span>{draft.timer_minutes} min/pick</span>
                          </span>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => startEditing(draft)}
                          className="text-blue-600 hover:text-blue-700 p-2"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteDraft(draft.id)}
                          className="text-red-600 hover:text-red-700 p-2"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}
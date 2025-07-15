'use client'

import React, { useState, useEffect } from 'react'
import Layout from '@/components/Layout'
import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Plus, Calendar, Users, Clock, Play, Eye } from 'lucide-react'
import Link from 'next/link'

interface Draft {
  id: string
  name: string
  description: string | null
  start_time: string
  status: 'pending' | 'active' | 'completed'
  timer_minutes: number
  created_at: string
  participant_count?: number
}

export default function Home() {
  const { user, userProfile, loading } = useAuth()
  const router = useRouter()
  const [drafts, setDrafts] = useState<Draft[]>([])
  const [loadingDrafts, setLoadingDrafts] = useState(true)

  useEffect(() => {
    if (loading) return
    if (!user) {
      router.push('/login')
      return
    }
    fetchDrafts()
  }, [user, loading, router])

  const fetchDrafts = async () => {
    try {
      const { data, error } = await supabase
        .from('drafts')
        .select(`
          *,
          participants(count)
        `)
        .order('created_at', { ascending: false })

      if (error) throw error

      const draftsWithCounts = data.map(draft => ({
        ...draft,
        participant_count: draft.participants?.[0]?.count || 0
      }))

      setDrafts(draftsWithCounts)
    } catch (error) {
      console.error('Error fetching drafts:', error)
    } finally {
      setLoadingDrafts(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'active': return 'bg-green-100 text-green-800'
      case 'completed': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading || loadingDrafts) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Welcome back, {userProfile?.name || 'User'}!
            </h1>
            <p className="text-gray-600 mt-2">
              Manage your drafts and participate in live team selections
            </p>
          </div>
          {userProfile?.role === 'admin' && (
            <Link
              href="/admin"
              className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-lg font-medium hover:from-purple-700 hover:to-pink-700 transition-all flex items-center space-x-2"
            >
              <Plus size={20} />
              <span>Create Draft</span>
            </Link>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {drafts.map((draft) => (
            <div key={draft.id} className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-xl font-semibold text-gray-900 truncate">
                    {draft.name}
                  </h3>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(draft.status)}`}>
                    {draft.status}
                  </span>
                </div>

                {draft.description && (
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                    {draft.description}
                  </p>
                )}

                <div className="space-y-2 text-sm text-gray-500 mb-4">
                  <div className="flex items-center space-x-2">
                    <Calendar size={16} />
                    <span>{formatDate(draft.start_time)}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Users size={16} />
                    <span>{draft.participant_count} participants</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Clock size={16} />
                    <span>{draft.timer_minutes} min per pick</span>
                  </div>
                </div>

                <div className="flex space-x-2">
                  <Link
                    href={`/draft/${draft.id}`}
                    className="flex-1 bg-purple-600 text-white px-4 py-2 rounded-lg text-center hover:bg-purple-700 transition-colors flex items-center justify-center space-x-1"
                  >
                    {draft.status === 'active' ? <Play size={16} /> : <Eye size={16} />}
                    <span>{draft.status === 'active' ? 'Join Draft' : 'View Draft'}</span>
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>

        {drafts.length === 0 && (
          <div className="text-center py-12">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Calendar className="text-gray-400" size={32} />
            </div>
            <h3 className="text-xl font-medium text-gray-900 mb-2">No drafts yet</h3>
            <p className="text-gray-600 mb-6">
              {userProfile?.role === 'admin' 
                ? 'Create your first draft to get started'
                : 'Wait for an admin to create a draft'
              }
            </p>
            {userProfile?.role === 'admin' && (
              <Link
                href="/admin"
                className="inline-flex items-center space-x-2 bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors"
              >
                <Plus size={20} />
                <span>Create First Draft</span>
              </Link>
            )}
          </div>
        )}
      </div>
    </Layout>
  )
}
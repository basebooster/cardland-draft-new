import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Layout from '../../components/Layout'
import { useAuth } from '../../hooks/useAuth'
import { supabase } from '../../lib/supabase'
import { Clock, Users, Trophy, Play, CheckCircle } from 'lucide-react'

interface Draft {
  id: string
  name: string
  description: string | null
  start_time: string
  status: 'pending' | 'active' | 'completed'
  timer_minutes: number
}

interface Participant {
  id: string
  user_id: string
  pick_order: number
  status: 'waiting' | 'picking' | 'completed'
  users: {
    name: string
    email: string
  }
}

interface Selection {
  id: string
  name: string
  image_url: string | null
  is_taken: boolean
}

interface Pick {
  id: string
  user_id: string
  selection_id: string
  round: number
  timestamp: string
  is_auto_pick: boolean
  users: {
    name: string
    email: string
  }
  selections: {
    name: string
    image_url: string | null
  }
}

export default function DraftRoom() {
  const router = useRouter()
  const { id } = router.query
  const { user, userProfile, loading } = useAuth()
  
  const [draft, setDraft] = useState<Draft | null>(null)
  const [participants, setParticipants] = useState<Participant[]>([])
  const [selections, setSelections] = useState<Selection[]>([])
  const [picks, setPicks] = useState<Pick[]>([])
  const [currentPicker, setCurrentPicker] = useState<Participant | null>(null)
  const [timeLeft, setTimeLeft] = useState<number>(0)
  const [isMyTurn, setIsMyTurn] = useState(false)

  useEffect(() => {
    if (loading) return
    if (!user) {
      router.push('/login')
      return
    }
    if (id) {
      fetchDraftData()
    }
  }, [user, loading, id, router])

  const fetchDraftData = async () => {
    try {
      // Fetch draft details
      const { data: draftData, error: draftError } = await supabase
        .from('drafts')
        .select('*')
        .eq('id', id)
        .single()

      if (draftError) throw draftError
      setDraft(draftData)

      // Fetch participants
      const { data: participantsData, error: participantsError } = await supabase
        .from('participants')
        .select(`
          *,
          users(name, email)
        `)
        .eq('draft_id', id)
        .order('pick_order')

      if (participantsError) throw participantsError
      setParticipants(participantsData || [])

      // Find current picker
      const currentPickerData = participantsData?.find(p => p.status === 'picking')
      setCurrentPicker(currentPickerData || null)
      setIsMyTurn(currentPickerData?.user_id === user?.id)

      // Fetch selections
      const { data: selectionsData, error: selectionsError } = await supabase
        .from('selections')
        .select('*')
        .eq('draft_id', id)
        .order('fallback_order')

      if (selectionsError) throw selectionsError
      setSelections(selectionsData || [])

      // Fetch picks
      const { data: picksData, error: picksError } = await supabase
        .from('picks')
        .select(`
          *,
          users(name, email),
          selections(name, image_url)
        `)
        .eq('draft_id', id)
        .order('timestamp')

      if (picksError) throw picksError
      setPicks(picksData || [])

    } catch (error) {
      console.error('Error fetching draft data:', error)
    }
  }

  const handleMakePick = async (selectionId: string) => {
    if (!isMyTurn || !user || !draft) return

    try {
      // Create the pick
      const { error: pickError } = await supabase
        .from('picks')
        .insert({
          draft_id: draft.id,
          user_id: user.id,
          selection_id: selectionId,
          round: 1, // You might want to calculate this based on current round
          is_auto_pick: false
        })

      if (pickError) throw pickError

      // Mark selection as taken
      const { error: selectionError } = await supabase
        .from('selections')
        .update({ is_taken: true })
        .eq('id', selectionId)

      if (selectionError) throw selectionError

      // Update participant status
      const { error: participantError } = await supabase
        .from('participants')
        .update({ status: 'completed' })
        .eq('draft_id', draft.id)
        .eq('user_id', user.id)

      if (participantError) throw participantError

      // Refresh data
      fetchDraftData()

    } catch (error) {
      console.error('Error making pick:', error)
    }
  }

  if (loading || !draft) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        </div>
      </Layout>
    )
  }

  const availableSelections = selections.filter(s => !s.is_taken)
  const completedPicks = picks.length
  const totalParticipants = participants.length

  return (
    <Layout>
      <div className="space-y-8">
        {/* Draft Header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{draft.name}</h1>
              {draft.description && (
                <p className="text-gray-600 mt-2">{draft.description}</p>
              )}
            </div>
            <div className="text-right">
              <div className="flex items-center space-x-2 text-sm text-gray-500 mb-2">
                <Clock size={16} />
                <span>{draft.timer_minutes} min per pick</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <Users size={16} />
                <span>{totalParticipants} participants</span>
              </div>
            </div>
          </div>

          {/* Current Status */}
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-4">
            {currentPicker ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="font-medium text-gray-900">
                    {isMyTurn ? "It's your turn!" : `${currentPicker.users.name} is picking...`}
                  </span>
                </div>
                {timeLeft > 0 && (
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <Clock size={16} />
                    <span>{Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <CheckCircle className="text-green-500" size={20} />
                <span className="font-medium text-gray-900">Draft completed!</span>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Available Selections */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Available Selections ({availableSelections.length})
              </h2>
              
              {availableSelections.length === 0 ? (
                <div className="text-center py-8">
                  <Trophy className="mx-auto text-gray-400 mb-4" size={48} />
                  <p className="text-gray-600">All selections have been picked!</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {availableSelections.map((selection) => (
                    <button
                      key={selection.id}
                      onClick={() => handleMakePick(selection.id)}
                      disabled={!isMyTurn}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        isMyTurn
                          ? 'border-purple-200 hover:border-purple-400 hover:bg-purple-50 cursor-pointer'
                          : 'border-gray-200 cursor-not-allowed opacity-50'
                      }`}
                    >
                      {selection.image_url && (
                        <img
                          src={selection.image_url}
                          alt={selection.name}
                          className="w-full h-24 object-cover rounded-md mb-2"
                        />
                      )}
                      <p className="font-medium text-gray-900 text-sm">{selection.name}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Draft Order & Picks */}
          <div className="space-y-6">
            {/* Draft Order */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Draft Order</h3>
              <div className="space-y-2">
                {participants.map((participant, index) => (
                  <div
                    key={participant.id}
                    className={`flex items-center space-x-3 p-2 rounded-lg ${
                      participant.status === 'picking'
                        ? 'bg-green-50 border border-green-200'
                        : participant.status === 'completed'
                        ? 'bg-gray-50'
                        : 'bg-white'
                    }`}
                  >
                    <span className="w-6 h-6 bg-purple-100 text-purple-800 rounded-full flex items-center justify-center text-sm font-medium">
                      {index + 1}
                    </span>
                    <span className="flex-1 text-sm font-medium text-gray-900">
                      {participant.users.name}
                    </span>
                    {participant.status === 'picking' && (
                      <Play className="text-green-500" size={16} />
                    )}
                    {participant.status === 'completed' && (
                      <CheckCircle className="text-gray-400" size={16} />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Picks */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Recent Picks ({picks.length})
              </h3>
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {picks.slice(-5).reverse().map((pick) => (
                  <div key={pick.id} className="flex items-center space-x-3 p-2 bg-gray-50 rounded-lg">
                    {pick.selections.image_url && (
                      <img
                        src={pick.selections.image_url}
                        alt={pick.selections.name}
                        className="w-8 h-8 object-cover rounded"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {pick.selections.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {pick.users.name}
                        {pick.is_auto_pick && ' (auto)'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}
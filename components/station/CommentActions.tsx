'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { ThumbsUp, Flag, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { authClient } from '@/lib/authClient'
import { ReportCommentModal } from './ReportCommentModal'

interface CommentActionsProps {
  comentarioId: string
  voteCount: number
  userVoted: boolean
  userReported: boolean
  isOwnComment: boolean
  onVoteChange: (newVoteCount: number, userVoted: boolean) => void
}

export function CommentActions({ 
  comentarioId, 
  voteCount, 
  userVoted, 
  userReported,
  isOwnComment,
  onVoteChange 
}: CommentActionsProps) {
  const [isVoting, setIsVoting] = useState(false)
  const [showReportModal, setShowReportModal] = useState(false)
  const { data: session } = authClient.useSession()

  const handleVote = async () => {
    if (!session?.user) {
      toast.error('Debes iniciar sesión para votar')
      // Redirect to login with return URL
      window.location.href = `/login?returnTo=${encodeURIComponent(window.location.pathname)}`
      return
    }

    if (isOwnComment) {
      toast.error('No puedes votar tu propio comentario')
      return
    }

    try {
      setIsVoting(true)
      
      const response = await fetch(`/api/comentarios/${comentarioId}/votos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Error al procesar voto')
      }

      const data = await response.json()
      onVoteChange(data.voteCount, data.voted)
      
      // Show toast with appropriate message
      if (data.voted) {
        toast.success('¡Voto agregado!')
      } else {
        toast.success('Voto removido')
      }
    } catch (error) {
      console.error('Error voting:', error)
      toast.error(error instanceof Error ? error.message : 'Error al votar')
    } finally {
      setIsVoting(false)
    }
  }

  const handleReport = () => {
    if (!session?.user) {
      toast.error('Debes iniciar sesión para reportar')
      // Redirect to login with return URL
      window.location.href = `/login?returnTo=${encodeURIComponent(window.location.pathname)}`
      return
    }

    if (isOwnComment) {
      toast.error('No puedes reportar tu propio comentario')
      return
    }

    if (userReported) {
      toast.info('Ya has reportado este comentario anteriormente')
      return
    }

    setShowReportModal(true)
  }

  const handleReportSuccess = () => {
    toast.success('Reporte enviado correctamente')
    setShowReportModal(false)
    // You might want to call a callback here to update the parent component
  }

  return (
    <div className="flex items-center gap-2 mt-2">
      {/* Vote Button - Only show if not own comment */}
      {!isOwnComment && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleVote}
          disabled={isVoting}
          className={`h-8 px-2 text-xs transition-colors ${
            userVoted 
              ? 'text-blue-600 bg-blue-50 hover:bg-blue-100' 
              : 'text-muted-foreground hover:text-blue-600'
          }`}
        >
          {isVoting ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <ThumbsUp className={`h-3 w-3 mr-1 ${userVoted ? 'fill-current' : ''}`} />
          )}
          Es útil {voteCount > 0 && <span className="ml-1">{voteCount}</span>}
        </Button>
      )}
      
      {/* Vote count display for own comments */}
      {isOwnComment && voteCount > 0 && (
        <div className="h-8 px-2 text-xs text-muted-foreground flex items-center">
          <ThumbsUp className="h-3 w-3 mr-1" />
          {voteCount} {voteCount === 1 ? 'voto' : 'votos'}
        </div>
      )}

      {/* Report Button - Only show if not own comment */}
      {!isOwnComment && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleReport}
          disabled={userReported}
          className={`h-8 px-2 text-xs transition-colors ${
            userReported
              ? 'text-red-400 cursor-not-allowed'
              : 'text-muted-foreground hover:text-red-600'
          }`}
        >
          <Flag className="h-3 w-3 mr-1" />
          {userReported ? 'Reportado' : 'Denunciar'}
        </Button>
      )}

      {/* Report Modal */}
      <ReportCommentModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        comentarioId={comentarioId}
        onSuccess={handleReportSuccess}
      />
    </div>
  )
}
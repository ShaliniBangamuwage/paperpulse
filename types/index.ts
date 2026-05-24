export type UserRole = 'user' | 'admin'

export type PaperStatus = 'pending' | 'processing' | 'done' | 'failed'

export type IdeaDifficulty = 'Beginner' | 'Intermediate' | 'Advanced'

export type SavedStatus = 'saved' | 'building' | 'done'

export interface Profile {
  id: string
  email: string
  role: UserRole
  created_at: string
}

export interface Paper {
  id: string
  user_id: string
  title: string
  abstract: string
  file_url: string
  status: PaperStatus
  is_public: boolean
  created_at: string
}

export interface Idea {
  id: string
  paper_id: string
  title: string
  description: string
  difficulty: IdeaDifficulty
  estimated_weeks: number
  tech_stack: string[]
  architecture: string
}

export interface SavedIdea {
  id: string
  user_id: string
  idea_id: string
  status: SavedStatus
  notes: string
  saved_at: string
  idea?: Idea
}

export interface Rating {
  id: string
  idea_id: string
  user_id: string
  score: number
  created_at: string
}
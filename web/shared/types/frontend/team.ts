export interface TeamMemberSocials {
  github?: string
  website?: string
  instagram?: string
  x?: string
  tiktok?: string
  youtube?: string
  twitch?: string
  discord?: string
}

export interface TeamMember {
  name: string
  role: string
  image: string
  socials: TeamMemberSocials
}

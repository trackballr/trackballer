export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      career_ratings: {
        Row: {
          created_at: string
          id: number
          player_id: number
          updated_at: string
          user_id: string
          value: number
        }
        Insert: {
          created_at?: string
          id?: never
          player_id: number
          updated_at?: string
          user_id: string
          value: number
        }
        Update: {
          created_at?: string
          id?: never
          player_id?: number
          updated_at?: string
          user_id?: string
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "career_ratings_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "career_ratings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      comment_votes: {
        Row: {
          comment_id: number
          created_at: string
          user_id: string
          value: number
        }
        Insert: {
          comment_id: number
          created_at?: string
          user_id: string
          value: number
        }
        Update: {
          comment_id?: number
          created_at?: string
          user_id?: string
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "comment_votes_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comment_votes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      comments: {
        Row: {
          body: string
          created_at: string
          downvote_count: number
          fixture_id: number | null
          id: number
          is_deleted: boolean
          parent_id: number | null
          player_id: number | null
          score: number
          target_type: string
          thread_depth: number
          thread_root_id: number | null
          updated_at: string
          upvote_count: number
          user_id: string
        }
        Insert: {
          body: string
          created_at?: string
          downvote_count?: number
          fixture_id?: number | null
          id?: never
          is_deleted?: boolean
          parent_id?: number | null
          player_id?: number | null
          score?: number
          target_type: string
          thread_depth?: number
          thread_root_id?: number | null
          updated_at?: string
          upvote_count?: number
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          downvote_count?: number
          fixture_id?: number | null
          id?: never
          is_deleted?: boolean
          parent_id?: number | null
          player_id?: number | null
          score?: number
          target_type?: string
          thread_depth?: number
          thread_root_id?: number | null
          updated_at?: string
          upvote_count?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comments_fixture_id_fkey"
            columns: ["fixture_id"]
            isOneToOne: false
            referencedRelation: "fixtures"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_thread_root_id_fkey"
            columns: ["thread_root_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      featured_trending_players: {
        Row: {
          created_at: string
          ends_at: string | null
          id: number
          pinned_by: string | null
          player_id: number
          sort_order: number
          starts_at: string | null
        }
        Insert: {
          created_at?: string
          ends_at?: string | null
          id?: never
          pinned_by?: string | null
          player_id: number
          sort_order?: number
          starts_at?: string | null
        }
        Update: {
          created_at?: string
          ends_at?: string | null
          id?: never
          pinned_by?: string | null
          player_id?: number
          sort_order?: number
          starts_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "featured_trending_players_pinned_by_fkey"
            columns: ["pinned_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "featured_trending_players_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
        ]
      }
      fixture_appearances: {
        Row: {
          fixture_id: number
          id: number
          is_rateable: boolean | null
          is_starter: boolean
          minutes_played: number
          player_id: number
          position: string | null
          team_id: number
        }
        Insert: {
          fixture_id: number
          id?: never
          is_rateable?: boolean | null
          is_starter?: boolean
          minutes_played?: number
          player_id: number
          position?: string | null
          team_id: number
        }
        Update: {
          fixture_id?: number
          id?: never
          is_rateable?: boolean | null
          is_starter?: boolean
          minutes_played?: number
          player_id?: number
          position?: string | null
          team_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "fixture_appearances_fixture_id_fkey"
            columns: ["fixture_id"]
            isOneToOne: false
            referencedRelation: "fixtures"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fixture_appearances_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fixture_appearances_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      fixture_coaches: {
        Row: {
          fixture_id: number
          name: string
          photo_url: string | null
          team_id: number
        }
        Insert: {
          fixture_id: number
          name: string
          photo_url?: string | null
          team_id: number
        }
        Update: {
          fixture_id?: number
          name?: string
          photo_url?: string | null
          team_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "fixture_coaches_fixture_id_fkey"
            columns: ["fixture_id"]
            isOneToOne: false
            referencedRelation: "fixtures"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fixture_coaches_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      fixture_events: {
        Row: {
          assist_player_id: number | null
          detail: string | null
          extra_minute: number | null
          fixture_id: number
          id: number
          minute: number
          player_id: number | null
          team_id: number | null
          type: string
        }
        Insert: {
          assist_player_id?: number | null
          detail?: string | null
          extra_minute?: number | null
          fixture_id: number
          id?: never
          minute: number
          player_id?: number | null
          team_id?: number | null
          type: string
        }
        Update: {
          assist_player_id?: number | null
          detail?: string | null
          extra_minute?: number | null
          fixture_id?: number
          id?: never
          minute?: number
          player_id?: number | null
          team_id?: number | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "fixture_events_assist_player_id_fkey"
            columns: ["assist_player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fixture_events_fixture_id_fkey"
            columns: ["fixture_id"]
            isOneToOne: false
            referencedRelation: "fixtures"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fixture_events_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fixture_events_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      fixture_lineups: {
        Row: {
          fixture_id: number
          formation_position: string | null
          grid: string | null
          id: number
          is_starter: boolean
          player_id: number
          shirt_number: number | null
          team_id: number
        }
        Insert: {
          fixture_id: number
          formation_position?: string | null
          grid?: string | null
          id?: never
          is_starter?: boolean
          player_id: number
          shirt_number?: number | null
          team_id: number
        }
        Update: {
          fixture_id?: number
          formation_position?: string | null
          grid?: string | null
          id?: never
          is_starter?: boolean
          player_id?: number
          shirt_number?: number | null
          team_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "fixture_lineups_fixture_id_fkey"
            columns: ["fixture_id"]
            isOneToOne: false
            referencedRelation: "fixtures"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fixture_lineups_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fixture_lineups_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      fixtures: {
        Row: {
          appearances_synced_at: string | null
          away_goals_et: number | null
          away_goals_ft: number | null
          away_goals_pen: number | null
          away_team_id: number
          created_at: string
          home_goals_et: number | null
          home_goals_ft: number | null
          home_goals_pen: number | null
          home_team_id: number
          id: number
          kickoff_at: string
          lineups_synced_at: string | null
          ratings_unlocked_at: string | null
          round_id: number | null
          round_name: string | null
          season_id: number
          status_long: string | null
          status_short: string
          updated_at: string
          venue: string | null
          winner_team_id: number | null
        }
        Insert: {
          appearances_synced_at?: string | null
          away_goals_et?: number | null
          away_goals_ft?: number | null
          away_goals_pen?: number | null
          away_team_id: number
          created_at?: string
          home_goals_et?: number | null
          home_goals_ft?: number | null
          home_goals_pen?: number | null
          home_team_id: number
          id: number
          kickoff_at: string
          lineups_synced_at?: string | null
          ratings_unlocked_at?: string | null
          round_id?: number | null
          round_name?: string | null
          season_id: number
          status_long?: string | null
          status_short: string
          updated_at?: string
          venue?: string | null
          winner_team_id?: number | null
        }
        Update: {
          appearances_synced_at?: string | null
          away_goals_et?: number | null
          away_goals_ft?: number | null
          away_goals_pen?: number | null
          away_team_id?: number
          created_at?: string
          home_goals_et?: number | null
          home_goals_ft?: number | null
          home_goals_pen?: number | null
          home_team_id?: number
          id?: number
          kickoff_at?: string
          lineups_synced_at?: string | null
          ratings_unlocked_at?: string | null
          round_id?: number | null
          round_name?: string | null
          season_id?: number
          status_long?: string | null
          status_short?: string
          updated_at?: string
          venue?: string | null
          winner_team_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fixtures_away_team_id_fkey"
            columns: ["away_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fixtures_home_team_id_fkey"
            columns: ["home_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fixtures_round_id_fkey"
            columns: ["round_id"]
            isOneToOne: false
            referencedRelation: "rounds"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fixtures_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "seasons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fixtures_winner_team_id_fkey"
            columns: ["winner_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      leagues: {
        Row: {
          country: string | null
          created_at: string
          id: number
          is_active: boolean
          logo_url: string | null
          name: string
          slug: string
          updated_at: string
        }
        Insert: {
          country?: string | null
          created_at?: string
          id: number
          is_active?: boolean
          logo_url?: string | null
          name: string
          slug: string
          updated_at?: string
        }
        Update: {
          country?: string | null
          created_at?: string
          id?: number
          is_active?: boolean
          logo_url?: string | null
          name?: string
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      match_ratings: {
        Row: {
          created_at: string
          fixture_id: number
          id: number
          player_id: number
          updated_at: string
          user_id: string
          value: number
        }
        Insert: {
          created_at?: string
          fixture_id: number
          id?: never
          player_id: number
          updated_at?: string
          user_id: string
          value: number
        }
        Update: {
          created_at?: string
          fixture_id?: number
          id?: never
          player_id?: number
          updated_at?: string
          user_id?: string
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "match_ratings_fixture_id_fkey"
            columns: ["fixture_id"]
            isOneToOne: false
            referencedRelation: "fixtures"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "match_ratings_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "match_ratings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      player_career_aggregates: {
        Row: {
          display_score: number
          is_provisional: boolean
          mean_user_rating: number | null
          player_id: number
          tier: string
          updated_at: string
          vote_count: number
        }
        Insert: {
          display_score: number
          is_provisional?: boolean
          mean_user_rating?: number | null
          player_id: number
          tier?: string
          updated_at?: string
          vote_count?: number
        }
        Update: {
          display_score?: number
          is_provisional?: boolean
          mean_user_rating?: number | null
          player_id?: number
          tier?: string
          updated_at?: string
          vote_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "player_career_aggregates_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: true
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
        ]
      }
      player_form_snapshots: {
        Row: {
          last_5_avg: number | null
          last_5_fixture_ids: number[]
          player_id: number
          updated_at: string
        }
        Insert: {
          last_5_avg?: number | null
          last_5_fixture_ids?: number[]
          player_id: number
          updated_at?: string
        }
        Update: {
          last_5_avg?: number | null
          last_5_fixture_ids?: number[]
          player_id?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "player_form_snapshots_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: true
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
        ]
      }
      player_match_aggregates: {
        Row: {
          avg_rating: number | null
          fixture_id: number
          player_id: number
          rating_count: number
          updated_at: string
        }
        Insert: {
          avg_rating?: number | null
          fixture_id: number
          player_id: number
          rating_count?: number
          updated_at?: string
        }
        Update: {
          avg_rating?: number | null
          fixture_id?: number
          player_id?: number
          rating_count?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "player_match_aggregates_fixture_id_fkey"
            columns: ["fixture_id"]
            isOneToOne: false
            referencedRelation: "fixtures"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_match_aggregates_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
        ]
      }
      player_season_squads: {
        Row: {
          id: number
          player_id: number
          season_id: number
          team_id: number
        }
        Insert: {
          id?: never
          player_id: number
          season_id: number
          team_id: number
        }
        Update: {
          id?: never
          player_id?: number
          season_id?: number
          team_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "player_season_squads_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_season_squads_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "seasons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_season_squads_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      player_tournament_aggregates: {
        Row: {
          appearances_rated: number
          avg_rating: number | null
          player_id: number
          season_id: number
          updated_at: string
        }
        Insert: {
          appearances_rated?: number
          avg_rating?: number | null
          player_id: number
          season_id: number
          updated_at?: string
        }
        Update: {
          appearances_rated?: number
          avg_rating?: number | null
          player_id?: number
          season_id?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "player_tournament_aggregates_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_tournament_aggregates_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "seasons"
            referencedColumns: ["id"]
          },
        ]
      }
      players: {
        Row: {
          age: number | null
          birth_date: string | null
          club_team_id: number | null
          created_at: string
          firstname: string | null
          fm_base_rating: number | null
          id: number
          lastname: string | null
          name: string
          national_team_id: number | null
          nationality: string | null
          photo_url: string | null
          primary_position: string | null
          search_vector: unknown
          updated_at: string
        }
        Insert: {
          age?: number | null
          birth_date?: string | null
          club_team_id?: number | null
          created_at?: string
          firstname?: string | null
          fm_base_rating?: number | null
          id: number
          lastname?: string | null
          name: string
          national_team_id?: number | null
          nationality?: string | null
          photo_url?: string | null
          primary_position?: string | null
          search_vector?: unknown
          updated_at?: string
        }
        Update: {
          age?: number | null
          birth_date?: string | null
          club_team_id?: number | null
          created_at?: string
          firstname?: string | null
          fm_base_rating?: number | null
          id?: number
          lastname?: string | null
          name?: string
          national_team_id?: number | null
          nationality?: string | null
          photo_url?: string | null
          primary_position?: string | null
          search_vector?: unknown
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "players_club_team_id_fkey"
            columns: ["club_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "players_national_team_id_fkey"
            columns: ["national_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      profile_followed_clubs: {
        Row: {
          team_id: number
          user_id: string
        }
        Insert: {
          team_id: number
          user_id: string
        }
        Update: {
          team_id?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profile_followed_clubs_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profile_followed_clubs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profile_interested_leagues: {
        Row: {
          league_id: number
          user_id: string
        }
        Insert: {
          league_id: number
          user_id: string
        }
        Update: {
          league_id?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profile_interested_leagues_league_id_fkey"
            columns: ["league_id"]
            isOneToOne: false
            referencedRelation: "leagues"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profile_interested_leagues_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_source: string | null
          avatar_url: string | null
          country_code: string | null
          created_at: string
          date_of_birth: string | null
          display_name: string
          favourite_club_id: number | null
          favourite_national_team_id: number | null
          favourite_player_id: number | null
          google_avatar_url: string | null
          id: string
          instagram_handle: string | null
          is_admin: boolean
          is_banned: boolean
          location: string | null
          onboarding_completed_at: string | null
          reddit_handle: string | null
          tiktok_handle: string | null
          twitter_handle: string | null
          twitter_verified_at: string | null
          updated_at: string
          username: string | null
          x_avatar_url: string | null
        }
        Insert: {
          avatar_source?: string | null
          avatar_url?: string | null
          country_code?: string | null
          created_at?: string
          date_of_birth?: string | null
          display_name: string
          favourite_club_id?: number | null
          favourite_national_team_id?: number | null
          favourite_player_id?: number | null
          google_avatar_url?: string | null
          id: string
          instagram_handle?: string | null
          is_admin?: boolean
          is_banned?: boolean
          location?: string | null
          onboarding_completed_at?: string | null
          reddit_handle?: string | null
          tiktok_handle?: string | null
          twitter_handle?: string | null
          twitter_verified_at?: string | null
          updated_at?: string
          username?: string | null
          x_avatar_url?: string | null
        }
        Update: {
          avatar_source?: string | null
          avatar_url?: string | null
          country_code?: string | null
          created_at?: string
          date_of_birth?: string | null
          display_name?: string
          favourite_club_id?: number | null
          favourite_national_team_id?: number | null
          favourite_player_id?: number | null
          google_avatar_url?: string | null
          id?: string
          instagram_handle?: string | null
          is_admin?: boolean
          is_banned?: boolean
          location?: string | null
          onboarding_completed_at?: string | null
          reddit_handle?: string | null
          tiktok_handle?: string | null
          twitter_handle?: string | null
          twitter_verified_at?: string | null
          updated_at?: string
          username?: string | null
          x_avatar_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_favourite_club_id_fkey"
            columns: ["favourite_club_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_favourite_national_team_id_fkey"
            columns: ["favourite_national_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_favourite_player_id_fkey"
            columns: ["favourite_player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
        ]
      }
      rounds: {
        Row: {
          id: number
          name: string
          season_id: number
          sort_order: number | null
        }
        Insert: {
          id?: never
          name: string
          season_id: number
          sort_order?: number | null
        }
        Update: {
          id?: never
          name?: string
          season_id?: number
          sort_order?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "rounds_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "seasons"
            referencedColumns: ["id"]
          },
        ]
      }
      seasons: {
        Row: {
          id: number
          is_current: boolean
          league_id: number
          year: number
        }
        Insert: {
          id?: never
          is_current?: boolean
          league_id: number
          year: number
        }
        Update: {
          id?: never
          is_current?: boolean
          league_id?: number
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "seasons_league_id_fkey"
            columns: ["league_id"]
            isOneToOne: false
            referencedRelation: "leagues"
            referencedColumns: ["id"]
          },
        ]
      }
      team_of_the_week: {
        Row: {
          created_at: string
          created_by: string | null
          featured_at: string | null
          formation: string
          id: number
          published_at: string | null
          round_id: number | null
          season_id: number
          title: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          featured_at?: string | null
          formation?: string
          id?: never
          published_at?: string | null
          round_id?: number | null
          season_id: number
          title: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          featured_at?: string | null
          formation?: string
          id?: never
          published_at?: string | null
          round_id?: number | null
          season_id?: number
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_of_the_week_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_of_the_week_round_id_fkey"
            columns: ["round_id"]
            isOneToOne: false
            referencedRelation: "rounds"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_of_the_week_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "seasons"
            referencedColumns: ["id"]
          },
        ]
      }
      team_of_the_week_players: {
        Row: {
          player_id: number
          slot: string
          sort_order: number
          team_of_the_week_id: number
        }
        Insert: {
          player_id: number
          slot: string
          sort_order?: number
          team_of_the_week_id: number
        }
        Update: {
          player_id?: number
          slot?: string
          sort_order?: number
          team_of_the_week_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "team_of_the_week_players_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_of_the_week_players_team_of_the_week_id_fkey"
            columns: ["team_of_the_week_id"]
            isOneToOne: false
            referencedRelation: "team_of_the_week"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          code: string | null
          country: string | null
          created_at: string
          id: number
          is_national: boolean
          logo_url: string | null
          name: string
          updated_at: string
        }
        Insert: {
          code?: string | null
          country?: string | null
          created_at?: string
          id: number
          is_national?: boolean
          logo_url?: string | null
          name: string
          updated_at?: string
        }
        Update: {
          code?: string | null
          country?: string | null
          created_at?: string
          id?: number
          is_national?: boolean
          logo_url?: string | null
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      career_rating_integer_check: {
        Args: { p_value: number }
        Returns: boolean
      }
      custom_access_token_hook: { Args: { event: Json }; Returns: Json }
      get_shuffle_career_player: {
        Args: {
          p_league_id?: number
          p_team_ids?: number[]
        }
        Returns: {
          club_name: string
          display_score: number
          firstname: string
          id: number
          lastname: string
          name: string
          photo_url: string
          primary_position: string
          tier: string
        }[]
      }
      get_user_rating_history: {
        Args: {
          p_before_at?: string
          p_before_id?: number
          p_before_kind?: string
          p_kind?: string
          p_limit?: number
          p_user_id: string
        }
        Returns: {
          fixture_id: number | null
          id: number
          kind: string
          player_id: number
          rated_at: string
          value: number
        }[]
      }
      is_admin: { Args: never; Returns: boolean }
      rating_half_step_check: { Args: { p_value: number }; Returns: boolean }
      recompute_player_career_aggregate: {
        Args: { p_player_id: number }
        Returns: undefined
      }
      recompute_player_form_snapshot: {
        Args: { p_player_id: number }
        Returns: undefined
      }
      recompute_player_match_aggregate: {
        Args: { p_fixture_id: number; p_player_id: number }
        Returns: undefined
      }
      recompute_player_tournament_aggregate: {
        Args: { p_player_id: number; p_season_id: number }
        Returns: undefined
      }
      refresh_comment_vote_counts: {
        Args: { p_comment_id: number }
        Returns: undefined
      }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
      tier_for_score: { Args: { p_score: number }; Returns: string }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const

"use client"

import { SearchCombobox } from "@/components/ui/search-combobox"
import type { OnboardingDraft, OnboardingOptions } from "@/lib/onboarding/types"

type StepFavouritesProps = {
  draft: OnboardingDraft
  options: OnboardingOptions
  onChange: (patch: Partial<OnboardingDraft>) => void
}

export function StepFavourites({ draft, options, onChange }: StepFavouritesProps) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="h3 mb-1">Favourites</h2>
        <p className="body-sm text-muted-foreground">
          Pick a club and national team if you like - both are optional for now.
        </p>
      </div>

      <SearchCombobox
        label="Favourite club (optional)"
        placeholder="Search clubs..."
        options={options.clubs}
        valueId={
          draft.favouriteClubId != null ? String(draft.favouriteClubId) : null
        }
        onValueIdChange={(id) =>
          onChange({
            favouriteClubId: id != null ? Number(id) : null,
          })
        }
        emptyMessage="No clubs found. Run the top-leagues seed if the list is empty."
      />

      <SearchCombobox
        label="Favourite national team (optional)"
        placeholder="Search countries..."
        options={options.nationalTeams}
        valueId={
          draft.favouriteNationalTeamId != null
            ? String(draft.favouriteNationalTeamId)
            : null
        }
        onValueIdChange={(id) =>
          onChange({
            favouriteNationalTeamId: id != null ? Number(id) : null,
          })
        }
        emptyMessage="No national teams found."
      />
    </div>
  )
}
